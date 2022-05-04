---
layout: default
title:  "Bootstrap a database in real time"
description: "
Studying some theoretical bootstrap methods in a <i>P2P</i> network.
My feedback about the two previous solutions (Polling vs Webhook) 4/4 <br/>
<a href='./2022/05/02/d-bootstrap-a-database-in-real-time.html'>continue to read</a>"

authors: ["Adrien Zinger"]
comments_id: 4
---

## About the two solutions
In an unstructured P2P network, we can find a lot of
topological issues. I'm not qualified to guaranty that there is no corner cases
for the both solutions.

In production, a strong verification of the data consistency, with
a continuous checksum computation, for example, would be very smart. For example,
you can register all modification on time and compute the BTreeMap checksum
continuously, remembering the previous checksum.

```py
    # SharedDB parameter `checksum`, initially 0u32
    checksum = 0

    # Example if we received some updates
    for modif in modifs:
        key, val = data.get(modif.key) # get previous key/val if exist
        checksum = checksum ^ hash(key, val)) ^ hash(modif.key, modif.val))
```


The bandwidth and the limitations that the polling include in his solution make
me think that after some fixes it would look like a stack of patches. But can
be enough in a small point-to-point or a simple structured network.

## Contribute
You can contribute to the different projects we have just seen by posting issues and
PR. Any question is welcomes and will
help to increase the quality of the post.

Do not fall into the trap that consist of multiplying the optimizations. For
that case, a comment is better than a PR.

Any PR should focus on simplicity for the example study. Don't include flavours
like error management, memory optimization, etc. Instead, you would rather
change the data structures, namings, code organization, rectify the algorithm if
you found a mistake, add documentation, test cases, resolve _todo comments_.

Look first if your comment is off the subject, but post it anyway with the
mention "Off the subject". It can be treated in another article in the future
;-)

<b>[&larr; polling](/2022/05/02/c-bootstrap-a-database-in-real-time.html)</b>
