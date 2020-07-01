---
title: Various ways to map data between classes
date: 2020-07-01
description: >-
  How to take data from this object and put it in that object
tags:
  - CSharp
  - Code
  - blogentries
---

A while ago, I wrote about [using AutoMapper to copy data between objects](/intro-to-automapper). Today I want to revisit that and provide some alternatives for mapping. Some serious... some not so serious.

It can be useful to reshape our data by copying it to a more specific structure that's tailored to the current use case. For example, we want to return a limited amount of data in response to an API request rather than our full domain object. Or, maybe we want to let the user send us changes and we want to protect against [overposting](https://www.hanselman.com/blog/ASPNETOverpostingMassAssignmentModelBindingSecurity.aspx).

Let's explore some options in C# and learn something about two powerful `operator`s along the way.

To set the scene, I have a `User` that holds the state for some login and profile information on my to-be-announced e-commerce platform (it's a tool to find cheeses you'll love based on your favorite color... very scientific).

```csharp
public class User
{
  public int Id { get; }
  public string Name { get; }
  public string EmailAddress { get; }
  public string HashedPassword { get; }
  public string FavoriteColor { get; set; }
  public DateTimeOffset AddedOn { get; }

  public User(int id, string name, string favoriteColor, DateTimeOffset addedOn)
  {
    Id = id;
    Name = name;
    FavoriteColor = favoriteColor;
    AddedOn = addedOn;
  }
}
```

I also have an admin screen that lists all of my users. I don't need, or want, nearly as much information for that view. So, I'm going to return a summary object. You might hear these referred to as view models. There's nothing special about them; they're data models exist to make rendering the data via an API response or HTML page or CSV download easier. For a web app, they can look pretty darn boring.

```csharp
public class UserSummary
{
  public int Id { get; set;  }
  public string Name { get; set;  }
}
```

So, how do we get the data from our domain and put it in our view model? Seems trivially easy, right? You probably came up with a few options already. This would be a rather dull blog post if I stopped writing here and left the rest as an exercise to the reader. Let's take a look at some options.

## Inline Mapping

One option is that we can force the caller to do the mapping.

```csharp
public void MapUserManually()
{
  var users = new[] 
  { 
    new User(1, "Bob Almighty", "Green", DateTimeOffset.Now), 
    new User(2, "Alice Wunder", "Orange", DateTimeOffset.Now) 
  };

  var view = users.Select(u => new UserSummary { Id = u.Id, Name = u.Name });
}
```

This approach _can_ be sensible. Especially if there is only one location, or function, where the mapping occurs. However, this quickly falls down if you have, say, three controllers that rely on the same view model. If we decide that the summary must always include the email address, then we have to update *every* place that we map `User` -> `UserSummary`. This is also a bit unpleasant for users of your code, either other developers on your team or you in six months, because it forces you to be intimately familiar with how to construct a valid `UserSummary` from a `User`.

There's got to be a better way

## Mapping with AutoMapper

Let's start with a look at AutoMapper again.

```csharp
public void MapUsingAutoMapper()
{
  var config = new MapperConfiguration(cfg => cfg.CreateMap<User, UserSummary>());
  var mapper = config.CreateMapper();
  
  var users = new[]
  {
    new User(1, "Bob Almighty", "Green", DateTimeOffset.Now),
    new User(2, "Alice Wunder", "Orange", DateTimeOffset.Now)
  };

  var view = mapper.Map<IEnumerable<UserSummary>>(users);
}
```

Since this is not an in-depth AutoMapper article, I've chosen to keep the configuration together with the mapping call. In a production application, you would create the mapping configuration as part of your application's startup.

With AutoMapper, `cfg.CreateMap<User, UserSummary>()` creates a mapping _from_ `User` _to_ `UserSummary`. This automatically works with scenarios like above where I am mapping a **collection** of `User`s to a **collection** of `UserSummary`s. Note, however, that the mapping is one-way only. If you want to map from `UserSummary` back to `User` then you would need to add the inverse as well by adding `cfg.CreateMap<UserSummary, User>()`.

AutoMapper is pretty powerful and we use it extensively at my employer. However, there's no free lunch and that includes mapping tools in .NET. If we change `Name` to `FullName` on our `User` domain object, but then **forget** to rename the same property on our model, we won't get a compilation error. Rather, AutoMapper will happily give us an object with a mapped `Id` and a null `Name`. 

Note, AutoMapper has a method that you can call after you set up the configuration to ensure that all properites on the target mapping are accounted for. You can perform this check by calling `config.AssertConfigurationIsValid();`. But, it's still a runtime check. So, unfortunately, we lose the benefits of our compiler.

## Static Map Method

This next approach is my personal favorite. There's a few reasons for that. First, it puts the responsibility for mapping in **one** spot. Since I tend to put view models near my controllers and the domain "higher" in the hierarchy, that naturally forces the responsibility into the view model as it can see the domain but the domain can't see it.

Let's revisit the `UserSummary` and add a responsiblity for creating itself from a `User`

```csharp
public class UserSummary
{
  public int Id { get; set;  }
  public string Name { get; set;  }

  public static UserSummary MapFrom(User source)
  {
    return new UserSummary
    {
      Id = source.Id,
      Name = source.Name
    };
  }
}
```

