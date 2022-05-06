const NODE_NUMBER = 200; // number of nodes in the network
const MAX_CONNS = 50; // max number of other nodes a node can be connected to
const MAX_SEND = 20; // max _POST_ send by salve (for the time simulation)

// probability that a node produce a command (voluntary low for the
// simulation, it's more hypnotic)
const PROD_PROB = 0.0002;
const FRAME_RATE = 14; // p5 framerate.