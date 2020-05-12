---
title: The System
date: "2012-07-25"
description: >-
  A cautionary tale of hubris in IT development
tags:
  - DevLife
---

Once upon a time, I started a job as a technical lead for a web development group. 

In my group, there was a long-standing tradition where the junior members got stuck on maintenance and the senior devs got to do the cool, new stuff. I didn't like that so I put myself on maintenance to start. (If you want to see where a system sucks, support it). 

That's where I was introduced to The System.

Now, I never actually met The Architect of The System. I have heard plenty of stories, though. Apparently, this person was very proud of the fact that they used every GoF pattern in The System... and he used every pattern incorrectly.

The demise of The Architect started around the time that his beautiful new application, that was to be a pattern for all future development, went to production. This asp.net app could support a total of one concurrent user per server. As soon as a second user hit the same server, IIS bombed. You have to be a pretty special developer to do that.

Of course, the business sponsor was less than thrilled.

So, the rest of the team scrambled and monkey-patched around the worst parts of The System. They put in error handling and logging; they ripped out the parts they could; they busted through layers of abstraction where they needed to (bypassing seven abstracted calls to load a list of states in favor of a data reader directly against the database, for instance).

The Architect hated that the team put in error logging. A system as beautiful as his shouldn't have errors, so he removed all of their code and suppressed any throws. He was told that he wasn't allowed to touch the code any more.

So, The Architect compromised another developer's version control account and started committing code as that developer. This hastened the departure of The Architect.

The System eventually "stabilized" and went to production. It had been in production for about a year when I started.

All told, The System, a very simple "display data, get input, save input to database and notify these backend systems" application, weighed in at 98,000 lines of code. Spread across 20 assemblies. No unit tests. 

It accounted for 25% of our code base and was as big, or bigger than, the websites that used it. We did monthly production releases and, every month, it accounted for 50% of our QA defects (The System had rather unpredictable behavior plus we found discrepencies between the business requirements and QA regression test scripts... a bad combination).

Of all the parts of The System, a few stand out so well that they've become my favorite bad code examples... Now, keep in mind, the code was entirely C#. A statically-typed language. A language that will throw errors when you try and access non-existant methods and properties. A language with a good IDE and tooling to help you write code.

The System scoffs at such namby-pamby approaches. That's not resilient to change! But this... this is:

```csharp
public class Person
{
  public string FirstName { get; set; }
  //... 15 more properties

  public object GetValue(string valueName)
  {
    switch (valueName)
    {
      case "FNAME":
      case "FIRSTNAME":
        return FirstName;
      //... 15 more cases
    }
  }

  public void SetValue(string valueName, object value)
  {
    switch (valueName)
    {
      case "FNAME":
      case "FIRSTNAME":
        FirstName = value;
      //... 15 more cases
    }
  }
}
```

I do want to leave this on a high note. I worked to rewrite The System. I had some help along the way; these things are never solo jobs. QA people to test and help normalize business requirements against test cases, an outstanding developer who took over my work for the last push into production, a business owner willing to pay for the QA effort, and a smart boss who realized how much faster we could go every month if we weren't chasing down regression bugs.

All told, I reduced The System from 98,000 lines of code spread across 20 projects to 17,000 lines of code in three projects.  And, that new line count included automated unit tests for everything behind the UI. The System stopped being a monthly QA nightmare.