I've added a static method that takes in a `User` and gives us back a super-shiny `UserSummary`. I like this because there is a clear home for the mapping logic; if I rename a property on my domain object then my IDE will update the mapping for me; and if I search for references on my UserSummary, I'm guided here.

In action, the call to map looks like this

```csharp
public void MapUserWithStaticMapper()
{
  var users = new[]
  {
    new User(1, "Bob Almighty", "Green", DateTimeOffset.Now),
    new User(2, "Alice Wunder", "Orange", DateTimeOffset.Now)
  };

  var view = users.Select(u => UserSummary.MapFrom(u));
}
```

It's very similar to the first example but now the mapping has a home.

One downside of this is that now we have to write _a lot_ of mapping code. However, there is a very nice Visual Studio add-in that will do this work for you. Check out the [MappingGenerator](https://marketplace.visualstudio.com/items?itemName=54748ff9-45fc-43c2-8ec5-cf7912bc3b84.mappinggenerator). 

Depending on how frequently your mappings change and the existing structure of your app, you may find AutoMapper a better fit for you or you may prefer a static mapper.

## On to misusing C# to do what we want!

I promised some "creative" alternatives for mapping as well. 

### Explicit type conversion

Consider the following code, `var view = (UserSummary) user`. We're telling C# that we want to take our `User` object and strong-arm it into being a `UserSummary` object. As our code stands above, this won't work. It won't work because, as far as C# is concerned, there's no commonality... without making `User` a subclass of `UserSummary`, C# is just going to give us a compiler error, throw it's digital hands up, and call us names.

But, this would be a pretty lackluster spot to leave this blog post if we couldn't come up with some options.

And, we do have options. A way to dazzle your friends and win that coveted trivia night contest finally.

The explicit type conversion operator.

Let's change our `UserSummary` class again and give C# a roadmap on how to get from A to B.

```csharp
public class UserSummary
{
  public int Id { get; set;  }
  public string Name { get; set;  }

  public static explicit operator UserSummary(User source)
  {
    return new UserSummary { Id = source.Id, Name = source.Name };
  }
}
```

At the risk of repeating ourselves, let's see the explicit cast in action

```csharp
public void MapUserWithExplicitCast()
{
  var users = new[]
  {
    new User(1, "Bob Almighty", "Green", DateTimeOffset.Now),
    new User(2, "Alice Wunder", "Orange", DateTimeOffset.Now)
  };

  var view = users.Select(u => (UserSummary)u);
}
```

If you're familiar with LINQ, you're probably wondering why you can't call `users.Cast<UserSummary>()`. The reason is because the explicit cast that we introduced is bound at the [call sites](https://en.wikipedia.org/wiki/Call_site) at compile-time (that is, the code to do the conversion is written at the time you build your app) but the LINQ `.Cast<>()` method is a generic cast performed at runtime and, as such, misses out on that compilation switcharoo.

Would I do this in production code? Not for this kind of use case... no. It forces your caller to know that they can (and should), use an explicit cast to transform the data. Compare this to the `UserSummary.MapFrom()` method where we get intellisense in our IDE and a clear expectation of what to pass. 

That said, we've gotta have some fun in the blog. Plus, there are some valid use cases for it, such as creating a strongly typed ID value object if you're into Domain Driven Design.

### Implicit type conversion

Let's wrap up the code examples with a look at a similar approach to explicit type conversion. In a way, it feels like the inverse. Whereas our explicit type conversion is set up with, well, an explicit cast `var view = (UserSummary) user`, an implicit type conversion relies on the left hand side of the assignment `UserSummary view = user`.

After modifying our code, we have the following

```csharp
public class UserSummary
{
  public int Id { get; set;  }
  public string Name { get; set;  }

  public static implicit operator UserSummary(User source)
  {
    return new UserSummary { Id = source.Id, Name = source.Name };
  }
}
```

I should mention that you **cannot** have both an explicit and implicit operator that take the _same source type_ and return the _same converted type_. If you try and create a class with both the explicit and implicit operators as I have them in this article, you'll get a compiler error.

Now, on to the calling code

```csharp
public void MapUserWithImplicitCast()
{
  var users = new[]
  {
    new User(1, "Bob Almighty", "Green", DateTimeOffset.Now),
    new User(2, "Alice Wunder", "Orange", DateTimeOffset.Now)
  };

  var view = users.Select<User, UserSummary>(u => u);
}
```

We've had to change up our LINQ `.Select()` statement quite a bit. LINQ uses this type internally when iterating over the source collection. As it does, it will call our implicit type converter.

Again, I would not actually use this in production code although, honestly, to me the Select statement reads fairly nice. 

The reason that I don't like the implicit cast here is that it hides the complexity in a way that I'd rather keep centered. And, as with our explicit cast, it forces the caller to understand too much of your internal implementation. But, it's useful to understand explicit and implicit type conversions as they can come in handy.

## Wrapping up

We've covered a bit of ground on how to take data from over here and put it over there. I think AutoMapper or static mappers make the most sense for production applications of any notable size. I prefer static mapping methods as the maintenance _can_ be easier and having one less dependency to manage and update might be worth the trade-off. On the other hand, AutoMapper is great when you have a consistent convention and tests in place to catch any missed mappings.