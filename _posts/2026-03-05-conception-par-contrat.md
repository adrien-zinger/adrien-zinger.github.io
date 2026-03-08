---
layout: default
title: "Conception par Contrat, Juste un rapide coup d'œil"
description: "Dans cet article, je décortique un papier qui parle de la conception par contrat. Un paradigme qui vaut le coup de connaitre."

authors: ["Adrien Zinger"]
scripts: ""
comments_id: 14
published: true
---

<h1 class="web">Conception par Contrat, Juste un rapide coup d'œil</h1>

<div class="print">
    <h1 style="text-align: center;">Conception par Contrat, Juste un rapide coup d'œil</h1>
    <div style="text-align: center;">Adrien Zinger, mars 2026, maybeuninit.com</div>
</div>


# Conception par Contrat

Dans cet article, je décortique un relativement vieux papier de Robby FINDLER
et de M FELLEISEN.

Article libre, sauf si j'oublie, je mettrai un lien à la fin. Je dis
relativement vieux, parce qu'en fait, il date juste de 2002. Simplement, dans
ses exemples, il se réfère à DrScheme qui a depuis un moment passé le relais, il me semble.

Donc on va voir ici avec Racket, un nouveau DrScheme, ce que ça donne les
contrats dans un langage, c'est quoi, à quoi ça sert et surtout : qu'est-ce que
ça veut résoudre comme problème.

## Définition d'un contrat

Un contrat s'applique à une fonction et défini ce qui doit
être respecté par l'appelant et par la fonction. Les paramêtres
et la valeur de retour sont contraint de respecter les rêgles
du contrat.

Ci-dessous la première phrase de Wikipédia:

*"La programmation par contrat (en anglais, design by contract ou DBC) est un*
*paradigme de programmation dans lequel le déroulement des traitements est*
*régi par des règles."*

Utiliser abondamment les contrats est donc un paradigme comme l'orienté objet,
le fonctionnel, etc. À noter que ce paradigme comme beaucoup d'autre est
compatible avec l'usage d'autre paradigme.

En C++, par exemple, faire de la programmation fonctionnelle n'empêche pas
de faire de la programmation orienté objet à côté. Au même titre qu'il
n'empêchera pas à l'avenir de faire de la programmation par contrat (C++26).

Le language, ou votre fçon de coder vous assure que les règles suivante sont
respéctées :

- Précondition (les paramètres)
- Postcontition (le truc à droite de `return`)
- Les invariants (ce qui est toujours vrai)
- Les variants (ce qui... change)

## En pratique

En pratique, un contrat fait que votre programme ne compile pas s'il vérifie
qu'une règle n'est pas respecté. Et s'il ne peut pas vérifier pendant la
compilation, au pire des cas, il fait "paniquer" le programme en donnant une
raison (la plus précise possible).

Alors voilà, c'est le moment où j'écris du Racket...


```rkt
(define/contract (add-positive x y)
  (-> positive? positive? positive?)
  (+ x y))
```

La fonction `add-positive` permet à son appelant d'ajouter deux nombres positifs
entre eux. Les grandes lois des mathématiques nous assurent que le résultat
sera positif, mais pour notre exemple, on va dire que le contrat vérifie lui
aussi que la valeur de retour est bien positive.

`define/contract` ici est le mot clef pour commencer une fonction avec un
contrat. Le contrat `-> positive? positive? positive?` s'applique sur la
fonction avec deux parametrès (x et y). Comme c'est un langage définissant les
opérations sur une pile, ça peut se lire ainsi :

*"On doit avoir x positif et y positif, on obtiendra alors un positif"*

Cet exemple est un peu simpliste, le but est de voir un peu ce que ça
implique. Par exemple, imaginons que je ne respecte pas le contrat d'emblée.


```rkt
(define result (add-positive -3 4))
```

Je m'attends à une erreur, un peu comme une erreur de type en fait. Et
effectivement :

```
add-positive: contract violation
  expected: positive?
  given: -3
  in: the 1st argument of
      (-> positive? positive? positive?)
  contract from: (function add-positive)
```

