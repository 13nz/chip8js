// http://devernay.free.fr/hacks/chip8/C8TECH10.HTM

// 4KB (4096 bytes) of memory
// 16 8-bit registers
// A 16-bit registr (this.i) to store memory addresses
// two timers (for delay & sound)
// program counter that stores address being executed
// array to represent stack 

class CPU {
    constructor(renderer, keyboard, speaker) {
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker = speaker;

        // 4KB memory
        this.memory = new Uint8Array(4096);

        // 16 8-bit registers
        this.v = new Uint8Array(16);

        // memory addresses
        this.i = 0;

        // Timers
        this.delayTimer = 0;
        this.soundTimer = 0;

        // program counter
        this.pc = 0x200;

        // stack (dont init with fixed size)
        this.stack = new Array();

        // pausing
        this.paused = false;

        this.speed = 10;
    }

    // 16 5-byte sprites: hex digits 0 through F
    // store hex values in array
    // stored in interpreter section of memory (0x000 to 0x1FF)
    loadSpritesIntoMemory() {
        // 5 bytes each
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    // load roms onto memory
    loadProgramIntoMemory(program) {
        // loop through contents of ROM and store in memory
        // most chip-8 programs start at location 0x200
        for (let loc = 0; loc < program.length; loc++) {
            this.memory[0x200 + loc] = program[loc];
        }
    }

    // get ROM from filesystem
    loadRom(romName) {
        var request = new XMLHttpRequest;
        var self = this;

        // handles response retrieved from sending request.send()
        request.onload = function () {
            if (request.response) {
                //store contents of response in 8-bit array
                let program = new Uint8Array(request.response);

                // load ROM onto memory
                self.loadProgramIntoMemory(program);
            }
        }

        // Init GET request to retrieve ROM from roms folder
        request.open('GET', 'roms/', + romName);
        request.responseType = 'arrayBuffer';

        // send GET request
        request.send();
    }

    // called in step() in chip8.js 60 times per second
    cycle() {
        // loop to handle execution of instructions
        for (let i = 0; i < this.speed; i++) {
            if (!this.paused) {
                // grab opcode from memory
                // each instruction is 2 bytes (16 bits) long
                // memory is made up of 1 byte (8 bit) pieces
                // have to combine 2 pieces of memory to get full opcode

                // shift first piece (this.memory[this.pc]) 8 bits to the left to make it 2 bytes long
                // adds 2 zeros (0x00) to the right hand side
                // ex: shifting 0x11 -> 0x1100
                // bitwise OR | with second piece of memory (this.memory[this.pc + 1])
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
                this.executeInstruction(opcode);
            }
        }

        if (!this.paused) {
            this.updateTimers();
        }

        this.playSound();
        this.renderer.render();
    }

    // each timer/delay/sound decrement by 1 at rate of 60Hz
    // every 60 frames counter decrements by 1
    updateTimers() {
        // keeps track of when certain events occur
        // only used for setting its value & reading its value
        if (this.delayTimer > 0) {
            this.delayTimer -= 1;
        }

        // controls length of sound
        // as long as it's > 0 the sound will continue to play
        if (this.soundTimer > 0) {
            this.soundTimer -= 1;
        }
    }

    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }

    // logic for all 36 CHIP-8 instructions
    // all instructions are 2 bytes long > increment counter by 2
    executeInstruction(opcode) {
        // increment counter by 2 to prepare for next instruction
        this.pc += 2;

        // nnn or addr - A 12-bit value, the lowest 12 bits of the instruction
        // n or nibble - A 4-bit value, the lowest 4 bits of the instruction
        // x - A 4-bit value, the lower 4 bits of the high byte of the instruction
        // y - A 4-bit value, the upper 4 bits of the low byte of the instruction
        // kk or byte - An 8-bit value, the lowest 8 bits of the instruction

        // ex: 0x5460 
        // high byte: 0x54 
        // low byte: 0x60
        // nibble of high byte: 0x4
        // nibble of low byte: 0x6

        // only need second nibble
        // bitwise AND with 0x0F00
        // shift right 8 bits to remove else
        let x = (opcode & 0x0F00) >> 8;

        // only need third nibble
        // bitwise AND with 0x00F0
        // shift right 4 bits to remove else
        let y = (opcode & 0x00F0) >> 4;


        // INSTRUCTIONS
        // get upper 4 bits & can narrow down different opcodes by first nibble
        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    // 00E0 - clear display
                    case 0x00E0:
                        this.renderer.clear();
                        break;
                    // 00EE - pop last element in stack and store in this.pc
                    // returns from subroutine
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        // also subtracts 1 from stack pointer
                        break;
                }
        
