---
layout: default
title: "State machine and async queue (French)"
description: ""

authors: ["Adrien Zinger"]
scripts: ""
comments_id: 12
published: false
---

<span style="color: #A0A0A0">[2022-12-01] \#Design_pattern \#State_machine \#Code

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
références à des générateurs tel que Bison, ou bien au framework React. Vous
aurez une petite introduction obligatoire aux différentes machines à états
qu'on trouve dans la nature.

La plupart du temps, j'utilise le langage associé à la construction d'analyseur.
Pour être plus clair, je me représente une machine à état comme un analyseur.
Même si un analyseur est un sous-type de machine à état, le langage est suffisement
consistent pour mon introduction. Je parlerai donc de grammaires, de contextes, de
conflits, etc.

Durant un court épisode, vous verrez comment développer une partie en C et une
autre en Rust et compiler le tout en un binaire unique. Pour cette partie, il
faudra des compétences en Rust que je ne peux pas vous offrir en si peu de
text. Les détails importants seront tout de même bien expliqués.

Une grande partie sera consacrée à la file d'événements qui peuvent modifier
une machine à état. Cette file d'événement doit être traitée de façon
séquentielle. Dans le cas où c'est important, je montre comment améliorer les
performances quand les événements arrivent rapidement. Néanmoins, je ne dis pas
quand ce cas est effectivement important. Les parties traitant ce sujet offrent
l'occasion de regarder de plus près des mécanismes utiles dans des programmes
multithreadés. C'est plus "intéressant" qu'utile, je ne peux pas
préciser dans quel contexte ces mécanismes sont utilisé dans "la vrai vie" !
Mais elles existe et sont souvent utilisé pour des raisons parfois
arbitraires, à cause de croyances personnels, ou bien de connaissance poussé
du sujet. Ou encore plus simplement, parce que le sous-problème nécessite une
attention particulière. Il doit être le plus performant possible, donc on essaie
de multiples méthodes.

J'aborde donc l'utilisation de structures de données non-bloquantes. Je parle
en particulier d'opérations atomiques. Je tiens à préciser que ce sujet est
bien plus complexe que ce qu'il laisse paraître. Changer une structure en
une autre structure non-bloquante, comme par exemple un table de hashage,
peut avoir de gros impactes. Parfois, l'espace mémoire que la structure
prendra sera bien plus grande que l'original. Autrement, il faudra faire des
concessions sur les performances. A vous de choisir où mettre les priorités.

J'en profite pour vous prévenir, je suis conscient de maîtriser certaines
aspects et pas d'autres. Même si j'ai le sentiment d'être dans le vrai, n'hésitez
pas à me corriger si vous y voyez de grosse erreurs! Et il y en aura probablement,
même après une centaine de relectures.


## Pourquoi une machine à états ? 

> Ce que tu peux faire de mieux pour ton programme, c'est
> d'en faire une machine à états.

Dans un projet, on souhaite une machine à état
quand une partie du programme:

- gère un context global ou temporaire.
- subit des modifications lors d'appels exterieurs.
- réagis à différentes entrées et retourne un résultat
  cohérent avec ces entrées.

Plus généralement, lorsqu'une fonction donnent
une sortie différente après chaque appel. Suivant ces
description, on remarque que
les itérateurs et les générateurs sont aussi des genres
de machines à états.

Il y a différente façon d'aborder le problème.
La façon scolaire, linéaire que la plupart des raisonements
humains vont produire. Cette façon de faire pourra entre
autre ressembler à un analyseur LL ou LR. L'implémentation
peut être très similaire. Souvent, ces deux méthodes divergent
uniquement dans les structures qu'elles utilisent.

En tout cas, on retrouvera la logique "si j'ai
tel événement dans tel context, je
passe à tel état suivant". Au début de mes études je
codais de nombreuses fonctions qui s'appelaient les unes
les autres. Elle étaient pleines de conditions et ça
marchait pas trop mal.

C'est un raisonement très linéaire, et efficace si on
souhaite développer rapidement un petit morceau de code.
Mais ça devient vite ingérable dans une application
qui traversera beaucoup d'états. Idem, si le projet
change de grammaires, ou s'il s'avère que la grammaire
commence à contenir des conflits.

