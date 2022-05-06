/**
 * Prototype of the graphical features of the node
 */
const _graphical = {
    _d: 4,

    /**
     * Draw the point
     */
    draw() {
        this.pos[0] += randomGaussian(0, 1 / this._d);
        this.pos[1] += randomGaussian(0, 1 / this._d);
        fill(this.status);
        ellipse(this.pos[0], this.pos[1], 10, 10);
    },

    drawLine(n, o) {
        //if (this.index !== 0) return;
        stroke(ops[o] + '33');
        line(nodes[n].pos[0], nodes[n].pos[1], this.pos[0], this.pos[1]);
    }
};