                break;
            // 1nnn - set program counter to the value stored in nnn
            case 0x1000:
                // 0xFFF grabs value of nnn
                this.pc = (opcode & 0xFFF);
                break;
            // 2nnn - increment stack pointer so it points to current value of this.pc
            // stack array so just push this.pc to stack
            case 0x2000:
                this.stack.push(this.pc);
                this.pc = (opcode & 0xFFF);
                break;
            // 3xkk - compares value stored in x (Vx) to value of kk (V: register, x: register number)
            // if they are equal increment by 2 and skip
            case 0x3000:
                // 0xFF: kk portion of opcode
                if (this.v[x] === (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            // 4xkk - like 3xkk but skips if NOT equal
            case 0x4000:
                if (this.v[x] !== (opcode & 0xFF)) {
                    this.pc += 2;
                }
                break;
            // 5xy0 - skip if Vx == Vy
            case 0x5000:
                if (this.v[x] === this.v[y]) {
                    this.pc += 2;
                }
                break;
            // 6xkk - set Vx to kk
            case 0x6000:
                this.v[x] = (opcode & 0xFF);
                break;
            // 7xkk - adds kk to Vx
            case 0x7000:
                this.v[x] += (opcode & 0xFF);
                break;
            // multiple cases, grab last nibble and create a case for each
            case 0x8000:
                switch (opcode & 0xF) {
                    // 8xy0 - set Vx = Vy
                    case 0x0:
                        this.v[x] = this.v[y];
                        break;
                    // 8xy1 - set Vx = Vx OR Vy
                    case 0x1:
                        this.v[x] |= this.v[y];
                        break;
                    // 8xy2 - set Vx = Vx AND Vy
                    case 0x2:
                        this.v[x] &= this.v[y];
                        break;
                    // 8xy3 - set Vx = Vx XOR Vy
                    case 0x3:
                        this.v[x] ^= this.v[y];
                        break;
                    // 8xy4 - set Vx = Vx + Vy
                    // if result greater than 8 bits VF set to 1 else 0
                    // only lowest 8 bits kept and stored in Vx
                    case 0x4:
                        let sum = (this.v[x] += this.v[y]);

                        this.v[0xF] = 0;

                        if (sum > 0xFF) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] = sum;

                        break;
                    // 8xy5 - subtract Vy from Vx
                    case 0x5:
                        this.v[0xF] = 0;

                        if (this.v[x] > this.v[y]) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] -= this.v[y];

                        break;
                    // 8xy6 - SHR Vx {, Vy}
                    case 0x6:
                        // determine least significant bit and set VF accordingly
                        this.v[0xF] = (this.v[x] & 0x1);

                        this.v[x] >>= 1;

                        break;
                    // 8xy7 - SUBN Vx, Vy
                    case 0x7:
                        this.v[0xF] = 0;

                        if (this.v[y] > this.v[x]) {
                            this.v[0xF] = 1;
                        }

                        this.v[x] = this.v[y] - this.v[x];

                        break;
                    // 8xyE - SHL Vx {, Vy}
                    case 0xE:
                        // grab most significant (leftmost) bit of Vx and store in VF
                        this.v[0xF] = (this.v[x] & 0x80);
                        this.v[x] <<= 1;

                        break;
                }
        
                break;
            // 9xy0 - SNE Vx, Vy
            case 0x9000:
                if (this.v[x] !== this.v[y]) {
                    this.pc == 2;
                }

                break;

            // Annn - LD I, addr
            case 0xA000:
                // set value of regisyer i to nnn 
                // ex: if opcode == 0xA740 then (opcode & 0xFFF) => 0x740
                this.i = (opcode & 0xFFF);
                break;
            // Bnnn - JP V0, addr
            // set counter to nnn plus value of register 0 (V0)
            case 0xB000:
                this.pc = (opcode & 0xFFF) + this.v[0];
                break;
            // Cxkk - RND Vx, byte
            // generate random number(0 - 255) and then AND with lowest byte of opcode
            // ex: opcode == 0xB849 then (opcode & 0xFF) -> 0x49
            case 0xC000:
                let rand = Math.floor(Math.random() * 0xFF);