Depuis longtemp, on élude ces problèmes en utilisant
un générateur de parseurs (analyseurs). Vous avez peut être déjà
entendu parler de yacc et lex. Ce genre de générateur existe
dans de nombreux langages et sous
de nombreuses formes. Il me semble qu'aujourd'hui leur utilisation
est moins répandue. Je trouve personnellement que c'est la meilleur
solution pour générer des machines à état aujourd'hui.
Se plonger dans une grammaire sous le format BNF,
même si c'est ennuyant, vous fera gagner une base
de code propre et un temps considérable.

Néanmoins, toute méthode a ses avantages et ses inconvégnants.
Dans certains cas, il sera plus simple d'écrire rapidement un analyseur
à la main ou en utilisant une bibliothèque tièrce.

Depuis quelques temps, on développe des analyseurs
par petits morceaux. Ces combinations de
parseurs ont des bon côtés. Déjà, on ne dépend
pas d'un générateur et dans le meilleur des cas, on
ne dépend pas non plus d'une bibliothèque. Le
développement est linéaire: je parse, je change d'état.
Les états sont: des parseurs, des fonctions. Bien sûr,
on retombe rapidement dans de nombreuses fonctions
pleines de conditions, maiiiiis c'est pas mal.

Ensuite il y a la manière React. Attendez, avec
React on ne fait pas de parseurs, on fait des apps !
Hé bien si, en faisant du React, on fait des parseurs.

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

Ici je parle de ces `hooks` en React qui permettent
de recharger des composants avec des valeurs mises à
jour. Il y a `use_reducer`, qui est généralement
moins utilisées. Cette méthode permet de créer une
fonction de mise à jour en donnant pour paramettre
une methode de _réduction_ avec cette signature:

`(current_state, action) => new_state`

Une fonction de réduction permet de créer un nouvel
état à partir de l'état courant associé à un évenement,
donc une entrée dans le programme. Pouvoir donner
cette fonction en argument permet de de centraliser
un comportement complexe en fonction d'un context.

On trouve aussi `use_state`, qui se limite à prendre pour
argument un état initial. Cependant, il produit la même
chose que son compagnon. A la différence qu'il utilise
sa propre fonction de réduction où l'action est le
le nouvel état.

Le fonctionnement de ma machine à états est alors décrite par
des structures génériques dans une queue et une fonction
de transition si elle est définie. A terme, ce modèle
pourrait ressembler trait pour trait à des combinations
de parseurs.

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

Une machine à état est très flexible et s'adapte en
fonction du besoin. En effet, plus haut je vous disais
qu'un itérateur, un générateur ou encore un parseur
son des types de machines à états. Parfois un simple
appel à un timeout peut cacher une machine à état,
"en cours -> annulé", "ouvert -> fermé".

Mais parmis tous, le parseur est un cas particulier.
Le parseur suppose une fin à ces états. Que le
programme soit écrit à l'aide d'un générateur ou avec
la méthode des combinations, on attend des états
qu'ils se résolvent.

Une dernière méthode permettant de créer des machines
à état, est celle de React. Avec cette méthode, on
peut écrire des itérateurs, des parseurs, toutes
les machines à états finies et infinies. C'est pour
cette raison qu'elle est extrèmement éfficace pour
la gestion d'une application.

Faire avancer les états avec React se résume à empiler
des évenements et les traiter un par un. Pour pousser
la démonstration, je vais écrire un petit exemple en C.

## Développement de Reagir

Les morceaux de codes qui suivront seront des éléments
d'un programme simplet, un echo avec une implémentation
volontairement complexe. Surtout, ne refaite pas ça chez
vous.

Voici le comportement attendu:

1. la sortie standart affichera `waiting for an entry`.
2. `you wrote: ${entrée}` suivit de `Can you write something else?`.
3. `you wrote: ${entrée}` puis `Can you write something else? (${compteur})`.
4. répéter à partir de 3.

Le programme devra s'arrêter à la lecture du mot clef _"exit"_.

Je commence par créer une structure représentant
un état, auquel est associé une méthode liée dynamiquement
appliquant une étape de ma machine à état. Pendant la
modification de l'état, le programme continue à agir
tant que je lui ai pas dit de se mettre à jour. Un peu
comme avec la fonction de mise à jour `setState` en React.

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

