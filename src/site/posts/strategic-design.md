---
title: A Hitchhiker's Guide to Strategic Design
date: 2023-07-15
description: >-
  Exploring Domain Driven Design to deliver robust software
tags:
  - DDD
  - blogentries
---

In this post, I'd like to talk about strategic software design and aligning architecture and delivery with business needs. I'll provide a high-level introduction to some of the strategic aspects of Domain Driven Design (DDD), Event Sourcing, and Event-Driven Architecture (EDA) as a way to achieve long-term objectives. Not the only way... but a way.

My hope is that, by the end of this article, you'll have some ideas on how to approach challenges that arise in the balance of shipping software that lasts. Each section only barely scratches the surface of the topic but it will give you a starting point to dig deeper as you map out your own domain.

Not every software product is a good fit for domain driven design. Event Sourcing doesn't fit every problem space. Event-Driven Architecture isn't a magic bullet for scale problems. And, not every business will survive long enough to have scale problems.

Once a business has validated their market fit, started to clarify their core value stream, and is grappling with cross-team coordination, then the topics below will be worth considering.

> Cash Rules Everything Around Me

 — Wu-Tang Clan

## Our "Simple" Scenario

Let's pretend that we work at a small, luxury hotel chain. This chain specializes in destination properties. Business comes from a mix of individual bookings, group bookings for weddings, and corporate retreats. Our CEO wants to modernize the business and has asked us to build a new system to manage bookings and reservations.  

## And Off We Go

But, wait. A word of warning before we start.

Domain Driven Design is slower than other approaches. It is more deliberate. It involves aligning business, product, and technology. You should use it when you want to build software that lasts. You should use it to focus on your core domain; your core differentiator and value proposition. It might be the follow-on implementation step once you've drawn out Wardley Maps and know where to best spend your engineering hours.

Do not use these techniques to build an MVP to validate market fit. 

With that, let's get started with the first tools in our kit for building software that lasts. 

As you start to work with the business and product owners on a hotel reservation system, you'll start to form a high-level picture of various aspects of running a hotel. 

We can use some techniques from Domain Driven Design to help bring order and focus to these aspects.

## Bounded Contexts

One of the challenges with delivering a solution is understanding the current process. As you talk to key stakeholders, you'll discover that the front desk personnel have separate functions from the group sales team. And, likewise, the housekeeping staff have different tasks than the maintenance team. They'll all have distinct workflows and language. 

> Put Like With Like

 — literally every organization book ever

A Bounded Context is a way to group the common things together within a team or function. It's very hard to get it right the first time and you likely will iterate in several sessions with your stakeholders before boundaries crystalize. One tip from Vaughn Vernon is that a Bounded Context is a linguistic boundary. That is, the terms and language within a Bounded Context are consistent.

For example, the front desk staff will talk about reservations, check-ins, check-outs, and folios. The housekeeping staff will talk about floor assignments, dirty rooms, and late checkouts. While the group sales team will talk about room blocks, room rates, and room types.

Drawing these bounded contexts will help you to design the components of the system. If you are delivering a modular monolith then you'll want to keep these boundaries in mind as you design the modules. If you are delivering a microservice architecture then you'll want to keep these boundaries in mind as you design the services.

One more tip... odds are very good that the bounded contexts you identify will align with the organizational structure of the business. That's ok.

> Any organization that designs a system (defined broadly) will produce a design whose structure is a copy of the organization's communication structure.

 — Melvin E. Conway

## Ubiquitious Language

Concurrently with discovering the bounded contexts, you'll want to start to build a shared language with the business. This is called a Ubiquitous Language. Referring back to Mr. Vernon's tip about linguistic barriers, we should ensure that the organization refers to the same thing with the same label within a given context.

Imagine working in IT at a yoga chain, for example, where one part of the business calls an instructor-led session a "class" while another team calls it an "event" and yet another team might call it an "activity". This is a recipe for confusion and frustration.

We should avoid confusion and frustration.

For all of the teams working within a bounded context, we should develop and mature a ubiquitous language. We want developers, designers, product managers, and business stakeholders to have a common language; a common way to describe the problem. We want this to permeate so deeply that the language used in meetings is the language used in support tickets is the language used in the software code.

Some language will be common across the entire organization. For example, a "guest" means the same thing to the front desk, housekeeping, and maintenance. 

Some language will be specific to a bounded context. For example, a "Do Not Rent" list is specific to the front desk. 

(aside, you never want to be a "guest" on a "do not rent" list in any context)

## Context Maps

After we've discovered the bounded contexts and started to develop a ubiquitous language, we'll want to start to map the relationships between the bounded contexts. This is called a Context Map.

A Context Map will show the synapses firing in the organizational brain; the impulses that cause other parts of the business to light up.

Within our reservation system, a "check-in" in the front desk context will cause a "room assignment" in the housekeeping context. It might also trigger a "forecast for breakfast" in the kitchen context.

## Event Storming / Event Modeling

Domain Driven Design is, in many ways, focused on the flow of information through the business and capturing how that information is acted on to make decisions. It captures process and workflow. Software becomes an outcome that supports and automates these workflows.

Discovering and validating the workflow (aka, finding the "things everybody knows" and making sure everybody actually knows them) is difficult.

One way to do this, and surface your boundaries and assumptions at the same time, is through Event Storming sessions. In these sessions, you'll take one, or several, long-lived business processes and model the events that occur end-to-end. These sessions must involve the stakeholders, product owners, and tech. 

