---
layout: default
title:  "Bootstrap a database in real time"
description: "
Studying some theorical bootstrap methods in a <i>P2P</i> network.
Which are the data structures, introduction... 1/4<br/>
<a href='./2022/05/02/a-bootstrap-a-database-in-real-time.html'>continue to read</a>"

authors: ["Adrien Zinger"]
---


# Bootstrap a database in realtime

## Advertisement

The following articles are about a generic study of how we could bootstrap a
key-value database. I will not talk about SQLite and even less mongodb.

Instead, that article can be helpful (I hope so), if you're working on a *P2P*
project where you manage a kind of data-replication/streaming between several
nodes.

## Data structures

The database can be seen as a data structure. The classical storage of data is
a kind o hashmap or a relational key-value structure. Hashmap are optimized to
be fast and very safe to use. But doesn't respect the mandatory requirement of
a real-time streaming: _Ordering_.

### Hashmap

The function below will print the keys in the correct order. Because the
insertion will make a binary tree search before insertion, and doesn't hash the
keys before insertion. A hashmap would have generated a random _Hasher_ in the
execution, that can be considered as "sorted" because the iterator would give
the same key order, while we don't stop the program.

```rust
let mut map = HashMap::new();
map.insert("a", "hello");
map.insert("b", "hello");
map.insert("c", "hello");
map.insert("d", "hello");
for _ in 0..10 {
    for (key, _value) in map.clone() {
        print!("{key},"); // will print 10 times the keys in the same order
    }
    println!();
}
```

That said, when we generate and store the keys ourselves, and keep it in
another data store
the problem of ordering with the classical HashMap is solved. It is solved
because the order of the hashmap is now deterministic and the same for each
instances.

First, we need to bypass the Hasher implementation, and take the key as the
real hash. For a lot of efficiency reasons, the hashes have to respect some
specificities:

- Having the same type.
- Being Sized. (size known at compile time)

Now if you store the entries in a database, or, if you're in a P2P behavior, in
another node that keep the data consistency. Every running instance of our
program will have the same key ordering.

_Pro_: That situation is benefit, keys are _"prehashed"_ and keeps order
consistency. The classical maps operations are as fast as possible.

_Cons_: You should be careful with the hashing function, a little miss
is very difficult to find, and can have disastrous impacts on a bootstrap
algorithm.

### BTreeMap

In comparison to an HashMap, a BTreeMap:
- creates a kind of binary tree
- has cheap reallocation
- is ordered by key


```rust
fn main() {
    let mut map = std::collections::BTreeMap::new();
    map.insert("a", "hello");
    map.insert("b", "hello");
    map.insert("c", "hello");
    map.insert("d", "hello");
    for (key, _value) in map {
        println!("{key}");
    }
}
```

A BTreeMap will always give the same order, mainly because there is no Hasher.
Basically, a BTreeMap is a good compromise between an HashMap and a Binary
tree. It takes advantage of memory pages to be fast, but `get` and `insert`
are always a search in a tree.

_Pro_: We don't have to maintain a hash function.

_Cons_: This is a tree.

<b>[solutions &rarr;](/2022/05/02/b-bootstrap-a-database-in-real-time.html)</b>
