---
title: Database Tuning - Y U NO SORT IN APPLICATION
date: "2012-07-19"
description: >-
  Part two on obsessing over database queries
---

[Rob](http://tekpub.com/productions/ft_sullivan) [Sullivan](https://twitter.com/datachomp) has a great post on why [your application shouldn't waste the database's time sorting your data](http://datachomp.com/archives/hey-app-quit-wasting-my-time-sorting-your-data/). I will be the first to admit it, I'm guilty of this. It's just so damn easy to pass in an order by and be done.

But, you know what, sometimes it's even worse than that! I'm going to visit another section of [yesterday's tuning work](/Key-Lookups-are-Bad/) and this time we're going to hit on a small, but important, detail.

![Forgive me Rob, for I have sinned](/img/no_sort.png)

The last thing I do before returning my result set is sort. Forgive me Rob, for I have sinned. Ok, I know what you're thinking, 1.7% of a query that runs in sub-300ms isn't really a huge cost. But, multiply that by the number of concurrent requests we serve and it starts to add up pretty quickly.

We're still not to the bad part. We take this very flat result set and turn it into a pretty robust object graph in our domain model. Then, we do an in-memory sort based on a different set of criteria and display the data. That's right, we're not even *using* that order by. It's **dead code!**

Around here, we remove and bury dead code.