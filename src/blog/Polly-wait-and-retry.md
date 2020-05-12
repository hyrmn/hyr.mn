---
title: Exploring the Polly.Contrib.WaitAndRetry helpers
date: 2019-09-18
description: >-
  Patterns and practices for wrapping code in wait-and-retry blocks when making remote calls.
tags:
  - CSharp
  - Code
  - Polly
  - posts
---

If you're just here for the code, you can grab it in [this Gist](https://gist.github.com/hyrmn/a5227ed08923f3d14bab7736a9683c24)

In a previous post, I covered a little bit of what you can do with Polly last time to [wait and retry SQL Server exceptions](/Dapper-and-Polly/). Today I want talk about one of the contrib libraries and how it can help bake some better practices into your retry policies.

In my code, I use Polly in several places to retry remote calls. Our software is deployed to a cloud provider and, while people should generally build for it anyway, hosting in a cloud environment really drives home that you need to bake resiliency in to any of your code that involves a network connection. That's not to say cloud hosting is unreliable; far from it. But, you can't control those small hiccups and blips that happen when underlying infrastructure is upgraded or rerouted.

So, I might have a Polly retry policy for handling saves to our Raven document database

```csharp
var retryTimes = new List<TimeSpan>
{
    TimeSpan.FromMilliseconds(0),
    TimeSpan.FromMilliseconds(50),
    TimeSpan.FromMilliseconds(100),
    TimeSpan.FromMilliseconds(150)
};

var retryPolicy = Policy
    .Handle<WebException>(ex => TransientErrors.Contains(ex.Status))
    .OrInner<WebException>(ex => TransientErrors.Contains(ex.Status))
    .Or<TimeoutException>()
    .OrInner<TimeoutException>()
    .WaitAndRetry(retryTimes,
        (exception, timeSpan, retryCount, context) =>
        {
            LogTo.Warning(
                exception,
                "WARNING: Unable to save to Raven, will retry after {RetryTimeSpan}, Retry attempt {RetryCount}",
                timeSpan,
                retryCount);
        });
```

What I've defined in my code above is a linear back-off. If my first try fails, I try again immediately. On each subsequent failure, I'll wait an additional 50ms and try again. After the last wait and retry, Polly will kick the underlying error up the call chain. 

There are a few things to think about when deciding on a retry policy. 

First, how long should we wait after the initial failure? In my use case (hosting in the cloud), it makes sense to retry failures immediately. A connection might fail because traffic is being killed and routed through a different firewall within the data center. In this case, trying again right away will (probably) succeed. 

Next, how long should we wait between retries? That depends on a balance of understanding the resource being called and the execution path of the caller. The code I posted above is in the execution path for a user's action on the web app. The last thing I want to do is force my users to wait. And, I'm calling a well-provisioned multi-node database cluster so I expect it to respond quickly outside of minor traffic blips.

Choosing how long to wait in a wait-and-retry loop is a balance of resources. You don't want to overwhelm a remote resource by retrying too quickly. You don't want to wait too long between retries, though; especially when a user is on the line and waiting. (user patience is the most valuable resource of all.)

While my code works well, let's take a look at [Polly.Contrib.WaitAndRetry](https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry/) and see if it can help with making things cleaner or at least clearer.

As the name alludes to, these are helper methods for wait-and-retry that are maintained outside of the official Polly library. There's so much you can do with Polly and they can't possibly bake everything into the core library. 

So, let's redo that Raven retry policy with the contrib library. 

```csharp
var linearBackoff = Backoff.LinearBackoff(TimeSpan.FromMilliseconds(50), retryCount: 4, fastFirst: true);
var retryPolicy = Policy
    .Handle<WebException>(ex => TransientErrors.Contains(ex.Status))
    .OrInner<WebException>(ex => TransientErrors.Contains(ex.Status))
    .Or<TimeoutException>()
    .OrInner<TimeoutException>()
    .WaitAndRetry(linearBackoff,
        (exception, timeSpan, retryCount, context) =>
        {
            LogTo.Warning(
                exception,
                "WARNING: Unable to save to Raven, will retry after {RetryTimeSpan}, Retry attempt {RetryCount}",
                timeSpan,
                retryCount);
        });
```

