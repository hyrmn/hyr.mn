---
title: Formatting Go code with goimports
date: 2020-01-20
description: >-
  A formatting tip for Go in Visual Studio Code
tags:
  - Go
  - Code
  - posts
---

I've found a couple things that help when writing Go in Visual Studio Code. If you're using VS Code then you've probably been prompted to install some Go-related extensions already. But, there are a couple of settings that you might not have enabled. These settings will make things a little more enjoyable. At least they did for me

## Format on Save

Go to your VS Code settings. You can either press `ctrl + ,` or go to File -> Preferences -> Settings. Ensure that `Format on Save` is enabled:

![VS Code Format on Save](/img/vscodeformatonsave.png)

Every time you save the file in VS Code, it will run it through your format tool. Yay!

## Switch from gofmt to goimports

The `gofmt` tool does one thing. It formats your code to ensure it follows the Go standards. Useful, but not helpful. For example, Go will throw a compilation error if your source contains an unused import. `gofmt` doesn't care; it's happy to just make sure things look decent.

The following won't compile

```go
package main

import (
	"fmt"
	"log"
)

func main() {
	fmt.Println("Hello world!")
}
```

```powershell
> go run .
.\main.go:5:2: imported and not used: "log"
 ```

There's another option. [goimports](https://godoc.org/golang.org/x/tools/cmd/goimports). In addition to the formatting work of `gofmt`, `goimports` will remove unused imports, lay out imports so that the standard library ones are grouped first, and list everything alphabetically. It will also try and resolve and import any missing imports.

The link above has steps to get running with some editors but VS Code is missing. Fortunately, it's uncomplicated.

First, we need to install `goimports`. Open a command prompt and do that

```powershell
> go get golang.org/x/tools/cmd/goimports
```

Next, go to to your VS Code settings. 

Search for `go: format tool` and pick `goimports` from the list.

![VS Code editor setting for Go: Format Tool](/img/vscodegoformattool.png)

That's it. Now you'll get a little more help when writing code.

## Next Steps

Of course, `gofmt` and `goimports` aren't the only two tools in town for code tidying. Search around, find others, and see if you find one that meshes nicely with your workflow. For example, check out [goreturns](https://github.com/sqs/goreturns).

Happy formatting.