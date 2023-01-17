---
layout: default
title: "State machine and async queue (French)"
description: ""

authors: ["Adrien Zinger"]
scripts: ""
comments_id: 12
published: true
---

<span style="color: #A0A0A0">[2022-12-01] \#Design_pattern \#State_machine \#Code

## Introduction

Cet article est un patchwork de problèmes qui me sont venus à l'esprit ces
derniers mois. La suite peut vous sembler être un puzzle sans solution que
j'essaie de construire. Malgré le fil conducteur, cet article ressemble
toujours un peu à un monstre de Frankenstein composé de plusieurs sujets.
J'espère que cet article aura un sens pour vous et vous inspirera comme il m'a
inspiré.

Le sujet principal de ce post présente une façon de représenter un programme
comme une machine à état. Cette méthode de représentation est vieille comme
l'informatique. Aujourd'hui, elle est mise en avant par des frameworks tels que
React et Redux. Il n'est pas nécessaire d'utiliser un framework pour qu'un
programme ressemble à une machine à état. Ce qui est décrit dans les prochains
chapitres explique comment identifier des éléments qui seraient clarifiés, si
les développeurs écrivaient des machines à états.

Si j'échoue à faire comprendre pour quelles raisons on peut souhaiter avoir un
programme tel quel, cet article pourrait être intéressant au moins pour les
sujets variés qu'il aborde. Il montre ce qu'on attend d'une machine à états et
les différentes techniques pour en produire. Vous y trouverez donc des
références à des générateurs tels que Bison, ou bien au framework React. Vous
aurez une petite introduction obligatoire aux différentes machines à états
qu'on trouve dans la nature.

Dans ce document, j'utiliserai le même langage que celui qu'on utilise pour
parler de parseurs. Pour être plus clair, je me représente une machine à état
comme un analyseur. Même si un analyseur est un sous-type de machine à état, le
langage est suffisant pour mon introduction. Je parlerai donc de grammaires, de
contextes, de conflits, etc.

Quelque exemple en C et en Rust accompagnerons mon propos. Le code complet est
disponible en annexe. Je vous recommande de ne pas trop vous y attarder, je
considère qu'il n'y a pas de réponse parfaite et encore moins une unique
implémentation.

Une grande partie sera consacrée à la file d'événements qui modifie une machine
à état. Cette file d'événement doit être traitée de façon séquentielle. Quand
les événements arrivent rapidement, je montre comment améliorer les
performances. Néanmoins, je ne dis pas qu'il est effectivement important de se
soucier à ce point des performances d'une machine à états. Les parties traitant
ce sujet offrent l'occasion de regarder de plus près des mécanismes utilisés
dans des programmes multithreadés. C'est plus intéressant qu'utile. Je ne peux
pas dire dans quel contexte ces mécanismes sont utilisés dans la vie. Mais ils
existent et sont utilisés, pour des raisons parfois arbitraires, à cause  de
croyances personnels, ou bien avec de bonnes raisons, avec des connaissances
poussées du sujet. Ou plus simplement, parce que le sous problème nécessite une
attention particulière. Il doit être le plus performant possible, donc on
essaie plusieurs méthodes.

J'aborde donc l'utilisation de structures de données non-bloquantes. Je parle
en particulier d'opérations atomiques. Je tiens à préciser que ce sujet est
bien plus complexe que ce qu'il laisse paraître. Changer une structure en une
autre structure non-bloquante peut avoir de gros impactes. Parfois, l'espace
mémoire que la structure prendra sera bien plus grande que l'original.
Autrement, il faudra faire des concessions sur les performances.

J'en profite pour vous prévenir, je suis conscient de maîtriser certaines
aspects et pas d'autres. Même si j'ai le sentiment d'être dans le vrai,
n'hésitez pas à me corriger si vous y voyez de grosse erreurs! Et il y en aura
probablement, même après une centaine de relectures.


## Pourquoi une machine à états ? 

> Ce que tu peux faire de mieux pour ton programme, c'est
> d'en faire une machine à états.

Dans un projet, on souhaite une machine à état
quand une partie du programme:

- gère un context global ou temporaire.
- subit des modifications lors d'appels exterieurs.
- réagis à différentes entrées et retourne un résultat
  cohérent avec ces entrées.

Plus généralement, lorsqu'une fonction donnent une sortie différente après
chaque appel. Suivant ces description, on remarque que les itérateurs et les
générateurs sont aussi des genres de machines à états.

Il y a différente façon d'aborder le problème. La façon scolaire, linéaire que
la plupart des raisonements humains vont produire. Cette façon de faire pourra
entre autre ressembler à un analyseur LL ou LR. L'implémentation peut être très
similaire. Souvent, ces deux méthodes divergent uniquement dans les structures
qu'elles utilisent.

En tout cas, on retrouvera la logique "si j'ai tel événement dans tel context,
je passe à tel état suivant". Au début de mes études je codais de nombreuses
fonctions qui s'appelaient les unes les autres. Elle étaient pleines de
conditions et ça marchait pas trop mal.

C'est un raisonement très linéaire, et efficace si on souhaite développer
rapidement un petit morceau de code. Mais ça devient vite ingérable dans une
application qui traversera beaucoup d'états. Idem, si le projet change de
grammaires, ou s'il s'avère que la grammaire commence à contenir des conflits.

Depuis longtemp, on élude ces problèmes en utilisant un générateur de parseurs
(analyseurs). Vous avez peut être déjà entendu parler de yacc et lex. Ce genre
de générateur existe dans de nombreux langages et sous de nombreuses formes. Il
me semble qu'aujourd'hui leur utilisation est moins répandue. Je trouve
personnellement que c'est la meilleur solution pour générer des machines à état
aujourd'hui. Se plonger dans une grammaire sous le format BNF, même si c'est
ennuyant, vous fera gagner une base de code propre et un temps considérable.

Toute méthode a ses avantages et ses inconvégnants. Dans certains cas, il sera
plus simple d'écrire rapidement un analyseur à la main ou en utilisant une
bibliothèque tièrce.

