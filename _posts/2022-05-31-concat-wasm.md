---
layout: default
title:  "String concatenation in webassembly"
description: "
Develop a concatenation of strings in webassembly is the best
entry point to understand the linear memory in a wasm instance.

All is about how do you represent a structure with a sequence
of bytes. Nothing complex.
"

authors: ["Adrien Zinger"]
comments_id: 8
---

## String concatenation in webassembly

<span style="color: #A0A0A0">[2022-05-31] \#JS \#wasm \#interop

---

Dealing with memory in webassembly can be difficult to understand. But, actually,
it is not so hard.

The thing to understand is that wasm modules leave in separated instances
inside a *VM*. The *VM* is the executor, manage behind the scene the
validation of the module, the execution. It manages the stack machines,
the global variables and the *heap*.

Instances are fully described in the wasm code. In webassembly text, you
can know how is initialized the instance's memory when you see that
kind of lines:

```wat
  (memory (export "memory") 1) ;; describe the memory
  (data (i32.const 0) "hi") ;; add a kind of constant in that memory at 0
```

The binary describes the memory management.
So there is nothing like *garbage collection*. Furthermore, because in
a navigator, the environment manage mainly the memory of your
JS code. So you cannot safely let the memories being shared
like as in a classical dynamically linked library between compiled codes.

> It's actually possible to share the memory between multiple modules. Exactly
> like the linking of a *Rust* and a *C* library. With the difference in a classical dynamic
> link you don't have to specify it explicitelly.
>
> Emscripten can produce wasm that are dynamically linked together. You can
> So compile C into a webassembly binary and deal with a shared memory between
> two wasm.
>
> In the future, it would be neat to be able to share the
> memory with C/C++/Rust code from a VM like _wasmtime_ or _wasmer_.
>
> Another thing.
> There is no garbage collection directly in the webassembly,
> nevertheless, it could be done by an embedder. For example you can for each value
> walk through their dependencies, and delete the unreachables objects. More simple, you
> can store for each value a `pin` flag, then, on trigger the garbage collector, remove
> all structures without that flag. 👏

## Writing a string

The calls of a wasm function from the embedder can only transfer primitive
value as `i32` or `i64`, if we want to share a string, we need to write inside
the instance memories.

To do that, we first need to share with the embedder the
memory. We need to import or export it.

Ex: export a memory of one page.

```wat
  (memory (export "memory") 1)
```

In the JS side, I write from the position *8 x 20* the charcodes
of `hello\0` string in the exported memory :)

```js
    const { concat, memory } = wasmModule.instance.exports;
    // define a C-style string
    let hello = "hello\0";
    // get the memory of the module
    let buf = memory.buffer;
    let mem_arr = new Uint8Array(buf);
    for (let i = 0; i < hello.length; ++i) {
	mem_arr[20 + i] = hello.charCodeAt(i);
    }
```

Be careful! There is nothing that prevent you to write over a value already in
the shared memory. You could try to *grow* the memory of one page, so you're sure
the memory chunk where you're about to write is free to use. You can also let
the module tell you where you can write if there is an allocator inside.

Like that too simple but enough allocator, for example:

```wat
 (func $wrong_malloc (param $0 i32) (result i32)
        (local $ret i32)
        global.get $heap_head
	local.tee $ret
	local.get $0
	i32.add
	global.set $heap_head
	local.get $ret
 )
```

## Modify the string

I write the string in the memory, then the charcodes are accessible in
the wasm.

Now I would like to expose a wasm function that append the word *world* to
anything I write in my variable. If I write the string at the position
*8 x 20*, I could call `concat(20)` (because it's align to the 20th byte in memory).
That will read and find the end of the string,
and then continue to write ` world`.

```wasm
  ;; store in the s param the next index after the last char
  ;; initialy, s == 20 (given input arg)
  (loop $to_the_end
    local.get $s
    i32.load8_u
    i32.const 0
    i32.gt_u

    (if (result i32)
      (then
        local.get $s
        i32.const 1
        i32.add
        local.tee $s
      )
      (else
        i32.const 0
      )
    )
    i32.gt_u
    br_if $to_the_end
  )
```

We already defined a string in the memory at the position `0`
containing the sequence ` world` with this `(data (i32.const 0) " world")`.
So we can load it and copy each values of the string to
the last character.

```wat
  (loop $dump
    local.get $s
    local.get $pos
    i32.load8_u
    i32.store8

    i32.const 1
    local.get $s
    i32.add
    local.set $s
    i32.const 1
    local.get $pos
    i32.add
    local.tee $pos
    i32.load8_u
    i32.const 0

    i32.gt_u
    br_if $dump
  )
)
```

And then in the JS side you can just get back the address of the new string and read
enough of memory 😉

```js
    let v = new Uint8Array(memory.buffer, 20, 50);
    console.log(new TextDecoder('utf8').decode(v));
    // hello world
```

> You can define better how the string is represented, you can use another
> standard, send the address and the size of the string. As well you don't
> have to do the first loop. You can choose if your string will be in utf16
> instead of the simple ascii.
>
> You can also invent your own encoding process! But I recommend to use some
> known standard 😂

The full code is on my bucket [here](https://github.com/adrien-zinger/code_bucket/tree/main/wasm_strings)!