On peut également s'attendre à ce qu'une erreur similaire survienne pour la
valeur de retour. Dans l'exemple précédent, `positive?` est une fonction
pre-définie. Mais nous sommes libres d'en créer de nouvelles :

```rkt
;; math-utils.rkt
(define my-range? (lambda (x) (and (>= x 4) (<= x 8))))                                          
(define/contract (add-positive-return-my-range x y)                                              
  (-> positive? positive? my-range?)                                                             
  (+ x y)) 


;; main.rkt
(define result (add-positive-return-my-range 9 4))
```

Dans cet exemple, je déninis une fourchette de valeurs imaginaires (entre 4
et 8) et je définis une fonction `add-positive` qui vérifie que la valeur de
retour est bien dans cette fourchette.

Petit disclaimer: les erreurs que je montre ici sont relevées au *runtime*. En
tout cas en ce qui concerne racket. Donc, même si c'est intéressant, ça
n'empêche pas *vraiment* d'écrire du code bugué (à mon sens).

Ces deux petits exemples d'introdution nous permettent de définir plus
clairement deux concepts aux noms un peu bizarre : le *domain* et le *range*. Le
domain est en fait ce qui concerne les paramètres, tandis que le range ce
qui concerne la valeur de retour.

Dans la langue de Molière, domain donne *"dommaine de définition"* ou encore
*"ensemble de départ"* et range donne *"ensemble d'arrivée"*.

## Ce qui y ressemble

En soit, ce code en Racket pourrait correspondre à une fonction plus commune.

```rust
fn add_positive_return_my_range(x: i32, y: i32) -> Result<i32> {
  check_domain(x, y)?;
  let ret = x + y;
  check_range(ret)?;
  ret
}
```

On se rend tout de suite compte qu'avec un meilleur typage, on résoudrai
déjà une bonne partie des problèmes rien qu'à la compilation. En
remplaçant `x: i32, y: i32` par `x: u32, y: u32`, `check_domain` deviendrait
redondant. En fait, dans un programme correct (qui ne viole aucun contrat),
chacun de ces tests est redondant et pourrait être retiré sans affecter le
programme final.

D'après mon expérience, on peut programmer
avec un style "orienté par contrat" dans n'importe quel langage. Si c'est
plutôt difficile de s'y tenir avec un langage dynamiquement typé, c'est bien
plus simple avec un statiquement typé, ou graduellement.

Dans un langage graduellement typé comme Python, on trouve un certain type
d'assertion qui ressemble aux contrats. Lorsqu'on essaie d'ajouter une
chaine de caractère à un nombre par exemple. On retrouve ici une assertion
automatique de la VM python... La feature reste très
légère comparée aux capacités des contrats.

En C++ on retrouve une autre feature, les concepts. Même s'ils ne font pas
du tout la même chose, ça me donne l'idée qu'on peut jouer avec de la même
manière, en profitant du static dispatch. On ne peut pas vraiment vérifier
de logique metiers cependant. Mais avec un bon système de type, encore une
fois, on s'en sort...

```C++
template<typename T>
concept Addable = requires(T a, T b) {
    a + b;
};
```

En soit, on ne peut pas tester les invariants dans ces
langages autrement qu'en ajoutant un `assert(x >= 0 && y >= 0)`. En C++
comme en Rust, les features les plus avancés dans ce domaine se limite
aux types. Ce qui est déjà PAS MAL.

Un certain nombre d'outils se basant sur le typage permettent de dénicher
des erreurs de logique métier qu'on pourrait éviter (ou gérer) avec
des contrats. Je pense à l'analyse statique et à l'interprétation abstraite.
Cette dernière était mon idée principale de la résolution de type dans
eniem (mon langage nul).

```
let not0 = (x) { x != 0 }
let a = 15 as not0
```

## La gestion des erreurs

Lorsqu'un contrat est rompu, il faut bien blâmer quelqu'un. Dans une fonction
de premier ordre, et bien c'est facile. La faute revient clairement à
l'appelant si l'erreur est dans l'ensemble de départ. C'est moins clair
lorsque l'erreur est dans l'ensemble d'arrivée, mais généralement c'est la
faute de la fonction.

