function setup() {
    let canvas = createCanvas(600, 400);
    canvas.parent('can');
    const N = NODE_NUMBER;
    for (let i = 0; i < N; ++i) {
        let node = Node.new(i);
        nodes.push(node);
    }
    frameRate(FRAME_RATE);
    Node.connections();
}

function draw() {
    noStroke();
    clear();
    background("#181818");
    nodes.forEach((node, index) => {
        node.inform();
        node.peek();
        node.draw();
    });
}