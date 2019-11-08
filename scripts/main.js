// Project:  Doodlecap
// Author: John Lynch
// Date: Nov. 2019
// File: fourier/scripts/main.js

const randInt = n => Math.floor(n * Math.random());
const range = (m, n) => [...function* (p, q) { while (p < q) yield p++; }(m, n)];
const BKG_COLOUR = `#000000`;
const DEFAULT_FILL_COLOUR = `#01b3ea`;
const DEFAULT_POINT_SIZE = [1, 1];
let [point_width, point_height] = DEFAULT_POINT_SIZE;
let ant_scale = 32;
let ant_path_length = 8192;
let ant_reset = false;
let sparseness = 1;

document.onreadystatechange = _ => {
    if (document.readyState === `complete`) {        

        const W = document.body.offsetWidth;
        const H = document.body.offsetHeight;
        let xcentre = ~~(W / 2);
        let ycentre = ~~(H * 0.428571429);  // or H / 2.33333333
        let apos;

        const canv = document.getElementById(`canv`);
        const pixel_list = document.getElementById(`pixel-values`)
        canv.width = W;
        canv.height = H * 0.857142857;
        const ctx = canv.getContext("2d");   // get a graphics context
        ctx.fillStyle = DEFAULT_FILL_COLOUR;
        // let imgData = ctx.createImageData(W, H); // create an ImageData object, which is an array-like thing
        let dragging = false;
        let cp_visible = false;
        let ignore_inline_point_sizes = false;
        const temp = document.getElementsByTagName(`template`)[0];
        let colpicker, col_input;

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
            xs.push(`p${point_width}`);
            ys.push(`p${point_height}`);            
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
            ctx.fillRect(x, y, point_width, point_height);
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

        async function processKeys(e) {       // trap keyboard input; takes an event
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
                    await ant(ant_path_length);
                    break;
                case `<`:
                    if (point_width > 1 && point_height > 1) {
                        point_width /= 2, point_height /= 2;
                        xs.push(`p${point_width}`);
                        ys.push(`p${point_height}`);
                    }
                    break;
                case `>`:
                    if (point_width < xcentre && point_height < ycentre) {
                        point_width *= 2, point_height *= 2;
                        xs.push(`p${point_width}`);
                        ys.push(`p${point_height}`);
                    }
                    break;
                case `i`:
                    ignore_inline_point_sizes = true;     // on replay, ignore point sizes in the point arrays
                    break;
                case `u`:
                    ignore_inline_point_sizes = false;     // on replay, unignore point sizes in the point arrays
                    break;
                case `+`:
                    ant_scale *= 2;
                    break;
                case `-`:
                    if (ant_scale > 1) ant_scale /= 2;
                    break;
                case `(`:
                    if (sparseness > 1) --sparseness;
                    break;
                case `)`:
                    if (sparseness < ant_path_length) ++sparseness;
                    break;
                case `[`:
                    ant_path_length /= 2;
                    break;
                case `]`:
                    ant_path_length *= 2;
                    break;
                case `z`:
                    reset();
                    break;  
            }
        }

        function reset() {
            ant_reset = true;
            pixel_list.innerText = ``;
            // clearInterval(timer);
            ctx.clearRect(0, 0, W, H);
            doodles.length = 0;
            xs.length = 0;
            ys.length = 0;
            [point_width, point_height] = DEFAULT_POINT_SIZE;
            ctx.fillStyle = DEFAULT_FILL_COLOUR;                    
        }

        function save() {
            console.log(`Saving doodle at index ${doodles.length}`);
            doodles.push([[...xs], [...ys]]);
        }

        function replay(n = 0) {
            const dl = doodles.length;
            if (n >= dl) {
                console.log(`*** WARNING *** ${n} is too big.   You only have ${dl == 0 ? `no` : dl} doodles saved.`);
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
                    if (typeof(x) == `string`) {
                        if (x.startsWith(`#`)) {
                            if (x.length == 7 && !isNaN(parseInt(x.slice(1), 16))) {    // check it's valid 6-hex-digit string
                                ctx.fillStyle = x;
                            }
                        }
                        else if (x.startsWith(`p`)) {
                            const val = parseInt(x.slice(1));
                            if (!ignore_inline_point_sizes && !isNaN(val) && val > 0 && val < 2 * ycentre) {
                                [point_width, point_height] = [val, val];
                            }
                        }
                    }
                }
                else {
                    ctx.fillRect(x, y, point_width, point_height);
                } 
            }, 5)
                : setInterval(_ => {
                range(0, dl).forEach(n => {
                    const x = doodles[n][0][++i];
                    const y = doodles[n][1][i];
                    if (isNaN(x)) {
                        if (typeof(x) == `string`) {
                            if (x.startsWith(`#`)) {
                                if (x.length == 7 && !isNaN(parseInt(x.slice(1), 16))) {    // check it's valid 6-hex-digit string
                                    ctx.fillStyle = x;
                                }
                            }
                            else if (x.startsWith(`p`)) {
                                const val = parseInt(x.slice(1));
                                if (!ignore_inline_point_sizes && !isNaN(val) && val > 0 && val < 2 * ycentre) {
                                    [point_width, point_height] = [val, val];
                                }
                            }
                        }
                    }
                    else {
                        ctx.fillRect(x, y, point_width, point_height);
                    }
                });
            }, 5);
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

        async function ant(n) {
            if (ant_reset) {
                ant_reset = false;
                return;
            }
            xs.length = 0;
            ys.length = 0;
            // [point_width, point_height] = DEFAULT_POINT_SIZE.map(comp => comp * 8);
            apos = [xcentre, ycentre];
            for (i = 0; i < n; i++) {
                ctx.lineWidth = point_width;
                // ctx.strokeStyle = ctx.fillStyle;
                let hue = (i % 10800) / 10800;
                ctx.beginPath();
                ctx.strokeStyle = hslArray2RgbString([hue, 1, 1]);
                let lastpos = [...apos];
                let k = 1;
                let x, y;
                // ant_scale = 2 ** (8 - Math.trunc(i / ant_path_length * 9));
                while (k < 8) {
                    x = apos[0] + (randInt(3) - k) * ant_scale;
                    y = apos[1] + (randInt(3) - k++) * ant_scale;
                    if ([x, y] != apos) break;
                }
                if (x >= 0 && x < 2 * xcentre) {
                    apos[0] = x;
                }
                if (y >= 0 && y < 2 * ycentre) {
                    apos[1] = y;
                }
                xs.push(apos[0]);
                ys.push(apos[1]);
                // ctx.transform(1, 0, 0, 1, 16 * Math.sin(apos[0] * 48), 13 * Math.cos(apos[1] * 53));
                ctx.moveTo(...lastpos);
                ctx.lineTo(...apos);
                ctx.stroke();
                ctx.closePath();
                await sleep(10);
                // ctx.fillRect(x, y, point_width, point_height);
            }
            pixel_list.innerText = `xs = [${xs}]${'\n'}ys = [${ys}]`;
        }

        function sleep(ms) {
          return new Promise((resolve, reject) => setTimeout(resolve, ms));
        }

        function draw(n, i) {
            const x = doodles[n][0][++i];
            const y = doodles[n][1][i];
            if (isNaN(x)) {
                if (typeof(x) == `string`) {
                    if (x.startsWith(`#`)) {
                        if (x.length == 7 && !isNaN(parseInt(x.slice(1), 16))) {    // check it's valid 6-hex-digit string
                            ctx.fillStyle = x;
                        }
                    }
                    else if (x.startsWith(`p`)) {
                        const val = parseInt(x.slice(1));
                        if (!ignore_inline_point_sizes && !isNaN(val) && val > 0 && val < 2 * ycentre) {
                            [point_width, point_height] = [val, val];
                        }
                    }
                }
            }
            else {
                ctx.fillRect(x, y, point_width, point_height);
            }
            requestAnimationFrame((n, i) => draw(n, i))            
        }

        function rgb2NumericComponents(rgbcol) {
            let rgb = rgbcol.slice(4,-1).split(`,`);
            return [Number(rgb[0]), Number(rgb[1]), Number(rgb[2])];
        }

        function rgb2Hex(rgbcol) {
            let rgb = rgbcol.slice(4,-1).split(`,`);
            return `#`
              + (`0` + Number(rgb[0]).toString(16)).slice(-2)
              + (`0` + Number(rgb[1]).toString(16)).slice(-2)
              + (`0` + Number(rgb[2]).toString(16)).slice(-2);
        }

        function rgb2HexStringComponents(rgbcol) {
            let rgb = rgbcol.slice(4,-1).split(`,`);
            return [
                (`0` + Number(rgb[0]).toString(16)).slice(-2),
                (`0` + Number(rgb[1]).toString(16)).slice(-2),
                (`0` + Number(rgb[2]).toString(16)).slice(-2)
            ];
        }

        function rgbComponentSum(rgbcol) {
            return rgb2NumericComponents(rgbcol).reduce((x, y) => x + y);
        }

        function rgbString2hslArray(rgbcol) {
            // Algorithm from 'Principles of Digital Image Processing - Fundamental Techniques' by Burger & Burge, p.208.
            let rgb_components = [r, g, b] = rgb2NumericComponents(rgbcol);
            let c_high = Math.max(...rgb_components);
            if (c_high <= 0) {
                return [0, 0, 0];
            }
            else {
                let hue, sat, lum;
                let c_low = Math.min(...rgb_components);
                let c_range = c_high - c_low;
                sat = c_range / c_high;
                lum = c_high / 255;
                let [r_, g_, b_] = rgb_components.map(comp => (c_high - comp) / c_range);
                hue = r == c_high ? b_ - g_ : g == c_high ? r_ - b_ + 2 : g_ - r_ + 4;
                hue = (hue + 6) % 6 / 6;
                return [hue, sat, lum];
            }
        }

        function getHue(rgbcol) {
            return rgbString2hslArray(rgbcol)[0];
        }

        function setHue(rgbcol, new_hue) {
            let hsl_components = [hue, sat, lum] = rgbString2hslArray(rgbcol);
            hsl_components[0] = new_hue;
            return hslArray2RgbString(hsl_components);
        }

        function hslArray2RgbArray(hsl) {
            let h_ = 6 * hsl[0] % 6;
            let [sat, lum] = hsl.slice(1);
            let c1 = Math.trunc(h_);
            let c2 = h_ - c1;
            let x = (1 - sat) * lum;
            let y = (1 - sat * c2) * lum;
            let z = (1 - (sat * (1 - c2))) * lum;
            let [r_, g_, b_] = c1 == 0 ? [lum, z, x]
                          : c1 == 1 ? [y, lum, x]
                          : c1 == 2 ? [x, lum, z]
                          : c1 == 3 ? [x, y, lum]
                          : c1 == 4 ? [z, x, lum]
                          : c1 == 5 ? [lum, x, y]
                          : null;
            return [r_, g_, b_].map(comp => Math.min(Math.round(256 * comp), 255))
        }

        function hslArray2RgbString(hsl) {
            let [r, g, b] = hslArray2RgbArray(hsl);
            return `rgb(${r}, ${g}, ${b})`;
        }
    }
}
