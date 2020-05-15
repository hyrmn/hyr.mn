---
title: Moving to Wyam
date: 2016-06-15
description: >-
  On playing with the best .NET static site generator 
---

I've just completed moving my blog from Ghost hosted on Azure (back) to static pages on GitHub. Previously, I was using Jekyll; this time I'm using [Wyam](http://wyam.io/). Wyam is a static site generator written in C\#. It's very flexible, extensible, and comes with a lot of sweetness out of the box.

In other words, it's not just a blog generator... but, it obviously works well as one.

The docs are an excellent starting point. From there, I headed to the [GitHub repository](https://github.com/daveaglick/daveaglick) of [David Glick](https://twitter.com/daveaglick) (Wyam's creator) to liberally 'borrow' (steal) from his config file.

You can see the source for my blog at [https://github.com/hyrmn/hyr.mn/](https://github.com/hyrmn/hyr.mn/). 

A few things to call out that stumped me at first...

Many methods, such as `WriteFiles` can take in a lambda. If you use either the context or document, there's a shortcut way to expand the lambda. If you don't use either of those, you must declare the lambda.

```csharp
WriteFiles(@doc["Filename"]) //this uses some metadata from the document object

WriteFiles((doc, ctx) =>  "index.html") //this specifies a static filename
```

Module declaration order matters. When it comes to processing, Wyam is safe by default. That is, if you tell it to order your posts by some metadata declared in the frontmatter, and you haven't read in the frontmatter yet, it will go on it's merry way. 

```csharp
//I want the most recent post to be the home index as well.
Pipelines.Add("MostRecentAsIndex",
	ReadFiles("posts/*.md"),  // Read all markdown files in /posts
	FrontMatter(Yaml()),  // Load any frontmatter and parse it as YAML markup
	OrderBy(@doc.Get<DateTime>("Published")).Descending(),
	Take(1),
        ...
);
```

If you switch the FrontMatter method call with the OrderBy + Take, it will process just fine... but you won't get your correct order.

Last, the modules documentation mention fluent method chaining. Take a look at the [OrderBy](http://wyam.io/modules/orderby) documentation for example. You can see how that looks in my example above

```csharp
OrderBy(@doc.Get<DateTime>("Published")).Descending()
```

But, aside from those few things I had to bang on a bit to figure out, the docs are great; the tool is awesome; and I look forward to having some fun with this.
