---
title: Reflecting on .NET Developers
date: 2016-06-16
description: >-
  An observation on the current .NET drama (evergreen post)
---

This is a perennially useful blog post (or useless). Turf wars will spring up in any large community every so often. While there is a lot of merit in the crux of the argument, as is often the case, discussions tend towards strawmen and away from discourse.  

So, in spirit of the long, raging posts and counter-raging posts and counter-counter raging posts on the state of .NET development. I thought I would chime in too because that's what you do when you have a blog.

Special thanks to [William Randol](https://twitter.com/williamrandol) for actually writing this code

```javascript
<title>Omphaloskepsis</title>

<button type="belly" class="innie" id="navel">@</button>
<script>
	var navel = document.getElementById('navel')
	
	function gaze(object){
		setTimeout(function () {
			gaze(object)
		}, 10)
	}
	
	gaze(navel);
</script>
```