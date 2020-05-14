---
title: Counting lines with Go
date: 2020-05-13
description: >-
  Learning how to read from the command line and process a file using Go, one bunch of bytes at a time.
tags:
  - Go
  - Code
  - blogentries
---

I was thinking the other day about <a href="https://en.wikipedia.org/wiki/Unix_philosophy">The Unix Philosophy</a>. Broadly, you can get a lot of power from small command line utilities that do one thing well and can be chained, or composed, into more powerful use cases. For example, there's a command called `wc` (word count). It, well, unsurprisingly, counts words. But, you can also have it count lines if you pass in a flag `wc -l`.

I wanted to take the idea of "do one thing well" to the extreme. And, since I'm learning Go, I thought a line count utility would be a fitting exercise. In building this, we'll be able to learn how to read input from another program to support composability; we'll learn a bit about command line arguments; and we'll learn about reading files.

I mentioned composability a bit. Let's see what that entails. It means that this utility will output only the line count (so that it can be piped on to another command). And, it will need to accept, as input, either the output of another program (we might call this piped input). Or, it will need to be given a file location.

This means that our little application might be called like this

```powershell
> lc "path/to/your/file.txt"
```

or like this

```powershell
> echo "Count the lines in this" | lc
```

(you can substitute `cat`, or `grep`, or anything else, for `echo` above)

In either case, the count of carriage returns (`\n`) in the file will be printed out.

```powershell
> lc "path/to/your/file.txt"
109
```

If you want to just see the code, it's <a href="https://github.com/hyrmn/lc">available on GitHub</a>.

## Implementation Considerations

There are some counting assumptions that I made. I had originally chosen to have this match my editor's line count. That is, if Visual Studio Code shows `x` lines then my logic would also show `x` lines. However, I've chosen to follow the behavior of `wc -l`. I count carriage returns (`\n`). If a file does not end with a carriage return then the last line will not be counted.

While I'm not sure how I feel about this behavior, it is consistent with other tooling. A trailing carriage return is required to get an accurate count. Changing this is an exercise left to the reader.

Also, I think I might want to reuse the line-counting logic in other applications. So, I'm going to separate the command-line interface from the code that understands how to read through a stream and count returns.

## Handling a file argument

Go has a nice flag library to read from the command line. We're going to abuse it a bit to read in the first argument a user passes. Remember, the first scenario is, `lc "path/to/your/file.txt"`. In this usage, there are no named flags being passed in. I simply need `arg0`.

```go
flag.Parse()
filePath := flag.Arg(0)

if filePath == "" {
	fmt.Println("Usage:\n\tlc \"path\\to\\file.txt\"")
	return
}

file, err := os.OpenFile(filePath, os.O_RDONLY, 0444)
if err != nil {
	log.Fatal(err)
}
defer file.Close()
countLines(file)
```

I'm opening a file for read-only access, and requiring that the file have read permissions set for the user, group, and other. We'll get a file descriptor back from the call to `os.OpenFile`. You can think of a file descriptor as a small reference that we'll keep around so know know where to read data from later. And, to clean up after ourselves, we'll close the file when we're done reading. We can do with with the call to `defer file.Close()`

## Handling piped input

The other use case we have to handle is when the data is passed, or piped, directly into our utility.

```powershell
> echo "Count the lines in this" | lc
```

This is passed in on `stdin`, or `standard input`. Unix introduced <a href="https://en.wikipedia.org/wiki/Standard_streams">three standard streams</a>. These are ubiquitious enough that many programming languages have some way to access them and will, as needed, abstract the implementation details for the operating system away for you. These streams are `stdin`, `stdout` (`standard output`), and `stderr` (`standard error`). You might read something from the user on `stdin`, give them some results on `stdout`, and log any problems to `stderr`. But, as you can see in my use case above, `stdin` might be input from anything, including another program.

And, Unix loves file descriptors. Like, it really loves them. `stdin`, `stdout`, and `stderr` are all file descriptors. Yep, just like the result of the `os.OpenFile` call earlier. This will come in handy. Trust me.

We need to probe the `stdin` file descriptor to see if we received any data.

```go
stat, err := os.Stdin.Stat()
if err != nil {
	panic(err)
}

if stat.Mode() & os.ModeCharDevice == 0 {
	reader := bufio.NewReader(os.Stdin)
	countLines(reader)
}
```

Calling `Stat()` will give us information on the associated file descriptor. In this case, that's Go's reference to `stdin`, which Go nicely stores for us in a variable called `os.Stdin`.

I know `stat.Mode() & os.ModeCharDevice == 0` looks a little hairy. We're asking Go for the current file mode on the file information. This is a bitmask of the current modes that are set on the file. When the 'this is character input' flag is set, then we know that `stdin` is open and being written to. 

