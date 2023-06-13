import Renderer from "./renderer.js";
import Keyboard from "./keyboard.js";
import Speaker from "./speaker.js";
import CPU from "./cpu.js";

const render = new Renderer(10);
const keyboard = new Keyboard();
const speaker = new Speaker();
const cpu = new CPU(render, keyboard, speaker);

let loop;
let fps = 60, fpsInterval, startTime, now, then, elapsed;

function init() {
    fpsInterval = 1000 / fps;
    then = Date.now();
    startTime = then;

    cpu.loadSpritesIntoMemory();
    cpu.loadRom('TETRIS');

    loop = requestAnimationFrame(step);
}

function step() {
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        // Cycle CPU
        cpu.cycle();
    }

    loop = requestAnimationFrame(step);
}

init();