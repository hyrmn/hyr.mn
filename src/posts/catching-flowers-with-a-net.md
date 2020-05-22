---
title: Counting lines with C#
date: 2020-05-15
description: >-
  Learning how to read from the command line and process a file using C#, one bunch of bytes at a time.
tags:
  - CSharp
  - Code
  - blogentries
---

This is, I guess, part 2 in a series. 

I previously wrote about [writing a utility in Go](/counting-flowers-on-the-wall/) to count carriage returns (or newline characters) in a file. I decided that I wanted to do the same in C# on [.NET Core](https://docs.microsoft.com/en-us/dotnet/core/about). 

Anyway, let's take a look at some of the neat new goodies in .NET and see what a command line utility to parse a file might look like. If you want to just see the code, it's <a href="https://github.com/hyrmn/nlc">on GitHub</a>.


## Implementation Recap

I want this to function just like the Go version. One difference, though. Since I named the Go version `lc`, I'm going to go ahead and dub this one `nlc`

This means that our little application might be called like this

```powershell
> nlc "path/to/your/file.txt"
```

or like this

```powershell
> echo "Count the lines in this" | nlc
```

(you can substitute `cat`, or `grep`, or anything else, for `echo` above)

In either case, the count of carriage returns (`\n`) in the file will be printed out.

```powershell
> nlc "path/to/your/file.txt"
109
```


## Handling a file argument

Let's first figure out how to read a file if the user calls our application with a file path `nlc c:\somedir\somefile.txt`.

We create an entry point into our console application by declaring a `static void Main` function. This can take in a string array of command-line arguments. We don't need to support named arguments or even more than one argument, so we'll just assume that the first argument is the path to the file.

```csharp
namespace nlc
{
  class Program
  {
    static void Main(string[] args)
    {
      LineCounter counter = new LineCounter();
      int count = 0;

      //...//

      try
      {
        using var file = new FileStream(args[0], 
		                                FileMode.Open,
										FileAccess.Read,
										FileShare.None, 
										bufferSize: LineCounter.BufferSize,
										FileOptions.SequentialScan);

        count = counter.CountLines(file);
      }
      catch (FileNotFoundException)
      {
        Console.WriteLine($"Could not find {args[0]}. Check the file path.");
      }
      //...//
	}
  }
}
```

