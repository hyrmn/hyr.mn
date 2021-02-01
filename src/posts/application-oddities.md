---
title: Living with your creations
date: 2021-02-01
description: >-
  Some musings on supporting the same software for years
tags:
  - blogentries
---

Last week, I [tweeted out](https://twitter.com/hyrmn/status/1355249530086838279) the three oddities of application development:

- How you thought you built the system  
- How you built the system  
- How your system is used  

I'm not tredding any new ground here. There's been a lot of thinking by smart people on emerging properties of complex systems. But, I wanted to take a bit of time and talk about my experience and maybe share some ideas and techniques for life in a small company with a focus on a B2B SaaS product.

I've been living with, and supporting, a software product for 8 years now. So, these opinions are formed by that.

When you first set out to build a system, you'll anchor some large architectural and design decisions. You probably won't do a big design up front, but you'll make decisions and live with them. Some decisions you won't even know you've made... but not choosing is still a choice. Because communication is lossy, your mental model of the system will never match your coworkers' mental model of the system. You'll try, and you'll get pretty close but you'll all have implicit assumptions that seep in.

Over time, what you thought you built is not what you built.

You'll face market pressure; real and imagined. Enhancements and features, like water, will seek the path of least resistance in their journey to production. You'll shore up pathways and dam off bad directions, but riverbanks will still shift on you.

Heck, you will not be the same person with the same skills in two years that you are now. Your tools, libraries, frameworks and, most importantly, your thinking will change. You'll purposely take new code and new designs in a different direction. But you can't lift and shift all of the old code.

Again, over time, what you thought you built is not what you built. Multiply that by the size (and churn) of your team. Multiply it by the years your app has existed. Realize that, in some nook, some forgotten logic path, your code is lying to you. Unit tests help. Integration tests help. You still missed what happens with that I/O interaction at the edge.

## How to handle code untruths

For me, this is multi-pronged.

During development, leave your code better than you found it. You can't be solely focused on pulling work, completing work, pushing work and moving on. You need to revisit those old code paths. Clean behind the fridge once in a while. Can your unit tests be better? Should you add an integration test for that path you noticed but didn't touch while you were working on your feature?

In production, I've found that you absolutely will live and die by your application instrumentation and logging. Maybe you can invest in observability. Maybe you can't. But, at the very least, you need to be able to see the runtime execution path. For us, we've gotten a lot of mileage off of correlation ids from the front-end all the way back and using [Seq](https://datalust.co/seq) to monitor and slice when things go wrong. Things will go wrong.

## But then, the users

The thing is.. all of the above is trivial once you get to the real issue with your application. And that's that people will use it. People will use it in ways you didn't realize or understand. 

We had an idea in mind that people would edit a certain document maybe a dozen times. Heck, even that seemed like a stretch. When a user saved their edits, we'd throw the current and previous state on a queue to be picked up by a backend store for reporting. Well, our mental model of our users was shattered when one user made 300 edits which caused the document to be so large that the system couldn't enqueue it.

Or, they won't use a feature you built. 

There are two broad efforts you should think about with your users. First, learn how they use your software, and then either adapt to them or help them adapt. Second, write tools to analyze the data to answer meta questions.

Broadly, think about how you can test your hypotheses quickly and cheaply. Then put the tooling in place to do that.

If you're offering a web-based service, instrument the important paths through your system so that you can see how your application is being used. **Talk to the people that use your system**. You will have a core group of power users. You will have people that absolutely love your product and want you to succeed. Identify these people and talk to them; make their life easier.

Think about how you'll store your data and write tools to give you answers.

We store some information in a way that we can answer questions about trends about, or affecting, all of our customers. We have utilities in place to run a little bit of code across all of our tenants. Being about to go from question to answer in < 30 minutes is powerful. Why have a meeting to talk about if you should work on a feature when you can quickly show how people are using it. And who the heaviest users are.

These tools can be rough. They're for your team and you can add the polish in over time. But, you must have internal support tooling from the start.

## Parting

We're a small team with a profitable product. We've out-competed much bigger companies in our space. We have great net promoter scores with our customers. Some of that is driven by the fact that we can quickly learn about, and adapt to, our customers. Accept that your system is going to evolve and be used in ways you never imagined and think about how to support your team and your customers on that journey.