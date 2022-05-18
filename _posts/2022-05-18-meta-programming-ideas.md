---
layout: default
title:  "Templates, Concepts and traits"
description: "
The common thing between these three words is that they all are
_programming ideas_ and not (perhaps) related to any language feature.
If you want, it's the kind of ideas that know live in the soul of
the modern programming."

authors: ["Adrien Zinger"]
comments_id: 7
---

## Templates, Concepts and traits
<span style="color: #A0A0A0">[2022-05-18] \#C++ \#Rust \#Traits

---



The common thing between these three words is that they all are
_programming ideas_ and not (perhaps) related to any language feature.
If you want, it's the kind of ideas that know live in the soul of
the modern programming.

If `templates` and `concepts` are a similar in the sens that it allow
the user to do some _meta programming_, `traits` are an idiomatic system
to (and I quote <u> _Bjarn Stroustrup_ </u>) carry information used by
another object to determine _policy_ or _implementation details_.

## About templates

In C++, templates are very common in the standard library. Even if it
tends to be replaced with concepts, you have probably already seen one
in your programmer life.

It's all about genericness, if you're building a library, you probably
want that the user could use it with any kind of input. If your library
is doing an abstract sequence of operations with the input, there is no
reasons to limit the client to a specific _Class_.

Note that there is some cases where you precisely **want** to be
specific. For example when you build a lib with physic's function, you
certainly want to introduce the specification of types like `Hz`, `km`.
You can so remotely introduce some rules of calculations and
assignations. It's an example but I'm sure there can exist a lot of
reason to don't use generics programming's tools.

Unsurprisingly, the templates takes the form of `< T >` in many
languages. I'll not go into details of the pattern because I'm sure you
can google it if you don't know what is it.

## About concepts

Hmf... 😬 In practice, concepts are very C++ oriented. But it introduce
the idea of _Constraints_ that you cannot have with just templates!
Basically, it move the resolution of the template very early in the
compilation and give a flavour to the user to understand why the type
doesn't match with the library.

In other words:

- with templates, you describe the constraints of the library in the
    documentation (the latest thing you read)
- with concepts, you let the compiler saying the constraints in a nice
    format 🙅

## And the traits

Here is the bridge between Rust and C++ for the meta programming part.
In Rust, traits are used to describe both _Constraints_ and
_implementation details_, where in C++, you need to do a mix of all the
ideas of that article.

Now, a basic example of an almost _word for word translation_. You can
decline it with any algorithm, nevertheless, I'm going to show how to do
the famous `ToString` traits constraints.

```rust
// Declared in the standard library at std::string;
// Let user carry on the implementation for their own structures as `A`
// pub trait ToString {
// 	fn to_string(&self) -> String;
// }

/// Structure defined in the user program
struct A {
  // parameters
};

/// Implementation of the trait `ToString` for local structure `A`
impl ToString for A {
  fn to_string(&self) -> String {
    // implementation
  }
}
```

In rust, most of traits are already declared in the standard library
because it's very idiomatic to work with. Note that as for a C++
parallel, the implementation for `A` isn't _inside_ `A`. It can, for
some reason, being implemented in another file that we would import if
we need `A` to implement the trait!

The library would constrain the used type to implement `ToString` like
that:

```rust
pub fn foo(obj: impl ToString) {
  println!("{}", obj.to_string());
}
```

So what is the C++ equivalent to the paradigm? First you need to declare
yourself the trait. Because C++ is not oriented like that and sometime
(I don't understand why) people discourage to do it that way. If you
have got an idea please comment the post!

```cpp
// declare trait in lib.h

template<typename T>
struct trait_to_string {
  // By default, we don't implement that trait for T
  static const bool impl_flag = false;
  static std::string to_string(const T& self);
};
```

OK, so we are here with a `trait_to_string` that replace the standard in
Rust. And the structure `trait_to_string<A>` that implement the trait.

You've noticed that we already use templates here in _C++_, and not in
_Rust_. It's because, behind the hood in _Rust_ we are doing the same thing
(but in earlier in the compilation).

Now, we need to constrain the client to use our library with only data
that implement our trait `ToString-like`. We will use... _Concepts_!!


```cpp
// still in lib.h

template<typename T>
concept ImplToString = requires(T a) {
  // required to be true
  requires trait_to_string<T>::impl_flag;
};

/**
* Export function log that is very simple...
*/
template <typename T>
requires ImplToString<T>
std::string log(T a)
{
  return trait_to_string<T>::to_string(a);
}
```

And we expose a basic function `log` that don't even do anything so it's
a bit miss-named. Whatever, you're not forced to use the concepts here,
you can do the same thing with a simple `<Template>` and documentation!
In addition, you shouldn't use _Concepts_ only to do that kind of stuff.
It will take a full dedicated article about that subject.

Then, once you're done with your library, you can use it that way:

```cpp
struct A {
  A(std::string a): str(a) {};
  std::string str;
};

template<>
struct trait_to_string<A> {
  static const bool impl = false;
  static std::string to_string(const A& self) {
    return self.str;
  }
};

int main() {
  A a("hello world");
  std::cout << log(a);
}
```

I'm agree, the flag isn't really beautiful, it allow us to put a Concept
constraint and we'll probably get a better way to define that. To be
honest, there is probably already a solution that I don't know. :-D

However, look at the definition of the trait... Isn't it `Rusty`?!

I leave you here for the moment! I'll be back in next articles to be
more precise about _Concepts_. I promise to look attentively at that
flag too.

## Conclusion
Rust compiler do a lot of things for us to make the pattern efficient
and easy to use. In addition, there is a little thing that we learn the
last 20 years about hat pattern called the _Orphan rule_, and it's
probably the reason why I didn't heard much about _traits_ in C++.

I really want to test the limits in C++ of the pattern! I'll be back!

