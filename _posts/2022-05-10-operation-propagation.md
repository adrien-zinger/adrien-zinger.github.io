---
layout: default
title:  "Data propagation with unstructured P2P"
description: "
In a P2P network, the propagation of an information is a big deal, especially with an
open and unstructured network. Nevertheless, with the popularity of the blockchain and
decentralization, we have to also being resilient to attacks or to weak nodes connecting
and disconnecting... Here I show a little simple algorithm for that kind of propagation.
"

authors: ["Adrien Zinger"]
scripts: "
<script src=\"https://cdn.jsdelivr.net/npm/p5@1.4.1/lib/p5.js\"></script>
<script src=\"/assets/js/constants.js\"></script>
<script src=\"/assets/js/graphical.js\"></script>
<script src=\"/assets/js/node.js\"></script>
<script src=\"/assets/js/sketch.js\"></script>
"
comments_id: 6
---

## Data propagation with unstructured P2P

<div id="can" style="width:600px; height:400px;"></div>

Consider that you have a full P2P network with for any instant _T_ each node
are connected to perhaps 25% of the full network. Reducing the global bandwidth
of the network.

Also consider that the network is open and a new node can spawn in the network
connected to 25% of the network (in general it's a geographic zone). Any nodes
at the same instant _T_ is able to create a new data to be propagated to the
network.

That kind of network can be any P2P or node
configuration. We can imagine a multitude of cell-phone talking each others and
sending a notification. A client based + online video game that use a kind of
consensus, with a weak leader and weak node connections. Or a blockchain
network with poor connectivity between nodes.

Now the problem is, how to propagate the information through the network?

### Straightforward

The simplest tactic is sending the data that we received to every
neighbors once. And send the data that we produce to every neighbor once.

![workflow of a data propagation](/assets/img/graph_id_send_workflow.svg)

The _"algorithm"_ is very basic but works well with no surprise. But looking 
at the workflow of an information. We understand that a node will receive
the information from a kind of random amount of distant nodes. And more
the network grow up, more he will receive a lot of useless batches of data.

![hell of data propagation](/assets/img/horrible_id_wf.svg)

In the worst case the data is really taking a lot of place in our bandwidth
😨

### Solutions of accumulated evidences

The solution cut the transfers of the data in two part, the first discussion
between the nodes contains only a hash of the data. And then, the distant node
choose by itself if getting the full buffer or not.

Sending the full body with the information is taking time and bandwidth because
of the size of that one. In fact, the straightforward tactic of propagation is
good enough for small data, but not for a large buffer.

So nodes are receiving hash/ids of the data and increment locally the number of times
a nodes say _"Hi! I get that data by the way"_.

```js
// On receive a hash key, increment a counter in the `this.known`
// structure ('known' because we heard about that data)
insertOpKey(key) {
    // return if we already have the full data locally
    if (this.owned.findIndex(e => e == key) > - 1) return;

    const index = this.known.findIndex(e => e[0] === key);
    index === -1
        ? this.known.push([key, 0]) // create a counter
        : this.known[index][1]++; // increment the counter
    this.known.sort((a, b) => a[1] > b[1])
},
```

So, the last `sort` is very useful for the second and last part of the algorithm!
It gave me that strategical order.

The table `this.known` look's like that:
<div style="font-size:30px; line-height:auto;">
<span style="font-size:20px;">youngest data (or fake)</span> <<<<<<
<br/>
>>>>>> <span style="font-size:20px;">oldest data with a lot of replication (probably not a fake)</span>
</div>

Actually, more we heard about a data, more it will be easy to find it. But we could also ask to the latest
senders of the ids directly when we want to get the data!

```js
peek() {
    if (this.known.length === 0) return;

    const i = this.known.pop();
    // the following two lines must be replaced with a logic
    // that "find" the data in your real network. Here I just
    // simulate that :-)

    // if (this.owned.contains(i[0])) return;
    this.setStatus(i[0]);
    this.owned.push(i[0]);
},
```

---

### Thank's!

Thank you for reading! If you appreciate that little P2P introduction. You can
find the full code of the preview on my blog repository in the following paths:

```bash
.
├── assets
│   ├── js
│   │   ├── constants.js # some constants for the mocked network configuration
│   │   ├── graphical.js # Drawing tools
│   │   ├── node.js      # Nodes behaviors 
│   │   └── sketch.js    # p5js configuration and main loop
```
