---
title: Non-destructive integration tests with .NET 2.0
date:  2006-07-17
description: >-
  How to do database integration tests with .NET 2.0
---

I had a very basic programming need the other day. I needed to unit test my data access code but I didn't want to leave my database in an inconsistent state afterwards. It's a basic problem that is usually solved by just writing clean-up code in the set up and tear down routines... that's not pretty, though. We have .Net 2.0 now, though, and that's very pretty. So, it stands to reason, there must be some way to solve this in 2.0. And, thanks to the wonderfully powerful, amazingly simple, joyously useful System.Transactions namespace, the solution is simple, elegant, and workable.

```csharp
public class TransactionalTest
{
  public TransactionalTest()
  {
    Transaction.Current = new CommittableTransaction();
  }

  ~TransactionalTest()
  {
    if (Transaction.Current != null &&
        Transaction.Current.TransactionInformation.Status !=
        TransactionStatus.Committed)
    {
        Transaction.Current.Rollback();
    }
  }
}
```

All your test needs to do to is extend this test and you're in business:

```csharp
[TestFixture]
public class AccountTest : TransactionalTest
{
  [Test]
  public void CreateAccount()
  {
    Account user = new Account();
    user.Username = "test";
    user.EmailAddress = "test@somedomain.com";
    user.Password = "test";
  
    user.Save();
  
    Assert.IsTrue(user.Id > 0);
    }
}
```
This particular test works against SQL Server 2000, but it should work with any ADO.NET provider that supports auto-enlisting. Basically, what's going on here is that we create a new System.Transactions transaction.

When I spin up my ADO.NET connection, it auto-enlists in the transaction and then (since I'm using SQL Server 2000) promotes the transaction to the Distributed Transaction Coordinator (gotcha note, you need to have DTC enabled on the database server if it's SQL Server 2000 and you're using System.Transactions).

The transaction is then discarded in the class destructor. It might be nice to have more control over this step. After all, you can't know for certain when the garbage collector will sweep, but I prefer the ease of not forcing any more effort than needed into my test classes. Besides, since you'll typically be running this on a local dev box or build station, having a few transactions in an uncertain state isn't the end of the world.

Oh, by the way, the underlying data access layer for this is NHibernate 1.2 Alpha1, but that doesn't matter. 