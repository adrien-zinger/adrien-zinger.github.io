---
layout: default
title: "Fiche mémo: parsing, if pattern"
description: "Lors de la conception d'une grammaire, la présence de certaines structures syntaxiques peut entraîner des ambiguïtés. Une grammaire ayant plusieurs arbres de dérivation possibles pour une même phrase est une grammaire dite ambiguë, ce qui peut compliquer l'analyse et la compréhension du langage en question
"

authors: ["Adrien Zinger"]
scripts: ""
comments_id: 13
published: true
---

<h1 class="web">Fiche mémo: parsing, <em>if pattern</em></h1>

<span class="web" style="color: #A0A0A0">[2023-02-24] \#Parsing \#State_machine \#Code
</span>

<div class="print">
    <h1 style="text-align: center;">Fiche mémo: parsing, <em>if pattern</em></h1>
    <div style="text-align: center;">Adrien Zinger, février 2023, maybeuninit.com</div>
</div>

Lors de la conception d'une grammaire, la présence de certaines structures syntaxiques peut entraîner des ambiguïtés. Une grammaire ayant plusieurs arbres de dérivation possibles pour une même phrase est une grammaire dite *"ambiguë"*, ce qui peut compliquer l'analyse et la compréhension du langage en question. Prenons l'exemple du pattern *if*, qui branche vers un état ou un autre selon le résultat d'une expression. 

```js
stmt : IF EXPR then stmt
     | IF EXPR then stmt IF stmt
     | STMT ;
```

`if E1 then if E2 then S1 else S2`

On ne peut pas déterminer avec la grammaire ci-dessus si la phrase sera traduite en un arbre tel que `(if E1 then (if E2 then S1) else S2)` ou `(if E1 then (if E2 then S1 else S2))`. Deux arbres de dérivation pour la même phrase. Afin de résoudre l'ambiguïté causée par la présence d'un pattern tel que celui-ci, nous pouvons remplacer la partie grammaticale par une structure syntaxique équivalente, mais qui ne pose pas de difficulté pour l'analyse syntaxique.

```js
stmt :      matched | unmatched ;
matched :   IF EXPR then matched ELSE matched | STMT ;
unmatched : IF EXPR then matched
          | IF EXPR then matched ELSE unmatched ;
```


La factorisation à gauche représente toujours un défi lorsqu'on conçoit un générateur de parseurs pour une grammaire. Dans le cas présent, cette difficulté est exacerbée par la possibilité que le token IF puisse être le premier symbole de plusieurs états générés, du fait, des conflits peuvent survenir entre les règles de production *unmatched* et *matched*. Si l'on décide de raisonner dès la lecture du *IF*, ces conflits peuvent apparaître, compromettant ainsi l'efficacité et la fiabilité de la grammaire. Dans de tels cas, un générateur de parseurs pourrait prendre une décision arbitraire pour résoudre le conflit, entraînant ainsi une possible altération de la grammaire désirée.

```js
matched :   IF /* { printf("pop\n"); } */ EXPR THEN matched ELSE matched
          | STMT ;
unmatched : IF /* { printf("pop\n"); } */ EXPR THEN matched
          | IF /* { printf("pop\n"); } */ EXPR THEN matched ELSE unmatched ;
```

Le pattern en question pose un problème majeur en ce sens qu'il nécessite la lecture complète du code pour pouvoir réduire le statement à sa racine, ce qui peut représenter un problème important lorsqu'on souhaite compiler le code en une seule passe. Pour pallier cette difficulté, certains langages optent pour des patterns plus contraignants. Par exemple, en Rust, les statements doivent obligatoirement être entourés d'accolades. En Nix, toute condition doit retourner une valeur car la résolution de type requiert la spécification de chaque alternative, ce qui permet de supprimer la règle de production *unmatched*.

```nix
x: T = if ... then T else T
```

En obligeant l'utilisateur à définir toutes les alternatives, il est possible d'inférer le type de l'expression *if*, entre autres. Cette inférence est généralement effectuée lors du preprocessing si le langage utilisé est compilé. Toutefois, certains outils de développement peuvent proposer de réaliser cette vérification pendant l'écriture du code.

Pour finir, analysons l'expression suivante avec un *parser combinator*. Cette méthode, ne construisant pas de machine à état à proprement dit, devra résoudre les conflits à l'exécution. Pour ce faire, il convient d'adapter préalablement la grammaire pour qu'elle corresponde autant que possible à un parseur de ce type.

```js
stmt :              matched_eof | unmatched_eof ;

matched_eof :       matched EOF ;
unmatched_eof :     unmatched EOF ;

matched :           token_if EXPR token_then matched token_else matched
                  | STMT ;
unmatched :         token_if EXPR token_then matched
                  | token_if EXPR token_then matched token_else unmatched ;

token_if :          IF spaces ;
token_then :        spaces THEN spaces ;
token_else :        spaces THEN spaces ;

spaces :            at_least_one(SPACE) ;
```

Dans le cas d'une analyse avec un *parser combinator*, il faut garder à l'esprit qu'une alternative comme celle-ci: `stmt : matched_eof | unmatched_eof`, peut être *complètement* lue. C'est-à-dire que le premier élément `matched_eof` va tenter d'être lu en premier, puis s'il y a eu une erreur, `unmatched_eof` sera lu également. L'analyse se découpe donc en plusieurs branches d'un potentiel arbre de dérivation jusqu'à en trouver une valide. Contrairement à un parseur GLR, les deux branches ne sont pas analysées simultanément. La première règle de dérivation qui fonctionne sera la bonne. Cette particularité implique que l'ordre des branches alternatives est important, dans un cas comme celui-ci, il aura une incidence sur les performances de l'analyse. La dernière figure montre respectivement l'output avec `matched_eof | unmatched_eof` et `unmatched_eof | matched_eof`.

```js
ext matched done
ext matched done
bounded stmt matched done

ext matched done
ext unmatched done
error bounded stmt unmatched
ext matched done
ext matched done
bounded stmt matched done
```