.NET gives us different kinds of [Streams](https://docs.microsoft.com/en-us/dotnet/api/system.io.stream?view=netcore-3.1) for reading and writing a sequence of bytes. Or, broadly, we get different classes with a shared abstraction to do things like... read and write to files, read and write to memory, the network, etc. 

So, here we're opening a [FileStream](https://docs.microsoft.com/en-us/dotnet/api/system.io.filestream?view=netcore-3.1) in read-only mode. We're specifying a buffer size, or the number of bytes we expect to read at a time, and we're providing a hint that we'll be processing the file sequentially. This gives the runtime a chance to work with the operating system to optimize for read performance.


## Handling piped input

Next, we should handle piped input. In my [Go line counting article](/counting-flowers-on-the-wall/), I covered file descriptors and how `stdin` can be treated as just another file descriptor. Well, in .NET, the abstraction gets kicked up a notch and, you may have guessed already, we can treat it as a stream!

We can use the System.Console object to determine if the user is piping input to us on `stdin` and then read that as a stream if they are

```csharp
if (Console.IsInputRedirected)
{
  count = counter.CountLines(Console.OpenStandardInput());
}
```


## Count Them Lines

On to the core of the program. The LineCounter

```csharp
using System;
using System.IO;

namespace nlc
{
  public class LineCounter
  {
    public const int BufferSize = 32 * 1024;
    private const byte rune = (byte)'\n';

    public int CountLines(Stream stream)
    {
      int read;
      int idxOf;
      var buffer = new Span<byte>(new byte[BufferSize]);
      int count = 0;

      while ((read = stream.Read(buffer)) > 0)
      {
        var slice = buffer.Slice(0, read);
        while ((idxOf = slice.IndexOf(rune)) > -1)
        {
          slice = slice.Slice(idxOf + 1);
          count++;
        }
      }
      return count;
    }
  }
}
```

As in the Go version, I'm creating a 32 <a href="https://en.wikipedia.org/wiki/Kibibyte">kibibyte</a> buffer. From there, we're quickly going to diverge from the Go implementation and get weird with things.

One of the shiny and amazing new offerings that came with C# 7.2 is [Span&lt;T&gt;](https://docs.microsoft.com/en-us/dotnet/api/system.span-1?view=netcore-3.1). Rather than loading the entire file into memory at once (which would be impossible with a large enough file!), we'll load a chunk at a time and then look for all occurances of our `\n` character.

Some of this looks similar to the Go version. In both, we're reading a 32kb section of file at a time. The steps we need to take in the .NET version are remarkably similar to the **alternate** version of the Go program. 

**For reference, here's that Go code again.**

```go
...
const target byte = '\n'
//...//

	var position int
	for {
		idxOf := bytes.IndexByte(buffer[position:read], target)
		if idxOf == -1 {
			break
		}

		count++
		position += idxOf + 1
	}
```

In both, we look at how many bytes we've read, and then we slice over that section of the file; looking for our newline character as we go. Once we find once, we advance past it in the slice and continue our search. 

You can spot some philosophical differences between the .NET and Go versions. I think the one that strikes me the most is that, in .NET, I can't read past the end of the stream. The documentation has this to say

> **Return Value**
> **The total number of bytes read into the buffer**. This can be less than the number of bytes allocated in the buffer if that many bytes are not currently available, **or zero (0) if the end of the stream has been reached**.

Contrast that with the Go version. 

```go
read, err = r.Read(buffer)
//...//
if err == io.EOF {
//...//
}
```

In Go, we expect to get back _either_ the number of bytes read _or_ an error. The error is our signal that the end of file has been reached.

I think this type of thinking is probably one of the harder switches for someone accustomed to writing C# or Java code when they first start with Go. In those languages, we're told that raising exceptions is expensive and should truly only be used for exceptional cases (reaching the end of a file is a normal control flow and certainly not exceptional). However, in Go, raising or returning an error is idiomatic and not costly.


## Is .NET as Fast as Go?

The real reason you're reading. Maybe. 

As a reminder from the last post, I'm warming up reads of a 1.6GB text file. Using our **Go version** `lc`, I get the following averages after an initial warmup call:

```
real    0m0.625s
user    0m0.015s
sys     0m0.015s
```

Using our **.NET version** `nlc`, I get the following averages after an initial warmup call:

```
real    0m0.619s
user    0m0.000s
sys     0m0.015s
```

Looks like a tie to me (and they're both faster than `wc`). 

Of course, there are other considerations. The compiled Go version on Windows is 2.8mb. Respectable. And, easy enough to compile to multiple targets and distribute. Meanwhile, the .NET version... if you have the framework installed already... is a svelte 170kb (yes, kilobytes). You _can_ choose to compile the .NET version standalone. I'll leave that as an exercise for the reader. (spoiler, it results in quite a bit more to bring along for a deployment).


## Wrapping Up

I haven't demonstrated any tests for this program. I'll leave you to <a href="https://github.com/hyrmn/nlc/blob/master/nlc.tests/LineCounterTests.cs">review them</a> at your leisure.

Contrasting .NET and Go with a small utility like this has been fun and interesting. The new developments with .NET Core and C# have been exciting to watch and playing with the new Span class has been great. I would be hard-pressed to reach for .NET over Go for a utility like this though. But, I think I could easily say the inverse for other problem spaces.

Feel free to ping me on Twitter <a href="https://twitter.com/hyrmn">@hyrmn</a> with any questions or comments.