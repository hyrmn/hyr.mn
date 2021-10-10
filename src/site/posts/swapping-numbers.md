---
title: Swapping two numbers in C#
date: 2021-09-13
description: >-
  Let's profile some code! This time we'll look at options for number swapping in C#
tags:
  - CSharp
  - Code
  - blogentries
---

Occasionally in programming, we come across the need to swap two numbers. That is, if we have `var x = 10` and `var y = 20`, we need to end up with `x = 20` and `y = 10`. 

Here's a possible way to do it in C#

```csharp
public void SwapWithTemp(ref int x, ref int y)
{
    var tmp = x;
    x = y;
    y = tmp;
}
```

Back when I was first learning to program, there were a finite number of variables in the world and we all needed to call the central variable office to see if we could use one. As you can imagine, this was a very lengthy process so interviewers started asking candidates a brain teaser question. `How can you swap two variables without using a third temp variable?`

I'll show the code (in C#) and then discuss why it works

```csharp
public void SwapWithXor(ref int x, ref int y)
{
    x = x ^ y;
    y = y ^ x;
    x = x ^ y;
}
```

The `^` in this context is the XOR, or Exclusive OR, operator. It's much easier to visualize how things work if we can see the numbers like a computer does. Since computers see everything in binary, we need to as well.

```csharp
int x = 10;
int y = 20;
```

The computer sees
```
x = 0000 1010
y = 0001 0100
```