Dans la figure précédente, plusieurs ligne modifie la
valeur de l'état. Dans mon cas, ces valeurs sont modifiées
en prévision de _l'itération suivante_ de mon programme.
Autrement dit, je construit par dessus mon état actuel
l'état suivant.

A noté que dans certains cas, cette façon de faire peut
poser problème. Notemment si le programme accède à cette
valeur via plusieurs thread. Parmis les problèmes qu'on
rencontre dans ce cas là, le fait de rendre l'état actuel
immutable devient capital. Pas de problèmes, ne touchez pas
à l'état courant, construisez en un nouveau et entourez le
de mutex.

J'ai évoqué plus haut le terme d'itération. En quelques mots,
le coeur de mon programme est une boucle infinie, qui à chaque
nouvel mise à jour de mon état, executera la même fonction.
Le coeur ne change pas, l'état change.

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
        free(re->state);
        return EXIT_SM;
    }
    st->step(st);
    // Attend dans un autre thread une entrée
    async_scan(re);
    return CONTINUE_SM;
}
```

Voici comment une machine à état infinie peut
fonctionner. L'absurde complexité du mini projet
montre néanmoins comment on peut se défaire d'une
série de conditions et d'intrications de monades.
Par exemple, l'optimisation de la fonction before
qui en premier lieu retourne forcément 0. N'ayant
aucune entrée à lire, celà montre bien comment
éviter des tests inutiles, dans un projet plus
important.

# File d'états, file d'actions

Je n'ai pas encore parlé d'une partie importante
de l'exemple précédent. La lecture de l'entrée
utilisateur. C'est à cet endroit que j'appelle
la méthode `dispatch` associée à ma machine à état.

Cette méthode ajoute dans une file un nouvel objet,
qui selon la configuration, appelera une fonction
de réduction, ou mettra à jour l'état actuel. La
configuration ce faisant si l'on créer l'état grâce
à `use_state` ou `use_reducer`, exactement comme en
React !

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

Je vous ai prévenu, ce modèle de machine à états
enfile des objets afin de les traiter de façon
synchrones. Mais rien n'empêche l'accumulation des
événements d'être asynchrone ou parrallèle. Alors
on peut se poser quelques questions sur la résistance
du modèle face au parrallèlisme.

Ici, j'ai de la chance pour plusieurs raison. La première,
_scanf_ en C a une implémentation telle que même si plusieurs
thread écoutaient en même temps, seulement un d'entre eux
pourrait réagir à une entrée. Je reviendrai sur la seconde
raison plus tard. Pour l'instant immaginons que le programme écoute
plusieurs entrées différentes, des appels réseau ou
des notifications de l'OS. L'enfilement et le défilement peuvent
être concurents et poser problème. Mais c'est sans compter sur
la connaissance des patrons de producteurs - consommateurs.

Depuis même avant ma naissance, on sait gérer les
notifications concurente sur plusieurs threads grâce à ce genre
de solutions. Et depuis les anneés 90, il y a eu de nombreuses
implémentations et approches différente. Celle qui
est implémentée dans ma bibliothèque n'est pas
la plus efficace. Par contre, elle est facile à comprendre.

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
```

Un appel à `dispatch` créer une nouvelle entrée. Cette
fois-ci, l'en trée est une information qui serait traitée
par la bibliothèque afin de passer d'un état à un autre.
Tant que la bibliothèque peut faire défiler ces entrées,
on avance dans la machine à états. On ne s'attend pas
spécialement à un état final, simplement à continuer
d'avancer.

Prenons un peu le temps de lire l'algorithme de la figure
précédente. On remarque que ce code contient plusieurs
locks. Un lock coûte au processeur. En tout cas c'est
ce que j'ai appris. D'ici quelques années, j'aurai peut
être tort de dire ça, mais si possible, aujourd'hui il
est préférable d'éviter d'invoquer un lock du procésseur.

Cette implémentation est peut être suffisante pour
mon exemple ? Je n'ai pas besoin de code particulièrement
rapide. Mais je peux encore aller plus loin. Je pourrais
par exemple retirer complètement les locks.

L'utilisation que je fais de ma machine à état
dans mon exemple est synchrone! Même si j'utilise
deux threads différents. Je ne lis pas d'entrée utilisateur
pendant l'execution de la boucle de la machine à états,
ou même avant. A aucun moment, je peux envoyer un évennement
ET en recevoir simultanement. Les lignes S2, S9 R1 et R8
sont donc inutiles dans mon cas.

