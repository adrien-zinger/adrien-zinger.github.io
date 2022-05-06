/** static variable, all operations in the network */
let ops = [];
/** static variable, all nodes in the network */
let nodes = [];

function getColor() {
    const letters = '0123456789ABCDEF';
    var color = '#';
    for (let i = 0; i < 6; ++i) {
        color += letters[floor(random(0, 16))];
    }
    return color;
}

/**
 * Node prototype
 */
const _impl = {
    /**
     * Push a key in `node.ops_counter` if don't exist and increment the
     * counter.
     * @param {*} key ops key
     */
    insertOpKey(key) {
        // todo check if we can remove the lower rated if cache size overflow
        // todo optimize find with a map of known operation id
        if (this.owned.findIndex(e => e == key) > - 1) return;

        const index = this.known.findIndex(e => e[0] === key);
        index === -1 ? this.known.push([key, 0]) : this.known[index][1]++;
        this.known.sort((a, b) => a[1] > b[1])
    },
    /**
     * Inform the network about an existing color in `ops`.
     */
    inform() {
        if (PROD_PROB > random()) this.changeColor();
        if (this.owned_index >= this.owned.length) return;

        const rand = floor(random(1, MAX_SEND));
        let start = this.send_index;
        this.send_index = min(start + rand, this.conns.length);
        let end = this.send_index;
        for (let i = start; i < end; ++i) {
            let index = this.conns[i];
            this.drawLine(i, this.owned[this.owned_index]);
            nodes[index].insertOpKey(this.owned[this.owned_index]);
        }
        if (this.send_index + 1 >= this.conns.length) {
            this.owned_index++;
            this.send_index = 0;
        }
    },
    /**
     * Peek, retrieve the most famous color in the network!
     */
    peek() {
        if (this.known.length === 0) return;
        const i = this.known.pop();
        // experience, we can test also to just update the status
        // without the check if latest ops.
        this.setStatus(i[0]);
        this.owned.push(i[0]);
    },
    _set_latest_status(index) {
        if (this.max < index) {
            this.status = ops[index];
            this.max = index;
        }
    },
    setStatus(index) {
        this.status = ops[index];
    },
    /**
     * Push a new color into the set
     */
    changeColor() {
        const color = getColor();
        ops.push(color);
        this.owned.push(ops.length - 1);
        this.status = color;
    },
    /**
     * Compute the distance between `this` and `node`
     * @param {*} node target node
     */
    dist(node) {
        // floor(  √[(x2 − x1)2 + (y2 − y1)2]  )
        return sqrt(pow(this.pos[0] - node.pos[0], 2) + pow(this.pos[1] - node.pos[1], 2));
    },
}

const Node = {
    /**
     * Create a new nodes connected with the node indexes in `conns`
     * @param {*} conns connection list, usually [0, 1, 2, ...N]
     * @returns 
     */
    new(index) {
        let node = {
            // index of the node in nodes, used in setup
            index,
            // graphical position in the canvas, doesn't impact latencies
            pos: [floor(random(10, 590)), floor(random(10, 390))],
            // List of connection, shuffle to simulate randomization of
            // connection latency
            conns: [],
            // Status defined by the latest color a node peeked
            status: "#000000",
            // list of colors index (in ops) the node has peeked
            owned: [],
            // colors a node know in the network,
            // filled by `insertOpKey` and pop when
            // a node is get. The list looks like [[color_index], []...]
            known: [],
            // index in conns, of the latest node we inform about the
            // `owned[owned_index]` color.
            send_index: 0,
            // index in owned, indicate which one a node should propagate
            // increment monotonically.
            owned_index: 0,
            // max index color
            max: -1,
        };
        Object.setPrototypeOf(_impl, _graphical);
        Object.setPrototypeOf(node, _impl);
        return node;
    },

    connections() {
        let r = range(0, NODE_NUMBER);
        nodes.forEach(node => {
            let s = r.sort((a, b) => node.dist(nodes[a]) - node.dist(nodes[b]));
            node.conns = s.slice(0, MAX_CONNS);
        });
    }
}

function range(b, e) {
    let arr = [];
    for (let i = b; i < e; ++i)
        arr.push(i);
    return arr;
}