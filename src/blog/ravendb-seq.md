---
title: Logging from RavenDB to Seq
date: 2015-01-15
description: >-
  How to integrate RavenDB server logging into Seq so you can up your visibility game
tags:
  - CSharp
  - Code
  - RavenDb
  - posts
---

**The following applies to Raven 2.5.** It might apply to later versions as well...

We've settled on [Seq](http://getseq.net/) for our logging aggregator. Our apps log messages locally and to a Seq instance and everything just plain works. However, we were left with some gaps on our RavenDB instances. So, the task for today was to figure out how to wire up RavenDB, which uses NLog, to send its log messages to our Seq instance.

The venerable [Nicholas Blumhardt](https://twitter.com/nblumhardt) has an [NLog-to-Seq library](https://github.com/continuousit/seq-client). However, the verson on Nuget (as of this writing) takes a dependency on NLog 3.2. RavenDB 2.5 comes with NLog 2.0. My attempts at assembly binding redirects failed.

So, I copied (borrowed / stole / whatever) the code from the Seq NLog client. I then referenced the NLog binary that comes with Raven in my shiny new Raven.Seq.Client.NLog assembly and built.

After compiling, I placed the following dlls from my output directory in Raven.Server folder

```csharp
System.Net.Http.Extensions.dll
System.Net.Http.Primitives.dll
Raven.Seq.Client.NLog.dll
```

I then added a shiny new ``nlog.config`` file.

My nlog.config (or at least as it pertains to Seq) looks like this:

```xml
<?xml version="1.0" encoding="utf-8" ?>
<nlog xmlns="http://www.nlog-project.org/schemas/NLog.xsd"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
	<extensions>
		<add assembly="Raven.Seq.Client.NLog"/>
	</extensions>
	<targets>
		<target name="seq" type="Seq" serverUrl="http://localhost:5341/">
			<property name="Server" value="${machinename}" />
			<property name="database" value="${mdc:item=database}"/>
		</target>
	</targets>
	<rules>
		<logger name="Raven.*" minlevel="Warn" writeTo="seq" />
	</rules>
</nlog>
```

And here you can see it in action:

![raven images in seq](/img/seq_raven.png)