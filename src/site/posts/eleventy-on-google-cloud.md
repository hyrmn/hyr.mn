---
title: Host your static 11ty site on Google Cloud
date: 2021-03-17
description: >-
  A walk-through of the steps you need to follow in order to get your site working nicely on Google Cloud
tags:
  - gcp
  - Code
  - blogentries
---

I am working on a [fake product](https://github.com/TwoPeas/SharpStatusApp) for a [fake business](https://github.com/TwoPeas). Of course, I need a [marketing site](https://sharpstatus.com/) for my fake app! It's a static web site so I'm using my favorite site generator, [11ty](https://www.11ty.dev/). Of course, you could use the same approaches below with any static site generator or hand-rolled HTML. Many of the same steps apply.

My requirements were:
- Static site hosted on Google Cloud
- All content is served over HTTPS and if you go to the HTTP site then you get redirected
- Content hosted on GitHub
- Site automatically built and deployed when I push new content

Rather than walk you step-by-step through yet another tutorial, I'm going to link to the resources that helped me and then provide the stitching that I had to figure out to get a complete solution. I have a feeling that this will be simplified and turned into a product offering soon.

## Step 1 - The basics of a static site

Follow this excellent [Google Cloud guide on hosting a static website](https://cloud.google.com/storage/docs/hosting-static-website). 

I want to call out a couple items.

First, you'll need to ensure that you've already validated your domain with Google. That involves adding a TXT record to your DNS entry with whoever your registrar is (Godaddy, NameCheap, etc). If you've already done this, or if Google is your DNS provider, then you can skip this.

Next, you can only make your storage bucket for your website files multi-region when you create it.

Also, to start, don't enable CDN caching when you create your HTTPS load balancer. Enable this later, but you will hate yourself while you're doing the initial development if you have this on.

On the subject regarding the load balancer, unless you know what you're doing and have a good reason to do it, just let Google manager your SSL cert.

Last, you're going to end up with just an HTTPS site at the end of this step. Don't worry, though, we'll take care of that next to add an HTTP to HTTPS redirect.

## Step 2 - Add an HTTP to HTTPS redirect

Skip almost to the end of this [Google Cloud guide on setting up an HTTP to HTTPS load balancer](https://cloud.google.com/load-balancing/docs/https/setting-up-http-https-redirect#partial-http-lb). This whole article provides a nice overview of the network topology and how and why. But, if you're in a hurry, just skip to the section on redirecting traffic to your HTTPS load balancer. You have an HTTPS load balancer from step 1 already, so now you need to set up one that will listen to HTTP.

At this point, you should be set. 

## Step 3 - Automate building and deploying your site

We're going to leverage Cloud Build for this. And, we're going to leverage the existing [Cloud Builders](https://github.com/GoogleCloudPlatform/cloud-builders) that Google provides.

You'll need to create a `cloudbuild.yaml` (or json) file in your repository that we'll then point Cloud Run at. Here's [my cloudbuild.yaml](https://github.com/TwoPeas/SharpStatusSite/blob/main/cloudbuild.yaml)

```yaml
steps:
 - name: 'gcr.io/cloud-builders/npm'
   args: ['ci']
 - name: 'gcr.io/cloud-builders/npm'
   args: ['run', 'build']
   env:
   - 'NODE_ENV=production'
 - name: gcr.io/cloud-builders/gsutil
   args: ['-m', 'rsync', '-r', '-c', '-d', './dist', 'gs://www.sharpstatus.com']
```

We'll cover how this is triggered next, but... when you push a change to GitHub, Cloud Run will clone your repository and then run the steps in the `cloudbuild.yaml`.

I'm leveraging the `npm` cloud builder because that's how I build my site. First, I run `npm ci` to restore my node packages. Then I run `npm run build` which runs the npm script labeled `build` in [my package.json](https://github.com/TwoPeas/SharpStatusSite/blob/main/package.json) file. I'm using TailwindCSS and I have it configured to purge unused CSS. But, by default, it only does that for production builds. You signal that by setting your Node environment to production, which you can see I'm doing above for the second step.

As part of my 11ty configuration, I'm copying all generated assets to `/dist`. So the last step is to use the `gsutil` builder top copy (rsync) everything from my output to my storage bucket. If you'll recall, the guide in step 1 showed using `gsutil rsync` locally to copy files.

That's the basics of automating the build. The last step is to tie it all together and actually trigger it.

Again, I'm going to start by pointing you to the [Google Cloud guide on triggering builds from GitHub](https://cloud.google.com/build/docs/automating-builds/create-github-app-triggers). At a high level, you're going to connect Cloud Run to your repository. This involves granting permissions to the Google Cloud Build app. You'll also want to tell the trigger to run the cloudbuild.yaml file we just defined.

## Wrapping Up

🤞🏻 That should be everything you need to deploy your static site. Once you're happy with your site, be sure to go back to your HTTPS load balancer that you created in step 1 and enable CDN.

It's a bit involved; I'm not going to lie. I feel like [Netlify](https://netlify.com) is significantly easier to get started with. In fact, this site that you're reading right now is hosted there. But, I wanted to host all of my infrastructure together and also experiment a little. I'd call the experiment a success.