Depuis quelques temps, on développe des analyseurs par petits morceaux. Ces
combinations de parseurs ont des bon côtés. Déjà, on ne dépend pas d'un
générateur et dans le meilleur des cas, on ne dépend pas non plus d'une
bibliothèque. Le développement est linéaire: je parse, je change d'état. Les
états sont: des parseurs, des fonctions. Bien sûr, on retombe rapidement dans
de nombreuses fonctions pleines de conditions.

Ensuite il y a la manière React. Attendez, avec React on ne fait pas de
parseurs, on fait des apps ! Hé bien si, en faisant du React, on fait des
parseurs.

```js
// thread 1
...
let request = recv_async_call();
dispatch(request.state_2);
...

// thread 2
function state_machine() {
  let r = use_state(reducer_function, state_1);
  ...
}
```

Ici je parle de ces `hooks` en React qui permettent de recharger des composants
avec des valeurs mises à jour. Il y a `use_reducer`, qui est généralement moins
utilisées. Cette méthode permet de créer une fonction de mise à jour en donnant
pour paramettre une methode de _réduction_ avec cette signature:

`(current_state, action) => new_state`

Une fonction de réduction permet de créer un nouvel état à partir de l'état
courant associé à un évenement, donc une entrée dans le programme. Pouvoir
donner cette fonction en argument permet de de centraliser un comportement
complexe en fonction d'un context.

On trouve aussi `use_state`, qui se limite à prendre pour argument un état
initial. Cependant, il produit la même chose que son compagnon. A la différence
qu'il utilise sa propre fonction de réduction où l'action est le le nouvel
état.

Le fonctionnement de ma machine à états est alors décrite par des structures
génériques dans une queue et une fonction de transition si elle est définie. A
terme, ce modèle pourrait ressembler trait pour trait à des combinations de
parseurs.

```js
function onStateChange(state) {
  if (state.view == "view1") return view1();
  else if (state.view == "view2") return view2();
  else return view3();
}

// vs

function onStateChange(state) {
  return state.view();
}
```

## Usage d'une machine à état

Une machine à état est très flexible et s'adapte en fonction du besoin. En
effet, plus haut je vous disais qu'un itérateur, un générateur ou encore un
parseur son des types de machines à états. Parfois un simple appel à un timeout
peut cacher une machine à état, "en cours -> annulé", "ouvert -> fermé".

Mais parmis tous, le parseur est un cas particulier. Le parseur suppose une fin
à ces états. Que le programme soit écrit à l'aide d'un générateur ou avec la
méthode des combinations, on attend des états qu'ils se résolvent.

Une dernière méthode permettant de créer des machines à état, est celle de
React. Avec cette méthode, on peut écrire des itérateurs, des parseurs, toutes
les machines à états finies et infinies. C'est pour cette raison qu'elle est
extrèmement éfficace pour la gestion d'une application.

Faire avancer les états avec React se résume à empiler des évenements et les
traiter un par un. Pour pousser la démonstration, je vais écrire un petit
exemple en C.

## Développement de Reagir

Les morceaux de codes qui suivront sont des exemples d'utilisation d'une
bibliothèque créé pour l'article. Le sujet de l'expérience ici sera un
programme simpliste. Il implémente un echo volontairement complexe (à ne pas
refaire pas ça chez soit).

Voici le comportement attendu du programme:

1. la sortie standart affichera `waiting for an entry`.
2. `you wrote: ${entrée}` suivit de `Can you write something else?`.
3. `you wrote: ${entrée}` puis `Can you write something else? (${compteur})`.
4. répéter à partir de 3.

Le programme devra s'arrêter à la lecture du mot clef _"exit"_.

Je commence par créer une structure représentant un état, auquel est associé
une méthode liée dynamiquement appliquant une étape de ma machine à état.
Pendant la modification de l'état, le programme continue à agir tant que je lui
ai pas dit de se mettre à jour. Un peu comme avec la fonction de mise à jour
`setState` en React.

```c
void step_n(struct State *self)
{
    printf("you wrote: %s\n");
    printf("Can you write something else? (%i)\n",
        self->val, ++(self->count));
}

void step_2(struct State *self)
{
    printf("you wrote: %s\n");
    printf("Can you write something else?\n", self->val);
    self->step = step_n;
}

void step_1(struct State *self)
{
    printf("waiting for an entry\n");
    self->step = step_2;
}
```

Dans la figure précédente, plusieurs ligne modifie la valeur de l'état. Dans
mon cas, ces valeurs sont modifiées en prévision de _l'itération suivante_ de
mon programme. Autrement dit, je construit par dessus mon état actuel l'état
suivant.

A noté que dans certains cas, cette façon de faire peut poser problème.
Notemment si le programme accède à cette valeur via plusieurs thread. Parmis
les problèmes qu'on rencontre dans ce cas là, le fait de rendre l'état actuel
immutable devient capital. Pas de problèmes, ne touchez pas à l'état courant,
construisez en un nouveau et entourez le de mutex.

J'ai évoqué plus haut le terme d'itération. En quelques mots, le coeur de mon
programme est une boucle infinie, qui à chaque nouvel mise à jour de mon état,
executera la même fonction. Le coeur ne change pas, l'état change.

```c
int state_machine()
{
    struct Reaction *re = use_state(make_init_state);
    struct State *st = re->state;
    // Vérifie si la dernière entrée est *exit*
    if (st->before(st) == 1)
    {
        void *_;
        pthread_join(st->scan, _);
        return EXIT_SM;
    }
    st->step(st);
    // Attend dans un autre thread une entrée
    async_scan(re);
    return CONTINUE_SM;
}
```

Voici comment une machine à état infinie peut fonctionner. L'absurde complexité
du mini projet montre comment on peut se défaire d'une série de conditions et
d'intrications de monades. Par exemple, l'optimisation de la fonction before
qui en premier lieu retourne forcément 0. N'ayant aucune entrée à lire, celà
montre bien comment éviter des tests inutiles, dans un projet plus important.

# File d'états, file d'actions

