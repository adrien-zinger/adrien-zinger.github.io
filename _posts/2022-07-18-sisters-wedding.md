---
layout: default
title:  "Sister's wedding"
description: "
I'm happy to inform you, that my sister is getting to be married!! Speaking
with her, we started to talk about the problem of placing people. How to
prepare a table plan?! Then I started to write a funny naive genetic algorithm...
"

authors: ["Adrien Zinger"]
scripts: "
<script src=\"/assets/js/wedding/user-input.js\"></script>
<link rel=\"stylesheet\" href=\"/assets/css/sisters-wedding.css\" >
<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css\" integrity=\"sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm\" crossorigin=\"anonymous\">
"
comments_id: 10
---


# Sister's wedding
<span style="color: #A0A0A0">[2022-07-18] \#Rust \#GeneticAlgorithm \#WASM

> Article is being checked ;) but readable!

---

## Live snippet

Full result at the end of the article ;)

<div class="container-fluid">
    <div class="row">
        <div class="col">
            <div class="input-group mb-3">
                <input
                    id="input-names"
                    type="text"
                    class="form-control"
                    placeholder="Name"
                    aria-label="Name"
                    aria-describedby="input-name"
                    >
            </div>
            <ul class="list-group">
                <li id="name1" class="list-group-item active"></li>
                <li id="name2" class="list-group-item"></li>
                <li id="name3" class="list-group-item"></li>
                <li id="name4" class="list-group-item"></li>
            </ul>
        </div>
        <div class="col">
            <div class="input-group mb-3">
                <input
                    id="input-bonus"
                    type="text"
                    class="form-control"
                    placeholder="Bonus"
                    aria-label="Bonus"
                    aria-describedby="input-bonus"
                    >
            </div>
            <ul id="bonus" class="list-group">
                <li id="bonus1" class="list-group-item active"></li>
                <li id="bonus2" class="list-group-item"></li>
                <li id="bonus3" class="list-group-item"></li>
                <li id="bonus4" class="list-group-item"></li>
            </ul>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <div class="input-group mb-3">
                <input
                    id="input-penalties"
                    type="text"
                    class="form-control"
                    placeholder="Penalties"
                    aria-label="Penalties"
                    aria-describedby="input-penalties"
                    >
            </div>
            <ul id="penalties" class="list-group">
                <li id="penalties1" class="list-group-item active"></li>
                <li id="penalties2" class="list-group-item"></li>
                <li id="penalties3" class="list-group-item"></li>
                <li id="penalties4" class="list-group-item"></li>
            </ul>
        </div>
        <div class="col">
            <div class="input-group mb-3">
                <input
                    id="input-result"
                    type="text"
                    class="form-control"
                    placeholder="Result"
                    disabled
                    style="background-color: transparent !important; color: white !important"
                    >
            </div>
            <ul id="result" class="list-group">
                <li
                    id="result1"
                    class="list-group-item active"
                    style="color: grey !important;"
                >.</li>
                <li
                    id="result2"
                    class="list-group-item"
                    style="color: grey !important;"
                >.</li>
                <li
                    id="result3"
                    class="list-group-item"
                    style="color: grey !important;"
                >.</li>
                <li
                    id="result4"
                    class="list-group-item"
                    style="color: grey !important;"
                >.</li>
            </ul>
        </div>
    </div>
    <div class="row">
        <button type="button" class="btn btn-primary" onClick="reset()">Reset</button>
    </div>
</div>

---
<br />

## My sister is getting married!

We're talking about serious things!!
  
Talking with my sister, we spoke about some people at the wedding that
cannot be together at the table. Then, we felt about the problem, how to
correctly place people? For example, I want to be with my girlfriend and
my daughter, but Barney wants to be with his crush, who doesn’t want
to speak with that ex-best friend! Multiply that kind of story by 100,
and you finish with a wedding burnout.


<img style="max-width: 500px;" src="{{site.baseurl | prepend: site.url}}/assets/img/bureaucracy.gif" alt="crack" />

One of the firsts _little easy algorithm_ I learned is the genetic one.
And May be it can help my sister to do his table plan... I'll do a special article
with a code snippet.

## Code

A genetic algorithm is just a smart method to bruteforce a problem like the
famous “Traveling salesman”. You’ll never be sure that the result is the
best. Nevertheless, you’ll have a better result than an approximation, and
in a reasonable time.

