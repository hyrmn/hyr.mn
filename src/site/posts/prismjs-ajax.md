---
title: Using Prism.js with AJAX content
date: 2014-06-03
description: >-
  Integrating PrismJS on a blog that doesn't do full page requests
---

I'm using [Prism](http://prismjs.com) for code highlighting. And, this blog theme uses AJAX to fetch and transition pages (or show/hide the recent posts). Those two things did not work well together.

The issue is that Prism wasn't triggered to add its markup after a page transitioned; leaving me with a horribly-styled code block.

The fix, as outlined on the [Prism documentation](http://prismjs.com/extending.html#api) is straightforward. You can tell it to manually render:

```javascript
Prism.highlightAll();
```

I added this to the end of the $.get AJAX call and all is right with the world again.