Même si mon programme communiquait avec d'autres,
s'assuré d'un ping pong où chaque instance attend
la réponse de l'autre peut être résolu sans aucun
appel à lock, autre que par l'invocation de `wait`.

Attention, le fait d'avoir une utilisation synchrone
de cette file est l'unique justification valable pour
retirer les invocations de lock. Des appels concurrents
auraient des résultats imprévisibles! Par mesure de
sécurité, il faut toujours entourer les variables
conditionnelles par des appels de lock. Prenez ça
comme une rêgle d'or.

Dans notre cas, on retire quelques utilisations de mutex
et ça marche. Cependant, si on souhaite quelque chose
de plus puissant qui nous autorise toujours des lectures
et écritures parrallèles, il faut se tourner vers des
structures plus efficaces.

Dans un contexte où on recevrait beaucoup d'évenements,
une structure de donnée non bloquante pourrait être
intéressante. Il y a un grand nombre d'implémentation
possible, à commencer par utiliser deux mutex différents
pour la tête de file et le bout de file. Les producteurs
se partageraient un mutex et le consommateur sera
plus rapide pour lire, aillant le monopole sur le defilement.

Plus rapide encore, une version de la file de Mickael-Scott
propose une solution n'utilisant aucun mutex. L'algorithme tire
avantage des fonctions atomiques du processeur. En d'autre
termes, la lecture ou l'écriture d'une variable sera organisé
parmis les différents threads dans un ordre spécifié.

## Rapide rappel atomique

Une opération atomique, c'est lire, ecrire, effectuer une opération
basique comme `ET` ou `OU`, sur une petite partie de mémoire comme
par exemple là où se trouve un entier. Cette opération garantis qu'aucun
autre thread du même programme va essayer de lire ou écrire pendant
le temps de l'opération. Enfin, cette opération garantis un ordre
définis que le processeur doit respecter.

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
*RELAXED* est chimérique. On remarque que des opérations atomiques
avec le flag *RELAXED* produisent le même résultat que des opérations dites "non-atomique".

Toute les opérations sont de l'écture et d'écriture sont donc "atomiques" sur `x86`.
Mais pas sur tout les processeurs. Sur `ARM` par exemple, on devra utiliser des
instructions tel que `dmb` pour préciser un ordre *ACQUIRE-RELEASE*. L'instruction `dmb`
(data memory barrier) garantit que toutes les instructions de lecture ou écriture en
mémoire exécutées avant elle sont terminées avant que celles exécutées après ne le soient.
Il convient donc de dire, en écrivant du code plus haut niveau, comme du *Rust* ou du *C*,
que toute les opérations sont "non-atomique" tant que le code ne précise rien.

Le processeur, pour plusieurs raisons, a le droit de superposer
des opérations sur un thread. Ce qui peut rendre un programme
avec des executions parrallèle difficile à se représenter.
Avec des opérations atomiques et les flags `Acquire`, `Release`
et `SeqCst`, on peut forcer le processeur à ne plus superposer les
lectures et ecriture. On peut forcer un certain ordre, ou du moins,
certaines contraintes.

Une variable peut être atomique dans le cas où elle est assez petite.
Elle est généralement une version d'un type primitif. On peut lui
donner des ordonnacement d'accès en lecture et ecriture de manière
à ce que différents threads ne tombent pas dans des *data races*.
Et dans tout les cas, il est préférable, si on utilise ces variables,
de donner l'ordonnancement `SeqCst` qui est la contrainte la plus
élevée.

## Atomique ou pas atomique

Il existe certains cas ou les choses peuvent bien se
passer, même sans préciser l'atomicité dans le code. Ou avec des ordonnancements
plus faible que `SeqCst`. Notamment sur des processeurs
`x86`. C'est intéressant de savoir pourquoi et comment le mécanisme
est traduit en instructions.

Voici le même programme ecrit plusieurs façons différentes. Le
programme consiste en deux threads. L'un produit, l'autre
consomme. Le producteur incrémente une variable jusqu'à
ce quelle soit égale à 5, l'autre lis tant que la même
variable ne vaut pas 5. Après quoi, le programme s'arrête.

