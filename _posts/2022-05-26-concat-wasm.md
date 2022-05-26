## String concatenation in webassembly

Deal with memory in webassembly can be difficult to understand. But, actually,
it is nothing very complex.

The thing to understand is that wasm modules leave in instances inside a *VM*.
The *VM* is the executor, manage behind the scene the validation of the module, the
execution. It manage the stack machines, the global variables and the *heap*.

That instance is fully described in the wasm. In the webassembly text, you
can know how is the initialized the instance when you see
that kind of lines:

```wat
  (memory (export "memory") 1)
  (data (i32.const 0) "hi")
```

The wasm memory management is described inside the code. So there is nothing like
*garbage collection*, nevertheless, it could be done by an embedder. Because
in a navigator, the envirronment manage the memory of your JS code, you cannot
safely let the memories being shared like with a classical dynamic linked library.

> It's actually possible to share the memory between multiple modules. Exactly
> like the linking of a *Rust* and a *C* library. Even if in a classical dynamic
> link you don't have to specify it.

## Writing a string

Since the calls of wasm function from the embedder can only transfer primitiv
value as `i32` or `i64`, if we want to share a string, we need to write inside
the instance memories. To do that, we first need to share with the embedder the
memory by importing or exporting it.

Export a memory of one page limited to 200b

```wat
  (memory (export "memory") 1 200)
```

And in the JS side, I write from the position *8 x 20* the charcodes
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

Be carefull, there is nothing that prevent you to write over a value already in
the shared memory. You could try to *grow* the memory of one page, so you're sure
the memory chunk where you're about to write is free to use. You can also let
the module tel you where you can write if there is an allocator inside.

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

Now I have written the string in the memory an so the charcodes are accessible in
the wasm. I would like to expose a wasm function that append the word *world* to
anything I write in my `hello` variable. If I've written the string at the position
*8 x 20*, I could call `concat(20)`. That will read and find the end of the string,
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

We already defined a string in the memory at the position `0` containing the sequence ` world` with this `(data (i32.const 0) " world")`. So we can load it and copy each values of the string to the last character.

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
enough of memory :)

```js
    let v = new Uint8Array(memory.buffer, 20, 50);
    console.log(new TextDecoder('utf8').decode(v));
    // hello world
```

> You can define better how the string is represented, you can use the classic
> standard where you send the address and the size of the string. As well you don't
> have to do the first loop.