I'm not going to explain step by step the principle of the genetic method. If
you're interested, you can look at these videos of [The coding train channel](https://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=&cad=rja&uact=8&ved=2ahUKEwjnoJme_oH5AhUzh_0HHTNmAwkQwqsBegQIEhAB&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D9zfeTw-uFCw&usg=AOvVaw2r19VpTmdolkAXJpaZDJv7).

I propose to show, how with perhaps 200 lines of rust I can write a web library
with a genetic algorithm, specific for a table's plan.

### Types

When I start a genetic algorithm, I like to start with the definition of
DNA. An option for our case is to use a vector of tables and store
the names of the participants.

```rust
type Dna = Vec<Vec<String>>;
```

To judge an ADN, we need to create some penalties and some
bonuses. Penalties are applied when two participants that
are not “compatible” are in the same table. I give bonuses
in the same way.

Penalty key: two names separated with a coma in alphabetical order.
Penalty value: value of the penalty. (0 to 255)


```rust
pub type Penalties = HashMap<String, u8>;
pub type Bonus = HashMap<String, u8>;
```

Number of people in the population. I Don't need many, 100 is more
than enough. If we want a better result we prefer to increase the number of
generations.

```rust
static N: usize = 100;
```


### Evaluation

There is no genetic algorithm without evaluations! The function will
compute a value from a DNA, then we will order the bests rated candidates
and merge them together.

The evaluation can be very naive! If two people with a bonus are at
the same table, we add the bonus's value. If two people with a penalty
are at the same table, we subtract the penalty's value (all of that
in the range of an unsigned 32 bits integer)

```rust
pub fn evaluation(dna: &Dna, penalties: &Penalties, bonus: &Bonus) -> u32 {
    let mut ret = 0i64;
    for table in dna {
        let couples =
            HashSet::<String>::from_iter(table.iter().combinations(2).map(|c| couple(c[0], c[1])));
        for couple in couples.iter() {
            ret += 1;
            if let Some(v) = bonus.get(couple) {
                ret = ret.saturating_add(*v as i64);
            } else if let Some(v) = penalties.get(couple) {
                ret = ret.saturating_sub(*v as i64)
            }
        }
    }
    match ret.try_into() {
        Ok(ret) => ret,
        _ => 0,
    }
}
```

### Merging (reproduction)

Once you have a population (the list of DNAs), and you have evaluated each
person. You can order them and "merge" the half of the bests between them.

To merge two DNAs, you call that function. It will shuffle some places and
create a new random one.

What do I try to do? First, if `a` and `b` are equals, I just return `a` and
avoid useless execution of codes. Then I take the table length, in theory,
there shouldn't be a problem here to take the first element of `a`.

Then I flatten the names. I have to list of names ordered by there position in
the wedding. At the position `0`, we have the name of the person at table 1
place 1. At position `1`, we have the name for table 1, position 2, etc.

I can shuffle manually the places, taking randomly the piece of DNA from the
parent `a`, or from the parent `b`. As it would work in the real life I
guess.

Note that I also add a possibility to create a random DNA from nowhere.
That's a natural mutation that will add a natural branch of evolution
if it's very good, or just die at the next generation. Sad, but life can be
terrible.

To keep coherency, if you choose the one from the parent `a`,
I need to say that `b` should replace the chosen name by the other.

In other words, for each element in the DNA, I choose to use the second
element or restore the first element.

Note: there is probably a lot of cloning that I can avoid! If you want to
share an idea you can post a comment ;)

```rust
pub fn merge(a: &Dna, b: &Dna) -> Dna {
    if a == b {
        return a.clone();
    }
    let table_length = a[0].len();
    let mut a: Vec<String> = a.iter().flatten().cloned().collect();
    if rand::random::<u8>() > 254 {
        return random(a, table_length);
    }
    let b: Vec<String> = b.iter().flatten().cloned().collect();

    let mut rng = rand::thread_rng();
    let mut pos =
        HashMap::<String, usize>::from_iter(a.iter().enumerate().map(|(i, v)| (v.clone(), i)));
    let mem = a.clone();

    for i in 0..a.len() {
        let n = match rng.gen() {
            true => b[i].clone(), // replace
            _ => mem[i].clone(),  // restore
        };
        let pn = *pos.get(&n).unwrap();
        let o = a[i].clone();
        a[i] = n.clone();
        a[pn] = o.clone();
        pos.insert(n, i);
        pos.insert(o, pn);
    }
    a.chunks(table_length).map(|t| t.to_vec()).collect()
}
```


