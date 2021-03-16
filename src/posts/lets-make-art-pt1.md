---
title: Let's Make Some Art - Part 1
date: 2021-03-15
description: >-
  Let's make our computer draw stuff
tags:
  - dotnet
  - c#
  - Code
  - blogentries
---

I sa a tweet from [@James_M_South](https://twitter.com/James_M_South), creator of the amazing ImageSharp library where he mentioned there wasn't a lot of public chatter about said library. Now, I know nothing about image processing or graphics. But, I've been wanting to learn more about creating [Algorithmic Art](https://en.wikipedia.org/wiki/Algorithmic_art), or [Generative Art](https://en.wikipedia.org/wiki/Generative_art), for a while. And, [James' tweet](https://twitter.com/James_M_South/status/1367430358472536064) inspired me to dive in.

## Generative Art?

The Wikipedia links above provide some really great in-depth links into generative art. For my purposes, I want to use an algorithm to get a computer to make a picture within the constraints I've provided. I also want to introduce some randomness so that no two runs will produce the same result. I'm going to do this as a bit of a series and you're going to explore with me. Each post will be self-contained to a specific idea and should offer up some space to explore your own ideas after.

## Let's Create!

First, we'll need a program to run our code. And then I'm going to pull in the ImageSharp Drawing library to abstract away the drawing magic for me. I'm going to create a new project and then add ImageSharp

```powershell
>dotnet new console
```

```powershell
>dotnet add package SixLabors.ImageSharp.Drawing --version 1.0.0-beta11
```

Note, at the time of this post, [ImageSharp.Drawing](https://www.nuget.org/packages/SixLabors.ImageSharp.Drawing) is still in beta so you'll need to explicitly add the version. Be sure to check before you start in case there's a newer version.

Now, let's get the basics in place. I'll create an image, fill it with a color, and then save it. Just to ensure it works.

```csharp
using System;
using System.IO;

using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

var destWidth = 1920;
var destHeight = 1080;

using var image = new Image<Rgba32>(destWidth, destHeight);

image.Mutate(ic =>
{
    ic.Fill(Color.Black);
});

using var outputStream = File.OpenWrite("generated.png");
image.SaveAsPng(outputStream);
Console.WriteLine("Done!");
```

This code creates a new 32-bit [RGBA](https://en.wikipedia.org/wiki/RGBA_color_model) image. Drawing on the image happens in an image context, which we set-up above and then use that context to fill the image a solid black.

There you have it, our first algorithmic art. It's sized for a background right now at 1920x1080 (the resolution of my little monitor). But, you could make it huge, call it a Study in Black, and wait for the offers to roll in!

## Let's Make It Art!

This is fun and all, but variety is the spice of life. Let's add some randomness and let that drive our colors.

```csharp
var rand = new Random();
var r = (byte)rand.Next(0, 255);
var g = (byte)rand.Next(0, 255);
var b = (byte)rand.Next(0, 255);

var todaysLuckyColor = new Color(new Rgba32(r, g, b, 255));

image.Mutate(ic =>
{
    ic.Fill(todaysLuckyColor);
});
```

By default, our random number generator will be seeded with the current timestamp. We then use that to create random values for our red, green, and blue. We then fill the image with that color. I ended up with a horrible mustard yellow and then a wonderful violet the second time I ran it. Let's push this just a little bit further before we wrap up today's post.

## Shapes! Boxes... oh my.

Drawing a single color image is cool and all, but what about a single tiny box instead?

Changing up the mutate function yet again, let's draw a square.

```csharp
image.Mutate(ic =>
{
    ic.Fill(Color.White);

    var rotation = GeometryUtilities.DegreeToRadian(45);
    var square = new RegularPolygon(40, 40, 4, 50, rotation);
    ic.Fill(todaysLuckyColor, square);
});
```

ImageSharp.Drawing has some great utilities for making shapes. And, that's what we're after. Shapes. Or, specifically, squares. I'm asking ImageSharp to make me a 4-sided polygon that is 50 pixels wide with a centerpoint that is 40 pixels from the top and 40 pixels from the left (the top left corner is our reference point of 0,0). Technically... ImageSharp is giving us a polygon where each corner touches the edge of a circle that is 50 pixels around. Which brings up an interesting thing... if we draw this without rotating it, we get a diamond. I haven't looked at the internals, but I assume ImageSharp starts at 0 on a circle and then draws. So, we need to rotate our shape. ImageSharp uses radians. I'm not smart enough to understand radians but I know I need to rotate my diamond 45 degrees so I'll use their handy utility.

Run this program and you now have a pretty square on an expanse. 

Let's go a little further and generate a lot of squares. A lot of multi-colored squares.

If we think about each square as going in a row and column, then we can look for a number that's easily divisible into 1920 and 1080. Completely by coincidence, if we divide by 40, we get 48 columns and 27 rows.

```csharp
image.Mutate(ic =>
{
    ic.Fill(Color.White);

    var rotation = GeometryUtilities.DegreeToRadian(45);

    for(var row = 1; row < 27; row++)
    {
        for(var col = 1; col < 48; col++)
        {
            var r = (byte)rand.Next(0, 255);
            var g = (byte)rand.Next(0, 255);
            var b = (byte)rand.Next(0, 255);
            var squareColor = new Color(new Rgba32(r, g, b, 255));

            var polygon = new RegularPolygon(40 * col, 40 * row, 4, 20, rotation);
            ic.Fill(squareColor, polygon);
        }
    }
});
```

I'm using two `for` loops here. The first to walk down the imaginary rows in my image and the second to walk across the columns. I'm offsetting each square by 40 pixes and drawing a 20 pixel square in the middle. Because each square should be a random color, we need to move the randomized color creation into the loop as well. Try it out and show off your creation.

## Wrapping up... for now

We scratched the surface of what we can do with [Six Labors'](https://sixlabors.com/) ImageSharp library and used it with a very simple algorithm to make a unique piece of art... which is pretty damn cool.

Some ideas of where you could take this:
 - Randomize the rotation
 - Rotate and shrink the size as you get closer to the image edge
 - Randomize the location
 - Different shapes
 - Vary the shapes
 - Constrain the colors to a specific range
 - Make the colors grayscale
 - Overlap the shapes and play with the alpha blending