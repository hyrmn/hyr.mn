---
title: Scheme Relative URLs
date: "2012-07-24"
description: >-
  How to specify a link without a schema
---

If you do web dev, and you include scripts or images from external sources, then you (probably) should be using scheme-relative urls. For example, 
here's how we include jquery from the Google CDN:

```javascript
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
```

Here's why you care. It makes the request using whatever your current scheme (alternately, protocol) is. So, when you go to http://mysite.com then the request for the jQuery script is resolved to http://ajax.googleapis.com. Similarily, if you go to **https://**mysite.com then the script reference is resolved as **https://**ajax.googleapis.com.

And, as you know, browsers just aren't very happy when you include HTTP resources on an HTTPS-secured page.

This means you don't need any funky conditional generation server-side.

Yes, this works great in css files too!

```css
#header { background: url(//fancysite.net/someheader.png); }
```

Note, this won't work if you attempt view your page via opening an html file as it'll attempt to resolve the script include to file://ajax.googleapis.com. 
But, come on, you're doing web development... use a web server locally.