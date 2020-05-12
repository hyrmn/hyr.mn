---
title: RavenDB Multitenant lessons learned
date: 2016-06-28
description: >-
  Lessons learned from life with RavenDB 2.5 in production
tags:
  - CSharp
  - Code
  - RavenDb
  - posts
---

Note: Parts of this post are rather specific to RavenDB 2.5. While the overall lessons should guide you on any version, some specifics, such as pre-staging indexes, have better stories in newer versions (see, side-by-side indexes). We run on Azure virtual machines and some thoughts are specific to that platform as well.

We run a multi-node active-active RavenDB cluster with ~500 tenants. About 300 of those are active with the remainder being demos, accounts for sales people, research, etc. Our average tenant has 100k documents with the highest being around 600k. Multitenant support in Raven is straightforward; just specify a database name when you open a session! This means you don't have to remember to decorate every query with a discriminator or jump through any other design decisions to not accidentally show the wrong thing to the wrong customer. Positive design pressure.

We have learned some lessons after supporting this in production on Azure for a couple years and I thought I'd share.

 - Write tooling to support automatic tenant creation across all nodes
 - Favor active-active read/write and let Raven handle syncing behind the scenes until your constraints force you to active-passive or another solution
 - Expect replication to randomly not be set up between nodes even if it tells you it succeeded. Raven will log when replication isn't correct
 - Centralize logging for your nodes. We use Seq for our logging and I've documented how to get [Raven to log to Seq](/ravendb-seq/)
 - More RAM is better than less RAM
 - Faster disk is better than slower disk. This was a problem for us on Azure but premium disk storage did alleviate the problems we first encountered (indexing performance issues)
 - Understand how your hosting infra affects Raven. We had to write custom failover code because of all of the virtual layers on Azure caused the client to not respond quick enough in a failover from the primary node to a secondary. [Code here](https://gist.github.com/hyrmn/7262c3d7450793550e48)
 - Pre-stage indexes. Use an index naming scheme to support this (eg, `PeopleSearch` changes get deployed as `PeopleSearch2`). This means you should never reference an index by string
 - Running is fine but server restarts are slow and messy. Block client traffic to the node and let clients failover to other node(s)
 - Multi-tenant on Raven is incredibly straightforward; use it to isolate at appropriate bounded contexts
 - Write tooling to sanity check your databases across nodes. We compare doc counts and flag any that are significantly off
 - Ditto checking indexes. I've seen non-stale indexes differ by several thousand documents across nodes. Forcing a change to the index definition (eg, add a space and save) will fix. This isn't ideal.
 - If you're on Azure, assume the networking layers will occasionally interrupt your writes. We use Polly to address this 

Overall, I'm happy. Even though I complain a lot (it's what I do).