Je n'ai pas encore parlé d'une partie importante de l'exemple précédent. La
lecture de l'entrée utilisateur. C'est à cet endroit que j'appelle la méthode
`dispatch` associée à ma machine à état.

Cette méthode ajoute dans une file un nouvel objet, qui selon la configuration,
appelera une fonction de réduction, ou mettra à jour l'état actuel. La
configuration ce faisant si l'on créer l'état grâce à `use_state` ou
`use_reducer`, exactement comme en React !

```c
void *scan(void *_re)
{
    struct Reaction *re = (struct Reaction *)_re;
    struct State *new_state = malloc(sizeof(struct State));
    memcpy(new_state, re->state, sizeof(struct State));
    int _ = scanf("%299s", new_state->val);
    dispatch(re, new_state);
}
```

Je vous ai prévenu, ce modèle de machine à états enfile des objets afin de les
traiter de façon synchrones. Mais rien n'empêche l'accumulation des événements
d'être asynchrone ou parrallèle. Alors on peut se poser quelques questions sur
la résistance du modèle face au parrallèlisme.

Ici, j'ai de la chance pour plusieurs raison. La première, _scanf_ en C a une
implémentation telle que même si plusieurs thread écoutaient en même temps,
seulement un d'entre eux pourrait réagir à une entrée. Je reviendrai sur la
seconde raison plus tard. Pour l'instant immaginons que le programme écoute
plusieurs entrées différentes, des appels réseau ou des notifications de l'OS.
L'enfilement et le défilement peuvent être concurents et poser problème. Mais
c'est sans compter sur la connaissance des patrons de producteurs -
consommateurs.

Depuis même avant ma naissance, on sait gérer les notifications concurente sur
plusieurs threads grâce à ce genre de solutions. Et depuis les anneés 90, il y
a eu de nombreuses implémentations et approches différente. Celle qui est
implémentée dans ma bibliothèque n'est pas la plus efficace. Par contre, elle
est facile à comprendre.

```c
static void send_state(struct Entry e)
{
    struct Reagir *re = e.rea->re;                       // S1
    pthread_mutex_lock(&re->mutex);                      // S2
    while (re->queue_len == QUEUE_MAX_LEN)               // S3
        pthread_cond_wait(&re->pop_condvar, &re->mutex); // S4
    re->queue[re->push_ptr] = e;                         // S5
    re->push_ptr = (re->push_ptr + 1) % QUEUE_MAX_LEN;   // S6
    re->queue_len++;                                     // S7
    pthread_cond_signal(&re->push_condvar);              // S8
    pthread_mutex_unlock(&re->mutex);                    // S9
}

static struct Entry receive_state(struct Reagir *re)
{
    pthread_mutex_lock(&re->mutex);                      // R1
    while (re->queue_len == 0)                           // R2
        pthread_cond_wait(&re->push_condvar, &re->mutex);// R3
    struct Entry e = re->queue[re->pop_ptr];             // R4
    re->pop_ptr = (re->pop_ptr + 1) % QUEUE_MAX_LEN;     // R5
    re->queue_len--;                                     // R6
    pthread_cond_signal(&re->pop_condvar);               // R7
    pthread_mutex_unlock(&re->mutex);                    // R8
    return e;
}

void dispatch(struct Reaction *rea, void *arg)
{
    struct Entry e = {(struct PrivReaction *)rea, arg};
    send_state(e);
}
```

Un appel à `dispatch` créé une nouvelle entrée. Cette fois-ci, l'entrée est
une information qui serait traitée par la bibliothèque afin de passer d'un état
à un autre. Tant que la bibliothèque peut faire défiler ces entrées, on avance
dans la machine à états. On ne s'attend pas spécialement à un état final,
simplement à continuer d'avancer. La fonction `dispatch` prend en argument la
structure `Reaction` qui représente la machine à état qu'on souhaite altérer
ainsi qu'un argument. Ce `arg` est l'argument de la fonction de réduction. Il
peut être un nouvel état, si on a utilisé `use_state`, ou une action, si on a
utilisé `use_reducer`. En fin de compte, la file contient des
fonctions de réduction qui seront appelées séquenciellement.


Prenons un peu le temps de lire l'algorithme de la figure précédente. On
remarque que ce code contient plusieurs locks. Un lock coûte du temps au
processeur. En tout cas c'est ce que j'ai appris. D'ici quelques années,
j'aurai peut être tort de dire ça, mais si possible, aujourd'hui il est
préférable d'éviter d'invoquer un lock du procésseur.

Cette implémentation est peut être suffisante pour mon exemple ? Je n'ai pas
besoin de code particulièrement rapide. Mais je peux encore aller plus loin. Je
pourrais par exemple retirer complètement les locks.

L'utilisation que je fais de ma machine à état dans mon exemple _est synchrone_ !
Même si j'utilise deux threads différents. Je ne lis pas d'entrée utilisateur
pendant l'execution de la boucle de la machine à états, ou même avant. A aucun
moment, je peux envoyer un évennement ET en recevoir simultanement. Les lignes
S2, S9 R1 et R8 sont donc inutiles dans mon cas.

Même si mon programme communiquait avec d'autres, s'assuré d'un ping pong où
chaque instance attend la réponse de l'autre peut être résolu sans aucun appel
de `lock/unlock`, autre que par l'invocation de `wait`. Tant qu'on peut
considérer que l'ensemble du système fonctionne sur un unique thread en
aditionnant les executions concurrentes, on peut se passer des vérous. 

Attention, le fait d'avoir une utilisation synchrone de cette file est l'unique
justification valable pour retirer les vérous. Des appels parrallèles auraient
des résultats imprévisibles ! Par mesure de sécurité, il faut toujours entourer
les variables conditionnelles par des vérous. Prenez ça comme une rêgle d'or.