We could read directly from the `stdin` file. But, I want to buffer the input to more efficiently traverse it. Go provides a <a href="https://www.quora.com/In-C-what-does-buffering-I-O-or-buffered-I-O-mean/answer/Robert-Love-1">buffered I/O</a> library for just such a use case. We give `bufio.NewReader` an `io.Reader` and get back an `io.Reader`. What a deal. But, it does _a ton_ for us under the hood.

Now that we have an `io.Reader`, we can call into the package (that we haven't written yet), and count them carriage returns.

```go
func countLines(r io.Reader) {
	count, err := lc.CountLines(r)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(count)
}
```

## Count Them Lines

Long article. I know. But, we're here. All of that setup and we can deliver the actual value in 22 lines of code

```go
func CountLines(r io.Reader) (int, error) {
	var count int
	var read int
	var err error
	var target []byte = []byte("\n")

	buffer := make([]byte, 32*1024)

	for {
		read, err = r.Read(buffer)
		if err != nil {
			break
		}

		count += bytes.Count(buffer[:read], target)
	}

	if err == io.EOF {
		return count, nil
	}

	return count, err
}
```

Just to recap, we want to know how many times a `\n` character appears in a given file. In a text file, at least, this would tell us how many lines long it is (emoji can't have carriage returns in the middle; I checked).

We don't care about any of the content. So, the question is. How can we efficiently read through the file, get what we want, and get out. I'm going to rule out using `io.ReadBytes('\n')` or higher-level abstractions like `scanner` as I want to hold as little in memory as possible. With those options, I might end up trying to read an entire file into memory before I find the first newline character.

But, we can create a byte buffer, read into that buffer, and then search just that buffer. When we're done, we'll move on to the next chunk.

So, let's create a 32 <a href="https://en.wikipedia.org/wiki/Kibibyte">kibibyte</a> buffer

```go
buffer := make([]byte, 32*1024)
```

and then read from our file into that

```go
read, err = r.Read(buffer)
```

This might give us a buffer with the following content

```markdown
Hello World\nThis is a\nThree line file
```

The variable `read` will tell us how many bytes were read in. This is _very_ important information because we're reusing our buffer and not re-initializing it between reads. Suppose we read **32kb** of data on the first call to `r.Read(buffer)` but only **5kb** of data on the second call. **Our buffer will still contain 32kb of data**. 5kb from the last read followed by 27kb of old data...

Next, we can use the `bytes.Count` method in the Go standard library to find the number of newline characters. We'll store the result in our counter variable.

```go
count += bytes.Count(buffer[:read], target)
```

We will loop "forever". In reality, we will read incrementially to the end of the file. Then, we'll try and read _one more time_ and Go will return an end of file error. We'll check to see when this is encountered and return our results then. In our use case, an end of file error is _expected_ so... well, we shouldn't return it to the caller.

```go
if err == io.EOF {
	return count, nil
}

return count, err
```

## An Alternative Way to Read

Calling `bytes.Count(buffer[:read], target)` is a very specific choice that I can make for this application. However, it might not always work for us. Suppose we were looking for a slightly more complicated pattern. Go has a way for us to do that. `bytes.IndexByte` will return the index position of the first occurance of a byte in a byte array. If no occurance is found, then a `-1` is returned.

So, while it's more complicated, we can look for our `\n` character, and then look at the next slice of the array after that character, and then look at the next slice... continuing on until we're out of things to look at. Then we'd move on to the next chunk of file.

In that implementation, we would replace `count += bytes.Count(buffer[:read], target)` with the following

```go
...
const target byte = '\n'
...

	var position int
	for {
		idxOf := bytes.IndexByte(buffer[position:read], target)
		if idxOf == -1 {
			break
		}

		count++
		position += idxOf + 1
	}
```


## Wrapping Up?

I haven't demonstrated any tests for this program. I'll leave you to <a href="https://github.com/hyrmn/lc/blob/master/pkg/lc/lc_test.go">review them</a> at your leisure. Or, wait for the next exciting installment.

I've <a href="/blog/go-structure-windows/">previously covered</a> how I set Go up locally and added `%GOPATH%\bin` to my path. So, from within the `lc` project directory, I can run `go install` and have a shiny new command line utility to use.

Honestly, thinking up bespoke little utilities has been a lot of fun. And, once you unlock the power of chaining them together, you'll think of many new use cases. Just keep the Unix philosophy in mind.

Feel free to ping me on Twitter <a href="https://twitter.com/hyrmn">@hyrmn</a> with any questions or comments.