Je vous épargnerai les déclarations de bibliothèques et la
fonction de démarrage. On se concentrera sur les threads.

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

Dans cette version, mon postulat est que l'invocation d'un
bloquage autour de ma variable est inutilement couteuse. En
plus, je dois gérer une variable globale pour y controller
l'accès. 1 sur 20, parce que ça fonctionne.

Je constate alors que ma variable est un type primitif. Je
peut utiliser la bibliothèque standart disponible dans
pratiquement tout les langages compilés !

Voilà la deuxième version, amélioré:

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

Cette fois-ci, plus de mutex et j'immagine, plus de verouillage.
On utilise une opération atomique basique `fetch_add` qui va,
sans surprise, faire récupérer la valeur, ajouter `1`, puis écrire
à l'adresse la nouvelle valeur.

`fetch_add` va produire la ligne instruction `lock xaddl %edx, (%rax)`.
Voilà c'est une opération d'addition entre edx et rax, avec le
prefix lock. Ce préfixe permet entre autre de préciser au
processeur que la valeur de la cible ne peut pas être changer
pendant l'instruction. Dans ce cas, les instructions ne vont
rien préciser de plus sur l'ordre de lecture et écriture.
Ce qui est plutôt décevant.

La dernière version n'utilise même plus d'opérations atomiques
et fonctionne parfaitement. Cette version ne marche que parce
que les instructions MOV\* sont intrinsequement atomiques.

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

Normalement, un processeur optimisé pour aller lire
du cache de façon spéculative peut buter sur un spinlock.
Si les lectures et écritures sont ordonnés faiblement,
le processeur pourrait lire une valeur avant qu'elle
soit prête. Mais la plupart du temps, forcer l'ordre d'accès
à une adresse n'est pas traduit en instructions. Ce qui est
plutôt décevant. Car l'architecture ne permettrait simplement
pas de lecture spéculative. Celà dit, ça reste un bonne
pratique de faire tout comme et d'écrire un "programme
atomique" avec la plus forte réstriction possible.

Spécifier un ordre dans lequel les threads vont accéder à
une variable est possible dans quasiment tout les langages
permettant la parrallèlisation des executions.

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

fn main() {
    let boola = Arc::new(AtomicBool::from(false));
    let boolb = boola.clone();
    let vala = Arc::new(AtomicU32::default());
    let valb = vala.clone();
    std::thread::spawn(|| thread_a(boola, vala));
    let th = std::thread::spawn(|| thread_b(boolb, valb));
    let _ = th.join();
}
```

La figure ci-dessus est un exemple de synchronization. De la même
manière qu'un lock de mutex relaché dans un thread A puis aquis
dans un thread B, ce qui à été stoqué par le thread A est
visible par le thread B.

Une écriture avec un ordre atomique `Release` implique qu'aucune
écriture ou lecture dans le même thread ne peut être réorganiser
par le processeur. Que l'opération soit atomique ou non-atomique.
En plus, toute écriture dans une variable devient visible par
tout les autres threads voulant lire avec un ordre atomique `Acquire`.

Pour résumer simplement, val est comme protégé par un mutex. Cette
façon d'attendre activement l'accès à une ressource s'appel un spinlock.
Très utiles dans certains cas, et bien trop gourmant en ressource dans
d'autre.

Sans l'utilisation de lecture et écriture atomique, un programme
se risquera à un comportement indéfini. Et d'ailleurs en Rust ce
ne sera pas possible de l'écrire sans l'utilisation de code `unsafe`.

Les fonctions atomiques permettent aussi de lire et écrire
simultanement.

## L'état dans lequel je suis est en mémoire

Les états sont par défaut des constantes, statiques.
Ce choix technique découle du fait qu'en C, on doit
nettoyer. Je pense que j'aurai fait des choix différent
si j'avais du coder mon exemple en Javascript ou en
Bash. Après réflexion, je pense que ce n'est pas une
mauvaise idée d'imaginer sa machine à état avec des
états statiques. Mais ce n'ai pas toujours possible
ou même pratique.

Dans mon exemple, l'état dans lequel je suis est sur le
tas. C'est à dire que j'ai alloué de la mémoire pour
lui. Et comme je n'ai pas de runtime en C qui m'aide à
nettoyer, je dois le faire moi même. C'est pratique, car
de cette manière je peux vous montrer quelque chose de
très important: le passage d'un état à un autre.

Par défaut, les états sont des constantes, et changer
d'état est très simple. Lorsque la machine à état décide
de dépiler et de passer de A à B. Elle assigne bêtement
l'état courant à B. Sans nettoyer, ni verifier que A
est encore utilisé ou non.

```c
static void on_state_change(void **dst, void **src)
{
    *dst = *src;
}
```

Si je commence à écouter des entrées asynchrones, je
développe un serveur qui reçoit ses commandes via tcp.
Plusieurs thread, au moins deux, peuvent utiliser mon
état à tout moment de mon execution. C'est le prix que
j'ai à payer pour quelque chose d'efficace. Dans ce cas,
mon petit bout de code est **très très critique**.

Immaginons que pendant que je reçoivent une nouvelle
information la machine à état passe de l'état A à B.
Je me pose la question, si un autre thread
viens juste de modifier A, comment je fais pour
savoir si j'ai perdu une information ? Peut être que
mon état n'a plus de raison d'être ! J'aurai du passer
à l'état C.

L'exemple suivant montre une façon simple de proteger
mon état contre des accès simultanés. Evidemment,
chaque cas à sa spécificité. Pour mon exemple je
n'en ai pas besoin.

```c
void *locker(void *_, void *new_state)
{
    lock(&state_mutex);
    return new_state;
}

