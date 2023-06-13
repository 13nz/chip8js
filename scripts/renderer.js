class Renderer {
    // scale display
    constructor(scale) {
        this.cols = 64;
        this.rows = 32;

        this.scale = scale;

        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = this.cols * this.scale;
        this.canvas.height = this.rows * this.scale;

        // display
        // chip-8: 64 x 32 (2048)
        this.display = new Array(this.cols * this.rows);
    }

    setPixel(x, y) {
        // if a pixel is positioned outside bounds of display, wrap around opposite side
        if (x > this.cols) {
            x -= this.cols;
        } else if (x < 0) {
            x += this.cols;
        }

        if (y > this.rows) {
            y -= this.rows;
        } else if (y < 0) {
            y += this.rows;
        }

        let pixelLoc = x + (y * this.cols);

        // sprites XORed into the display
        // pixelLoc 0 to 1 or 1 to 0
        // 1: drawn, 0: erased
        this.display[pixelLoc] ^= 1;

        // return whether pixel was erased
        return !this.display[pixelLoc];
    }

    // clear display
    clear() {
        this.display = new Array(this.cols * this.rows);
    }

    // render pixels in display array onto screen (60tps)
    render() {
        // clear display every render cycle
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // loop through display array
        for (let i = 0; i < this.cols * this.rows; i++) {
            // x position based off i
            let x = (i % this.cols) * this.scale;

            // y position base off i
            let y = Math.floor(i / this.cols) * this.scale;

            // if this.display[i] == 1 -> draw pixel
            if (this.display[i]) {
                // set pixel black
                this.ctx.fillStyle = '#000';

                // place pixel at (x, y) with width & height of scale
                this.ctx.fillRect(x, y, this.scale, this.scale);
            }
        }
    }

    testRender() {
        this.setPixel(0, 0);
        this.setPixel(5, 2);
    }
}

export default Renderer;