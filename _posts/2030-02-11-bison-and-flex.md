---
layout: default
title:  "Bison and flex (French)"
description: ""

authors: ["Adrien Zinger"]
scripts: ""
comments_id: 13
published: false
---

# Bison et flex
<span style="color: #A0A0A0">[2023-02-11] \#Design_pattern \#State_machine \#Code

Cet article est pour grande partie une traduction
du copie manuel bison, dans lequel j'ai ajouter
et modifié quelques exemple et explication. L'ordre
d'apparition des chapitres, leur nom et leur organisation
est quelque peut refais celon ce que je trouvais plus
naturel. Quoi qu'il en soit, si un lecteur cherche
l'homologue français d'un paragraphe, il pourrait
toujours se refférer à l'index de rosette.

TODO index de rosette:

## Langage et grammaires `Context-free`

La description requière la représentation d'une grammaire.
Bison, peut générer des parseurs décrite par des
grammaires dites Context-free, c'est à dire un groupe
de rêgles parmis lequels on trouve des informations syntaxique,
i.e "un identifiant est composé de lettres minuscules suivit
de potentiellement un chiffre",
et comment les assembler en divers `expressions`,
i.e. "'let' identifiant '=' nombre".

Contrairement au langage naturel qu'on utilise tout les
jours, la plupart des langages informatique sont représentable
grace à ce genre de rêgles qu'on ecriera sous un format
qui s'appelle "Backus Naur Form". C'est à dire un regroupement
de description de divers expressions.

Tout ça pour ecrire une "grammaire", les rêgles d'un langage.
Et hors-context, ce qui veut dire que chaque rêgle est de la
forme X -> alpha. Grace à cette représentation, on est capable
de décrire sans ambiguité les rêgles de production d'un subset
de Javascript.

Exemple d'une grammaire représentant un sous ensemble de
Javascript.
```js
/**
 * Représentation BNF
 * expr:
 *     %empty
 *   | FUNCTION IDENTIFIANT '(' arguments ')' '{' expr '}'
 *   | appel expr
 *  
 * appel:
 *    IDENTIFIANT parametres '(' arguments ')' ';'
 *  
 * arguments:
 *     %empty
 *   | list_arguments
 *  
 * list_arguments:
 *     IDENTIFIANT
 *   | IDENTIFIANT ',' list_arguments
 *  
 * parametres:
 *     %empty
 *   | '.' IDENTIFIANT parametres
 */
function main(args) {
    console.log(args);
}
```

Il y a differente grammaires hors-contexte, les grammaires les plus
utilisée sont les LL, LR(n) et LALR(n) IELR(n). Bison se concentre
principalement sur des parseurs LALR(1) et produits des parseurs
deterministes. Ce qui
signifie qu'à partir d'un état courant, la lecture d'une seule
nouvelle portion finis du langage permet de connaitre le prochain état.
Par contre, une grammaire hors-contexte peut tout à fait être
ambigue, cela rend la tache complexe pour Bison. Il faut que Bison
choisisse arbitrairement comment résoudre ces ambiguitées. Il nous
propose également certains mots clefs qui nous donnerons la mains
sur leurs résolutions.

Une grammaire non ambigue peut aussi être
non deterministe si on se limite à une portion
finie du langage. Il sagit de grammaires LR(n)
où n est supérieur à 1. Pour résoudre ce genre
d'ambiguité, bison propose de lancer un parseur
LR "généralisé" (GLR). Un exemple d'utilisation
de cette methode sera exposé.

La figure 1 montre comment on peut écrire un sous ensemble
du langage Javascript. La grammaire BNF décrite contient
des expressions: expr, appel, arguments, list_arguments et
parametres. Elle contient des symboles terminaux, en
opposition au expressions qui sont "non terminaux":
FUNCTION, IDENTIFIANT, '(', ')', '{', '}', ';', '.'. Ces symboles
termnaux sont parfois appelé des groupe syntactique,
FUNCTION est une suite de lettre formant le mot "function",
IDENTIFIANT est un groupe d'au moins une lettre minuscule
ou majuscule ou un underscore et peut contenir un chiffre
a partir de la deuxième lettre.
Petite précision, les rêgles appelés aussi symboles
non terminaux peuvent tout à fait être récursifs, ou
encore être vide.

D'après le même exemple, "console.log(args);" est une
expression valide, comme "args", "foo()" ou "". Etre valide
ne signifie pas que le programme fonctionnera pour autant.
La liste de ces symboles permet de savoir comment lire et comment
générer un programme valide.

## Quelque termes importants

Pendant la lecture d'une grammaire et son parcours, certains
termes sont indispenssable à la compréhenssion de ce que va
faire un parseur. Egalement indispenssable pour comprendre
les problématiques d'un générateur de parseurs. Et aussi
modestement problématique pour comprendre ce que je vais
expliquer.

Shift et reduce, leur traduction dans la langue de molière
décaler et réduire. Prenons pour exemple cette grammaire
rudimentaire:

TODO dessins de grammaire