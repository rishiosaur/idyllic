![Banner](assets/Banner.svg)
# ⚡️ Idyllic

[comment]: <> (![lint status]&#40;https://github.com/rishiosaur/idyllic/workflows/lint/badge.svg&#41;)

[comment]: <> (![format status]&#40;https://github.com/rishiosaur/idyllic/workflows/format/badge.svg&#41;)

[comment]: <> (![build status]&#40;https://github.com/rishiosaur/idyllic/workflows/build/badge.svg&#41;)
![GitHub](https://img.shields.io/github/license/rishiosaur/idyllic)
![GitHub issues](https://img.shields.io/github/issues/rishiosaur/idyllic)
![GitHub contributors](https://img.shields.io/github/contributors/rishiosaur/idyllic)
![GitHub last commit](https://img.shields.io/github/last-commit/rishiosaur/idyllic)
![npm (scoped)](https://img.shields.io/npm/v/@idyllic/compiler?label=%40idyllic%2Fcompiler&style=flat-square)
![npm (scoped)](https://img.shields.io/npm/v/@idyllic/server?label=%40idyllic%2Fserver&style=flat-square)

The specification language for building APIs ridiculously fast.


# Table of Contents
- [⚡️ Idyllic](#️-idyllic)
- [Table of Contents](#table-of-contents)
- [Getting Started](#getting-started)
- [Manifesto.](#manifesto)
- [Language](#language)
  - [Definitions](#definitions)
    - [Handlers](#handlers)
    - [Middleware](#middleware)
    - [Guards](#guards)
  - [Sequences](#sequences)
    - [Global Sequence](#global-sequence)
    - [Fragments](#fragments)
  - [Routes](#routes)
    - [Defining Handlers](#defining-handlers)
    - [Query parameters](#query-parameters)
  - [Conclusion](#conclusion)
- [Compiler](#compiler)
  - [Compilation stages](#compilation-stages)
    - [Lexing](#lexing)
    - [Parsing](#parsing)
    - [Desugaring](#desugaring)
    - [Validation](#validation)
    - [Objectification](#objectification)
  - [API](#api)
- [Server](#server)
- [Contributing](#contributing)

# Getting Started

You can find a tiny example of what Idyllic looks like at [the TODO example](https://github.com/rishiosaur/idyllic-todo)

# Manifesto.

Boilerplate is the single most disingenuous part of the Node ecosystem today. Frameworks like Express, Koa, and so many more focus on having rigid rules for how to write code instead of, well, writing it.

Idyllic aims to reverse that paradigm. Instead of writing your code to follow the arbitrary conventions of a given 
framework, the Idyllic pattern allows you to write code *however you want*.

Idyllic wraps Typescript functions in a web server that you define using the Idyllic Language. There aren't any 
weird functions, conventions, objects, or patterns to recognize; making an 
Idyllic web service is indistinguishable from writing normal TS.

# Language

Idyllic language files are denoted by the extension `.idl`, and are used to wrap Typescript functions that are 
imported from local files like any other JS module. A program written using the Idyllic Language is known as a 
singular Idyll, and holds definitions about how data moves through the service & API routes.

```
define middleware { test, logger } from "./api"
define guards { authed } from "./api"
define handlers { getAllTodos, postTodos } from "./api"

global
  | middleware logger

fragment getTodosFragment(level)
  | guard authed(level)
  | middleware test

route "/todos" {
  | middleware test

  get {
     | expand getTodosFragment("user")
     getAll
  }
  
  post {
     | expand getTodosFragment("admin")
     postTodos
  }
}
```
<center><small>A basic example of a todo API implemented using the Idyllic Language</small></center>

## Definitions

We begin by importing values from a Typescript or Javascript file. In Idylls, there are three main types of 
**functions** that can be imported: handlers, middleware, and guards.

### Handlers

Handlers are the simplest of the three types of functions that Idyllic supports, and are quite self-explanatory—they 
return values based off of a given request.

```typescript
export const getAllTodos = () => {
    return [{
        name: "todo 1",
        completed: false
    }]
}
```
<center><small>A handler takes in a request and returns a value—this is as simple as it gets!</small></center>

It's also worth noting that Idyllic servers handle serialization for you—you don't need to set any weird headers to 
make sure that JSON is returned.

You can import handler functions into an Idyll by using `define handlers`:

```
define handlers { ... } from '<path>'
```

### Middleware

If you come from nearly any other Node web framework, you'll also be familiar with the concept of middleware. These 
are used as 'pipes' of data—they intercept an HTTP request and change the data within it somehow, passing it down 
the chain of middleware and guards (we'll get to this in the next section) until the request hits a handler.

```typescript
export const loggerMiddleware = (req) => {
    log(req)
    return {
        ...req,
        logged: true
    }
}
```
<center><small>Middleware intercepts a request and returns some augmented data for the next piece in 
the chain.</small></center>

One important thing to note in Idyllic's implementation of middleware is that there is no 'next' function—you just 
return the arguments that you'd like to pass to the next function in the chain.

You can import middleware functions into an Idyll by using `define middleware`:

```
define middleware { ... } from '<path>'
```

### Guards

Guards are also fairly self-explanatory—they guard requests from being executed. You can think of them as 'filters' 
for a given request. At a low level, they are functions that take in a request and return a boolean value—if the 
guard returns `true`, then the request continues execution, and vice versa.

```typescript
export const authGuard = async (req) => {
    const { headers: { authorization } } = req
    
    return validateToken(authorization)
}
```
<center><small>Guards take in a given request and return a boolean value, stopping execution if the result is false.
</small></center>

Unlike middleware, guards are not meant to change the request itself. As such, Idyllic handles context for guards; 
if the guard allows further execution, the request object that was passed into the guard function will be the same 
one that is passed into the next function in the chain.

You can import guard functions into an Idyll by using `define guards`:

```
define guards { ... } from '<path>'
```

## Sequences

Now that we have functions available to us in the Idyll program through the use of `define`, how do we go about 
using them? Well, Idylls are made up of pipelines of data known as Sequences. A Sequence is just a collection of 
guard and middleware functions (and fragments, but we'll get into those later).

Let's annotate the Idyll we saw from before to see where all the Sequences are:

```
define middleware { test, logger } from "./api"
define guards { authed } from "./api"
define handlers { getAllTodos, postTodos } from "./api"

global
  | middleware logger                   - [ SEQUENCE ]

fragment getTodosFragment(level)
  | guard authed(level)                 ┓
  | middleware test                     ┻ [ SEQUENCE ]

route "/todos" {
  | middleware test                     - [ SEQUENCE ]

  get {
     | expand getTodosFragment("user")  - [ SEQUENCE ]
     getAll
  }
  
  post {
     | expand getTodosFragment("admin") - [ SEQUENCE ]
     postTodos
  }
}
```

Each sequence defines how a request moves through the Idyll to reach a handler function (note that handlers are not 
part of Sequences). You can find them pretty much everywhere in Idylls—they are the bulk of the language.

Sequences can be defined in Fragments, Routes, Request Handlers (separate from handler functions), and the Global 
Sequence.

The form of a singular Sequence node is `| <type> <identifier> (<arguments>)`. 

If we want a given piece of data to flow through a guard called `authed`, we can write something like:
```
| guard authed
```
We may also pass in arguments (arguments can be numbers or strings) to this guard, in case 
we'd like to 
customize behaviour (these arguments will get 
passed into the corresponding function:
```
| guard authed("user")
```

The rules for middleware apply here as well, but instead of using the `guard` keyword, you should use the 
`middleware` keyword.

Where and how can we actually define these sequences, though?

### Global Sequence

Oftentimes, you'll want to put some middleware in front of every request that the server handles (like a logger or 
an authentication guard). This is where the `global` keyword comes in.

To define a sequence that gets executed for every single request, you can write one directly under the `global` name 
(note: this is a reserved keyword):

```
define middleware { test, logger } from "./api"
[...]

global
  | middleware logger
  
[...]      
```

With a program like this, `logger` will be executed on each request.

### Fragments

Writing sequences all over the place can get tiring. That's why the Idyllic Language has first-class macro support!

If you're coming from GraphQL, this bit should come naturally—macros act the exact same way as they do over there. 
However, Idyllic macros are even more powerful because of their parameter support.

Defining a Fragment is as easy as using the `fragment` keyword and adding an identifier and your sequence:

To use a Fragment, just include it in any non-Fragment sequence using the `expand` keyword the same way you would a 
Guard or Middleware function:

```
[...]

fragment GetTodosAuthedAdmin
  | guard authed("admin")
  | middleware test
  
fragment GetTodosAuthedUser
  | guard authed("user")
  | middleware test
  
route "/todos" {
  get {
     | expand GetTodosAuthedAdmin
     getAll
  }
}

route "/todos/{id}" {
  get {
     | expand GetTodosAuthedUser
     getAll
  }
}
```

While this example follows terrible UX, it shows the function of Fragments quite well. In the compilation stage of 
an Idyll, this program would get expanded to:

```
[...]
  
route "/todos" {
  get {
      | guard authed("admin")
      | middleware test
     getAll
  }
}

route "/todos/{id}" {
  get {
     | guard authed("user")
     | middleware test
     getAll
  }
}
```

Fragments are a purely Idyllic construct—they are not preserved in the compiled object, and there is a separate 
compiler pass stage exclusively for rendering them out.

Anyways, there is one (albeit of many) glaring problem with the fragments that we wrote in the last example: it's 
repetitive. Instead of defining two different fragments for a specific auth level change, let's use parameters to 
generalize a fragment:

```
[...]

fragment GetTodosAuthed(level)
  | guard authed(level)
  | middleware test
  
route "/todos" {
  get {
     | expand GetTodosAuthed("admin")
     getAll
  }
}

route "/todos/{id}" {
  get {
     | expand GetTodosAuthed("user")
     getAll
  }
}
```

There we go. That's much more concise! This will get expanded out to the exact same program that we saw earlier.

## Routes

No web framework would be complete without some form of router support, and Idyllic is no different; they're a core 
part of the language.

Defining a route requires the `route` keyword, a string literal with the route itself, the route's sequence, and the 
various handlers associated with it:
```
[...]

route "/todos" {
  | middleware test 

  get {
     | expand getTodosFragment("user")
     getAll
  }
  
  post {
     | expand getTodosFragment("admin")
     postTodos
  }
}

route "/todos/{id}" {
  get {
     | guard authed("user")
     | middleware test
     getAll
  }
}
```

This program would create an API with two routes: `/todos` and `/todos/{id}`, the latter of which runs the 
middleware called `test` before all requests to it (remember, Sequences can be as long as you'd like; sequences for 
Routes run before all requests). Let's dissect this a little bit further!

### Defining Handlers 

In each of the two routes' brace pairs (`"{"` and `"}"`), we can see their corresponding sequences & some new code 
blocks:

```
[...]
  get {
     | expand getTodosFragment("user")
     getAll
  }
  
  post {
     | expand getTodosFragment("admin")
     postTodos
  }
  
  [...]
```
<center><small>What are these code blocks?
</small></center>

Every route can be queried in a number of different ways—in REST, there are exactly 5 different request types: GET, 
POST, PATCH, PUT, and DELETE. We can define behaviour for each type of request a given route supports by defining 
Handlers. This is also where the function handlers we defined at the beginning of the program go (remember, you 
can't add handler functions in fragments)!

A Handler must have a request type (this is the first thing in its definition) and a handler function. We can also 
define Sequences to be run before a request of a given type simply by adding nodes right after our opening brace.

Handlers can also have arguments passed to them—these are defined in the exact same way as you might pass arguments 
to a middleware or guard function.

### Query parameters

It's also useful to have some form of parameter support for the routes themselves—if we'd like to query just one 
todo by ID, we might send a GET request to `/todos/3`.

We can define query parameters by using brace pairs in the route's associated string:

```
route "/todos/{id}" {
  get {
     | guard authed("user")
     | middleware test
     getAll
  }
}
```

## Conclusion

That's pretty much it as far as the Idyllic Language specification goes! Let's recap all the major features of the 
language:

- Static typing with Typescript & definition types
- Parameterized, first-class macro support with Fragments
- Data pipelines with Sequences
- First-class support for Middleware and Guards
- Query parameter capturing
- Request type definitions

# Compiler

Of course, understanding the language would be useless without a compiler to actually use that knowledge with. 
Luckily, this repository includes a high-performance implementation of the language to get started!

## Compilation stages

The compilation consists of 5 main stages: lexing/tokenization, parsing, desugaring, validation, and objectification.

### Lexing

Lexing merely translates a source string to an array of `Token`s: a `Token` is merely a class that consists of a 
position, literal and type.

### Parsing

This is where things start getting interesting. In this stage, the compiler turns the static array of `Tokens` into 
a large tree of `AstNode`-implementing classes. An "abstract syntax tree" is constructed—this is where the arbitrary 
tokens start to take on meaning.

### Desugaring

This is the stage of compilation where macros (Fragments) are expanded into various Sequences around the programs. 
Nothing super interesting; the compiler just walks itself through the tree constructed in the Parsing stage. After 
all Fragments have been expanded out, they then get deleted from the tree (they serve no purpose after expansion, 
and removal keeps runtime memory usage to a minimum)

### Validation

After desugaring, the compiler walks through the `definition`s of middleware, handler, and guard functions and 
dynamically imports them from the associated Typescript function. It then goes through and validates identifiers, 
types, and Sequences used in the program.

### Objectification

The final stage of compilation turns the validated abstract syntax tree and constructs a "concrete syntax tree," and 
then simplifies everything down to one singular object of the form:

```typescript

export interface ConcreteSequenceNode {
	interop: Function
	name: string
	type: TokenType
	arguments: (string | number)[]
}

interface CompiledTree {
	global: ConcreteSequenceNode[]
	routes: {
		[id: string]: {
			requests: {
				[requestType: string]: {
					sequence: ConcreteSequenceNode[]
					handler: {
						interop: Function
						name: string
						arguments: (string | number)[]
					}
				}
			}
			sequence: ConcreteSequence
		}
	}
}
```

This final compilation stage turns the syntax tree into an easily traversible API-like tree, with intuitive bindings 
for all API-specific functionality. It holds references to all Typescript functions, so we can call any handler, 
middleware or guard functions right from the object itself.

## API

All of this functionality is held within the [`@idyllic/compiler`](/packages/compiler) package, which exposes a 
simple `IdyllicCompiler` class. Other types are also available by hooking into `@idyllic/compiler/dist/...`.

To compile an Idyllic program directly from a file path, we may write a simple asynchronous Node snippet:

```typescript
import { IdyllicCompiler } from "@idyllic/compiler";

(async () => {
    
    // The fromFile static method reads the file into a string for us
    const compiler = await IdyllicCompiler.fromFile("ast.idl") 
    
    // The compile method executes all 5 stages of compilation automatically.
    const compiled = await compiler.compile()
    
})()
```

Of course, the `constructor` for `IdyllicCompiler` takes in a `string` as its only argument if you'd like to send in 
an Idyll constructed differently.

# Server

This repository also includes an extremely fast web server that complements the compilation stage. While it isn't 
professionally benchmarked (yet), you can expect response times similar to (and in many cases, beating) Express.

To use this server, you can import the `IdyllicServer` class from the [`@idyllic/server`](/packages/server) package.

Using this server is as easy as adding a few lines to the reference program we wrote earlier:

```typescript
import { IdyllicCompiler } from "@idyllic/compiler";
import { IdyllicServer } from "@idyllic/server";

(async () => {
    
    // The fromFile static method reads the file into a string for us
    const compiler = await IdyllicCompiler.fromFile("ast.idl")

    // The compile method executes all 5 stages of compilation automatically.
    const compiled = await compiler.compile()
    
    // The server constructor takes in a compiled Idyllic object.
    const server = new IdyllicServer(compiled)
    
    // The start function takes in a port number (defaults to 3000) and a function to be executed on start.
    server.start(3000, () => {
        console.log("Idyllic server has started!")
    })

})()
```

This server implementation uses Node's native `http` package, but because the Idyllic compiler always returns the 
same implementation, you can write your own bindings for any Node HTTP server library out there!

# Contributing

Contributions are always welcome—Idyllic is a massive project, and it's always nice to have some help from awesome 
people like you :)

To get started, make sure to follow the instructions in the [Contributing file](CONTRIBUTING.md), and always 
remember to act according to the [Code of Conduct](CODE_OF_CONDUCT.md).