Dans un exemple précédent, le retour de la fonction
`add-positive-return-my-range` casse le contrat à cause de l'ensemble d'arrivée.
Cependant, c'est aussi la faute d'un manque de précision dans le contrat.

Dans l'exemple précédent, l'erreur fournie est la suivante :

```
add-positive-return-my-range: broke its own contract
  promised: my-range?
  produced: 13
  in: the range of
      (-> positive? positive? my-range?)
  contract from: 
      (function add-positive-return-my-range)
  blaming: (function add-positive-return-my-range)
   (assuming the contract is correct)
```

Racket blâme la fonction elle-même pour avoir rompu son propre contrat. Une
version plus correcte de cette fonction serait :

```rkt
(define/contract (better-add x y)

  (->i ([x positive?] [y positive?])
    #:pre (x y) (my-range? (+ x y))
    any)

  (+ x y))
```

Le résultat n'est pas tout à fait juste pour moi, car on continue de blâmer
la fonction elle-même. Néanmoins, on a un indice sur le fait que l'erreur
vient du domaine de définition. Donc de l'appelant.

```
better-add: contract violation
  #:pre condition violation; variables are:
      x: 9
      y: 4
  in: (->i
       ((x positive?) (y positive?))
       #:pre
       (x y)
       (my-range? (+ x y))
       any)
  contract from: (function better-add)
```

La question de savoir qui a eu tort lorsque le programme relève une erreur
peut m'aider à debuguer. Mais j'imagine un tas d'autre application métier, je
pense que c'est plutôt évident.

Avec des fonctions de plus haut degré, c'est plus compliqué.

## Error handling dans les fonctions de haut degré

Prenons un exemple commun.

Je vais m'éloigner un peu du sujet, mais je trouve que l'exemple qui va suivre
illustre plutôt bien le problème.

Voici un morceau de java:

```java
public Stream<Integer> some_mapping(Stream<Integer> stream) {
	return stream.map(i -> self.throwable_at_runtime(i))
}
```

Disons que dans un programme, on trouve une fonction qui peut relever une
exception. Mais l'exception peut arriver bien plus tard. Par exemple quand
`stream.collect(...)` est appelé. Comme je l'ai dit, savoir d'où vient
l'erreur aide à débuguer et ne peut avoir que des repercutions positives sur le
programme et son usage. Ici, quand l'erreur est relevée, on peine à connaitre le
responsable :

a. `some_mapping`
b. l'appelant de `some_mapping`
c. `throwable_at_runtime`
d. l'appelant de `collect`

Je rappelle que dans une situation réelle, `throwable_at_runtime` a un nom
beaucoup moins explicite. Par exemple `match` dans Matcher, `Integer.parseInt`,
`get` et `add` dans de nombreux contexts.

---

```rkt
(define saved (lambda (x) 50))
(define/contract (save f)
  (-> (-> bigger-than-zero? bigger-than-zero?) any)
  (set! saved f))

(define (use n)
  (-> bigger-than-zero? bigger-than-zero?)
  (saved n))

(save (lambda (x) (x)))
(displayln (format "Result: ~a" (use 5)))
```

Dans cet exemple, je définis `saved` avec une lambda qui n'a pas vraiment
d'importance. Puis je donne une fonction `save` qui prend en argument une
lambda qui doit respecter le contrat : *"prend un argument superieur à zéro
et retourne une valeur supérieur à zéro"*.

Ici, c'est impossible de savoir `saved` sera toujours appliqué à des nombres
positifs. Encore pire, on ne peut pas prédire que `saved` retournera bien
une valeur positive !

Le parallèle avec l'exemple java. Une `RuntimeException` incarne parfaitement
cette situation. C'est-à-dire que la fonction peut "fail", car on est dans
l'incapacité de prédire avec quel argument elle va être appelée. Ou bien,
on ne peut garantir que le type retourné est correct. Ou les deux.

