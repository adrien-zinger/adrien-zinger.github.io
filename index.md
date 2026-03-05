---
layout: default
permalink: /
---
 ☕

Ce blog contient des articles qui m'aident principalement à étudier des choses. En gros,
chaque article est le résultat de notes que je prends. Qu'ils soient très long ou non, ils
ne contiennent qu'une compilation de notes, de références, de réflexions, de vulgarisation.

En espérant que ça puisse être aussi utile à quelqu'un qu'à moi, bonne lécture.

Voici mon profile github: <a href="https://github.com/adrien-zinger">github</a>.

## Posts

{% for post in site.posts %}
* [{{ post.title }}]({{ post.url }}) <span style="color: grey">{{ post.date | date_to_long_string: "ordinal" }}</span>
<br/>
{{ post.description }}
<br/>
<br/>
{% endfor %}