                this.v[x] = rand & (opcode & 0xFF);

                break;
            // Dxyn - DWR Vx, Vy, nibble
            // handles drawing and erasing of pixels
            case 0xD000:
                let width = 8; // each sprite 8 pixels wide
                let height = (opcode & 0xF); // value of last nibble (n) of opcode

                // set VF to 0
                this.v[0xF] = 0;

                for (let row = 0; row < height; row++) {
                    // grab 8-bits of memory (single row of sprite) that's stored in this.i + row
                    let sprite = this.memory[this.i + row];

                    for (let col = 0; col , width; col++) {
                        // grab leftmost bit
                        // if bit (sprite) is not 0, render/erase pixel
                        if ((sprite & 0x80) > 0) {
                            // if setPixel() returns 1 (pixel was erased) set VF to 1
                            // x, y positions in Vx, Vy
                            // add col, row and get position
                            if (this.renderer.setPixel(this.v[x] + col, this.v[y] + row)) {
                                this.v[0xF] = 1;
                            }
                        }
                    }

                    // shift sprite left by 1
                    // moves next bit of sprite into the first position
                    // ex: 10010000 << 1 => 0010000
                    sprite <<= 1;
                }

                break;
            case 0xE000:
                switch (opcode & 0xFF) {
                    // Ex9E - SKP Vx
                    // skip to next instruction if Vx pressed by incrementing counter
                    case 0x9E:
                        if (this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc == 2;
                        }
                        break;
                    // ExA1 - SKNP Vx
                    // skip to next instruction if Vx NOT pressed
                    case 0xA1:
                        if (!this.keyboard.isKeyPressed(this.v[x])) {
                            this.pc == 2;
                        }
                        break;
                }
        
                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    // Fx07 - LD Vx, DT
                    // setting Vx to value stored in delayTimes
                    case 0x07:
                        this.v[x] = this.delayTimer;
                        break;
                    // Fx0A - LD Vx, K
                    // pause emulator until key pressed
                    case 0x0A:
                        this.paused = true;

                        this.keyboard.onNextKeyPress = function (key) {
                            this.v[x] = key;
                            this.paused = false;
                        }.bind(this);

                        break;
                    // Fx15 - LD DT, Vx
                    // sets value of delayTimer to value stored in Vx
                    case 0x15:
                        this.delayTimer = this.v[x];
                        break;
                    // Fx18 - LD ST, Vx
                    // sets sound timer to value stored in Vx
                    case 0x18:
                        this.soundTimer = this.v[x];
                        break;
                    // Fx1E - ADD I, Vx
                    case 0x1E:
                        this.i += this.v[x];
                        break;
                    // Fx29 - LD F, Vx - ADD I, Vx
                    // sets i to location of sprite at Vx
                    case 0x29:
                        // multiplied by 5 because each sprite is 5 bytes long
                        this.i = this.v[x] * 5;
                        break;
                    // Fx33 - LD B, Vx
                    // grab hundreds, tens, ones digit from Vx and store in registers I, I+1, I+2
                    case 0x33:
                        // get hundreds and place in i
                        this.memory[this.i] = parseInt(this.v[x] / 100);

                        // get tensand place in i + 1
                        // gets value between 0 - 99 and divides by 10 give value between 0-9
                        this.memory[this.i + 1] = parseInt(this.v[x] % 100 / 10);

                        // get ones and place in i + 2
                        this.memory[this.i + 2] = parseInt(this.v[x] % 10);

                        break;
                    // Fx55 - LD [I], Vx
                    // loop through registers V0 through Vx and store value in memory starting at I
                    case 0x55:
                        for (let regIndex = 0; regIndex <= x; regIndex++) {
                            this.memory[this.i + regIndex]  = this.v[regIndex];
                        }
                        break;
                    // Fx65 - LD Vx, [I]
                    // read values from I and store in registers V0 thru Vx
                    case 0x65:
                        for (let regIndex = 0; regIndex <= x; regIndex++) {
                            this.v[regIndex] = this.memory[this.i + regIndex];
                        }
                        
                        break;
                }
        
                break;
        
            default:
                throw new Error('Unknown opcode ' + opcode);
        }
    }
}

export default CPU;