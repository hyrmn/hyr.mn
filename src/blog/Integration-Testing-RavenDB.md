---
title: Integration Testing with RavenDB for Fun and Profit
date: 2012-07-23
description: >-
  Some tips for integration tests with RavenDB; the document database for .NET (plus other languages but we only care about that, right?)
tags:
  - CSharp
  - Code
  - RavenDb
  - blogentries
---

I'm working on a project where we're replacing db4o with RavenDB as an embedded data store. Now, normally, when you're integration testing and a database is involved, you mock the heck out of it because you don't want the hassle of cleaning up your test data and you don't want the slowness of hitting an actual database (sure, some of them are fast, and some not so much).

RavenDB was built to be used wherever you want. There are two things you should do for testing with it, though.

First, configure it to run in memory. This will prevent it from writing to disk... which means no cleanup work on your end. Normally I'd also mention something about how in-memory is much faster but, c'mon, it's Raven after all.

Second, set up a custom listener that automatically decorates your query with a behavior that ensures your indexes have been written.

```csharp
public abstract class UsingRaven : IDisposable
{
  public readonly EmbeddableDocumentStore DocumentStore;
  public readonly IDocumentSession DocumentSession;

  public class NoStaleQueriesAllowed : IDocumentQueryListener
  {
    public void BeforeQueryExecuted(IDocumentQueryCustomization queryCustomization)
    {
      queryCustomization.WaitForNonStaleResults();
    }
  }

  protected UsingRaven()
  {
    this.DocumentStore = new EmbeddableDocumentStore() { RunInMemory = true };
    this.DocumentStore.RegisterListener(new NoStaleQueriesAllowed());

    this.DocumentStore.Initialize();

    this.DocumentSession = this.DocumentStore.OpenSession();
  }

  public void Dispose()
  {
    this.DocumentStore.Dispose();
  }

  protected void SetupData(Action<IDocumentSession> action)
  {
    using (var session = DocumentStore.OpenSession())
    {
      action(session);
      session.SaveChanges();
    }
  }

  protected IQueryable<T> Query<T>()
  {
    return DocumentSession.Query<T>();
  }

  protected T Get<T>()
  {
    return Query<T>().FirstOrDefault();
  }
}
```

Using it in action would then be something like

```csharp
//ever wonder why programmers are so obsessed with ninjas?
public class Ninja
{
  public string Name { get; set; }
  public string Rank { get; set; }
}

public class HackTheNinja : UsingRaven
{
  public HackTheNinja()
  {
    this.SetupData(session => session.Store(new Ninja { Name = "Bob" }));
  }

  [Fact]
  public void CanDoCoolDojoThings()
  {
    //super-secret dojo training
    this.Get<Ninja>().Rank.ShouldBe("Master");
  }
}
```

Fast, lightweight, in-memory fun with RavenDB and it doesn't leave a mess. What's not to love?