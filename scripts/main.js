// Project:  Doodlecap
// Author: John Lynch
// Date: Nov. 2019
// File: fourier/scripts/main.js

const randInt = n => Math.floor(n * Math.random());
const range = (m, n) => [...function* (p, q) { while (p < q) yield p++; }(m, n)];

document.onreadystatechange = _ => {
    if (document.readyState === `complete`) {        

        const W = document.body.offsetWidth;
        const H = document.body.offsetHeight;
        let xcentre = ~~(W / 2);
        let ycentre = ~~(H * 0.428571429);
        let apos;

        const canv = document.getElementById(`canv`);
        const pixel_list = document.getElementById(`pixel-values`)
        canv.width = W;
        canv.height = H * 0.857142857;
        const ctx = canv.getContext("2d");   // get a graphics context
        ctx.fillStyle = `#ff8800`;
        // let imgData = ctx.createImageData(W, H); // create an ImageData object, which is an array-like thing
        let dragging = false;
        let cp_visible = false;

        const temp = document.getElementsByTagName(`template`)[0];
        var colpicker, col_input;

        let xs = [];
        let ys = [];
        let doodles = [];
        let timer;

        canv.addEventListener(`mousedown`, dragStartHandler);
        document.addEventListener('keyup', processKeys);

        function dragStartHandler(ev) {
            dragging = true;
            xs.push(ctx.fillStyle);
            ys.push(`*`);            
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
            let key = e.key || e.keyCode;   // keyCode is an older standard
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
                case `s`:
                    save();
                    break;
                case `a`:
                    replay(-1);     // paint all doodles
                    break;
                case `c`:
                    show_color_picker();     // paint all doodles
                    break;
                case `Escape`:
                    hide_color_picker();
                    break;
                case `l`:
                    ant(131072);
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
            timer = n >= 0 ? setInterval(_ => {
                const x = doodles[n][0][++i];
                const y = doodles[n][1][i];
                if (isNaN(x)) {
                    if (typeof(x) == `string` 
                        && x.startsWith(`#`) 
                        && x.length == 7 
                        && !isNaN(parseInt(x.slice(1), 16))) {
                            ctx.fillStyle = x;
                    }
                }
                else {
                    ctx.fillRect(x, y, 4, 4);
                }
            }, 0)
                           : setInterval(_ => {
                range(0, dl).forEach(n => {
                    const x = doodles[n][0][++i];
                    const y = doodles[n][1][i];
                    if (isNaN(x)) {
                        if (typeof(x) == `string` 
                            && x.startsWith(`#`) 
                            && x.length == 7 
                            && !isNaN(parseInt(x.slice(1), 16))) {
                                ctx.fillStyle = x;
                        }
                    }
                    else {
                        ctx.fillRect(x, y, 4, 4);
                    }
                });
            }, 0);
        }

        function show_color_picker() {
            if (cp_visible) return;
            cp_visible = true;
            colpicker = document.importNode(temp.content, true);
            col_input = colpicker.querySelector(`input`);
            col_input.value = ctx.fillStyle;
            document.body.appendChild(colpicker);
        }

        function hide_color_picker() {
            if (!cp_visible) return;
            cp_visible = false;
            xs.push(ctx.fillStyle = col_input.value);
            ys.push(`*`);            
            document.body.removeChild(document.getElementById(`col-picker`));
        }

        function ant(n) {
            xs.length = 0;
            ys.length = 0;
            apos = [xcentre, ycentre];
            for (i = 0; i < n; i++) {
                const x = apos[0] + randInt(3) - 1;
                const y = apos[1] + randInt(3) - 1;
                if (x >= 0 && x < 2 * xcentre) {
                    apos[0] = x;
                }
                if (y >= 0 && y < 2 * ycentre) {
                    apos[1] = y;
                }
                xs.push(apos[0]);
                ys.push(apos[1]);
                ctx.fillRect(x, y, 1, 1);
            }
            pixel_list.innerText = `xs = [${xs}]${'\n'}ys = [${ys}]`;
        }
    }
}