Dans notre cas, on retire quelques utilisations de mutex et ça marche.
Cependant, si on souhaite quelque chose de plus puissant qui nous autorise
toujours des lectures et écritures parrallèles, il faut se tourner vers des
structures plus efficaces. Dans un contexte où on receverait beaucoup
d'évenements, une structure de données non bloquante pourrait être intéressante.
Il y a un grand nombre d'implémentation possible, à commencer par utiliser deux
mutex différents pour la tête de file et le bout de file. Les producteurs se
partageraient un mutex et le consommateur sera plus rapide pour lire, aillant
le monopole sur le defilement.

Plus rapide encore, une version de la file de Mickael-Scott propose une
solution n'utilisant aucun mutex. L'algorithme tire avantage des fonctions
atomiques du processeur. En d'autre termes, la lecture ou l'écriture d'une
variable sera organisé parmis les différents threads dans un ordre spécifié.

## Rapide rappel atomique

Une opération atomique, c'est lire, ecrire, effectuer une opération basique
comme `ET` ou `OU`, sur une petite partie de mémoire comme par exemple là où se
trouve un entier. Cette opération garantis qu'aucun autre thread du même
programme va essayer de lire ou écrire pendant le temps de l'opération. Enfin,
cette opération garantis un ordre définis que le processeur doit respecter.

De base, sur un processeur intel, tout mouvement ou copie est, selon ce qu'on
entend par là, atomique. Prenons l'instruction `mov` sur `x86`. Cette
instruction permet selon son utilisation de copier une valeur ou de copier
l'adresse de cette valeur. C'est cette diférence qui implique un déplacement
*par copie* ou par *référence*. Elle peut être utilisé pour lire ou écrire,
selon le sens dans lequel on place ces arguments. lorsqu'une instruction mov de
lecture est exécutée, elle a un comportement similaire à l'ordonancement
définis par *ACQUIRE* et lorsqu'une instruction mov d'écriture est exécutée,
elle a un comportement similaire à l'ordonancement définis par *RELEASE*. Ce,
sans avoir besoin de préciser quoi que ce soit. Sur `x86`, l'ordonnancement
*RELAXED* est chimérique. On remarque que des opérations atomiques avec le flag
*RELAXED* produisent le même résultat que des opérations dites "non-atomique".

Toute les opérations sont de l'écture et d'écriture sont donc "atomiques" sur
`x86`. Mais pas sur tout les processeurs. Sur `ARM` par exemple, on devra
utiliser des instructions tel que `dmb` pour préciser un ordre
*ACQUIRE-RELEASE*. L'instruction `dmb` (data memory barrier) garantit que
toutes les instructions de lecture ou écriture en mémoire exécutées avant elle
sont terminées avant que celles exécutées après ne le soient. Il convient donc
de dire, en écrivant du code plus haut niveau, comme du _Rust_ ou du _C_, que
toute les opérations sont "non-atomique" tant que le code ne précise rien.

Le processeur, pour plusieurs raisons, a le droit de superposer des opérations
sur un thread. Ce qui peut rendre un programme avec des executions parrallèle
difficile à se représenter. Avec des opérations atomiques et les flags
`Acquire`, `Release` et `SeqCst`, on peut forcer le processeur à ne plus
superposer les lectures et ecriture. On peut forcer un certain ordre, ou du
moins, certaines contraintes.

Une variable peut être atomique dans le cas où elle est assez petite. Elle est
généralement une version d'un type primitif. On peut lui donner des
ordonnacements d'accès en lecture et ecriture de manière à ce que différents
threads ne tombent pas dans des *data races*. Et dans tout les cas, il est
préférable, si on utilise ces variables, de donner l'ordonnancement `SeqCst`
qui est la contrainte la plus élevée.

## Atomique ou pas atomique

Il existe certains cas ou les choses peuvent bien se passer, même sans préciser
l'atomicité dans le code. Ou avec des ordonnancements plus faible que `SeqCst`.
Notamment sur des processeurs `x86`. C'est intéressant de savoir pourquoi et
comment le mécanisme est traduit en instructions.

Pour observer les instructions qu'un processeurs intel peut comprendre, on peut
commencer par écrire avec un langage haut niveau, les différents concepts que
la plupart des languages nous offrent. J'ecris donc un programme de diférentes
façon, avec des méthodes plus ou moins validées par la communauté des
développeurs. Ce programme consiste principalement en deux threads. L'un
produit, l'autre consomme. Le producteur incrémente une variable jusqu'à ce
quelle soit égale à 5, l'autre lit tant que la même variable ne vaut pas 5.
Après quoi, le programme s'arrête.

Je vous épargnerai les déclarations de bibliothèques et la fonction de
démarrage. On se concentrera sur les threads.

La première version utilise des mutexes.

```c
void *producer_thread(void *counter)
{
    int c = 0;
    while (c != 5)
    {
        pthread_mutex_lock(&COUNTER_MUTEX);
        *(int *)counter = ++c;
        pthread_mutex_unlock(&COUNTER_MUTEX);
    }
}

void *consumer_thread(void *counter)
{
    int c = 0;
    while (c != 5)
    {
        pthread_mutex_lock(&COUNTER_MUTEX);
        c = *(int *)counter;
        pthread_mutex_unlock(&COUNTER_MUTEX);
    }
}
```

Dans cette version, mon postulat est que l'invocation d'un verrou autour de ma
variable est inutilement couteuse. En plus, je dois gérer une variable globale
pour controller l'accès. Cette méthode est particulièrement utilisée lorsque le
type de `counter` n'est pas primitif. Si c'était une structure ou un tableau,
cette méthode aurait acceptable.

A noter que ici, il serait simple de modifier le programme de façon à ce qu'on
ai plusieurs producteurs sans créer de comportement indéfini. Il suffirai que
dans la boucle du producteur on teste la variable pour voir si elle est déjà
égale à 5. Le cas échéant, on retourne un erreur ou on sort simplement de la
fonction.

Voilà la deuxième version:

```c
void *producer_thread(void *counter)
{
    int c = atomic_fetch_add_explicit(
        (atomic_int *)counter, 1,
        __ATOMIC_RELEASE);
    while (c != 4)
        c = atomic_fetch_add_explicit(
            (atomic_int *)counter, 1,
            __ATOMIC_RELEASE);
}

void *consumer_thread(void *counter)
{
    int c = atomic_load_explicit(
        (atomic_int *)counter,
        __ATOMIC_ACQUIRE);
    while (c != 5)
        c = atomic_load_explicit(
            (atomic_int *)counter,
            __ATOMIC_ACQUIRE);
}
```

