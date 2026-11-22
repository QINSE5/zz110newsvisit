const AudioBus=(()=>{
 let ctx,master,scene='',sources=[],timers=[],effectNodes=[],lastEffect=0;
 function ensure(){ctx??=new(window.AudioContext||window.webkitAudioContext)();if(!master){master=ctx.createGain();master.gain.value=.85;master.connect(ctx.destination);}return ctx;}
 function stop(){timers.forEach(t=>clearInterval(t));timers=[];sources.forEach(s=>{try{s.stop();}catch{}try{s.disconnect();}catch{}});sources=[];}
 function oscillator(freq,when,duration,gain,type='sine',destination=master){const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),when+.025);g.gain.exponentialRampToValueAtTime(.0001,when+duration);o.connect(g);g.connect(destination);o.start(when);o.stop(when+duration+.03);sources.push(o);o.onended=()=>{o.disconnect();g.disconnect();sources=sources.filter(s=>s!==o);};}
 function ring(){if(!ctx||!sound||ctx.state!=='running')return;const t=ctx.currentTime;for(let k=0;k<12;k++){const start=t+k*.085;const fundamental=k%2?1640:1330;[1,1.47,2.09].forEach((ratio,i)=>oscillator(fundamental*ratio,start,.19,.12/(i+1),'sine'));}}
 function noise(kind){const buffer=ctx.createBuffer(1,ctx.sampleRate*9,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+.025*(Math.random()*2-1))/1.025;data[i]=last*6;}const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='street'?950:420;const gain=ctx.createGain();gain.gain.value=kind==='street'?.12:.07;source.connect(filter);filter.connect(gain);gain.connect(master);source.start();source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};sources.push(source);}
 function pad(){const tones=[110,130.81,164.81];tones.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.08/(i+1);o.connect(g);g.connect(master);o.start();o.onended=()=>{o.disconnect();g.disconnect();};sources.push(o);});}
 function footsteps(){if(!sound||ctx.state!=='running')return;const t=ctx.currentTime;oscillator(78,t,.09,.07,'triangle');oscillator(92,t+.34,.08,.045,'triangle');}
 function movement(){if(!sound||ctx.state!=='running')return;const t=ctx.currentTime,buffer=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.32),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=buffer;f.type='bandpass';f.frequency.value=550;f.Q.value=.6;g.gain.value=.095;s.connect(f);f.connect(g);g.connect(master);s.start(t);sources.push(s);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();sources=sources.filter(x=>x!==s);};oscillator(95,t+.12,.13,.035,'triangle');}
 function set(next){if(next===scene&&sources.length&&sound)return;scene=next;stop();if(!sound||!ctx||ctx.state!=='running')return;master.gain.setTargetAtTime(.85,ctx.currentTime,.12);if(next==='incoming'){ring();timers.push(setInterval(ring,4400));return;}pad();noise(next==='street'||next==='incident'?'street':'room');if(next==='street'||next==='incident'){footsteps();timers.push(setInterval(footsteps,4200));}if(next==='incident'){movement();timers.push(setInterval(movement,3700));}document.getElementById('sound')?.setAttribute('data-audio-state',ctx.state);}
 async function enable(next){try{ensure();await ctx.resume();sound=true;updateSound();set(next);document.getElementById('sound').setAttribute('data-audio-state',ctx.state);}catch{sound=false;updateSound();toast('点击顶部声音开关，可再次开启城市的声音。');}}
 function disable(){stopEffects();sound=false;stop();if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.05);updateSound();document.getElementById('sound')?.setAttribute('data-audio-state','muted');}
 function stopEffects(){effectNodes.forEach(n=>{try{n.stop();}catch{}try{n.disconnect();}catch{}});effectNodes=[];}
 function effectTone(freq,delay,duration,volume,type='sine'){const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(master);o.start(t);o.stop(t+duration+.02);effectNodes.push(o);o.onended=()=>{o.disconnect();g.disconnect();effectNodes=effectNodes.filter(x=>x!==o);};}
 function rustle(duration,hz,volume,sweep=0){const t=ctx.currentTime,b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*duration),ctx.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/a.length)*Math.pow(1-i/a.length,.5);const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();n.buffer=b;f.type='bandpass';f.Q.value=.8;f.frequency.setValueAtTime(hz,t);if(sweep)f.frequency.linearRampToValueAtTime(hz+sweep,t+duration);g.gain.value=volume;n.connect(f);f.connect(g);g.connect(master);n.start();effectNodes.push(n);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect();effectNodes=effectNodes.filter(x=>x!==n);};}
 let previousEffect='';
 function fx(kind='tap'){if(!sound||!ctx||ctx.state!=='running')return;const now=ctx.currentTime;if(kind==='tap'&&now-lastEffect<.06)return;if(kind===previousEffect&&now-lastEffect<.035)return;lastEffect=now;previousEffect=kind;
 if(kind==='paper'){rustle(.20,2300,.19,-800);effectTone(170,0,.065,.035,'triangle');}
 else if(kind==='zip'){rustle(.34,1100,.16,2200);[0,.09,.19].forEach(d=>effectTone(390,d,.025,.025,'square'));}
 else if(kind==='pickup'){rustle(.11,1100,.08);effectTone(360,0,.10,.07,'triangle');}
 else if(kind==='drop'){effectTone(130,0,.11,.11,'triangle');rustle(.07,700,.09);}
 else if(kind==='rotate'){effectTone(750,0,.027,.035,'square');effectTone(260,.04,.07,.075,'triangle');}
 else if(kind==='step'){effectTone(90,0,.085,.085,'triangle');rustle(.06,1600,.035);}
 else if(kind==='fit'){effectTone(520,0,.10,.065,'triangle');effectTone(780,.06,.15,.055);}
 else if(kind==='success'||kind==='connect'){[620,830,1040].forEach((f,i)=>effectTone(f,i*.085,.23,.065));}
 else if(kind==='error'){effectTone(210,0,.12,.07,'triangle');effectTone(165,.11,.14,.055,'triangle');}
 else if(kind==='stamp'){effectTone(105,0,.11,.13,'triangle');rustle(.075,900,.16);}
 else if(kind==='receiver'){effectTone(290,0,.08,.08,'triangle');rustle(.08,1500,.08);}
 else if(kind==='switch'){effectTone(520,0,.035,.045,'square');effectTone(110,.045,.19,.05,'triangle');}
 else if(kind==='message'){effectTone(880,0,.11,.07,'triangle');effectTone(1320,.11,.18,.05);}
 else{effectTone(430,0,.045,.045,'triangle');}}
 function chime(){fx('tap');}
 function message(){fx('message');}
 function choose(n,step=0){return n===0?'incoming':n===5&&step===1?'incident':n===4||n===5?'street':'room';}
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden){stop();stopEffects();ctx.suspend().catch(()=>{});}else if(sound){ctx.resume().then(()=>set(scene)).catch(()=>{});}});
 return{enable,disable,set,chime,message,fx,choose,stop,get scene(){return scene;}};
})();
