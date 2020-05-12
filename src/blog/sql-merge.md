---
title: Basic MERGE with SQL Server
date: 2015-02-02
description: >-
  That lovely, funky SQL Server merge syntax
tags:
  - SQL
  - posts
---

SQL Server 2008 introduced [Merge](https://msdn.microsoft.com/en-us/library/bb510625.aspx) which lets you do inserts, updates, and deletes on a target table based on a join to a source entity. While there are some [pitfalls to be aware of](http://www.mssqltips.com/sqlservertip/3074/use-caution-with-sql-servers-merge-statement/), it can be a nice alternative to the 'if not exists insert else update' code we'd otherwise write. 

```sql
IF EXISTS(SELECT 1 FROM RatePlans WITH (updlock, rowlock, holdlock) WHERE BusinessId = @BusinessId and RatePlanId = @RatePlanId)
	UPDATE RatePlans SET RatePlanName = @RatePlanName WHERE BusinessId = @BusinessId and RatePlanId = @RatePlanId
ELSE
	INSERT INTO RatePlans(RatePlanId, BusinessId, RatePlanName) VALUES(@RatePlanId,@BusinessId,@RatePlanName)
```

Becomes

```sql
MERGE into RatePlans WITH (updlock)
USING ( VALUES (@BusinessId, @RatePlanId, @RatePlanName)) as source(BusinessId, RatePlanId, RatePlanName)
	ON source.RatePlanId = RatePlans.RatePlanId 
    AND source.BusinessId = RatePlans.BusinessId
WHEN MATCHED THEN 
	UPDATE SET RatePlanName = source.RatePlanName
WHEN NOT MATCHED THEN 
	INSERT (BusinessId, RatePlanId, RatePlanName)	
	VALUES (source.BusinessId, source.RatePlanId, source.RatePlanName);
```

This shows an upsert using parameterized values. While the Merge version doesn't necessarily read nicer, it [can provide some advantage](http://www.sql-server-performance.com/2012/sql-server-t-sql-tuning-not-in-and-not-exists/). At the least, it's a good option to have in your back pocket.