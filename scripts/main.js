// Project:  Doodlecap
// Author: John Lynch
// Date: Nov. 2019
// File: fourier/scripts/main.js

const range = (m, n) => [...function* (p, q) {
    while (p < q) yield p++;
}(m, n)];

const W = document.body.offsetWidth;
const H = document.body.offsetHeight;

const canv = document.getElementById(`canv`);
const pixel_list = document.getElementById(`pixel-values`)
canv.width = W;
canv.height = H * 0.857142857;
const ctx = canv.getContext("2d");   // get a graphics context
ctx.fillStyle = `#ff8800`;
// let imgData = ctx.createImageData(W, H); // create an ImageData object, which is an array-like thing
let dragging = false;

let xs = [];
let ys = [];
let doodles = [];
let timer;

canv.addEventListener(`mousedown`, dragStartHandler);
document.addEventListener('keyup', processKeys);

function dragStartHandler(ev) {
    dragging = true;
    let pixel = getMousePos(canv, ev);
    pushPixel(pixel.x, pixel.y);
    canv.addEventListener(`mousemove`,  ev => {
        if (dragging) {
            const pixel = getMousePos(canv, ev);
            pushPixel(pixel.x, pixel.y);
        }
    });
    document.addEventListener("mouseup", dragFinishedHandler);
}

function pushPixel(x, y) {
    xs.push(x);
    ys.push(y);
    ctx.fillRect(x, y, 4, 4);
}


function getMousePos(elem, ev) {       // got from https://codepen.io/chrisjaime/pen/lcEpn; takes a canvas and an event (mouse-click)
    var bounds = elem.getBoundingClientRect();
    return {
        x: ev.clientX - bounds.left,
        y: ev.clientY - bounds.top
    };
}

function dragFinishedHandler(ev) {
    dragging = false;
    pixel_list.innerText = `xs = [${xs}]${'\n'}ys = [${ys}]`;
}

// KEYBOARD HANDLING

function processKeys(e) {       // trap keyboard input; takes an event
    var key = e.key || e.keyCode;   // keyCode is an older standard
    if (key >= '0' && key <= '9') {
        replay(Number(key));
    }
    switch (key) {
        case " ":
            pixel_list.innerText = ``;
            xs.length = 0;
            ys.length = 0;
            clearInterval(timer);
            ctx.clearRect(0, 0, W, H);
            break;
        case "s":
            save();
            break;
        case "a":
            replay(-1);     // paint all doodles
            break;       
    }
}

function save() {
    console.log(`Saving doodle at index ${doodles.length}`);
    doodles.push([[...xs], [...ys]]);
}

function replay(n = 0) {
    const dl = doodles.length;
    if (n >= dl) {
        console.log(`*** WARNING *** ${n} is too big.   You only have ${dl} doodles saved.`);
        return;
    }
    if (n < -1) {
        console.log(`*** WARNING *** ${n} is negative.   Sorry, negative indices not implemented.`);
        return;
    }
    ctx.clearRect(0, 0, W, H);        
    let i = -1;
    timer = setInterval( _ => {
        if (n >= 0) {
            ctx.fillRect(doodles[n][0][++i], doodles[n][1][i], 4, 4);
        }
        else {      // paint all
            range(0, dl).forEach(n => {
                ctx.fillRect(doodles[n][0][++i], doodles[n][1][i], 4, 4);
            });
        } 
    }, 1);
}