struct Reagir* state_machine()
{
    struct Reagir *re = use_reducer(
        locker,
        initializer
    );
    return re;
}

void my_on_state_change(void **dst, void **src)
{
    *dst = *src;
    unlock(&state_mutex);
}

void main()
{
    struct ReagirOpt opt;
    opt.on_state_change = my_on_state_change;
    create(state_machine, opt);
}
```

Dans mon cas, je souhaite allouer des états au lieu
d'utiliser des variables statiques ou des constantes,
c'est une source de fuite mémoire. Je peux nettoyer
au fur et à mesure en conservant un pointeur vers l'état
précédent, mais ce n'est pas si simple. Je peux nettoyer
parrallèlement, avec un methode de garbage collection.
Ou bien je redefinis cette fonction.

```c
void on_change_with_free(void **dst, void **src)
{
    free(*dst);
    *dst = *src;
}
```

## Implementation de Reagir

Au fond, la bibliotheque Reagir ne propose pas grand
chose. Elle propose d'améliorer notre façon de penser
une machine à état. L'usage que j'en ai présenté dans
les paragraphes précédents n'a pas d'importance. Ce qui
est intéressant, c'est qu'il est facile de décliner la
logique pour écrire des FSM, des parseurs, en bref, tout
type de machine à état.

La boucle principale est assez simple. Dès que je reçois
un nouvel état, provenant d'une file d'attente,
j'applique la fonction de réduction de ma machine à état.

```c
    while (1)
    {
        struct Reagir *re = r();
        if (NULL == re)
            break;
        struct __Entry e = receive_state(re);
        void *new_state = re->__reducer(re->state, e.arg);
        opt.on_state_change(&re->state, &new_state);
    }
```

## Récapitulatif

En lisant divers articles durant mes recherches, je n'ai pas pu
m'empêcher de faire le lien avec ce que Pierre Boule a si bien
décrit dans son oeuvre _La planette des singes_. J'ai eu l'impression
que les thèses écrites entre les années 1990 et 2010 ont eues un
impacte important. Elles déteingnent nettement sur les articles
techniques jusqu'en 2022. Et si elles n'en sont pas la source
d'inspiration, d'autres articles répètent encore et encore les
même choses.

Toujours avec une légère différence dû à la personnalité
de l'écrivain, les postes autours des sujets qui suivent sont
des immitations les unes des autres. Parfois, simplement, un
développeur curieux découvre, comme moi, comment fonctionnent
des outils qu'il utilise depuis une décénie. Je suis un bucheron
qui comprend comment marche une hache. J'espère que ça n'en
reste pas moins utile, qu'une forme de vulgarisation est parfois
nécessaire. En revanche, je ne voudrais pas me limiter à imiter
mes pères. Je souhaite tenter de combiner des connaissances
et m'essayer à la créativité. Bien que ma créativité n'aura
rien de novatrice et sera déjà venu à l'esprit des premiers
informaticiens, je serai plus heureux comme ça.
