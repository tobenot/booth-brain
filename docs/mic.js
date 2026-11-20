class Frames extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Float32Array(1024);
    this.i = 0;
  }
  process(inputs) {
    const samples = inputs[0]?.[0];
    if (samples)
      for (const x of samples) {
        this.buf[this.i++] = x;
        if (this.i === this.buf.length) {
          this.port.postMessage(this.buf, [this.buf.buffer]);
          this.buf = new Float32Array(1024);
          this.i = 0;
        }
      }
    return true;
  }
}
registerProcessor("frames", Frames);
