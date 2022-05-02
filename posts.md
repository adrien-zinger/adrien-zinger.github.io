---
layout: default
permalink: /posts.html
---
 ☕

Many of posts are based on *Rust* or *C/C++* code.

## Posts

{% for post in site.posts %}
* [{{ post.title }}]({{ post.url }})
<br/>
{{ post.description }}
<br/>
<br/>
{% endfor %}
