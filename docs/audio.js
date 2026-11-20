// Segment mono microphone samples on silence. Preserve a short lead-in.
export class Segmenter {
  constructor(rate, emit) { this.rate=rate; this.emit=emit; this.reset(); }
  reset(){ this.frames=[]; this.lead=[]; this.count=0; this.quiet=0; this.voiced=0; }
  push(samples){
    const rms=Math.sqrt(samples.reduce((a,b)=>a+b*b,0)/samples.length);
    const voice=rms>0.013;
    if (!this.count && !voice){ this.lead.push(samples); if(this.lead.length>3)this.lead.shift(); return; }
    if(!this.count){this.frames=this.lead; this.lead=[];}
    this.frames.push(samples); this.count+=samples.length;
    this.quiet=voice?0:this.quiet+samples.length; if(voice)this.voiced+=samples.length;
    if(this.quiet>this.rate*.65 || this.count>=this.rate*10){
      if(this.voiced>this.rate*.12)this.emit(wav(this.frames,this.rate));
      this.reset();
    }
  }
}
export function wav(frames,rate){
  const size=frames.reduce((n,a)=>n+a.length,0)*2, out=new Uint8Array(44+size), v=new DataView(out.buffer);
  const tag=(i,s)=>out.set(new TextEncoder().encode(s),i);
  tag(0,'RIFF');v.setUint32(4,36+size,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,size,true);
  let i=44;for(const a of frames)for(const x of a){v.setInt16(i,Math.max(-1,Math.min(1,x))*(x<0?32768:32767),true);i+=2;}
  return out;
}
export function dataURI(bytes){let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return 'data:audio/wav;base64,'+btoa(raw);}
