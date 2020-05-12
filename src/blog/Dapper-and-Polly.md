---
title: SQL Server Retries with Dapper and Polly
date: 2019-09-03
description: >-
  Retryable SQL Server exceptions, that lovely little library called Polly, and Dapper (or your favorite database access library)
tags:
  - CSharp
  - Code
  - Polly
  - posts
---

If you're just here for the code, you can grab it in [this Gist](https://gist.github.com/hyrmn/ce124e9b1f50dbf9d241390ebc8f6df3)

[Ken Dale](https://twitter.com/kendaleiv) wrote a post on the RIM Dev blog on how to [Retry Transient Failures Using SqlClient / ADO.NET With Polly](https://rimdev.io/retry-transient-failures-using-sqlclient-adonet-with-polly/). Their use case is similar to mine but different enough that I thought it'd be worth sharing our implementation.

Like RIM, our tech stack is on Azure and we heavily rely on SQL Azure. We write to a service bus topic; a service then uses those messages to update a reporting database. If the message cannot be written then it's automatically returned to the queue and retried later. After 5 retries, the service dead-letters the message.

To accomplish this, our database structure and message handling code is idempotent. Getting, or applying, the same message twice won't cause duplicated data.

Our first thought that attempting to process the message x times and then deadlettering would be enough. However, at least in the early days (6+ years ago) after launch, we found out that we were mistaken. Sometimes SQL Azure just didn't want to cooperate. it's gotten much better since.

Enter [Polly](https://github.com/App-vNext/Polly/). Polly allows for all sorts of amazing retry logic. The things you need to care about in any distributed environment. From basic retry logic like I'll show here to circuit breakers (great if you're calling a flaky remote service and you don't want their service degradation to bring your app down).

The original code, along with [Dapper](https://github.com/StackExchange/Dapper), has been in production for quite a while. I've since updated to use the `async` methods in Dapper and thought I should share what we use.

Following is a simplified version of the full code that's available on [this Gist](https://gist.github.com/hyrmn/ce124e9b1f50dbf9d241390ebc8f6df3)

At the time of this post, I'm using Polly v7.0 and Dapper v2.0

```csharp
var retryPolicy = Policy
      .Handle<SqlException>(SqlServerTransientExceptionDetector.ShouldRetryOn)
      .Or<TimeoutException>()
      .OrInner<Win32Exception>(SqlServerTransientExceptionDetector.ShouldRetryOn)
      .WaitAndRetryAsync(RetryTimes);

```

```csharp
public static class SqlServerTransientExceptionDetector
{
    public static bool ShouldRetryOn(SqlException ex) {
      // See Gist
    }

    public static bool ShouldRetryOn(Win32Exception ex) {
      // See Gist
    }
}
```

We're defining an `AsyncRetryPolicy` Polly policy. When an exception is raised in the called code, Polly will look to see if it's an exception we want handled. In this case, we're looking for SqlExceptions, Timeouts, and a wrapped Win32 exception. For SqlExceptions and Win32 exceptions, we're going to further look to see if we can retry it with a call to `SqlServerTransientExceptionDetector`. For timeout exceptions, we'll just retry automatically.

I've given Polly a set number of times to retry with a static back-off. If it exhausts the number of retry times then the exception will then be bubbled up to the calling code. Our service then throws the message back on the service bus to try again or deadletters the message to be handled out of band.

I've created two Dapper extension methods to wrap up calling Polly.

```csharp
static async Task<int> ExecuteAsyncWithRetry(this IDbConnection cnn, 
  string sql, 
  object param = null) =>
    await RetryPolicy.ExecuteAsync(async () => await cnn.ExecuteAsync(sql, param));

static async Task<IEnumerable<T>> QueryAsyncWithRetry<T>(this IDbConnection cnn,
  string sql, 
  object param = null) =>
    await RetryPolicy.ExecuteAsync(async () => await cnn.QueryAsync<T>(sql, param));
```

The caller might then look like this

```csharp
public async Task UpsertPerson(string firstName, string lastName)
{
    await _conn.ExecuteAsyncWithRetry(_upsertSql,
                    new
                    {
                        firstName,
                        lastName
                    });
}
```

Again, the full code for the above classes can be found on [this Gist](https://gist.github.com/hyrmn/ce124e9b1f50dbf9d241390ebc8f6df3). Any questions or complaints, hit me up on Twitter [@hyrmn](https://twitter.com/hyrmn)