---
title: Go 1.13 on Windows - File Structure
date: 2020-01-15
description: >-
  Some basics I have learned while learning Go
tags:
  - Go
  - Code
  - posts
---

I've been playing with Go and I thought it might be helpful to others to document a bit of what I've learned about Go on Windows. The [Go Docs](https://golang.org/doc/code.html) are very thorough but I'm putting things down so I can remember and maybe it will help someone else as well. **Just keep in mind, these are the notes of a Go novice**

## The Go Path

When you install Go, it should add its bin directory to your path automatically. For me, everything related to the Go tooling went in `C:\Go\bin`

In addition to this, Go likes all of the Go code to live under one common root. It defaults to `%USERPROFILE%\go`. This most likely maps to `c:\Users\{Your user name}`. You can override this easily enough. I want everything to live under `c:\code\go`. To make this change, you need to set the `GOPATH` environment variable. 

You can do this from a command prompt by running

```powershell
setx GOPATH c:\code\go
```

Or, if you prefer, navigate to the environment variables UI and add a User Variable with the above value.

Your Go directory structure is going to closely mirror where the code comes from. If you run `go get github.com/hyrmn/GoTcpEchoServer` then that code will end up in `c:\code\go\src\github.com\hyrmn\GoTcpEchoServer`. So, while you can develop 100% locally, if you're going to eventually push the code to a remote repository then you should probably think about making the structures match now.

The full structure is probably going to look different than how you normally organize your code.

We'll also want a Go module definition file, `go.mod`. This file will live at the root of our repository. You can have more than one in your repository but it seems most common to only have one... The module is important as it defines the import path for your packaged code. This is another good reason to have your code structure match where it will ultimately live.

## Hello File Structure

Let's make Go say "hi" to us.

On a new command prompt (so you can pick up the `GOPATH` settings), navigate to your new root. 

Since we haven't done anything yet, it's going to be empty. However, Go will eventually put some top-level directories in here. Go expects all of the source code to live under `src` so make that directory now.

```powershell
c:\code\go>md src
```

Your structure will now look like 

```powershell
c:\code\go\
└── src
```

For "simplicity's sake" (well, simplicity for future you when you're pushing code, pulling other people's code, etc), make a structure under here to map to your remote repository home. For me, that's GitHub.

`c:\code\go\src\github.com\{replace with your username}\hello`

So, for me, I would run

```powershell
c:\code\go>md src\github.com\hyrmn\hello
```

This will eventually get pushed up to GitHub to a new repository under my account.

Navigate to that new directory

```powershell
C:\code\go>cd src\github.com\hyrmn\hello
```

## Hello World

At last, code time.

First, let's tell Go that we want this to be a module.

```powershell
c:\code\go\src\github.com\hyrmn\hello>go mod init github.com/hyrmn/hello
```

Open up that go.mod file in your favorite editor.

```md
module github.com/hyrmn/hello

go 1.13
```

This is useful, I promise.

Now, while you have your favorite editor open, create a new file `main.go`

```go
package main

import "fmt"

func main() {
	fmt.Println("Hello, world.")
}
```

run it.

```powershell
>go run .

Hello, world.
```

You could also package the code into an executable with `go build`. That will put an executable in the project directory named `hello.exe`

But, there's more we can do

## Install the world

We can `go install` our program.

```powershell
>go install
```

That will take a second to run. Finish with no output. And... nothing new in your current directory. What gives?

When you run that command, Go builds your code and, if it succeeds, puts the executable under `%GOPATH%\bin`. Or, in our case, `c:\code\go\bin`. Go has also taken the opportunity to create a `pkg` directory. You don't need anything in here. Go uses it as a module cache when you start ~~downloading the internet~~ pulling in modules from other developers.

Our full directory structure now looks like

```powershell
.
├── bin
│   └── hello.exe
├── pkg
└── src
    └── github.com
        └── hyrmn
            └── hello
```

## One Last Setting

Now that you have that fancy executable sitting in that bin directory, you should add your GOPATH bin to your path. One thing Go seems well suited for are fun little command line utilities (I mean, lots of serious stuff too, but I know where I'm starting). With them readily accessible in my bin directory, I just get them for free and at the ready the minute I `go install`

## Wrapping Up

If you are starting out in Go, and if 1.13, or the changes it introduced, are still current when you read this, then I hope you find it helpful. Feel free to ping me on Twitter [@hyrmn](https://twitter.com/hyrmn) with any questions.