Here, I'm using the contrib library to define a linear back-off. The execution is exactly like mine but I like that the intent is clearer. It's clear that I want to retry four times, that I want a linear growth of 50 milliseconds per retry, and that I want to retry the first time immediately (ok, granted, `fastFirst` might not be the clearest name).

The contrib library also provides a helper for a constant back-off. (I'm also going to switch to a shorter policy definition so this post isn't a scary length)

```csharp
var constant = Backoff.ConstantBackoff(TimeSpan.FromMilliseconds(100), retryCount: 5, fastFirst: true);
var constantPolicy = Policy
    .Handle<FooException>()
    .WaitAndRetryAsync(constant);
```

In this case, it will retry the first one immediately and then wait 100 milliseconds between each additional retry (and, if we remove that `fastFirst` flag then it will wait 100 milliseconds before the first retry as well). A constant back-off is a good choice when your issue is predictable. For example, a batched upload to a rate-limited resource. Or, it can be a good choice when you're just not sure what a good back-off wait time should be.

Next, there's a helper for an exponentially increasing back-off

```csharp
var exponential = Backoff.ExponentialBackoff(TimeSpan.FromMilliseconds(20), retryCount: 5, fastFirst: true);
var exponentialPolicy = Policy
    .Handle<FooException>()
    .WaitAndRetryAsync(exponential);
```

The default growth factor is 2.0 but you can provide your own value. With the default growth factor and a fast first retry, our delays will be 0ms, 20ms, 40ms, 80ms, 160ms. Since the growth is exponential, you should start with a low initial value; especially if your retry policy is in the path of a user request. An exponential back-off can be an excellent choice when you're trying to ensure that your requests don't all hit the remote resource at the same time every retry. If you're calling an overburdened service that's causing your code to retry, then some will retry immediately, some will be on their second retry which will take exponentially more time, etc. 

This brings me to a potential problem with all of these retry strategies, and something that the Polly.Contrib.WaitAndRetry library solves brilliantly.

Suppose in my scenario, where I'm retrying saves to Raven in response to a user on my web app, Raven becomes overloaded and starts refusing connections. In this case, where I have overloaded my service with a larger number of calls, then there is a strong chance that my failures and my retries will be highly correlated. Service gets overwhelmed so hundreds of requests wait and retry. Then the service comes up, those requests slam the server and bring it down again. We need a way to decorrelate the retries. That is, we want some requests to take, say, 30ms to retry and others to take 70ms, or 49ms, etc.

What we want to do is add jitter into our retry strategy.

```csharp
var jittered = Backoff.DecorrelatedJitterBackoffV2(
    medianFirstDelay: TimeSpan.FromMilliseconds(50) 
    retryCount: 5, 
    fastFirst: true);

var jitteredPolicy = Policy
    .Handle<FooException>()
    .WaitAndRetryAsync(jittered);
```

This will create a retry policy where the initial wait will be close to the first delay and then subsequent delays will, largely, follow an exponential back-off. The key here is to shift things just a little per request in an attempt to have lots of little waves crashing against your resource rather than big waves of retries. There's a much fuller write-up (along with science and graphs!) on the [Polly.Contrib.WaitAndRetry readme](https://github.com/Polly-Contrib/Polly.Contrib.WaitAndRetry/blob/master/README.md) and I would highly encourage heading there.

This is where the magic of the WaitAndRetry helpers really shines. While it's awesome for communicating intent with the simpler use cases like in my example of `Backoff.LinearBackoff`, it's downright amazing with the addition of the decorrelated jitter policy. [George Polevoy](https://twitter.com/georgepolevoy), the author of the decorrelation approach, put a lot of hard thinking into this and it really shows. Frankly, I don't have the knowledge to have come up with it myself, but I do have the knowledge to easily take advantage of it thanks to the packaging provided by [Dylan Reisenberger](https://twitter.com/softwarereisen) and [Grant Dickinson](https://github.com/grant-d). 

Again, the full code for the above blog snippits can be found on [this Gist](https://gist.github.com/hyrmn/a5227ed08923f3d14bab7736a9683c24). Any questions or complaints, hit me up on Twitter [@hyrmn](https://twitter.com/hyrmn)