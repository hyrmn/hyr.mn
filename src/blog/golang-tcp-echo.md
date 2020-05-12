---
title: Simple echo server in Go
date: "2018-02-05"
description: >-
  A really simple echo service; or, how to have fun with Go and Docker
tags:
  - Go
  - Code
---

When I first started learning to program, I had a blast writing little utilities and servers. I didn't realize it, but I've missed out on that feeling for too many years. I found it again. Thanks to my good friend [Pieter](https://twitter.com/pgermishuys), I've started making some progress on my backburner interest in [Go](https://golang.org/).

I've written a TCP echo server. There's a not-very-prescriptive RFC for an echo protocol in [RFC 0862](https://tools.ietf.org/html/rfc862). And, luckily for you, dear reader, the implementation is just as short.

I'll only cover the highlights of my server here. Which, given to the small program size, is pretty much all of it. But, you can get a copy of everything over on [my GitHub repository](https://github.com/hyrmn/GoTcpEchoServer).

## My first go at Go

I'm still learning Go so if I fumble on any important point, please let me know! I'm also going to gloss over a few things. So if, like me, you're new to Go, just know for now that it's important there's a `func main()` in a `package main`. Take that as gospel, we'll get into the rest.

The `init` function will be run first, and it seems like a good place to put the configuration stuff. 

```go
func init() {
	flag.StringVar(&opt.port, "p", os.Getenv("PORT"), "Default listen port")
	flag.Parse()

	if opt.port == "" {
		opt.port = "7"
	}
}
```

I want to be able to configure the port I'll bind. Yes, the only solid part of the RFC says port 7, but what if I'm on some *nix distro with an echo server daemon already running.

I'm  using the built-in flags library to allow the user to specify a port with `-p`. If they don't supply one, I'll look to see if an environment variable named `PORT` has been set already. I assume the program will be running in an isolated space which is why I have such a generic environment variable. Finally, if no port is specified, I default to port 7 (at long last, we'll obey the RFC).

Next, let's actually do something and set up our server to listen for a client to connect.

```go
func main() {
	log.Printf("listening on port %v", opt.port)

	ln, err := net.Listen("tcp", ":"+opt.port)

	if err != nil {
		log.Fatalf("listen error, err=%s", err)
		return
	}
	defer ln.Close()

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatalf("accept error, err=%s", err)
			return
		}

		go handleConn(conn)
		log.Printf("connection accepted %v", conn.RemoteAddr())
	}
}
```

There's a lot going on here, but half of it is Go's approach to error handling. We'll skip that. 

```go
ln, err := net.Listen("tcp", ":"+opt.port)
...
defer ln.Close()
```

This binds my program to the specified TCP port and waits for a client to connect. And, I've indicated with the `defer ln.close()` that I want to tidy up and stop listening when my `main()` function exits. I don't think this is necessary in this code, but it's a good practice to always clean up any resources your application has open.

The next section is, for me, mind-blowing.

```go
for {
    conn, err := ln.Accept()
    ...
    go handleConn(conn)
}
```

Usually, when you put your program in an infinite loop (in this case, a for loop with no signal on when to stop), bad things happen to your CPU. Here, we accept any new client connections from our listener and then pass them off to a [goroutine](https://gobyexample.com/goroutines). A goroutine is a lightweight thread that will run without tying up our main application. So, if 100 clients connect, my program will send off 100 independent goroutines and handle each client. This is infinitely easier than a lot of multithreaded code I've written in the past. It's not without its trade-offs, but that's immaterial for now.

Now, finally, on to the actual meat of the application. Echoing the what the client sends back to the client.

```go
func handleConn(conn net.Conn) {
	defer conn.Close()
    _, err := io.Copy(conn, conn)
    
	if err == io.EOF {
		log.Printf("received EOF. client disconnected")
		return
	} else if err != nil {
		log.Fatalf("copy error, err=%s", err)
	}
}
```

Wait, that's it?

Note the use of the defer again. Here, we're saying we want to tidy up the server's connection to the client when we exit. I also want to point out the `if err == io.EOF` as a special case to the other error handling in the program so far. If the client disconnects, it may send an EOF (end of file) marker to the server. We don't care about those kinds of errors; it just means the client disconnected. So, we'll note it but not treat it as an error we care about.

On to actually echoing back to the client... (yes, yes, I promised that earlier)

Here's where we can get a lot of help from Go's standard libraries. 

```go
_, err := io.Copy(conn, conn)
```

We don't need to set up an temporary buffer to read from the client or anything. [io.copy](https://golang.org/pkg/io/#Copy) expects to be able to read bytes from something and write bytes to something else. In our case, the connection object satisfies both of these requirements. So, we read some bytes from the connection... and then write some bytes straight back to the connection.

This is really nice.

## Wrapping up

Well, there it is, in a nutshell. A very basic Go TCP server. It might be useful if you wanted to, say, test connectivity between two computers. I also learned a bit about Docker and how to set up a Docker image to build the application, but I'm going to save that for a future post.