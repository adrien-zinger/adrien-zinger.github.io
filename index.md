---
layout: default
permalink: /
---
 ☕

If you like my work, you can follow me on <a href="https://github.com/adrien-zinger">github</a> and watch releases of
<a href="https://github.com/adrien-zinger/adrien-zinger.github.io">that repository</a> to follow the next articles.

## Posts

{% for post in site.posts %}
* [{{ post.title }}]({{ post.url }}) <span style="color: grey">{{ post.date | date_to_long_string: "ordinal" }}</span>
<br/>
{{ post.description }}
<br/>
<br/>
{% endfor %}
