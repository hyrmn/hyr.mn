---
title: An introduction to AutoMapper
date: "2013-08-29"
description: >-
  How to take everything from this object and put it in that object
tags:
  - CSharp
  - Code
---

There's probably been a time where you needed to map properties from one object to another. Maybe you had a domain object that needed to be mapped to a DTO or some other view model thingy de jour. 

You might have written something like a ToDto method off of your domain object

```csharp
public class Customer
{
  public int Id { get; set; }
  public string FirstName { get; set; }
  public string LastName { get; set; }
  public string FavoriteColor { get; set; }
  //more properties, lots more, trust me

  public CustomerSummaryDto ToDto()
  {
    return new CustomerSummaryDto
      {
        FirstName = FirstName,
        LastName = LastName
      };
  }
}

public class CustomerSummaryDto
{
  public int Id { get; set; }
  public string FirstName { get; set; }
  public string LastName { get; set; }
}
```

That can end up being a lot of boilerplate code.

Oh, and what happens when you want to introduce a new view model that contains customer id and favorite color?

There has to be a better way, right? I mean, we could sit down and come up with something based on reflection that works pretty well for our scenario. It's a one-off, but, hey, the time savings justify it.

But, wait, there's already a library that does that! Enter [AutoMapper](http://www.nuget.org/packages/AutoMapper/). AutoMapper is a convention-based mapping tool. If your needs and your naming schema follow what AutMapper expects, then you have to do almost nothing. If they vary, well there are some pretty easy ways to tell AutoMapper how to handle your edge cases.

The flow of AutoMapper has two parts. First, we configure our maps... telling AutoMapper what it can map (and provide tweaks if needed for edge cases). We do that once. If you're in ASP.NET, this could go in an App_Start file.

Then, we give AutoMapper a source and get back a target.

```csharp
using Shouldly;
using AutoMapper;

public class MyMappingTests
{
  public MyMappingTests()
  {
    Mapper.CreateMap<Customer, CustomerSummaryDto>();
  }

  public void CanMapCustomerToDto()
  {
    var customer = new Customer { 
      FirstName = "Ned", 
      LastName = "Ryerson" 
    };
    
    var dto = Mapper.Map<CustomerSummaryDto>(customer);

    dto.LastName.ShouldBe("Ryerson");
  }
}
```

Now, granted, this is overkill for our very simple example. However, if you have a fair-size domain and/or a lot of DTOs or view models that you map back and forth, AutoMapper quickly becomes worth it.