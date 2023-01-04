---
layout: default
title:  "The data compression (French)"
description: "
Ces derniers mois j'ai passé la plupart de mon temps libre à étudier plusieurs
algorithmes de compression. J'y ai passé tellement de temps que mon entourage à
commencé à surnommer ça \"la quête\".

Je vous partage un peu de mon enthousiasme en Français,
ma langue natale. Des réponses, mais surtout des questions,
sur l'ANS (FSE), sur des méthodes
arithmétiques et d'autres plus classiques.
"

authors: ["Adrien Zinger"]
scripts: "
<script type=\"text/x-mathjax-config\">
MathJax.Hub.Config({
  tex2jax: {
    inlineMath: [['$','$'], ['\\(','\\)']],
    processEscapes: true
  }
});
</script>
<script src=\"https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.0/MathJax.js?config=TeX-AMS-MML_HTMLorMML\" type=\"text/javascript\"></script>
"
comments_id: 11
published: false
---

# Ma quête vers la compression - TODO

<span style="color: #A0A0A0">[2023-01-04] \#FSE \#Algorithms \#Life \#Compression

---

## Preface - Life post

If you want to skip this introduction where I talk about my life, which I
understand very well, go directly to the section [Compression algorithms -
beginning of technique](#compression-algorithms---beginning-of-technique)!

I remember having an interview one day where I said I liked algorithms.
Everything went well, but at the end of the interview they told me:

> "That's strange, you say you like algorithms, but you're doing it this way?
> Everyone knows it can be solved in O(n) in two steps!"

I coded this part without questioning it too much. After all, it was going fast,
I didn't think that I would have to optimize that part. Does that mean I don't
like algorithms? Or simply that I'm exhausted? I was asking myself these
questions, especially at a time in my life when I was doubting my career a
little. It was really disheartening.

Like any computer scientist who has studied programming, I implemented the
classics: sorts, shortest paths, a memory allocator, alpha-beta pruning... and
so on.

But even knowing my classics, it would take me a little more than five minutes
to come up with a perfect A\* without resources. I don't practice every day, and
the world of computer science is too big to know everything, right? With
hindsight, I know today that this part of the interview was not decisive. I was
junior enough for it to be noticeable, even trying to talk well.

A good friend often tells me: "First, implement it in a naive way, then think
about it". And I find it quite fair. When we're interested in algorithms, we
often come across something without wanting to. If we're curious, we learn, we
realize our mistakes, we improve and our codes become better. But the most
important thing is to have fun and build something.

## Introduction

On January 18, 2022, I discovered the TV show "Silicon Valley". I highly
recommend it. After watching it, I became curious about data compression and
started looking into it.

I learned that there is no one "perfect" solution for data compression. Each
method has its own strengths and is suitable for certain problems. Performance
also depends on hardware capabilities. As our CPUs become faster, techniques
like arithmetic encoding become more practical.

One algorithm that caught my attention was "Finite State Entropy", which was
developed by Jarek Duda (or else he is mainly imply). However, I had a hard time
finding accessible information about it. It seemed to be reserved for students
who paid attention in their Master's program in computer science.

Instead, I decided to focus on something more approachable: Zstandard (zstd), a
compression algorithm developed by Facebook. Its code is well-written and easy
to understand, even for someone who is not an expert in C. It is also very fast
and efficient, making it a good choice for many practical applications. I
learned a lot about C language and the culture of computer science while
studying zstd. It can be demanding work, but it is necessary for progress.

## Zstd - Enrollment

I began by spending a lot of time on Facebook's zstd repository. I found out
that FSE is free to use and zstd is open source. It also has an implementation
by Yann Collet, a name to remember.

I often find it helpful to understand things by looking at the code. I was able
to pick up some important information that would be useful later.

About C:

Studying computer science with this language can be a great experience.
However, C has its drawbacks, such as low readability. FSE's code is excellent
and optimal from many perspectives. The current standard is to use
monomorphization in a library, which C doesn't support easily. Despite the
programmer's efforts to explain their code, genericity can be tricky in C. An
implementation in another language could only be beneficial.

Aside from the language, without knowing the purpose of FSE, functions like
normalization can be confusing. They contain technical choices and
optimizations based on mathematical evidence. While they certainly have
exceptional performance, they can be challenging.

In the end, if my goal was to understand FSE, it was not the best idea.
However, I did learn some things about C language and general computer science
knowledge. It can be discouraging work, it may seem to serve no purpose,
but it is essential for progress.