Stay high-level in these sessions. You can go deeper into Event Storming within a team or single business function later. However, your initial session is to capture the strategic, organizational-wide view. Look for the handoffs between teams to complete critical business functions in the core value stream of the business. 

At the end of the sessions, you should have clarified and validated your bounded contexts and context maps. Pay attention to the language people use when describing their process inputs and outputs. If you think you have solidly defined borders for your bounded contexts but the language within one of those borders isn't consistent then you may have found a new context... or at least you've identified that you need some workshops.

## Event-Driven Architecture

We've talked about events quite a bit so far. This is no coincidence. In this context, events tend to be asynchronously communicated information. In many ways, this models the natural flow of information in an organization.... unless you have a boss that hovers over your desk until you complete your task.

Let's imagine that you're going to your favorite restaurant this weekend. You called to make a reservation. That's an event. You give the waiter your order. Another event. That waiter then gives the order to the kitchen. That is, you guessed it, another event. 

All along the way, there's valuable information being passed and translated for each bounded context. But, no one is blocked and waiting for a response.

Going back to our event storming and context maps, we can see that exchanging information between bounded contexts is a useful paradigm. When it comes to the actual implementation of our software, we can translate this into an Event-Driven Architecture.

An Event-Driven Architecture is valuable on its own. While Domain Driven Design makes the most sense when focusing on our core domain, an Event- Driven Architecture is useful for communication between supporting systems as well. It allows us to independently scale and decouple capabilities. And, it allows us to build future capabilities that tap into existing information flow without impact.

But, there is also a real cost to adopting this architecture. If multiple services must coordinate to fulfill a user's request then you must plan and design for scenarios when one or more of those services has a stale view of the world because they are delayed in processing events or a myriad of other communication and processing issues.

## Event Sourcing

While it is more tactical than the other topics we've covered, I wanted to cover Event Sourcing as well. I've been in too many conversations where Event Sourcing and Event-Driven Architecture are conflated and used interchangeably.

Event Sourcing is a technique where we model the current state of the system by capturing every decision that led to that state. As an overused, but classic, example, the current state (balance) of your bank account is the sum of all events (deposits and withdrawals) that have happened.

Event Sourcing is very powerful but should not be used indiscriminately. In the hotel reservation system within the front desk bounded context, event sourcing would probably be very useful for the guest folio. You'll want to know every charge and every payment that has been made. However, that same front desk bounded context does not care about the history of the guest... that they moved or changed their name. However, that information is useful to the group sales bounded context and it might make sense to event source that there. Meanwhile, the housekeeping system might not benefit from event sourcing at all.

Choose carefully. Event Sourcing is a great way to capture the "why" behind state changes in a system. It is focused on all of the small changes within a system. Meanwhile, events in an Event-Driven Architecture tend to be "chunkier". 

Back to our reservation system, internally we might capture when a room is reserved, when the reservation is moved to a new room because of some request, when the guest checked in, and when the guest checked out. But, it might only publish the check-in and check-out events and those events may be enriched with more information than internal events (or, conversely, less information if you're publishing skinny events).

As an aside, if you adopt Event Sourcing, then you will likely also adopt Command Query Responsibility Segregation (CQRS). You can, of course, adopt CQRS on its own as well and I happen to think it's one of the easiest ways to simplify a system's architecture. As it's orthogonal to this blog post's topic, I'll leave it to another post.

## Conclusion

My goal in this blog post was to provide a very high-level introduction to strategic DDD and some of the supporting tactical architectures that often go hand-in-hand with DDD. 

Delivery speed, real or perceived, is slower with DDD; at least at first. In my opinion, the real value of DDD is in aligning people and teams. This alignment is critical in the core value streams of the organization. Unless you're an HR services company, your payroll system is not a differentiator. On the other hand, if you work at a hotel chain then the reservation system may be a core competitive advantage. Spend time on your advantage.

Even if you adopt nothing else from strategic DDD, there's immense value in capturing your organization's ubiquitious language. If you're not ready for bounded contexts and event storming then at least start with this.

Adopting an Event-Driven Architecture brings its own set of trade-offs. Asynchronous communication between disparate services can be more scalable but will also bring challenges and trade-offs around data exchange, eventual consistency, and data staleness.

Event Sourcing is a powerful approach to baking the reason for each state change into your system. And, while you get an audit log "for free" out of the implementation, you now need to think through how events will change and be versioned over time. Even within a single system within a bounded context, it is likely that not everything in that system would benefit from being event sourced. 

But, in spite of the challenges, strategic DDD is a very valuable tool in aligning everyone around delivering the core value of your organization. And, it will ensure that you can best focus on what matters vs what is important but not part of your core domain.

Adopting an Event-Driven Architecture can happen independent of DDD but it shines as the bridge between bounded contexts identified by DDD. It allows teams to be loosely-coupled and able to evolve their systems and architectures independently by adhering to messaging contracts for information exchange. And, defining these messaging contracts can be a concrete implementation of the ubiquitous language in the organization.

And, implementing Event Sourcing in your core applications and services will also reflect the business processes and ubiquitous language within the bounded context they support. You'll capture the intent with each change which can unlock other capabilities. And, since you will always have the events that led to the current state of the system, you aren't limited on when those capabilities can manifest.

I hope that you found this overview helpful.