Cette fois-ci, plus de mutex et j'immagine, plus de verouillage. On utilise une
opération atomique basique `fetch_add` qui va, sans surprise, faire récupérer
la valeur, ajouter `1`, puis écrire à l'adresse la nouvelle valeur.

`fetch_add` va produire la ligne instruction `lock xaddl %edx, (%rax)`. Voilà
c'est une opération d'addition entre edx et rax, avec le prefix lock. Ce
préfixe permet entre autre de préciser au processeur que la valeur de la cible
ne peut pas être changer pendant l'instruction. Utiliser cette fonction est
considéré comme `wait-free` si vous êtes familier avec les types d'algorithmes
multithreadés.

La version ci-dessus nous empêche d'avoir plusieurs producteurs. Effectivement,
on risque d'avoir une variable temporaire `c` qui ne soit plus la bonne,
cependant, on continue à incrémenter le compteur. Ce risque de *data race* est
à prendre en compte. Même si dans ce cas, tout va bien. 

La dernière version n'utilise même plus d'opérations atomiques et fonctionne
parfaitement. Cette version ne marche que parce que les instructions `mov` ont
le même comportement entre eux que des variables atomiques avec
l'ordonnancement *ACQUIRE-RELEASE*.

```c
void *producer_thread(void *counter)
{
    int c = 0;
    while (c != 5)
        *(int *)counter = ++c;
}

void *consumer_thread(void *counter)
{
    int c = 0;
    while (c != 5)
        c = *(int *)counter;
}
```

En fait, qu'on utilise *RELAXED* ou *ACQUIRE/RELEASE*, ça ne change rien. Celà
dit, utiliser l'ordonnancement par défaut, *SeqCst* (Sequentiellement
Consistent), reste la meilleur pratique. Ne vous risquez pas trop à changer
cette rêgle pour des bouts de chandelles de performance.

Ici, la version ne permet pas du tout d'avoir de multiples producteurs. Pas du
tout. En fait, on pourrait la modifier légèrement en utilisant la fonction
atomique `compare_and_swap` dans la boucle du producteur. Cette fonction permet
de vérifier si la valeur de `c` est bien celle qui se trouve dans le compteur.
Et si ce n'est pas le cas, on récupère la valeur actuelle, et on essaie à
nouveau si besoin. `compare_and_swap` est l'élément qui manquait aussi à la
deuxième version. Cependant, si l'utilisation de `fetch_add` est *wait-free*,
l'equivalent sans les *data race* avec `compare_and_swap` est *lock-free*.

Spécifier un ordre dans lequel les threads vont accéder à une variable est
possible dans quasiment tout les langages permettant la parrallèlisation des
executions. En Go, il n'est possible d'utiliser que l'ordonnancement *SeqCst*.
En Rust, les types atomiques sont identiques au C/C++.

Changeons de sujet. avec l'atomicité, on peut simuler ce que ferai un mutex
autour d'une variable. Voici l'exemple le plus classique que vous pourrez
trouver à propos des opérations de lécture et écrture atomiques.

```rust
fn thread_a(atomic_bool: Arc<AtomicBool>, val: Arc<AtomicU32>) {
    val.store(42, Ordering::Relaxed);
    atomic_bool.store(true, Ordering::Release);
}

fn thread_b(atomic_bool: Arc<AtomicBool>, val: Arc<AtomicU32>) {
    let mut b = false;
    while !b {
        b = atomic_bool.load(Ordering::Acquire);
    }
    let v = val.load(Ordering::Relaxed);
    assert!(b);
    assert_eq!(v, 42);
}
```

La figure ci-dessus est un exemple de synchronization. De la même manière qu'un
lock de mutex relaché dans un thread A puis aquis dans un thread B, ce qui à
été stoqué par le thread A est visible par le thread B.

Une écriture avec un ordre atomique `Release` implique qu'aucune écriture ou
lecture dans le même thread ne peut être réorganiser par le processeur. Que
l'opération soit atomique ou non-atomique. En plus, toute écriture dans une
variable devient visible par tout les autres threads voulant lire avec un ordre
atomique `Acquire`.

Pour résumer simplement, val est comme protégé par un mutex. Cette façon
d'attendre activement l'accès à une ressource s'appel un spinlock. Très utiles
dans certains cas, et bien trop gourmant en ressource dans d'autre.

Sans l'utilisation de lecture et écriture atomique, un programme se risquerai à
un comportement indéfini sur quelques processeurs. Et d'ailleurs le compilateur
de Rust permettrait pas d'écrire le code sans l'utilisation du mot clef
`unsafe`.


## L'état dans lequel je suis

Une machine à états conserve toujours au moins sont état actuel. Que cet état
soit représenté par une variable, une pile, ou simplement par la position de
l'execution sur la stack.

Pour Reagir comme pour React, les états sont des variables qu'on récupère à un
moment de l'execution. En C, l'état ne peut pas se trouver sur la pile. Si
c'était le cas, on ne pourrait jamais dépiler les executions et le programme
grossirait en mémoire continuellement. Les états de la bibliothèque Reagir sont
donc quelque part sur le tas. Par défaut, ils sont constants ou statiques.

Dans la vie, ce n'est pas toujours pratique d'avoir des états constants et
immutables. Dans la plupart des exemples qu'on trouve avec React, l'état est
modifié. Personnellement, j'aime considérer l'état comme une base avec laquelle
je profile l'execution, puis créé l'état suivant si besoin. Contrairement au
Rust, C me donne la libertée de créer des variables statiques mutables. Ce qui
rend ce vieux langage non *memory safe*. En contre partie, ça me permet de ne
pas à avoir à alouer de mémoire dynamiquement, et surtout, d'avoir un code
petit.

