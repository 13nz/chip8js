class Speaker {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;

        this.audioCtx = new AudioContext();

        // create gain to control volume
        this.gain = this.audioCtx.createGain();
        this.finish = this.audioCtx.destination;

        // connect gain to audio context
        this.gain.connect(this.finish);
    }

    mute() {
        this.gain.setValueAtTime(0, this.audioCtx.currentTime);
    }

    unmute() {
        this.gain.setValueAtTime(1, this.audioCtx.currentTime);
    }

    play(frequency) {
        if (this.audioCtx && !this.oscillator) {
            this.oscillator = this.audioCtx.createOscillator();

            // set frequency
            this.oscillator.frequency.setValueAtTime(frequency || 440, this.audioCtx.currentTime);

            // square wave
            this.oscillator.type = 'square';

            // connect gain and start sound
            this.oscillator.connect(this.gain);
            this.oscillator.start();
        }
    }

    stop() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
    }
}

export default Speaker;