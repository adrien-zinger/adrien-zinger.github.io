/**
 * Interactive form and chart events / logic.
 */
let items = document.querySelectorAll('.chart li');
let legend = document.getElementById('legend');

function calculateElapsedTime(from, to) {
  const diff = to.getTime() - from.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24 * 7));
}

function draw(start, end, options) {
  for (var i = start; i < end; i++) {
    if (options.color) items[i].style.backgroundColor = options.color;
    if (options.border) items[i].style['border-color'] = options.border;
  }
}

const birthday = new Date("1992", "16", "12");
let life_in_json = [
  // periodes
  {
    id: 2,
    from: new Date("2010", "8", "1"),
    to: new Date("2021", "7", "15"),
    title: "Writing in C++",
    tag: '<i><b>Computer science</b></i> 🖥️',
    options: {
      color: '#29779b',
      border: 'black'
    }
  },
  {
    id: 3,
    from: new Date("2012", "8", "1"),
    to: new Date("2016", "9", "10"),
    title: "Studies & informatics engineering 📚",
    tag: '<i><b>Computer science</b></i> 🖥️',
    options: {
      color: '#29779b',
      border: '#00ff4c78'
    }
  },
  {
    id: 4,
    from: new Date("2017", "3", "1"),
    to: new Date("2021", "1", "30"),
    title: "Computer scientist at <i><a href=\'https://www.eos-imaging.com/\'>EOS Imaging</a></i>",
    tag: '<i><b>Work Experience</b></i> 💼',
    options: {
      color: '#29779b',
      border: '#00cfffe8'
    }
  },
  {
    id: 5,
    from: new Date("2021", "7", "15"),
    to: new Date("2022", "4", "25"),
    title: "Writing in C++ and 🦀 <i>Rust</i>",
    tag: '<i><b>Computer science</b></i> 🖥️',
    options: {
      color: 'rgb(157, 50, 17)',
      border: 'black'
    }
  },
  {
    id: 6,
    from: new Date("2021", "4", "1"),
    to: new Date("2021", "9", "30"),
    title: "Computer scientist & frontend developer at <i><a href='https://www.alpenite.com/'>Alpenite</a></i>",
    tag: '<i><b>Work Experience</b></i> 💼',
    options: {
      border: '#ff006c85'
    },
  },
  {
    id: 7,
    from: new Date("2021", "10", "30"),
    to: new Date("2022", "4", "25"),
    title: "Computer scientist at <i><a href='https://massa.net/'>Massa Labs</a></i>",
    tag: '<i><b>Work Experience</b></i> 💼',
    options: {
      border: '#f00'
    },
  },
  {
    id: 12,
    from: new Date("2021", "8", "30"),
    to: new Date(),
    title: "Working on distributed/decentralized networking",
    tag: '<i><b>Computer science</b></i> 🖥️',
    options: {},
  },

  // dates
  {
    id: 1,
    from: birthday,
    to: new Date("2010", "8", "1"),
    tag: '<i><b>Important dates</i></b>',
    title: "🎶 Childhood in France & insouciance :-) 🎶",
    options: {
      color: 'rgb(92, 123, 101)',
      border: 'black'
    }
  },
  {
    id: 8,
    from: new Date("2008", "8", "10"),
    to: new Date("2008", "8", "19"),
    title: "Get my first computer",
    description: "Broke my config <i>N</i> times, discover <i>diablo II!!!</i>",
    tag: '<i><b>Important dates</i></b>',
    options: {
      color: '#d9e09b',
      border: 'black'
    }
  },
  {
    id: 9,
    from: new Date("2016", "8", "10"),
    to: new Date("2016", "8", "14"),
    title: "Publish my first article",
    description: "It was an article that I can share you about the study of a non-relational database",
    tag: '<i><b>Important dates</i></b>',
    options: {
      color: '#a3ff00',
      border: 'black'
    }
  },
  {
    id: 11,
    from: new Date("2021", "3", "20"),
    to: new Date("2021", "3", "27"),
    title: "Transfer to <i>Italy, Venezia</i> 🍕",
    tag: '<i><b>Important dates</i></b>',
    options: {
      color: '#cbb8ff',
      border: 'black'
    }
  },
  {
    id: 14,
    from: new Date("2016", "9", "10"),
    to: new Date("2016", "9", "17"),
    title: "Get graduated from <i>Epita!!</i>",
    tag: '<i><b>Important dates</i></b>',
    options: {
      color: 'rgb(255, 131, 131)',
      border: 'rgb(255, 131, 131)'
    }
  },
  {
    id: 15,
    from: new Date("2022", "4", "16"), //real date :-)
    to: new Date("2022", "4", "25"),
    title: "Became a father",
    tag: '<i><b>Important dates</i></b>',
    options: {
      color: 'rgb(249, 107, 77)',
      border: 'rgb(249, 107, 77)'
    }
  },
]
var groupBy = function (xs, key) {
  return xs.reduce(function (rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};
function reset(id) {
  let filtered;
  life_in_json.forEach(i => {
    if (i.id == id) {
      filtered = i;
      return;
    }
    let from = calculateElapsedTime(birthday, i.from);
    let to = calculateElapsedTime(birthday, i.to);
    draw(from, to, i.options);
  });
  if (filtered) {
    let from = calculateElapsedTime(birthday, filtered.from);
    let to = calculateElapsedTime(birthday, filtered.to);
    draw(from, to, { color: 'white', border: 'white' });
    items[0].scrollIntoView({ behavior: "smooth" });
  }
}
reset();
const groups = groupBy(life_in_json, 'tag');
Object.keys(groups).forEach(key => {
  if (key == 'undefined') return;
  let items = groups[key].sort((a, b) => a.from - b.from).map(i =>
    `<li onclick="reset(${i.id})" style="cursor: zoom-in;">
      <div style="width: 10px;
        height: 10px;
        ${i.options.color ? `background-color: ${i.options.color};` : ''}
        ${i.options.border ? `border-color: ${i.options.border};` : ''}
        border-style: solid;
        border-width: 1px;
        float: left;
        margin-right: 5px"
      ></div>
      <pre style="margin-bottom:${i.description ? '2' : '5'}px; white-space: inherit;">${i.title}</pre>
      ${i.description ? `<pre style="
        white-space: inherit;
        text-indent:20px;
        margin-bottom: 5px"
      >${i.description}</pre>` : ''}
    </li>`);
  legend.innerHTML += `<li><pre style="margin-bottom: 2px;">${key}</pre><ul>${items.join('')}</ul></li>`
});