`usePattern` relève une exception au runtime si le paramètre est null,
ou n'est pas une regex.

Quand on y réfléchit bien, `java.lang.IllegalArgumentException` étend
`RuntimeException`. Et justement, `gradle build` ne donne aucune alerte
quand il ne voit pas de `try/catch` autour d'une telle exception. C'est
le seul type d'exception qu'il veut bien voir dans des fonctions
de plus haut degré.

Il ne donne pas d'erreur avant d'effectivement appliquer effectivement
la méthode `usePattern`, comme Racket ne donne son erreur qu'à l'appel.

Si j'appelle `use` avec un mauvais argument, par exemple `-5`

```
save: broke its own contract
  promised: bigger-than-zero?
  produced: -5
  in: the 1st argument of
      the 1st argument of
      (->
       (-> bigger-than-zero? bigger-than-zero?)
       any)
  contract from: (function save)
  blaming: (function save)
   (assuming the contract is correct)
  at: ./src/delayed.rkt:9:18
  context...:
   <...>/blame.rkt:350:0: raise-blame-error
   <...>/arrow-higher-order.rkt:375:33
   ./main.rkt:19:0
   body of ./main.rkt
```

On dirait qu'on blâme save ici, non ? Qu'est-ce que vous en comprenez ?

Si maintenant j'appelle avec `5`, mais avant je set `saved` avec une lambda
qui revoit l'inverse :

```
save: contract violation
  expected: bigger-than-zero?
  given: -5
  in: the range of
      the 1st argument of
      (->
       (-> bigger-than-zero? bigger-than-zero?)
       any)
  contract from: (function save)
  blaming: ./src/delayed.rkt
   (assuming the contract is correct)
  at: ./src/delayed.rkt:9:18
  context...:
   <...>/blame.rkt:350:0: raise-blame-error
   <...>/arrow-higher-order.rkt:379:33
   ./main.rkt:19:0
   body of "./main.rkt"
```

Le moins qu'on puisse dire, c'est qu'on n'y comprend rien. Dans le deuxième cas,
effectivement, je m'attends à blâmer delayed (là où j'ai la définition de
`saved`).

Mais dans le premier cas, je m'attendais à ce qu'on blâme l'appel de `use`. Ou
bien que ça soit plus explicite (si c'est le cas).

---

Pour revenir sur l'exemple en java, après, j'en aurai terminé. Voilà l'erreur que j'ai :

```
Exception in thread "main" java.lang.RuntimeException
        at org.example.App.throwable_at_runtime(App.java:12)
        at org.example.App.lambda$some_mapping$0(App.java:16)
        at java.base/java.util.stream.ReferencePipeline$3$1.accept(ReferencePipeline.java:197)
        at java.base/java.util.Vector$VectorSpliterator.forEachRemaining(Vector.java:1464)
        at java.base/java.util.stream.AbstractPipeline.copyInto(AbstractPipeline.java:509)
        at java.base/java.util.stream.AbstractPipeline.wrapAndCopyInto(AbstractPipeline.java:499)
        at java.base/java.util.stream.ReduceOps$ReduceOp.evaluateSequential(ReduceOps.java:921)
        at java.base/java.util.stream.AbstractPipeline.evaluate(AbstractPipeline.java:234)
        at java.base/java.util.stream.ReferencePipeline.collect(ReferencePipeline.java:682)
        at org.example.App.main(App.java:24)
```

`throwable_at_runtime` est toujours la cause du problème. Peu importe la
raison. Donc le développeur doit spécifier si c'est un problème d'argument, un
problème extérieur ou qu'importe. De plus, le principe de la stack trace nous
empêche de raisonner avec la largesse qu'on souhaiterait. Par exemple un appel
à `saved` avec une lambda invalide serait invisible dans l'erreur. Il faudrai
développer tout le programme autour du mécanisme, ce qui n'est pas toujours
possible.


## Conclusion

Je vous laisse en conclure ce que vous voulez.


Ah oui, le lien : [ho contracts techreport](https://users.cs.northwestern.edu/~robby/pubs/papers/ho-contracts-techreport.pdf).