### Start and run the simulation!

Obviously, when we will get a list of participant, I want to create a
population for my experience. So I'll call that `random` method that will
create a new DNA from a list of names and a table length.

Ill call that function N times, I don't need so much, 100 would be great

```rust
pub fn random(mut people: Vec<String>, table_length: usize) -> Dna {
    people.shuffle(&mut rand::thread_rng());
    people.chunks(table_length).map(|t| t.to_vec()).collect()
}
```

Now, we have everything, I can run the genetic algorithm. I take in input a
population, some penalties, some bonus, the number of participants in a
table. And a log function to report the progression in a callback.

The `times` input significate the number of generations of the genetic
evolution.

I also want to return the latest bests DNA in my population. As well, I can
call `run` or `rerun`, where run will create a random population, and rerun
will use a population in input (and that is convenient that the input is
the previous bests returned by `run`).

```rust
fn intern_run(
    times: usize,
    mut population: Vec<Dna>,
    penalties: Penalties,
    bonus: Bonus,
    log: fn(Vec<Vec<String>>, usize),
) -> Vec<Dna> {
    let mut rng = rand::thread_rng();
    let mut ret: Vec<Dna> = vec![];
    for i in 0..times {
        let bests: Vec<&Dna> = population
            .iter()
            .sorted_by_cached_key(|dna| Reverse(evaluation(dna, &penalties, &bonus)))
            .take(N / 2)
            .collect();
        log(
            bests[0].clone(),
            evaluation(bests[0], &penalties, &bonus) as usize,
        );
        if i == times - 1 {
            ret = bests.iter().cloned().cloned().collect();
        }
        population = (0..N)
            .map(|_| {
                merge(
                    bests[rng.gen_range(0..N / 2)],
                    bests[rng.gen_range(0..N / 2)],
                )
            })
            .collect();
    }
    ret
}
```

Then some bindings with wasm-bindgen and I do the glue! Easy like that! You can
use the package, since there is no multithreading, and no thread locks, it compile
_like a charm_. The _JSON_ serialization could be modified I think, creating more
glue manually, but not now!!

```rust
#[wasm_bindgen]
pub fn run(
    times: usize,
    people: String,
    penalties: String,
    bonus: String,
    table_length: usize,
) -> String {
    let _: HashMap<String, u8> = match serde_json::from_str(&penalties) {
        Ok(p) => p,
        Err(e) => {
            elog(&e.to_string());
            panic!()
        }
    };
    serde_json::to_string(&algo::run(
        times,
        serde_json::from_str(&people).unwrap(),
        serde_json::from_str(&penalties).unwrap(),
        serde_json::from_str(&bonus).unwrap(),
        table_length,
        |dna, e| {
            #[allow(unused_unsafe)]
            unsafe {
                log_best(serde_json::to_string(&dna).unwrap(), e)
            }
        },
    ))
    .unwrap()
}
```


Thank you for reading! I'll share soon the full code of the project. Bellow
you can look at the full result of the computed table plan. The time you read
that, a lot of generations have lived and now, you have one of the best
possible proposal!

You can create you're own list of participants by resetting the example, and
adding the names (press enter to add a name), and adding bonus / penalty
(name1 [space] name2, [number value]). Note that it probably work better if
you prefer to use more bonus than penalties.

Good day!

<img style="max-width: 500px;" src="{{site.baseurl | prepend: site.url}}/assets/img/wedding.gif" alt="wedding" />

<script type="module">

    import init, {run, rerun} from "/assets/js/wedding/sisters_wedding.js";
    let bests;

    function call_run() {
        if (names.length == 0) {
            return;
        }
        orderNames();
        bests = run(
            40,
            JSON.stringify(names),
            JSON.stringify(penalties),
            JSON.stringify(bonus),
            5
        );
        change = false; // set relaunch flag to false
    }

    let rerun_count = 0;
    function call_rerun() {
        orderNames();
        if (change || rerun_count > 10) {
            call_run();
            rerun_count = 0;
        } else {
            rerun_count++;
            bests = rerun(
                40,
                bests,
                JSON.stringify(penalties),
                JSON.stringify(bonus)
            );
        }
        setTimeout(call_rerun, 2000);
    }

    init().then(() => {
        call_run();
        setTimeout(call_rerun, 2000);
    });
</script>


<div class="container-fluid">
    <div class="row">
        <div class="col">
            <ul id="full-result" class="list-group">
            </ul>
        </div>
    </div>
</div>
