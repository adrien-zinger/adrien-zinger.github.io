---
layout: default
permalink: /
---

## Cappuccino ☕

I present myself, I'm a computer scientist, I love discover any technology about informatic.
And sometimes, I have questions. Instead of keeping my reflexion, I just learn and test my
knowledge.

The purpose of that blog, broadcast my reflexions, projects and other feedbacks.

Many of posts are based on *Rust* or *C/C++* code.

Cappuccino is the result of a collaboration between several friends that are very good engeneers.
Look at the github page [cppccn](https://github.com/cppccn).

## Posts

{% for post in site.posts %}
* [{{ post.title }}]({{ post.url }})
<br/>
{{ post.description }}
<br/>
<br/>
{% endfor %}
