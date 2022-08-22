---
title: Let's Make Some Art - Part 2
date: 2021-09-25
description: >-
  Let's make our computer draw stuff - again
tags:
  - dotnet
  - c#
  - Code
  - blogentries
---

In [part 1](/lets-make-art-pt1), we had our computer draw some boxes. I want to go in a different direction here to lead up to part 3. This time I want to explore reading pixels from an existing image.

## What are we making this time?

I bet you, like me, have looked at an image and wondered what it would look like if all of the lines were sorted by their RGB color values. Well, let's write some code and find out!

## Let's Create!

First, we'll need a program to run our code.  I'm going to create a new .NET 6.0 project and then add ImageSharp.

```powershell
dotnet new console
```

```powershell
>dotnet add package SixLabors.ImageSharp.Drawing --version 1.0.0-beta13
```

Note, at the time of this post, [ImageSharp.Drawing](https://www.nuget.org/packages/SixLabors.ImageSharp.Drawing) is still in beta so you'll need to explicitly add the version. Be sure to check before you start in case there's a newer version available. Technically, for this post, we're not even using anything from the Drawing package, but it has a dependency on ImageSharp and we'll be back to using the Drawing package in part 3 so... to keep the flow consistent... Onward!

My goal is to read in an existing file, sort the pixels by some arbitrary scale, and then write them out to a destination file. We'll use the source image's dimensions to create the destination image.

```csharp
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;

var srcFilename = args.Length > 0 ? args[0] : throw new ArgumentNullException("source", "Must supply a source");
var srcFile = new FileInfo(srcFilename);

if(!srcFile.Exists)
{
    Console.WriteLine("Bad src");
    return 1;
}

var destFilename = Path.GetFileNameWithoutExtension(srcFile.Name) + "_sorted.jpg";

using var srcImg = Image.Load<Rgb24>(srcFile.FullName);
var srcWidth = srcImg.Size().Width;
var srcHeight = srcImg.Size().Height;

using var destImg = new Image<Rgb24>(srcWidth, srcHeight);

for (var row = 0; row < srcHeight; row++)
{
    var pixels = srcImg.GetPixelRowSpan(row).ToArray();
    var orderedPixels = pixels.OrderBy(p => p.R + p.G + p.B).ToArray();

    for (var col = 0; col < orderedPixels.Length; col++)
    {
        destImg[col, row] = orderedPixels[col];
    }
}

destImg.SaveAsJpeg(destFilename, new JpegEncoder() { Quality = 95 });

Console.WriteLine("Done");

return 0;
```

The above code reads in the source file, creates a destination image the same size, then goes row by row down the source image. It reads the row of pixels, reorders it by the sum of their RGB values, and then writes to the destination a pixel at a time. No, it's not the most efficient... but we don't need it to be for generating art.

Given an input like [this image I took of a controlled burn near our house](https://www.flickr.com/photos/benhyr/4464434633), the above code will generate an [image where each row is sorted by the sum of the colors in each pixel](https://www.flickr.com/photos/benhyr/51007091787).

## Messing around

While it's not a lot, the above work will be critical input in part 3. But, since this post doesn't have a lot of code... let's mess around and see what kind of mayhem we can create.

Of course, there are lots of other possibilities. We could figure out how to sort things by column instead of row. We could randomly sort each row. But... I noticed a neat method available on `Image`. `TryGetSinglePixelSpan`. It looks like, if possible, this method will give you back a [`Span`](https://docs.microsoft.com/en-us/archive/msdn-magazine/2018/january/csharp-all-about-span-exploring-a-new-net-mainstay) over the entire image. There are some practical limits to this. But, who cares about practical. In my case, since my input image is 2400x1600 pixels, my `Span` will cover an array of 3,840,000 (because math) pixels... all in a 1-dimensional array.

Knowing absolutely nothing about the underlying implementation and not really bothering to [read the excellent docs](https://docs.sixlabors.com/api/ImageSharp/SixLabors.ImageSharp.Image-1.html#SixLabors_ImageSharp_Image_1_TryGetSinglePixelSpan_), let's see what happens if we do something like... oh, I don't know...

```csharp
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;

var srcFilename = args.Length > 0 ? args[0] : throw new ArgumentNullException("source", "Must supply a source");
var srcFile = new FileInfo(srcFilename);
var destFilename = Path.GetFileNameWithoutExtension(srcFile.Name) + "_sorted" + srcFile.Extension;

using var srcImg = Image.Load<Rgb24>(srcFile.FullName);
var srcWidth = srcImg.Size().Width;
var srcHeight = srcImg.Size().Height;

using var destImg = new Image<Rgb24>(srcWidth, srcHeight);

srcImg.TryGetSinglePixelSpan(out var pixels);

for (var row = 0; row < srcHeight; row++)
{
    for (var col = 0; col < srcWidth; col++)
    {
        destImg[col, row] = pixels[col + row];
    }
}

destImg.SaveAsJpeg(destFilename, new JpegEncoder() { Quality = 95 });

Console.WriteLine("Done");
```

Note that, because col keeps resetting to zero, the first row starts with pixel 0 in the array and continues to pixel 2399. The second row in the destination will start at pixel 1 and continue to pixel 2400. This leads to some very interesting streaked output as you can see in [the generated image](https://www.flickr.com/photos/benhyr/51529903051).

And, if you're like me, your first question is "hey, what happens if we change that little `pixels[col + row]` code to do some multiplication instead `pixels[col * row]`?"

The answer, interestingly, is [a beautiful star field](https://www.flickr.com/photos/benhyr/51529097152).

## Wrapping up... for now

As with [part 1](/lets-make-art-pt1), this is just meant to get you thinking of other things you might want to explore. The key take-away from this post that you'll need for part 3 (not yet written) is that it's possible to read pixels from a source image and use them when writing to a destination image.

Some ideas of where you could take this:
 - Randomize the sort order for each row
 - Sort by row and column
 - Randomize the span and then write it out to the destination image
 - Combine two source input images into one destination
