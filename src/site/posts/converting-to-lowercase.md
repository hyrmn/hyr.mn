---
title: How (not) to convert a string to lowercase in C#
date: 2020-07-06
description: >-
  How many bad ways can we come up with to do something trivial?
tags:
  - CSharp
  - Code
  - blogentries
---

You're looking for a job, you had a good initial chat with the recruiter and the team would love to have you on-site for an interview day; starting with a technical interview. You've heard that the team you're interviewing with is a bit, well, eccentric. That's ok.

The good news, though. They encourage you to bring your own laptop configured how you'd prefer if it'd make you more comfortable. And you'll be free to use any language you want.

You show up. You think you're prepared for anything. You walk in only to be greeted by Alice and Bob. You think you're getting set up for a [cryptology joke](https://en.wikipedia.org/wiki/Alice_and_Bob) but, no, it's interview time.

Alice tells you that you've got one task. Come up with as many ways as possible, using your preferred language, to convert a string to lowercase. Given the string "This IS COOL", you should end up with "this is cool".

Luckily, since you read my blog, you are well-prepared with stupid ways to do stupid things with code.

### Using ToLower()

Let's do the simplest method first, just to make sure we're jibing with Alice and Bob.

```csharp
var s = "TEST STRING😁";
var lower = s.ToLower();
Debug.Assert(lower == "test string😁");
```

String has a `.ToLower()` method on it to do exactly what we need. Bob frowns slightly that you took the easy route but you assure them that you're just getting started. Meanwhile, Alice is happy that you thought to include some Unicode in your test case.

You consult MSDN and see that the [String class](https://docs.microsoft.com/en-us/dotnet/api/system.string) implements an `IEnumerable` over a collection of [Char](https://docs.microsoft.com/en-us/dotnet/api/system.char). Not only is `hello` a string, it's a collection of five characters `new [] {'h', 'e', 'l', 'l', 'o'};`.

We can work with this.

### Using ToLower() one character at a time

Let's write a for loop and lowercase a character at a time.

```csharp
var s = "TEST STRING😁";
var lower = string.Empty;
for (var i = 0; i < s.Length; i++)
{
    lower += char.ToLower(s[i]);
}

Debug.Assert(lower == "test string😁");
```

Now we're getting somewhere (not good, but it's still somewhere). We can iterate over the string one character at a time. 

Let's see what else we can do. 

## LINQ to the rescue

We can use LINQ. Like other languages, we have `map`, `reduce`, and `filter` in C# (thanks to LINQ). Unfortunately, we have different names for these methods. `reduce` is `Aggregate` in LINQ. It's common to reach for `reduce` when you need to do something "mathy", like maybe sum a bunch of numbers. But, C# lets us work on _any_ collection type.

This is going to get a bit confusing, so let's start with the method signature.

```csharp
TAccumulate Aggregate<TSource, TAccumulate>(this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func);
```

We are going to start with a `seed` in a known starting state. This will be where we'll `accumulate` the result of our function call as well. We're then going to walk over (enumerate) each entry in our collection (characters in our string in this case). As we do that, we will pass our current state and the entry into a `Func`. This can be either an inline lambda or any function that matches the signature `(string, char) => string`.

Confusing! Let's see it in action and hopefully understand it a bit clearer.

```csharp
var s = "TEST STRING😁";
var lower = s.Aggregate(string.Empty, (current, c) => current + char.ToLower(c));

Debug.Assert(lower == "test string😁");
```

We're starting with an empty string as our `seed` (the initial value). We then start iterating through the characters in the string. On the first character, we pass in an empty string and `T` to our lambda function. We then concatenate the lowercased `t` to our empty string. We then proceed to the next character `E`, and pass in our current string `t` and the now-current character `E`. We do this until the end of the string and then LINQ returns our final `accumulate` value to us.

Bob and Alice are, frankly, very impressed with the mess you've made.

But, we're not done.

## Reflecting on our progress

By now, I'm sure you've realized that there's a glaring problem with our code. That's right. It's not dynamic enough. `String` has two methods we can call. There's `.ToLower()`, which honors the rules of the current culture, and there's `.ToLowerInvariant()`. 

Let's revisit how we started our journey but, this time, we'll make it sizzle with some choose-your-own-adventure options for callers of our function.

```csharp
enum WaysToLower
{
    ToLower,
    ToLowerInvariant
}

var s = "TEST STRING😁";
var lowerMethod = typeof(string).GetMethods().First(m => m.Name == WaysToLower.ToLowerInvariant.ToString());
var lower = lowerMethod.Invoke(s, null).ToString();

Debug.Assert(lower == "test string😁");
```

Now we can dynamically choose which function we want to invoke. We'll use reflection to find the corresponding method on `String` and then invoke it. The beauty of this approach is that it's slower, breaks our IDE experience, and will cause a runtime exception if we try and invoke a function that doesn't exist.

Bob and Alice are overjoyed at all of the bad code you know how to write. Because, after all, knowing how to write lots of bad code is the mark of a good programmer.

## Let's get serious for a moment

Ok, all of the above code was, well, bad code. You shouldn't let it anywhere near your production systems. I wanted to highlight some ways to have fun with a trivial task in C#. But, in reality, string manipulation is not a trivial task. I'm not going to delve any more into it in this blog post, but I want to leave you with a parting example.

Strings are comprised of `Char` objects. But, that might not be a direct mapping with what you picture as a character. I've actually snuck this into the examples above. In linguistics, a [grapheme](https://en.wikipedia.org/wiki/Grapheme) is the smallest fundamental unit in a writing system. In English, when you learn your ABCs, you're learning your graphemes. Or, to belabor the point, `A`, `B`, and `C` are graphemes.

With that in mind, how many graphemes are in `test string😁`? How many `Char` objects are in `test string😁`? As any Millenial or Zoomer can tell you, an emoji is the smallest fundamental unit of any text message. (and, if you want even more fascinating insight into how emoji are impacting language and our ability to signal non-verbal communication in writing, check out "[Because Internet](https://gretchenmcculloch.com/book/)" by Gretchen McCulloch)

If you showed a college student our test string, they would quickly tell you that there are twelve graphemes.

But, if you ask .NET the same question, you're going to get conflicting answers. We need two characters to represent that innocuous 😁. Calling `.Length` will tell us there are 13 `Char` objects. But, there's been a recent addition to the .NET Framework so we can be as smart as a fifth grader. If we call `.EnumerateRunes()`, we'll learn that there are only 12 graphemes. (both .NET and Go call them runes)

Why does this matter? In your everyday coding life, it may not. After all, the .NET runtime was smart enough to not ruin our smiley no matter what we did. You'll know when it does matter, though. And, before you get to that point, you might want to dive deeper on [Character encoding in .NET](https://docs.microsoft.com/en-us/dotnet/standard/base-types/character-encoding-introduction).

Anyway, that's all for now.

👋🏻