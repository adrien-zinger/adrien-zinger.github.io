---
layout: default
title:  "Bootstrap a database in real time"
description: "
Studying some theorical bootstrap methods in a <i>P2P</i> network.
Use a webhook strategy with a <i>BTreeMap</i> 2/4<br/>
<a href='./2022/05/02/b-bootstrap-a-database-in-real-time.html'>continue to read</a>"

authors: ["Adrien Zinger"]
---

## Webhooks solution

### Some words about webhooks
In a P2P network, making webhooks is a classical solution to keep clients informed
from what is happening on our node. This is
written and explained in many books like
[Designing Web APIs](https://www.amazon.it/Designing-Web-APIs-Building-Developers/dp/1492026921),
and often the best solution in a real time context like live bootstrapping.

### Solution
Returning to our initial problem, whatever solution you choose, ordering is the
main deal. Once you have a deterministic order, you can stream in every
contexts.

A casual example of a bootstrap streaming of two instances. Imagine you have
two programs that keep a kind of cache consistency security. If one instance
crash, you always have the second one that store in his instance a cash of the
data.

Start with a server that give the following endpoints:
- size: return the size of the database
- bootstrap: register to the remote node that we need to bootstrap.
             take my entry point, a starting index, and an end index
- insert: Take an Update(key, value) or a Delete(key) entry

Before reading that, you should be aware of [hyper](https://hyper.rs) and his
simple server syntax. I decide that solution because it's fast to implements
and easy to read.

```rust
(&Method::POST, "/bootstrap") => {
    // ask to be registered as a bootstraper,
    // - addr: entry point (ex http://127.0.0.1:3031/insert)
    // - begin: index of the first entry in the database we want
    // - end: index of the last entry in the database we want
    let (addr, begin, end) =
        deserialize::<(String, usize, usize)>(&to_bytes(req.into_body()).await);
    // add a subscriber into the db and start the bootstrap loop if not
    // already done.
    spawn_bootstapper_sender(addr, begin, end, db.clone()).await;
    Ok(Response::new(Body::default()))
}
(&Method::GET, "/size") => Ok(Response::new(Body::from(format!("{}", db.len().await)))),
```

The bootstrap route is the start of a bootstrapping strategy, it will activate
the webhook for our node and start to stream in real time the database.

The loop that will send a stream is limited with a _Period_, a constant used in
the code to limit the bandwidth and also the usage of the database, shared
between multiple threads, for our example. The loop will be launched just once
and will run since the end of the program life.

```rust
/// Add a subscriber to my db that will stream it in real time and start the
/// _"bootstrap thread"_ if not already done
pub async fn spawn_bootstapper_sender(addr: String, begin: usize, end: usize, db: SharedDB) {
    db.add_subscriber(Subscriber::new(addr, begin, end)).await;

    static SPAWN_ONCE: std::sync::Once = std::sync::Once::new();
    SPAWN_ONCE.call_once(|| {
        tokio::spawn(async move {
            loop {
                let f = async {
                    db.send_chunks().await;
                    tokio::time::sleep(BOOTSTRAP_SEND_PERIOD).await;
                };
                tokio::select! {
                    _ = f => continue,
                    // cancel and return if ctrl-c
                    _ = tokio::signal::ctrl_c() => return
                };
            }
        });
    });
}
```

An attentive reader would have noticed that we could also stop the thread when
all subscribers would be _"stale"_. When nothing happen for a given arbitrary
amount of time, we could stop the thread and restart after a next
`spawn_bootstapper_sender` call. We will look how to do that in another
article.

The database implement `send_chunks` function. In that function, we simply want
to iterate through the subscribers and send a chunk for each one,
in the range they asked for. The chunk size is defined dynamically as the minimum
between what we still have to send to the remote node and the `MAX_CHUNK_SIZE`
limit.

```rust
    pub async fn send_chunks(&self) {
        let guard = &mut *self.0.lock().await;
        for subscriber in guard.subscribers.iter_mut() {
            if subscriber.index == subscriber.end {
                continue;
            }
            let chunk_size = min(MAX_CHUNK_SIZE, subscriber.end - subscriber.index);
            let modifs = take_chunk(&guard.data, subscriber.index, chunk_size);
            forward_all(&subscriber.addr, &modifs).await;
            subscriber.index += chunk_size;
        }
    }
```

If you visit the repository, you can also find some ways to improve the
implementation.

- remove the oldest subscribers, maybe an auto remove if stale. [Staling chapter](###Staling)
- limit the number of subscriptions
- put all forward_all in an `UnorderedFutures` list to profit of concurrency.

> That could be a great improvement if someone wanted to implement that ;-)


To finish presenting the solution, I have to introduce you to the _"/insert"_
route. As I said before, the insertion take an `Delete` or an `Update`. The
insertions are managed as an update, so all the `CRUD` (excepted for the
_Read_) are managed.

```rust
(&Method::POST, "/insert") => {
    // update or remove an element from my database
    let modifs = deserialize::<Vec<EntryModif>>(&to_bytes(req.into_body()).await);
    for modif in modifs.iter() {
        match modif {
            EntryModif::Delete(key) => db.remove(key).await,
            EntryModif::Update((key, value)) => db.update(key, value).await,
        };
    }
    Ok(Response::new(Body::default()))
}
```

The remove and the update are basically the same, just, one call a remove on
our database and another call an insert. Each one will look at our subscribers
that are streaming the db in the particular chunk of the map.
**That is why we're very interested about memory ordering deterministic**. We
can say if we already sent the value, thanks to the index, and resend it if we
want the remote streamer to be up-to-date.

```rust
// inform the bootstrapers of an update
let pos = guard.data.iter().position(|(k, _)| *k == *key).unwrap();
for subscriber in guard.subscribers.iter() {
    let end = match subscriber.eof {
        true => guard.data.len(),
        false => subscriber.end,
    };
    if pos >= subscriber.begin && end >= pos && pos <= subscriber.index {
        forward_all(
            &subscriber.addr,
            &vec![EntryModif::Update((key.clone(), value.to_string()))],
        )
        .await;
    }
}
```

The end value can be linked to the end of the database, when subscribing to the DB,
if the `end` is the same as `data.len()`, we will always use the full length to
keep consistency at the right part of the memory that can overflow the index
of `end` for the last chunks.

Finally, the subscription part! There are two possible implementation. One is
to bootstrap from one node only (the current example). The other split the
bootstrap between multiple database that theoretically are synchronized copies.

```rust
pub async fn _subscribe_to_one(to_addr: String, my_addr: String) {
    let client = Client::new();
    let size = size_request(&client, &to_addr).await;
    // 0: begin, size: end
    subscribe_request(&client, &to_addr, &my_addr, 0, size).await;
}
pub async fn _subscribe_multiple(to_addr: &[String], my_addr: String) {
    assert!(!to_addr.is_empty());
    let client = Client::new();
    let size = size_request(&client, &to_addr[0]).await;
    let c = size / to_addr.len();
    let mut i = 0;
    for t in to_addr {
        subscribe_request(&client, t, &my_addr, i, i + c).await;
        i += c;
    }
    if i < size {
        subscribe_request(&client, &to_addr[0], &my_addr, i, size).await;
    }
}
```

The multiple subscription simply share his request between multiple nodes
offering the bootstrap route. Instead, the "mono-subscription" ask only to one
node. Both are working, but both need a possible "retry" management in case
the remote nodes crashed.

### Staling

In the previous part, we saw how a subscriber link to the DB, but we
didn't define when a DB can dismiss one of these.

One strategy, adapted to a blockchain, would be to give a heartbeat timeout to
the subscriber. Each new information sent by our local node to a DB keep alive
the subscriber. Since his heartbeat is alright, we continue to send him new
information, and then we can remove him from the subscriber's list.

But here, we have to insert a heartbeat strategy that can take some heavy
lines of code.

Another strategy, is to stop to inform a subscriber when he start to be
informed by another node!

In other words, when the bootstrap is about to finish, the subscriber can
connect itself to the main network, or the main feeder. He can absolutely be
informed from multiple sources.

If the _"/insert"_ can return a `True` or `False` value, respectively, he
accept the new insertion, or he's already aware of the modification. The node
that help the bootstrap know that the subscriber has joined the network, and
can be notified as _Stale_ when the _index_ reach the _end_.

_Bootstrap phase_:
![bootstrap phase](/assets/img/befor_stale.svg)

_Stale phase_:
![staling phase](/assets/img/become_stale.svg)

In conclusion, both methods are possible depending on the topology and the
nature of the database you're sharing. The heartbeat, even if it seems
difficult to maintain, is more flexible and avoid desynchronization problems
in some cases. The stale detection, is more precise but can lead to hard
consistency bugs and has to be tested strongly before being in production.

> The two strategies are welcome in the
> [github repository](https://github.com/adrien-zinger/bootstrap_webhook_sample),
> as well we could judge wich one is more maintanable.

### Tests

You can look to the full code in this
[github repository](https://github.com/adrien-zinger/bootstrap_webhook_sample).
Some test cases are described in the README. Basically, we initialize one or two DB with
randoms data. Then with the help of a python script like just below, we run in
parallel, some bootstrapping nodes. After a while, we stop the python script
and we check if values are the same for each instance of linked DB.

```py
# Ex: python insert.py & cargo run -- 3001 3000
# random insertion in the database for perhaps 5 seconds
for _ in range(0, 100):
    key = random.randint(0,100)
    value = random.randint(0,999)
    requests.post('http://127.0.0.1:3000/insert', json=[{'Update': [f'{key}', f'{value}']}])
    time.sleep(0.02)
```

<b>[&larr; data structures](/2022/05/02/a-bootstrap-a-database-in-real-time.html)</b>&emsp;&emsp;<b style="margin-left: 30px">[polling &rarr;](/2022/05/02/c-bootstrap-a-database-in-real-time.html)</b>
