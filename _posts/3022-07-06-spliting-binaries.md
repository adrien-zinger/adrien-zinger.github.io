---
layout: default
title:  "Splitting binaries"
description: "
Looking deep inside that subject. Why is it a really bad thing to do.
"

authors: ["Adrien Zinger"]
comments_id: 8
---

# Splitting binaries
<span style="color: #A0A0A0">[2022-05-18] \#Linking \#AssemblyScript \#WebAssembly

## What can we do

Splitting binaries already exist. It's a common feature called dynamic
linking, I don't learn you nothing. When you're coding, you would
prefer to exclude the implementation of some part of your project.

Basically, a common compiler will not rewrite `malloc` or `printf` in
all your programs. It would be a waste of memory space to statically copy
those lib for each binary in your post. Some publics libs
like the _SDL_ or the _GTest_ are developed keeping in mind that it would be 
better to use it in a _dynamic way_.

You can so, compile multiple libraries and link them later, at runtime.

## After the compilation

Above, we spoke about dynamic linking. But that's not really _"splitting"_ a
binary. Finally, we just compile codes to get compatibles binaries.

No, we want to take a binary, and remove some parts inside of it and restore it
after all.

```rust
fn main() {
    let buffer = &mut [0; 32];
    my_static_lib::fill(buffer);
}
```

Let's start a little example, you want to fill something. You don't want to use
a dynamically linked library. So you compile, what happen (the big steps):

1. A specific code is generated especially for your program.
2. It's converted into assembly.
3. It's copied as a part of your program.
4. All the binary is optimized... with multiple substeps.

![First burnout](/assets/img/jenga.gif)

The first step is already a problem. We can imagine that fill use a lot of generics code. In that case, calling `fill` with a `&mut String` or
a `&mut [u8; 64]` would generate a code drastically different.

Yes, a generic library could also use monomorphic code.
But it should have been thought for. In addition, in rust, that's
very uneasy to write. So you need to manage each case, or verify
in a long and painful task if everything could be found and extracted
safely.

Compilers try to produce an efficient program. In
rust and in many other languages, the compiler will prefer to
inline things just before converting it into a binary,
letting us the pleasure to retrieve
what we can extract and what we cannot.

On the other hand, some compiler focus on the size.
They factorize a lot of function, which means that different
implementation could lead to a completely different binary. Even
if they use a common library.

Of course, we have written `fill` ourself and we know exactly what's
inside. We perfectly know which of the 53k generated lines in the binary are always the same for us and we'll delete them!!

![First burnout](/assets/img/bill_g.gif)

...should try on windows?

The development of a compiler is very special, a little modification in a
module can change a lot. If your working on a different os, you
probably have a compiler slightly different. And you need to check that.

FORtuNaTely, there is some compilers, like for the
[AssemblyScript](https://www.assemblyscript.org/) language that are portable and doesn't care about the OS.

In any cases, we'll have to check every version of the compiler.
We don't know if the next version will need an adaptation. And if it need one,
we have to define a way to understand which version of the compiler
the user use.

We cannot just try and hope it works...

## Long time after the compilation

Ok, we are always after the compilation, with a lot of binaries. Our
runtime is always feed with new user binaries.

Obviously we could think about a kind of factorization with
an higher level. A kind of huffman on our database. If 45% of
binaries have the same piece of data, it would be to have a
background task that create a table and replace the binaries
with a compressed one.

## Just before the compilation

The solutions after compilation are not very useful if we want a fast and safe result.

We can check every cases, for every version, for every target.
With my experience, I'm pretty sure that the next work will do is
to fix one million bugs and specific cases. You'll be drawn in the user's issues.

![Second burnout](/assets/img/infinit_task.gif)

The real question is: why people use shared libraries? The best solution maybe because it is.
