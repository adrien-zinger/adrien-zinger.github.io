let names = [
    "Jose", "Adrien", "Fabrice", "Mickael", "Christine",
    "Marise", "Ray", "Moha", "Alcest", "Hugo",
    "Miriame", "Alan", "Claude", "Claudine", "Jean",
    "Simone", "Seb", "Salome", "Sidonie", "Richard",
    "Johny", "Julien", "Valerie", "Viviane", "Joskin",
    "Rayan", "Louise", "Lili", "Louane", "Youssef",
    "Antoine", "Charles", "Luc", "Gael", "Gilette",
    "Stephanie", "Manon", "Thomas", "Paul", "Yolanda",
    "Lazar", "Helene", "George", "Kevin", "Margerite",
    "Ninon", "Marc", "Lorent", "Noel", "Bruno",
    "Gab", "Jeanne", "Timote", "Elinor", "Amina",
    "Karl", "Ilia", "Alexia", "Axel", "Wanda",
    "Will", "Jenny", "Mathieu", "Francois", "Leo",
    "Pierre", "Uliana", "Zaida", "Jerome", "Laure",
];

let bonus = {
    "Jose Seb": 3,
    "Jose Laure": 3,
    "Laure Wanda": 5,
    "Ilia Jose": 5,
    "Mathieu Noel": 4,
    "Viviane Yolanda": 3,
    "Antoine Moha": 1,
    "Antoine George": 2,
    "Pierre Uliana": 20,
    "Moha Ray": 3,
    "Richard Sidonie": 1,
    "Claude Mickael": 4,
    "Adrien Christine": 3
};

let penalties = {
    "Jose Wanda": 2,
    "Francois Leo": 4,
    "Jean Jeanne": 1,
    "Helene Thomas": 50,
    "Alexia Noel": 50,
    "Kevin Adrien": 5,
    "Bruno Margerite": 4,
    "Moha Richard": 3,
    "Alan Fabrice": 2,
    "Fabrice Moha": 2,
    "Alan Moha": 2,
    "Alcest Seb": 4,
};

let score_max = 0;
let change = true;

function toInt(x) {
    const parsed = parseInt(x);
    if (isNaN(parsed) || parsed < 0)
        return false;
    return parsed;
}

function inputValidation(val, target) {
    let b = val.split(',');
    if (b.length != 2) {
        return false;
    }
    let n = b[0].split(' ');
    if (n.length != 2) {
        return false;
    }
    if (!names.includes(names[0]
        || !names.includes(names[1]))
        || n[0] == n[1]) {
        return false;
    }
    const v = toInt(b[1]);
    if (!v) {
        return false;
    }
    let na = n[0] > n[1] ? `${n[1]} ${n[0]}` : `${n[0]} ${n[1]}`
    target[na] = v;
    return true;
}

window.addEventListener("load", () => {
    document.getElementById('input-names').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            let name = document.getElementById("input-names").value.trim().replaceAll(' ', '-');
            if (!names.includes(name)) {
                names.unshift(name)
                updateLists();
                document.getElementById("input-names").value = '';
            }
        }
    });
    document.getElementById('input-bonus').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            let val = document.getElementById("input-bonus").value.trim();
            if (inputValidation(val, bonus)) {
                document.getElementById("input-bonus").value = '';
                updateLists();
            }
        }
    });
    document.getElementById('input-penalties').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            let val = document.getElementById("input-penalties").value.trim();
            if (inputValidation(val, penalties)) {
                document.getElementById("input-penalties").value = ''
                updateLists();
            }
        }
    });
    updateLists();
});

function orderNames() {
    names = names.filter(name => !name.includes('Nobody'));
    if (names == 0) {
        return false;
    }
    let i = 1;
    while (names.length % 5 != 0) {
        names.push('Nobody' + i)
    }
}

function updateLists() {
    orderNames();
    change = true;

    document.getElementById('name1').innerText = names[0] ? names[0] : '.';
    document.getElementById('name2').innerText = names[1] ? names[1] : '.';
    document.getElementById('name3').innerText = names[2] ? names[2] : '.';
    document.getElementById('name4').innerText = names.length > 3 ? '...' : '.';

    let b = Object.keys(bonus);
    document.getElementById('bonus1').innerText = b[0] ? b[0] + ', ' + bonus[b[0]] : '.';
    document.getElementById('bonus2').innerText = b[1] ? b[1] + ', ' + bonus[b[1]] : '.';
    document.getElementById('bonus3').innerText = b[2] ? b[2] + ', ' + bonus[b[2]] : '.';
    document.getElementById('bonus4').innerText = b.length > 3 ? '...' : '.';

    let p = Object.keys(penalties);
    document.getElementById('penalties1').innerText = p[0] ? p[0] + ', ' + penalties[p[0]] : '.';
    document.getElementById('penalties2').innerText = p[1] ? p[1] + ', ' + penalties[p[1]] : '.';
    document.getElementById('penalties3').innerText = p[2] ? p[2] + ', ' + penalties[p[2]] : '.';
    document.getElementById('penalties4').innerText = p.length > 3 ? '...' : '.';

    document.getElementById('input-result').placeholder = 'Result';
    document.getElementById('result1').innerText = '.';
    document.getElementById('result2').innerText = '.';
    document.getElementById('result3').innerText = '.';
    document.getElementById('result4').innerText = '.';
    max = 0;
}

let max = 0;

function printBest(v, e) {
    if (e > max) {
        max = e;
        let ttBonus = 0;
        Object.values(bonus).forEach(v => ttBonus += v);
        let table_length = names.length / 5;
        let n = names.length / table_length;
        score_max = (((n + 1) * n) / 2) * table_length + ttBonus;
        let tables = JSON.parse(v);
        document.getElementById('input-result').placeholder = 'Result: ' + ((e / score_max) * 100).toFixed(2) + '%';
        console.log(tables);
        document.getElementById('result1').innerText = tables[0] ? 'Table 1: ' + tables[0].join(', ').slice(0, 15) + '...' : '.';
        document.getElementById('result2').innerText = tables[1] ? 'Table 2: ' + tables[1].join(', ').slice(0, 15) + '...' : '.';
        document.getElementById('result3').innerText = tables[2] ? 'Table 3: ' + tables[2].join(', ').slice(0, 15) + '...' : '.';
        document.getElementById('result4').innerText = tables.length > 3 ? '...' : '.';
	printFullResult(tables)
    }
}

function printFullResult(tables) {
	let res = ''
	for (let i = 0; i < tables.length; i++) {
		res += `<li
                    class="list-group-item active"
                    style="color: white !important;"
                >Table ${i + 1}: ${tables[i].join(', ')}</li>`;
	}
	document.getElementById('full-result').innerHTML = res;
}


function reset() {
    names = [];
    penalties = {};
    bonus = {};
    max = 0;
    updateLists();
}