```c
/// Création de l'état initial
void *make_init_state()
{
    static char val[300] = {'\0'};
    static struct State st = {
        val,
        0,
        zero,
        first_print,
        0,
    };
    return &st;
}

int state_machine()
{
    struct Reaction *re = use_state(make_init_state);
    struct State *st = re->state; // Récupération de l'état
    // ...
}
```

Un choix arbitraire pris ici, est l'argument qu'on donne à la fonction
`use_state`. Avec React, on donne directement une référence vers l'état
initial, puis on utilise la référence du scope pour le reste de l'éxecution. Ce
n'est pas très pratique pour un model de mémoire sans *garbage collector*. Le
choix de passer une fonction d'initialisation tout de même, malgré les
contraintes du langage, plutôt arbitraire. J'imagine sans mal qu'il y a de
nombreuses méthodes alternatives. Certaines me viennent à l'esprit en écrivant
ces lignes. Néanmoins, je ne trouve pas de gros défauts à cette implémentation.

Vous avez peut être remarqué une autre différence avec React qu'implique cette
implémentation. En utilisant le framework javascript, appeler la méthode
`dispatch` (celle qui permet de mettre à jour l'état) avec le même objet ne
redemande pas l'execution de l'application, même si cet objet à été modifié.
Dans le cas ci-dessus, si on garde la même logique le pointeur pour l'état
initial ne peut pas être celui des états suivants. Donc la bibliothèque est
forcé d'accepter tout appel à `dispatch` sans vérifier l'adresse.

Je recommande tout de même de ne pas utiliser l'état précédent dans la fonction
de dispatch sans savoir ce qu'on fait. Le mieux serait de pouvoir utiliser une
variable statique par état. La raison pour laquelle il n'est pas conseillé
l'état précédent, est qu'il peut être modifié par d'autres parties de
l'application avant que la fonction de dispatch n'ait été exécutée. Dans ce
cas, des *data races* peuvent entraîner des bugs difficiles à déboguer.

Quelques chapitres au dessus, on a vu comment des fonctions de réduction sont
enfilées. J'ai précisé ensuite que ces fonctions sont exécutées séquenciellement
et l'impacte qu'elles ont.

```c
struct Reagir *re = new_reagir(pthread_self());

while (state_machine())
{
    re->i = 0;
    struct Entry e = receive_state(re);
    void *new_state = e.rea->reducer(e.rea->pub.state, e.arg);  // L7
    opt.on_state_change(&e.rea->pub.state, &new_state);         // L8
}
```


Dans l'implémentation de la boucle d'exécution, il n'y a aucun néttoyage des
état. Dans un langage qui n'est pas *garbage collecté*, c'est un peu
problématique. À la place, la bibliothèque appelle une fonction paramettrable, qui permet
pour nous de résoudre plusieurs problème.

Première question : que se passe-t-il si je souhaite utiliser des états de ma
*heap* ? Si c'est le cas, il faut trouver un moment juste où on possède encore le pointeur
de l'état précédent afin de libérer l'espace mémoire. Une des possibilité qui n'embête pas
trop l'utilisateur de la bibliothèque est celle-ci: `on_state_change` s'occupe de néttoyer.
C'est simple et efficace, à la création de la machine à état, on donne en paramêtre une
fonction.

```c
void on_change_with_free(void **dst, void **src)
{
    free(*dst);
    *dst = *src;
}

void main(void)
{
    struct Opt opt = {on_change_with_free};
    create(state_machine, &opt);
}
```

La proposition précédente fonctionne parfaitement dans un contexte synhrone. Si
plusieurs thread pouvaient utiliser les états à tout moment de l'execution,
dans ce cas, ce bout de code est **très très critique** ! Pourtant, il existe
des situations où les executions seront toujours concurrentes, jamais
parrallèle, et ce code marche.

Deuxième question : immaginons que pendant que je reçoivent une nouvelle
information la machine à état passe de l'état A à A'. Le programme a passé `L7`
(voir la figure de la boucle) et est en train d'executer la fonction de
réduction. Si un autre thread modifie A à ce moment là, la fonction de
réduction aura et cet autre thread auront un `data race`. Comment peut-on
empêcher ça ?

La première réponse, la moins évidente à réaliser, est de faire en sorte que
le programme soit résilient. L'utilisation de structures non-bloquante encore
permet d'éviter des `data races` compliqué. La fonction de réduction, pourrait
par remplacer l'ancien état avec un `compare_and_swap` plus éllaboré, et tenter
de nouveau tant que l'opération échoue. Dans ce cas, il faut aussi se protéger
contre des libérations de mémoire inattendues. L'accès à une structure, aussi
atomique soit-elle, ne protège pas contre l'apparition d'un pointeur NULL comme
référence.

Une manière plus simple de se protéger est, evidement, l'utilisation de vérous.
En combinant une fonction de réduction qui enclenche un vérou et la fonction de
nettoyage pour le déclencher, on peut réussir à protéger l'état contre des
comportements indéfinis. Le vérou peut être contenu dans la machine à état.
Mais de toute manière, il n'y a toujours qu'un état courrant, donc
l'utilisation d'un vérou global est largement suffisant.

```c
void *locker(void *_, void *new_state)
{
    lock(&state_mutex);
    return new_state;
}

void my_on_state_change(void **dst, void **src)
{
    free(*dst); // dans le cas où j'utilise la heap.
    *dst = *src;
    unlock(&state_mutex);
}

struct Reagir* state_machine()
{
    struct Reagir *re = use_reducer(
        locker,
        initializer
    );
    return re;
}
```

## Une file plus rapide

TODO - présenter la file de Mickael-Scott. Lock-free qui contient des mutex.
TODO - Problème de spin CPU et ajout de vérous bien placés.

Admettons que la situation nous impose d'optimiser la lecture et l'écriture de
la file. Effectivement, la structure *mpsc* (multiple producer single
consumer) implique un goulot d'étranglement. Admettons qu'utiliser un simple
vérou sur la file de la machine à état n'est pas suffise pas, utiliser des
*mutex* coûte au CPU un temps précieux. Alors que fait-on ?

Une file est une structure de donnée qui en théorie n'a pas de taille précise
et qui implémente au moins deux fonctions: `pop` et `push` (defiler et enfiler)
et dont les éléments qui entrent et sortent respectent l'ordre *FIFO*. Avant de
commencer à présenter différentes façons d'optimiser cette structure, regardons
ce que font ces deux routines.

*Push*, par exemple va:
1. Créer un nouveau noeud.
2. Trouver la fin de la file.
3. Relier la fin de la file avec le nouveau noeud.
4. Modifier le pointeur de fin de file vers le nouveau noeud.

*Pop*:
1. Trouver la tête de la file.
2. Trouver l'element suivant.
3. Echanger le pointeur de en tête de file avec l'élément suivant.
4. Supprimer l'ancien noeud.

Initiallement les pointeurs de tête et de fin sont initialisé à null. On les
appellera des `dummies`, ils serviront essentiellement à combler le début et
la fin de la file et peuvent être égaux. Plus important, il faut souligner le
fait que la plupart de ces opérations sont invalides dans un contexte de
partage de données entre plusieurs threads parallèles.


// todo shema

La figure ci-dessus montre un des nombreux scénari de désynchronisation qui
pourrait arriver. En fait, en utilisant cette structure non protégée, ça ne se
passera jamais bien. Si on reste dans des executions concurrentes, dans des
*green threads*, pourquoi pas. Mais en incluant du parallélisme, il y a un fort
risque de perte de données et de comportements indéfinis. Dans ce cas, la
solution la plus évidente est d'ajouter un mutex autour de la file partagée.
Des solutions plus performantes entrent alors en scène.

L'étape suivante d'une structure de donnée *thread-safe*, après le grand mutex,
c'est le status *lock-free*. Quand on parle d'algorithme *lock-free*, on veut
simplement dire que l'appel d'une routine comme *Push* garantie que des appels
parrallèls à cette même routine pourront se terminer à un moment de son
execution. Autrement dit, on arrive à s'organiser entre thread de façon à se
partager une structure sans se marcher sur les pieds.

Pour l'implémentation d'un *mpmc* (multiple producer - single consumer), on
peut utiliser une version synchrone de l'algorithme de la file. Ça ressemble à
ce qu'on a vu précédemment dans `send_state` et `receive_state`. Sauf qu'on
différenciera le mutex de tête de file et celui de fin de file. Un producteur
et un consommateur ne se bloqueront jamais l'un l'autre. Cependant, on utilise
de vérou, ce qui veut dire qu'on aurait pas le droit d'appeler cette structure
*lock-free*. Ici, on décrit un algorithme qui garantit qu'au moins un thread
peut continuer à exécuter même si d'autres threads sont bloqués. Un
consommateur peut s'executer même si un producteur block la file. Par contre,
plusieur consommateur n'auront pas d'accès simultanés. Cette stratégie
s'appelle *"livelock-free"*.

```c
void enqueue(queue_t *queue) {
    node_t *node = (node_t *) malloc(sizeof(node_t)); // Step 1
    pthread_mutex_lock(&queue->tail_lock);
    queue->tail->next = node;                         // Step 2 & 3
    queue->tail = node;  // todo il fut modifier cet algo pour qu'il corresponde plus
    // a l'exemple lock-free... Pour l'exemple...
    pthread_mutex_unlock(&q->t_lock);
}

void dequeue(queue_t *queue) {
    pthread_mutex_lock(&queue->head_lock);
    node_t *node = queue->head;
    node_t *new_head = node->next;
    if (new_head == NULL) {
        pthread_mutex_unlock(&q->h_lock);
        return -1;
    }
    queue->head = new_head;
    pthread_mutex_unlock(&queue->head_lock);
    free(node);
}
```

À noter, si on retire les vérouillages/dévérouillages dans la figure si dessus,
on obtient strictement l'algorithme synchrone de file. Et c'est dans cette
voie: reproduire strictement une file synchrone, qu'on devra aller pour trouver
un nouvel algorithme libéré des *mutexes*. Les étapes 3 et 4 de l'ajout dans la
file ainsi que les 





// todo




## Machine à états industrielle

Il peut arrivé qu'une machine à état soit nécessaire dans votre programme parce
qu'il faut communiquer avec de l'embarqué. Il se peut également que les
evennements reçus des composants embarqués soient invalides, arrivent à des
moments improbables, se répetent plusieurs fois, ne sont pas dans l'ordre
attendu.

Définissons avec la bibliothèque Reagir une machine à état un peut plus
réaliste. La lecture de l'entrée utilisateur est parrallèle à l'execution, donc
on peut recevoir des évennements à tout moment. La machine à état quand à elle
ressemble à ça :

// todo shema
// start A
// A   + "gotoB"   -> B
// A   + "gotoC"   -> C
// B|C + "gotoD"   -> D
// D   + "restart" -> A
// D   + "stop"    -> E
// E               -> quit

Le code doit être clair et précis. Il doit être sans ambiguité et simple à
modifier, car dans le milieu industriel, ce sont les machines à états qui
bougent le plus. Par rapport à l'exemple précédent, la fonction `state_machine`
ne vari quasiment pas. La structure de l'état ne pourrait contenir que des
fonctions ainsi que le nécessaire à l'application. Les fonctions, toujours
appelées dynamiquement, inscrieront les prochains évènement attendu.

```c
void fn_state_A(struct State *self)
{
    onEvent("gotoB", &state_B);
    onEvent("gotoC", &state_C);
}

void fn_state_B(struct State *self)
{
    onEvent("gotoD", &state_D);
}

void fn_state_C(struct State *self)
{
    onEvent("gotoD", &state_D);
}

void fn_state_D(struct State *self)
{
    onEvent("restart", &state_A);
    onEvent("stop", &state_E);
}
```

Lorsque le programme entre dans l'état A. Il execute la fonction associée
`fn_state_A`. Laquelle, à part les effets de bord qu'elle implique, peut
inscrire quelque part que la machine s'attend maintenant à un évenement `gotoB`
ou `gotoC` et aucun autre. Le signal d'un de ces évenements entrainera
respectivement le passage à l'état B ou l'état C. On remarque instantanément
les avantages de décrire sa machine à état de cette façon. C'est extrèmement
fléxible et lisible. Avec cette technique basique, on est capable d'écrire des
programme d'une étonnante compléxitée.

Maintenant, regardons une problématique de discussion avec du hardware. À
chaque état, on peut recevoir un ou plusieurs évènements. Dans ce cas, on a du
text, mais ça pourrait être n'importe quel signal exterieur ou intérieur.
Admettons qu'on soit en discution avec des composants qui fonctionnent en temps
réel, et qu'un message comme "gotoB" puisse etre reçu plusieurs fois avant que
la partie hardware ne se mette à jour. Le mieux à faire, c'est de centraliser
le changement d'état grâce à une fonction de réduction.

Une fonction de réduction donne la possibilité de définir des mises à jour de
l'état basées sur l'état précédent, donc sur l'état actuelle. Elle est appelée
en amont de l'execution d'un état et peut décider de celui ci. L'état suivant
est définis par la valeur de retour de la fonction de réduction. Si cette
valeur est null, la bibliothèque va ignorer l'évennement. Cette fonction permet
de centraliser les transitions, vous pouvez rendre votre code plus facile à
comprendre et à maintenir en séparant clairement les différentes actions qui
peuvent modifier l'état de votre application.

```c
void *find_next_state(void *old_state, unsigned char *event)
{
    static char previous_event[30] = {'\0'};
    if (strcmp(previous_event, (char *)event) == 0)         // P1
        return NULL;
    void *state = hashmap[hash(event)];
    if (state != NULL)                                      // P2
        memcpy(previous_event, event, 30);
    return state;
}

void *reducer(void *old_state, void *event)
{
    void *ret = find_next_state(old_state, (unsigned char *) event);
    free(event);
    return ret;
}
```

Dans la figure précédente, la ligne P1 protège des signaux dupliqués. On ne
peut recevoir un signal qu'une seul fois, sa répétition est interdite. Notez
qu'en pratique, vous pourrez vouloir ajouter des exeptions à cette rêgle. C'est
possible que vous vouliez recevoir le signal "next" plusieurs fois. Pensez
alors à ajouter des fonctions de vérification. Regardez la figure ci-dessous,
ce morceau de code modifie la valeur du paramettre et signal en modifiant un
flag qu'elle a été modifiée. En C ou C++, on aurait même pas besoin de préciser
que ces paramettres sont atomiques, ni qu'elle sont cachée derrière un conteur
de référence. Malgré tout, la particularitée de Rust à être *memory safe*
n'exempte pas ce code d'un possible *data race*. Lorsqu'on ne précise pas
l'ordre, ou qu'on donne un ordre *Relaxed*, à l'éxriture de variable, on ne
peut pas confirmer avec certitude que `val` sera TOUJOURS modifié avant
`modified_flag`. C'est ça qu'on appel un *spurious wake up*.

Lorsqu'on ajoute à la place de P1 une exception, on doit toujours y ajouter si
necessaire une protection. En général, une variable tierce qui permet de
vérifier si l'évènement est unique.

```rust
fn modify_val(modified_flag: Arc<AtomicBool>, val: Arc<AtomicU32>) {
    val.store(42, Relaxed);
    modified_flag.store(true, Relaxed);
}

fn read_val(modified_flag: Arc<AtomicBool>, val: Arc<AtomicU32>) {
    while modified_flad.load(Relaxed) == false {}
    assert_eq!(val.load(Relaxed), 42); // Peut fail
}
```

Gardons à l'esprit que ce code est executé de façon synchrone, ça signifie que
l'état actuel a déjà été executé. Premièrement, on ne peut pas être
simultanément dans une fonction comme `fn_state_A` et dans la fonction de
réduction. Deuxièmement, la fonction de réduction est éxécutée avant que l'état
fasse ses effets. Conclusion, quand on entre dans la fonction de réduction, la
machine à état est abonnée aux seuls évènements attendus dans son context
actuel. La ligne P2 nous permet d'ignorer ces évenements inatendu. Si nous
sommes à l'état B, le signal `gotoC` sera ignoré. Ça peut être un comportement
erroné, dans certains cas, on peut souhaiter que l'état devienne vraiment C
dans la mesure du possible. Si besoin, j'ajouterai un état transitoire qui
tentera d'annuler les effets de bord de l'état précédent.

Représenter son programme grâce à un diagramme d'états et de transition
façilite le développement d'applications complexe. On se fait un cadeau en
décrivant à haut niveau le fonctionnement de son programme. On peut
vérifier l'exactitude, les besoins, transmettre une connaissance rapidement
dans une équipe et améliorer la communication entre les composants.

## Récapitulatif

En lisant divers articles durant mes recherches, je n'ai pas pu m'empêcher de
faire le lien avec ce que Pierre Boule a si bien décrit dans son oeuvre _La
planette des singes_. J'ai eu l'impression que les thèses écrites entre les
années 1990 et 2010 ont eues un impacte important. Elles déteingnent nettement
sur les articles techniques jusqu'en 2022. Et si elles n'en sont pas la source
d'inspiration, d'autres articles répètent encore et encore les même choses.

Toujours avec une légère différence dû à la personnalité de l'écrivain, les
postes autours des sujets qui suivent sont des immitations les unes des autres.
Parfois, simplement, un développeur curieux découvre, comme moi, comment
fonctionnent des outils qu'il utilise depuis une décénie. Je suis un bucheron
qui comprend comment marche une hache. J'espère que ça n'en reste pas moins
utile, qu'une forme de vulgarisation est parfois nécessaire. En revanche, je ne
voudrais pas me limiter à imiter mes pères. Je souhaite tenter de combiner des
connaissances et m'essayer à la créativité. Bien que ma créativité n'aura rien
de novatrice et sera déjà venu à l'esprit des premiers informaticiens, je serai
plus heureux comme ça.
