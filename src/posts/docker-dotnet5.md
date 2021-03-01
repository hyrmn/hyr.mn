---
title: Multi-stage Docker builds for ASP.NET Core 5
date: 2021-02-28
description: >-
  We'll cover how to build a multi-stage Dockerfile with the Node and Dotnet base images so we don't need to apt-get Node
tags:
  - dotnet
  - c#
  - Code
  - blogentries
---

I am building an app with .NET 5 and ASP.NET Core 5. And, I want to run it on a cloud provider. Since .NET 5 isn't widely adopted yet (and probably won't be since it's not an LTS version), that means the easiest path to deployment is a Docker image.

That part isn't hard. When you create a new .NET project, you get a multi-stage Dockerfile for free (well, as long as you select that option). But, I want to use vanilla Node.js build options for processing and bundling my CSS and JS files. The common solutions I've seen for Docker + Node + .NET involve starting with the base .NET image and then using `apt-get` to install Node. I didn't want to go down that path if I could help it. I don't know why, but the idea of modifying the Docker image outside of just building stuff offended my aesthetic.

As it turns out, you can start with a .NET base image, then layer Node on that, build your app, and then copy out the final assets.

```json
FROM mcr.microsoft.com/dotnet/aspnet:5.0-buster-slim AS base
WORKDIR /app

FROM node:lts-buster-slim AS node_base
FROM mcr.microsoft.com/dotnet/sdk:5.0-buster-slim AS build
COPY --from=node_base . .

WORKDIR /src
COPY ["MyDotNetApp/MyDotNetApp.csproj", "MyDotNetApp/"]
RUN dotnet restore "MyDotNetApp/MyDotNetApp.csproj"
WORKDIR "/src/MyDotNetApp/"
COPY "MyDotNetApp/." .

ENV NODE_ENV=production
RUN npm ci
RUN npm run build
RUN dotnet build "MyDotNetApp.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MyDotNetApp.csproj" -c Release -o /app/publish

FROM base AS final
EXPOSE 8080
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MyDotNetApp.dll"]
```

You can see how everything fits together [here](https://github.com/TwoPeas/SharpStatusApp/blob/main/SharpStatusApp/package.json) where I am building [SharpStatusApp](https://github.com/TwoPeas/SharpStatusApp).

The core bits:

```json
FROM node:lts-buster-slim AS node_base
FROM mcr.microsoft.com/dotnet/sdk:5.0-buster-slim AS build
COPY --from=node_base . .
```

We're going to pull down Node's LTS image built on Buster-Slim and Microsoft's .NET 5 SDK image built on Buster-Slim. Then we'll copy the contents of the Node image into the .NET image. For me, this means I get the Node bits I need from an official image rather than using `apt-get` to figure out and install my own dependencies.

On to the build part:

```json
ENV NODE_ENV=production
RUN npm ci
RUN npm run build
RUN dotnet build "MyDotNetApp.csproj" -c Release -o /app/build
```

PurgeCSS will automatically tree-shake the final CSS for you if it's in production mode. So, I default the `NODE_ENV` to production. This will also help with any other tooling I bring in later that might make different choices based on build environment. 

You should use `npm ci` on your build server rather than `npm install` as `ci` will use your `package-lock.json` file to grab versions... which gives you a bit of confidence that you won't accidentally rev a version that you haven't tried locally yet.

Then it's a matter of running my [npm script](https://github.com/TwoPeas/SharpStatusApp/blob/main/SharpStatusApp/package.json#L10) with `npm run build` and compiling my .NET app with `dotnet build` then we bundle things up and
get a svelte(?) final image with just our assets and runtime and none of the build tools or artifacts.

## Wrapping Up

Including a Node.js Docker image as a base part of your build might be old hat, but I hadn't seen any examples of it. I wanted to document what I learned in case it helped anyone else down the road. I, personally, think it's a pretty clean way to assemble an app for deployment.

If you have any questions, comments or complaints, you can always DM or tweet me [@hyrmn](https://twitter.com/hyrmn)