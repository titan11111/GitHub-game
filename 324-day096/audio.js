import {settings} from './controls.js';
export class TaikoAudio{
 constructor(){this.ctx=null;this.failed=false;this.fallback=performance.now()/1000;this.frozen=null;this.noise=null}
 async unlock(){if(!this.ctx&&!this.failed){try{this.ctx=new(window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});this.master=this.ctx.createGain();const compressor=this.ctx.createDynamicsCompressor();compressor.threshold.value=-18;compressor.ratio.value=5;this.master.connect(compressor);compressor.connect(this.ctx.destination);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*.1,this.ctx.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.configure()}catch{this.failed=true;this.ctx=null}}if(this.ctx?.state==='suspended')try{await this.ctx.resume()}catch{} }
 now(){return this.ctx?this.ctx.currentTime:this.frozen??performance.now()/1000-this.fallback}
 configure(){if(this.master)this.master.gain.setTargetAtTime(settings.mute?0:settings.volume/100*.65,this.ctx.currentTime,.02)}
 suspend(){if(this.ctx)this.ctx.suspend().catch(()=>{});else this.frozen=this.now()}
 async resume(){if(this.ctx)try{await this.ctx.resume()}catch{}else if(this.frozen!==null){this.fallback=performance.now()/1000-this.frozen;this.frozen=null}}
 strike(type='D',when=this.now(),volume=1){if(!this.ctx)return null;const c=this.ctx,t=Math.max(c.currentTime,when),g=c.createGain();g.gain.value=volume;g.connect(this.master);const nodes=[];
 const tone=(freq,amp,decay,bend=1.3)=>{const o=c.createOscillator(),a=c.createGain();o.frequency.setValueAtTime(freq*bend,t);o.frequency.exponentialRampToValueAtTime(freq,t+.08);a.gain.setValueAtTime(.001,t);a.gain.linearRampToValueAtTime(amp,t+.003);a.gain.exponentialRampToValueAtTime(.0001,t+decay);o.connect(a);a.connect(g);o.start(t);o.stop(t+decay+.02);o.onended=()=>{o.disconnect();a.disconnect()};nodes.push(o)};
 const noise=(duration,amp,hz)=>{const n=c.createBufferSource(),f=c.createBiquadFilter(),a=c.createGain();n.buffer=this.noise;f.type='bandpass';f.frequency.value=hz;f.Q.value=.7;a.gain.setValueAtTime(amp,t);a.gain.exponentialRampToValueAtTime(.0001,t+duration);n.connect(f);f.connect(a);a.connect(g);n.start(t);n.stop(t+duration+.01);n.onended=()=>{n.disconnect();f.disconnect();a.disconnect()};nodes.push(n)};
 if(type==='K'){tone(1030,.4,.07,1.1);tone(1570,.18,.04);noise(.055,.7,2400)}else if(type==='T'){tone(900,.16,.045);noise(.025,.18,3000)}else{const big=type==='O';tone(70,big?.5:.35,big?3:2,big?1.8:1.3);tone(185,.33,.95);tone(205,.26,.8);tone(294,.17,.6);tone(396,.12,.45);tone(490,.08,.35);noise(.025,.65,1800)}
 const cleanup=setTimeout(()=>g.disconnect(),Math.max(0,t-c.currentTime)*1000+3300);return{gain:g,start:t,nodes,cleanup,type,damped:false};
 }
 damp(v,amount=.125){if(!v||!this.ctx||v.damped)return;v.damped=true;v.gain.gain.setTargetAtTime(amount,this.ctx.currentTime,.025)}
 stop(v){if(!v)return;for(const n of v.nodes)try{n.stop()}catch{}clearTimeout(v.cleanup);v.gain.disconnect()}
}