The rules for [XOR](https://en.wikipedia.org/wiki/XOR_gate) are that it's true when one of the values is true and false if both values are the same (so 1 XOR 0 is 1, 1 XOR 1 and 0 XOR 0 are 0).

Let's step through the code and see what happens under the covers

```csharp
int x = 10; //x = 0000 1010
int y = 20; //y = 0001 0100

//We will go through x and y and compare row to row. 
//Any time there's a 1 in one row and a 0 in another, make it a 1 in the output
x = x ^ y;
//  0000 1010
//  0001 0100
//x=0001 1110
//If we work left to right then we know at the end x will be 0001 1110 

//Now we do the same thing with y
y = y ^ x;
//Work left to right and compare the new value of x (0001 1110) to y
//so compare these two with an XOR
//  0001 1110
//  0001 0100
//y=0000 1010
//At the end of this, y is 0000 1010 (10 in decimal. Oh, nice, the original value of x)

//Now do the same thing with x again to get the original value of y
x = x ^ y;
//  0001 1110
//  0000 1010
//x=0001 0100
```

We saved using a temp variable, which honestly hasn't mattered since hard drives shrunk down from the size of small cars. But, is it better? We'll get into that in a minute.

I want to share one more way to swap numbers in C#. We can use a [tuple](https://en.wikipedia.org/wiki/Tuple).

```csharp
public void SwapWithTuple(ref int x, ref int y)
{
    (x, y) = (y, x);
}
```

You will either see this and say that it's the most straightforward and idiomatic way to do a number swap in C# or you'll hate it and swear off this approach forever. We're telling the compiler to make a tuple of the values x and y and then assign it the tuple of values y and x. We'll go under the covers later and it will look more obvious then if it doesn't now.

So, three viable ways to swap two numbers. Which one makes the most sense? Writing software, in any language, can be a balancing act of writing code that is fast and code that is maintainable. If the XOR approach happened to be the fastest code, and the code was called often enough that optimizing a few nanoseconds was worth it, then it'd be worth using an approach that isn't as immediately obvious to everyone. (possibly including you six months later).

As we did in [Measure Two Hundred Times, Tweak Twice](/fun-with-benchmarkdotnet/), let's set up [BenchmarkDotNet](https://benchmarkdotnet.org/) and profile some code.

Here's the code in .NET 6.0 / C# 10. I've included two other possible ways to swap numbers from the many (stupid) [ways we came up with to swap numbers](https://gist.github.com/hyrmn/387e9e8d4e2858daf5e89097396b88fb)

```csharp
using BenchmarkDotNet.Attributes;
using BenchmarkDotNet.Running;

var summary = BenchmarkRunner.Run<Swappy>();

public class Swappy
{
    [Benchmark]
    [Arguments(10, 20)]
    public void SwapWithTemp(ref int x, ref int y)
    {
        var tmp = x;
        x = y;
        y = tmp;
    }

    [Benchmark]
    [Arguments(10, 20)]
    public void SwapWithXor(ref int x, ref int y)
    {
        x = x ^ y;
        y = y ^ x;
        x = x ^ y;
    }

    [Benchmark]
    [Arguments(10, 20)]
    public void SwapWithTuple(ref int x, ref int y)
    {
        (x, y) = (y, x);
    }

    [Benchmark]
    [Arguments(10, 20)]
    public void SwapWithArray(ref int x, ref int y)
    {
        var scratch = new [] { x, y };
        x = scratch[1];
        y = scratch[0];
    }

    [Benchmark]
    [Arguments(10, 20)]
    public void SwapWithLinq(ref int x, ref int y)
    {
        var numbers = new [] { x, y };
        x = numbers.Last();
        y = numbers.First();
    }

    [Benchmark]
    [Arguments(10, 20)]
    public void SwapWithInterlock(ref int x, ref int y)
    {
        y = Interlocked.Exchange(ref x, y);
    }
}
```

Compile the above code in release mode and then run the exe from the command prompt and you'll get some output like the following:

```powershell
|            Method |  x |  y |       Mean |     Error |    StdDev |
|------------------ |--- |--- |-----------:|----------:|----------:|
|      SwapWithTemp | 10 | 20 |  0.1575 ns | 0.0113 ns | 0.0106 ns |
|       SwapWithXor | 10 | 20 |  0.6337 ns | 0.0106 ns | 0.0094 ns |
|     SwapWithTuple | 10 | 20 |  0.1589 ns | 0.0023 ns | 0.0021 ns |
|     SwapWithArray | 10 | 20 |  3.4849 ns | 0.0427 ns | 0.0357 ns |
|      SwapWithLinq | 10 | 20 | 33.4991 ns | 0.4638 ns | 0.4339 ns |
| SwapWithInterlock | 10 | 20 |  3.0909 ns | 0.0334 ns | 0.0261 ns |
```

We can trust BenchmarkDotNet to give us useful measurements because it's handled all of the execution warmup, works to remove noise, and repeats runs to get useful data.

## Wrapping up

So, at least in C#, the temp variable and tuple approach are the fastest. And, in my mind, the two most readable as well.

If you show up at an interview and they ask you to swap two numbers without using a third, you can push back and dazzle them with science.

If you like the tuple syntax, then you should go with that. If you prefer the temp, then that's fine too. While I'm not in love with the tuple version, I would say that will be the canonical version you'll encounter in the wild and I can live with that.

Before I go, I wanted to dive into the temp version and tuple version further. This time with a look at the generated [IL](https://en.wikipedia.org/wiki/Common_Intermediate_Language). My go-to tool for this on Windows is [ILSpy](https://www.microsoft.com/en-us/p/ilspy/9mxfbkfvsq13?SilentAuth=1&wa=wsignin1.0&activetab=pivot:overviewtab).

Using that to explore the compiled DLL from our test above, let's look at the generated IL for the `SwapWithTemp` version:

```csharp
.maxstack 2
.locals init (
    [0] int32 tmp
)

// int num = x;
IL_0000: ldarg.1
IL_0001: ldind.i4
IL_0002: stloc.0
// x = y;
IL_0003: ldarg.1
IL_0004: ldarg.2
IL_0005: ldind.i4
IL_0006: stind.i4
// y = num;
IL_0007: ldarg.2
IL_0008: ldloc.0
IL_0009: stind.i4
// }
IL_000a: ret
```

It creates a local variable, `num`, and then does the assignment swapping.

Now let's look at the decompiled version of `SwapWithTuple`

```csharp
.maxstack 2
.locals init (
    [0] int32,
    [1] int32
)

// int num = y;
IL_0000: ldarg.2
IL_0001: ldind.i4
IL_0002: stloc.0
// int num2 = x;
IL_0003: ldarg.1
IL_0004: ldind.i4
IL_0005: stloc.1
// x = num;
IL_0006: ldarg.1
IL_0007: ldloc.0
IL_0008: stind.i4
// y = num2;
IL_0009: ldarg.2
IL_000a: ldloc.1
IL_000b: stind.i4
// }
IL_000c: ret
```

It's incredibly similar to the version that uses a temp variable to swap. Except, in this case, it's using two temp variables for us; `num` and `num2`. That explains why they're so close for timings on our benchmark tests. And, while it actually wastes just a little tiny bit more than `SwapWithTemp`, we're in a new bountiful age of variables where everyone can have as many as they want without some central variable assignment authority getting upset.

Anyway, that covers more than any reasonable person ever cared to know about swapping two numbers in C#. If you can think of any other creative ways that you want to contribute, please stop by [https://gist.github.com/hyrmn/387e9e8d4e2858daf5e89097396b88fb](https://gist.github.com/hyrmn/387e9e8d4e2858daf5e89097396b88fb) and leave a comment with some code.