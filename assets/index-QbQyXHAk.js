var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(e){throw n=[e],e}},s=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports),c=(e,n)=>{let r={};for(var i in e)t(r,i,{get:e[i],enumerable:!0});return n||t(r,Symbol.toStringTag,{value:`Module`}),r},l=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},u=(n,r,o)=>(o=n==null?{}:e(i(n)),l(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n)),d=e=>a.call(e,`module.exports`)?e[`module.exports`]:l(t({},`__esModule`,{value:!0}),e);(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var f=[1,.55,.28,.16,.1,.06,.04,.025,.015,.01],p=.18,m=32,h=.1,g=.05,_=.05,v=class{ctx;master;wave;voices=[];clicks=[];buses;bandNodes=[];noise;sustain=!1;offset=null;constructor(){this.ctx=new AudioContext({latencyHint:`interactive`}),this.master=this.ctx.createGain(),this.master.gain.value=.8;let e=this.ctx.createDynamicsCompressor();e.threshold.value=-12,e.ratio.value=8,this.master.connect(e).connect(this.ctx.destination);let t=e=>{let t=this.ctx.createGain();return t.gain.value=e,t.connect(this.master),t};this.buses={accomp:t(.8),band:t(.7),click:t(.8)},this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate,this.ctx.sampleRate);let n=this.noise.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=Math.random()*2-1;let r=new Float32Array([0,...f]);this.wave=this.ctx.createPeriodicWave(new Float32Array(r.length),r)}now(e=performance.now()){return this.sync(),e/1e3+(this.offset??this.ctx.currentTime-performance.now()/1e3-this.outputDelay)}fromPerf(e){let t=performance.now();return this.now(Math.max(t-100,Math.min(t,e)))}get outputDelay(){return(this.ctx.baseLatency||0)+(this.ctx.outputLatency||0)}get lead(){return this.ctx.currentTime-this.now()+h}async resume(){this.ctx.state!==`running`&&await this.ctx.resume()}get running(){return this.ctx.state===`running`}setVolume(e){this.master.gain.setTargetAtTime(Math.max(0,Math.min(1,e)),this.ctx.currentTime,.02)}setMix(e){for(let[t,n]of Object.entries(e))n!==void 0&&this.buses[t].gain.setTargetAtTime(Math.max(0,Math.min(1,n)),this.ctx.currentTime,.02)}noteOn(e,t=.75,n,r=`keys`){let i=Math.max(this.ctx.currentTime,n??0);this.stopVoices(t=>t.pitch===e&&t.start<=i,.03,i),this.voices.length>=m&&this.stopVoices(e=>e===this.voices[0],.03);let a=440*2**((e-69)/12),o=.1+.3*t**1.5,s=.35+2.2*2**((48-e)/24),c=this.ctx.createBiquadFilter();c.type=`lowpass`,c.Q.value=.5,c.frequency.setValueAtTime(Math.min(16e3,a*(4+10*t)),i),c.frequency.setTargetAtTime(Math.min(16e3,a*2.5),i,s*.4);let l=this.ctx.createGain();l.gain.setValueAtTime(0,i),l.gain.linearRampToValueAtTime(o,i+.004),l.gain.setTargetAtTime(o*.02,i+.004,s);let u=[-3,3].map(e=>{let t=this.ctx.createOscillator();return t.setPeriodicWave(this.wave),t.frequency.value=a,t.detune.value=e,t.connect(c),t.start(i),t});c.connect(l).connect(r===`accomp`?this.buses.accomp:this.master),this.voices.push({pitch:e,start:i,gain:l,oscs:u,pedalled:!1})}noteOff(e,t){let n=t??this.ctx.currentTime,r=t=>t.pitch===e&&t.start<=Math.max(n,this.ctx.currentTime);if(this.sustain)for(let e of this.voices)r(e)&&(e.pedalled=!0);else this.stopVoices(r,p,n)}setSustain(e){this.sustain=e,e||this.stopVoices(e=>e.pedalled,p)}allOff(){this.cancelAfter(-1/0),this.stopVoices(()=>!0,.05)}cancelAfter(e){let t=this.ctx.currentTime;this.voices=this.voices.filter(n=>{if(n.start<=Math.max(e,t))return!0;for(let e of n.oscs)e.stop(t);return!1}),this.clicks=this.clicks.filter(n=>n.at<=Math.max(e,t)?n.at>t-1:(n.osc.stop(t),!1)),this.bandNodes=this.bandNodes.filter(n=>n.at<=Math.max(e,t)?n.at>t-8:(n.node.stop(t),!1))}band(e,t,n,r=[],i=.5){let{ctx:a}=this,o=Math.max(a.currentTime,t),s=this.buses.band,c=e=>this.bandNodes.push({node:e,at:o}),l=(e,t,n,r)=>{let i=a.createGain();return i.gain.setValueAtTime(0,o),i.gain.linearRampToValueAtTime(e,o+t),i.gain.setTargetAtTime(0,o+t+n,r/3),i},u=(e,t,n,r)=>{let i=a.createBufferSource();i.buffer=this.noise;let u=a.createBiquadFilter();u.type=e,u.frequency.value=t,i.connect(u).connect(l(n,.002,0,r)).connect(s),i.start(o,Math.random()*.5),i.stop(o+r+.1),c(i)};if(e===`kick`){let e=a.createOscillator();e.frequency.setValueAtTime(130,o),e.frequency.exponentialRampToValueAtTime(42,o+.12),e.connect(l(.9*n,.003,.02,.3)).connect(s),e.start(o),e.stop(o+.45),c(e)}else if(e===`snare`){u(`highpass`,1400,.38*n,.16);let e=a.createOscillator();e.frequency.value=190,e.connect(l(.22*n,.002,0,.08)).connect(s),e.start(o),e.stop(o+.15),c(e)}else if(e===`hat`)u(`highpass`,7500,.13*n,.045);else{let t=Math.max(.1,i);for(let i of r){let r=440*2**((i-69)/12),u=a.createBiquadFilter();u.type=`lowpass`,u.frequency.value=e===`bass`?700:1300;let d=e===`bass`?l(.42*n,.01,t*.8,.12):l(.045*n,.3,t*.7,.5);u.connect(d).connect(s);let f=e===`bass`?[[`triangle`,0],[`sine`,-1200]]:[[`sawtooth`,-7],[`sawtooth`,7]];for(let[e,n]of f){let i=a.createOscillator();i.type=e,i.frequency.value=r,i.detune.value=n,i.connect(u),i.start(o),i.stop(o+t+.8),c(i)}}}}click(e,t){let n=Math.max(this.ctx.currentTime,t??0),r=this.ctx.createOscillator(),i=this.ctx.createGain();r.frequency.value=e?1760:1175,i.gain.setValueAtTime(e?.35:.22,n),i.gain.exponentialRampToValueAtTime(.001,n+.05),r.connect(i).connect(this.buses.click),r.start(n),r.stop(n+.06),this.clicks=this.clicks.filter(e=>e.at>this.ctx.currentTime-1),this.clicks.push({osc:r,at:n})}sync(){let e=this.ctx.getOutputTimestamp?.(),t;t=e&&e.contextTime&&e.performanceTime?e.contextTime-e.performanceTime/1e3:this.ctx.currentTime-this.outputDelay-performance.now()/1e3,this.offset===null||Math.abs(t-this.offset)>_?this.offset=t:this.offset+=(t-this.offset)*g}stopVoices(e,t,n){let r=this.ctx.currentTime,i=Math.max(r,n??r);this.voices=this.voices.filter(n=>{if(!e(n))return!0;n.gain.gain.cancelScheduledValues(i),n.gain.gain.setTargetAtTime(0,i,t/4);for(let e of n.oscs)e.stop(i+t+.05);return!1})}},y=[{id:`en`,name:`English`},{id:`de`,name:`Deutsch`}],b=`en`;function x(e){b=e,typeof document<`u`&&(document.documentElement.lang=e)}function S(){return b}function C(e,t=typeof navigator>`u`?`en`:navigator.language){return e===`en`||e===`de`?e:/^de\b/i.test(t)?`de`:`en`}function w(e,t){return b===`de`?t:e}function T(e){return typeof e==`string`?e:e[b]}function E(e,t){return{en:e,de:t}}var D={en:[`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`],de:[`C`,`Cis`,`D`,`Dis`,`E`,`F`,`Fis`,`G`,`Gis`,`A`,`B`,`H`]};function O(e){return D[b][(e%12+12)%12]}function k(e){return O(e)+(Math.floor(e/12)-1)}var A={C:0,D:2,E:4,F:5,G:7,A:9,B:11},j=[`C`,`C#`,`D`,`D#`,`E`,`F`,`F#`,`G`,`G#`,`A`,`A#`,`B`];function ee(e){let t=/^([A-G])([#b]?)(-?\d)$/.exec(e);if(!t)throw Error(`Bad note name "${e}"`);let n=t[2]===`#`?1:t[2]===`b`?-1:0;return(Number(t[3])+1)*12+A[t[1]]+n}function M(e){return j[(e%12+12)%12]+(Math.floor(e/12)-1)}function N(e){return[1,3,6,8,10].includes((e%12+12)%12)}function te(e){let t=e.beatsPerBar??4,n=[],r=0;for(let t of[`R`,`L`]){let i=e[t];i&&(r=Math.max(r,ne(i,t,n)))}n.sort((e,t)=>e.startBeat-t.startBeat||e.pitch-t.pitch);let i=Math.max(t,Math.ceil(r/t-1e-9)*t);return{id:e.id,title:e.title,bpm:e.bpm,beatsPerBar:t,notes:n,lengthBeats:i}}function ne(e,t,n){let r=e.match(/\[[^\]]*\]\S*|\S+/g)??[],i=0;for(let e of r){if(e===`|`)continue;let r=/^(\[[^\]]*\]|[^:\[\]]+)(?::(\d+(?:\.\d+)?))?$/.exec(e);if(!r)throw Error(`Bad chart token "${e}"`);let a=r[2]===void 0?1:Number(r[2]);if(!(a>0))throw Error(`Bad chart token "${e}"`);let o=r[1];if(o!==`-`){let r=o.startsWith(`[`)?o.slice(1,-1).trim().split(/\s+/):[o];for(let o of r)n.push({...re(o,e),startBeat:i,durationBeats:a,hand:t})}i+=a}return i}function re(e,t){let n=/^([A-G][#b]?-?\d)(?:\/([1-5]))?$/.exec(e);if(!n)throw Error(`Bad chart token "${t}"`);let r=ee(n[1]);return n[2]?{pitch:r,finger:Number(n[2])}:{pitch:r}}var ie={R:{C4:1,D4:2,E4:3,F4:4,G4:5},L:{C3:5,D3:4,E3:3,F3:2,G3:1}};function ae(e,t){return e?.replace(/([A-G][#b]?\d)(\/[1-5])?/g,(e,n,r)=>r||!ie[t][n]?e:`${n}/${ie[t][n]}`)}function P(e,t,n,r){return te({id:e,title:typeof t==`string`?t:t.en,bpm:n,R:ae(r.R,`R`),L:ae(r.L,`L`)})}var oe=e=>e.replace(/([A-G][#b]?\d)/g,`$1/2`);function F(e,t,n={}){return{type:`explain`,title:e,text:t,...n}}function I(e,t,n={}){return[{type:`demo`,title:E(`Watch and listen`,`Anschauen und zuhören`),chart:e},{type:`drill`,title:E(`Take your time`,`In Ruhe üben`),chart:e,hands:n.hands},{type:`perform`,title:t===`timed`?E(`Play it in time`,`Im Takt spielen`):E(`Play it through`,`Durchspielen`),chart:e,judging:t,...n}]}function L(e,t,n,r){return{id:e,unit:Number(e[1]),title:t,summary:n,steps:r}}var R={pass:.7},se=[L(`u1l2`,E(`Finding C`,`Das C finden`),E(`The most important key on the piano.`,`Die wichtigste Taste am Klavier.`),[F(E(`Welcome to the keyboard`,`Willkommen an der Tastatur`),E(`A piano looks like a long row of identical keys, but it has a pattern. Look at the black keys: they come in groups of two, then three, then two, then three.

Those groups are your landmarks. Once you can spot them, you can find any note without counting.`,`Ein Klavier sieht aus wie eine lange Reihe gleicher Tasten, doch es hat ein Muster. Sieh dir die schwarzen Tasten an: Sie kommen in Gruppen zu zweit, dann zu dritt, dann wieder zu zweit und zu dritt.

Diese Gruppen sind deine Orientierungspunkte. Wenn du sie erkennst, findest du jeden Ton, ohne zu zählen.`),{highlight:[`C#4`,`D#4`,`F#4`,`G#4`,`A#4`]}),F(E(`How the highway works`,`So funktioniert die Notenbahn`),E(`Notes slide down towards the keyboard. When a note reaches the bright line, press the key it lands on.

In these first lessons the notes wait for you, so there is no rush. Use the pointer finger of your right hand.`,`Die Noten gleiten auf die Tastatur zu. Wenn eine Note die helle Linie erreicht, drückst du die Taste, auf der sie landet.

In den ersten Lektionen warten die Noten auf dich, du hast also keine Eile. Spiel mit dem Zeigefinger der rechten Hand.`)),F(E(`C lives left of the twos`,`Das C wohnt links der Zweiergruppe`),E(`Find a group of two black keys. The white key just to the left of the group is always C.

Every C on the keyboard sits in that same spot. The one near the middle of the piano is called middle C, and it will be your home base.

Press middle C to carry on.`,`Such dir eine Gruppe aus zwei schwarzen Tasten. Die weiße Taste direkt links davon ist immer ein C.

Jedes C auf der Tastatur sitzt an genau dieser Stelle. Das C in der Mitte des Klaviers heißt mittleres C – es ist dein Ausgangspunkt.

Drück das mittlere C, um weiterzumachen.`),{highlight:[`C3`,`C4`,`C5`],pressToContinue:`C4`}),...I(P(`u1l2`,`Finding C`,80,{R:oe(`C4 C4 C5 C5 | C4 C4 C3 C3 | C4 C5 C4 C3 | C4:4`)}),`pitch`)]),L(`u1l3`,`C, D, E`,E(`The three white keys around the two black keys.`,`Die drei weißen Tasten rund um die zwei schwarzen.`),[F(E(`Neighbours of C`,`Die Nachbarn von C`),E(`White keys are named with letters, going up to the right. After C comes D, then E.

D is easy to spot: it sits between the two black keys. E is just to the right of the group.`,`Die weißen Tasten tragen Buchstaben, aufsteigend nach rechts. Nach C kommt D, dann E.

Das D ist leicht zu finden: Es liegt zwischen den beiden schwarzen Tasten. Das E liegt direkt rechts von der Gruppe.`),{highlight:[`C4`,`D4`,`E4`]}),F(E(`Three fingers`,`Drei Finger`),E(`Rest your right thumb on middle C, your pointer finger on D and your middle finger on E. Keep your fingers curved, as if holding a ball.

The small numbers on the notes tell you which finger to use: thumb is 1, pointer is 2, middle is 3.

Press D to carry on.`,`Leg den rechten Daumen auf das mittlere C, den Zeigefinger auf D und den Mittelfinger auf E. Halte die Finger gewölbt, als hieltest du einen Ball.

Die kleinen Zahlen auf den Noten sagen dir, welcher Finger dran ist: Daumen ist 1, Zeigefinger 2, Mittelfinger 3.

Drück D, um weiterzumachen.`),{highlight:[`D4`],pressToContinue:`D4`}),...I(P(`u1l3`,`C, D, E`,80,{R:`C4 D4 E4:2 | E4 D4 C4:2 | C4 E4 D4 E4 | C4 D4 C4:2`}),`pitch`)]),L(`u1l4`,E(`The whole alphabet`,`Alle sieben Töne`),E(`F, G, A and B complete the set of seven.`,`F, G, A und H machen die sieben komplett.`),[F(E(`Seven letters, then round again`,`Sieben Namen, dann von vorn`),E(`Music uses only seven letters: A B C D E F G. After G it starts again at A.

F sits just left of the group of three black keys. G and A are tucked inside that group, and B is just right of it. Then comes the next C.`,`Die Musik kommt mit sieben Tonnamen aus: C D E F G A H. Nach dem H beginnt es wieder mit C.

Das F liegt direkt links von der Dreiergruppe schwarzer Tasten. G und A liegen innerhalb dieser Gruppe, das H direkt rechts davon. Dann kommt das nächste C.`),{highlight:[`F4`,`G4`,`A4`,`B4`]}),F(E(`Walk up the keys`,`Die Tasten hinaufwandern`),E(`Use your pointer finger for this one and walk up the white keys from C to the next C, saying the letters aloud as you go. Saying them is what makes them stick.

Press F to carry on.`,`Nimm für diese Übung den Zeigefinger und wandere die weißen Tasten von C bis zum nächsten C hinauf. Sag die Tonnamen dabei laut – so bleiben sie hängen.

Drück F, um weiterzumachen.`),{highlight:[`F4`],pressToContinue:`F4`}),...I(P(`u1l4`,`The whole alphabet`,80,{R:oe(`C4 D4 E4 F4 | G4 A4 B4 C5 | C5 B4 A4 G4 | F4 E4 D4 C4 | F4 A4 G4 B4 | C5:2 C4:2`)}),`pitch`)])],ce=[L(`u2l1`,E(`Five fingers, five keys`,`Fünf Finger, fünf Tasten`),E(`Your right hand finds its home position.`,`Deine rechte Hand findet ihre Grundstellung.`),[F(E(`Finger numbers`,`Fingernummern`),E(`Pianists number their fingers. On both hands the thumb is 1, the pointer is 2, the middle is 3, the ring finger is 4 and the little finger is 5.`,`Pianisten nummerieren ihre Finger. An beiden Händen ist der Daumen 1, der Zeigefinger 2, der Mittelfinger 3, der Ringfinger 4 und der kleine Finger 5.`)),F(E(`C position`,`C-Lage`),E(`Put your right thumb on middle C and let each finger rest on the next white key: C D E F G. This is called C position.

Your hand stays put. Each finger owns one key, so you never need to look down to find a note.

Press G with your little finger to carry on.`,`Leg den rechten Daumen auf das mittlere C und lass jeden Finger auf der nächsten weißen Taste ruhen: C D E F G. Das nennt man die C-Lage.

Deine Hand bleibt, wo sie ist. Jeder Finger hat seine eigene Taste, du musst also nie hinschauen, um einen Ton zu finden.

Drück G mit dem kleinen Finger, um weiterzumachen.`),{highlight:[`C4`,`D4`,`E4`,`F4`,`G4`],pressToContinue:`G4`}),...I(P(`u2l1`,`Five fingers, five keys`,80,{R:`C4 D4 E4 F4 | G4:4 | G4 F4 E4 D4 | C4:4 | C4 D4 E4 F4 | G4 F4 E4 D4 | C4:4`}),`pitch`)]),L(`u2l2`,E(`Steps and skips`,`Schritte und Sprünge`),E(`The two ways a melody moves.`,`Die zwei Arten, wie sich eine Melodie bewegt.`),[F(E(`Next door, or one over`,`Nebenan oder eine weiter`),E(`Moving to the very next key is a step: C to D, D to E.

Jumping over one key is a skip: C to E, E to G. Skips use every other finger: 1, 3, 5.

Almost every tune is built from steps and skips.`,`Zur direkt benachbarten Taste zu gehen ist ein Schritt: C nach D, D nach E.

Eine Taste zu überspringen ist ein Sprung: C nach E, E nach G. Sprünge nehmen jeden zweiten Finger: 1, 3, 5.

Fast jede Melodie besteht aus Schritten und Sprüngen.`),{highlight:[`C4`,`E4`,`G4`]}),...I(P(`u2l2`,`Steps and skips`,80,{R:`C4 D4 E4:2 | C4 E4 G4:2 | G4 F4 E4:2 | G4 E4 C4:2 | C4 E4 D4 F4 | E4 G4 E4 C4 | D4 F4 E4 D4 | C4:4`}),`pitch`)]),L(`u2l3`,`Hot Cross Buns`,E(`Your first tune, with just three notes.`,`Deine erste Melodie, mit nur drei Tönen.`),[F(E(`A real tune`,`Eine echte Melodie`),E(`Hot Cross Buns uses only E, D and C, fingers 3, 2 and 1.

Listen to the demo first and hum along. Knowing how a tune goes makes it far easier to play.`,`Hot Cross Buns kommt mit E, D und C aus, den Fingern 3, 2 und 1.

Hör dir zuerst die Vorführung an und summ mit. Wer weiß, wie eine Melodie klingt, spielt sie viel leichter.`),{highlight:[`C4`,`D4`,`E4`]}),...I(P(`u2l3`,`Hot Cross Buns`,90,{R:`E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4`}),`pitch`)]),L(`u2l4`,E(`Mary Had a Little Lamb`,`Mary hatte ein kleines Lamm`),E(`A longer tune that reaches up to G.`,`Eine längere Melodie, die bis zum G reicht.`),[F(E(`Adding the little finger`,`Der kleine Finger kommt dazu`),E(`This tune is mostly E, D and C again, with one reach up to G for your little finger.

Notice how often a note repeats. When it does, lift the finger slightly and play again without moving your hand.`,`Diese Melodie besteht wieder hauptsächlich aus E, D und C, mit einem Griff hinauf zum G für den kleinen Finger.

Achte darauf, wie oft sich ein Ton wiederholt. Heb den Finger dann leicht an und spiel erneut, ohne die Hand zu bewegen.`),{highlight:[`C4`,`D4`,`E4`,`G4`]}),...I(P(`u2l4`,`Mary Had a Little Lamb`,96,{R:`E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4`}),`pitch`)])],le=[L(`u3l1`,E(`The beat`,`Der Grundschlag`),E(`Playing exactly with the click.`,`Genau mit dem Klick spielen.`),[F(E(`Music has a pulse`,`Musik hat einen Puls`),E(`Until now the notes waited for you. Real music keeps moving, on a steady pulse called the beat.

You will hear a click on every beat. A note that lasts one beat is a quarter note. Count along: 1, 2, 3, 4.`,`Bisher haben die Noten auf dich gewartet. Echte Musik läuft weiter, in einem gleichmäßigen Puls, dem Grundschlag.

Du hörst auf jedem Schlag einen Klick. Eine Note, die einen Schlag dauert, ist eine Viertelnote. Zähl mit: 1, 2, 3, 4.`)),F(E(`How timing is scored`,`So wird das Timing bewertet`),E(`From now on the last step of each lesson runs in time. You get four clicks to count you in, then press each key just as its note touches the line.

Close is good, spot on is perfect. If you miss one, keep going. Staying with the beat matters more than any single note.`,`Ab jetzt läuft der letzte Schritt jeder Lektion im Takt. Du bekommst vier Klicks zum Einzählen, dann drückst du jede Taste genau dann, wenn ihre Note die Linie berührt.

Knapp daneben ist gut, genau drauf ist perfekt. Wenn du eine verpasst, spiel weiter. Im Takt zu bleiben ist wichtiger als jede einzelne Note.`)),...I(P(`u3l1`,`The beat`,72,{R:`C4 C4 C4 C4 | D4 D4 D4 D4 | E4 E4 E4 E4 | D4 D4 C4 C4 | C4 D4 E4 D4 | C4 D4 E4 D4 | C4 C4 E4 E4 | C4 C4 C4 C4`}),`timed`,R)]),L(`u3l2`,E(`Long notes`,`Lange Noten`),E(`Half notes and whole notes.`,`Halbe und ganze Noten.`),[F(E(`Holding on`,`Aushalten`),E(`Longer bars on the highway are longer notes. A half note lasts two beats, a whole note lasts four.

Press when the front of the bar reaches the line and hold the key down until the tail has gone. Keep counting through the long notes: 1, 2, 3, 4.`,`Längere Balken auf der Notenbahn sind längere Noten. Eine halbe Note dauert zwei Schläge, eine ganze Note vier.

Drück, wenn der Anfang des Balkens die Linie erreicht, und halte die Taste, bis das Ende verschwunden ist. Zähl bei langen Noten weiter: 1, 2, 3, 4.`)),...I(P(`u3l2`,`Long notes`,76,{R:`C4:2 E4:2 | G4:4 | F4:2 D4:2 | C4:4 | C4 D4 E4:2 | E4 F4 G4:2 | G4:2 E4:2 | C4:4`}),`timed`,R)]),L(`u3l3`,E(`Rests`,`Pausen`),E(`Silence that keeps time.`,`Stille, die im Takt bleibt.`),[F(E(`Counting the gaps`,`Die Lücken zählen`),E(`A gap on the highway is a rest: a beat where you play nothing. The beat carries on, so keep counting through the silence.

Lift your finger for the rest and let the click fill the space. Rushing through rests is the most common beginner habit, so let them last.`,`Eine Lücke auf der Notenbahn ist eine Pause: ein Schlag, in dem du nichts spielst. Der Grundschlag läuft weiter, also zähl auch in der Stille weiter.

Heb den Finger für die Pause an und lass den Klick die Lücke füllen. Durch Pausen zu hetzen ist die häufigste Anfängergewohnheit – gönn ihnen ihre volle Länge.`)),...I(P(`u3l3`,`Rests`,76,{R:`C4 -:1 E4 -:1 | G4 G4 -:2 | F4 -:1 D4 -:1 | C4:2 -:2 | E4 E4 -:1 E4 | G4 -:1 G4 -:1 | F4 D4 -:2 | C4:4`}),`timed`,R)]),L(`u3l4`,E(`Hot Cross Buns, in time`,`Hot Cross Buns im Takt`),E(`A tune you know, now with a beat.`,`Eine bekannte Melodie, jetzt mit Grundschlag.`),[F(E(`Putting it together`,`Alles zusammen`),E(`You already know these notes. This time they come with a rhythm: half notes, a whole note, then a run of quick quarter notes.

Watch the demo and count along before you play.`,`Diese Töne kennst du schon. Diesmal kommen sie mit einem Rhythmus: halbe Noten, eine ganze Note und dann eine Reihe schneller Viertel.

Sieh dir die Vorführung an und zähl mit, bevor du spielst.`),{highlight:[`C4`,`D4`,`E4`]}),...I(P(`u3l4`,`Hot Cross Buns, in time`,92,{R:`E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4`}),`timed`,R)])],ue=[L(`u4l1`,E(`Left hand home`,`Grundstellung links`),E(`C position, one octave down.`,`C-Lage, eine Oktave tiefer.`),[F(E(`A mirror image`,`Ein Spiegelbild`),E(`Your left hand gets its own C position, on the C below middle C. This time the little finger (5) goes on C and the thumb (1) on G.

It is a mirror of your right hand: going up the keys, the fingers count down, 5 4 3 2 1.

Left-hand notes have their own colour on the highway. Press the low C with your left little finger to carry on.`,`Deine linke Hand bekommt ihre eigene C-Lage, auf dem C unterhalb des mittleren C. Diesmal liegt der kleine Finger (5) auf C und der Daumen (1) auf G.

Sie ist ein Spiegelbild der rechten Hand: Nach oben hin zählen die Finger rückwärts, 5 4 3 2 1.

Noten der linken Hand haben auf der Notenbahn ihre eigene Farbe. Drück das tiefe C mit dem linken kleinen Finger, um weiterzumachen.`),{highlight:[`C3`,`D3`,`E3`,`F3`,`G3`],pressToContinue:`C3`}),...I(P(`u4l1`,`Left hand home`,66,{L:`C3 D3 E3 F3 | G3:4 | G3 F3 E3 D3 | C3:4 | C3 D3 E3 F3 | G3 F3 E3 D3 | C3:4`}),`timed`,R)]),L(`u4l2`,E(`Left-hand steps and skips`,`Schritte und Sprünge links`),E(`Getting the weaker fingers moving.`,`Die schwächeren Finger in Bewegung bringen.`),[F(E(`Waking up fingers 4 and 5`,`Finger 4 und 5 aufwecken`),E(`For most people the left ring and little fingers are the weakest. That is normal, and it improves quickly.

Keep the hand relaxed and let each finger drop into its key. Skips here use fingers 5, 3 and 1.`,`Bei den meisten Menschen sind Ring- und kleiner Finger der linken Hand die schwächsten. Das ist normal und wird schnell besser.

Halte die Hand locker und lass jeden Finger in seine Taste fallen. Die Sprünge hier nehmen die Finger 5, 3 und 1.`),{highlight:[`C3`,`E3`,`G3`]}),...I(P(`u4l2`,`Left-hand steps and skips`,69,{L:`C3 E3 G3:2 | G3 E3 C3:2 | C3 D3 E3 C3 | E3 F3 G3:2 | G3 E3 G3 E3 | F3 D3 F3 D3 | E3 D3 C3:2`}),`timed`,R)]),L(`u4l3`,E(`Mary, left-handed`,`Mary mit links`),E(`A tune you know, in the other hand.`,`Eine bekannte Melodie in der anderen Hand.`),[F(E(`Same tune, new hand`,`Gleiche Melodie, neue Hand`),E(`Playing a tune you already know with the other hand is one of the fastest ways to train it. Your ear knows where the melody goes, so your fingers only have to follow.

It starts on E, which is finger 3 in this hand too.`,`Eine bekannte Melodie mit der anderen Hand zu spielen, ist eine der schnellsten Arten, diese Hand zu trainieren. Dein Ohr weiß, wohin die Melodie geht, die Finger müssen nur folgen.

Sie beginnt auf E – auch in dieser Hand Finger 3.`),{highlight:[`C3`,`D3`,`E3`,`G3`]}),...I(P(`u4l3`,`Mary, left-handed`,80,{L:`E3 D3 C3 D3 | E3 E3 E3:2 | D3 D3 D3:2 | E3 G3 G3:2 | E3 D3 C3 D3 | E3 E3 E3 E3 | D3 D3 E3 D3 | C3:4`}),`timed`,R)]),L(`u4l4`,E(`Bass notes`,`Basstöne`),E(`The long low notes that hold a song up.`,`Die langen tiefen Töne, die ein Lied tragen.`),[F(E(`The job of the left hand`,`Die Aufgabe der linken Hand`),E(`In most piano music the right hand sings the tune and the left hand supports it with long, low notes called bass notes.

Three of them do most of the work in the key of C: C (finger 5), F (finger 2) and G (finger 1). Play them firmly and hold each one for its full length.`,`In den meisten Klavierstücken singt die rechte Hand die Melodie, und die linke stützt sie mit langen, tiefen Tönen, den Basstönen.

In C-Dur erledigen drei davon die meiste Arbeit: C (Finger 5), F (Finger 2) und G (Finger 1). Spiel sie kräftig und halte jeden für seine volle Länge.`),{highlight:[`C3`,`F3`,`G3`]}),...I(P(`u4l4`,`Bass notes`,72,{L:`C3:4 | G3:4 | C3:2 G3:2 | C3:4 | C3:2 F3:2 | G3:4 | F3:2 G3:2 | C3:4`}),`timed`,R)])],de=[L(`u5l1`,E(`Taking turns`,`Abwechselnd`),E(`Both hands ready, one playing at a time.`,`Beide Hände bereit, immer eine spielt.`),[F(E(`Call and answer`,`Ruf und Antwort`),E(`Place both hands in C position: right thumb on middle C, left little finger on the C below.

The right hand plays a short phrase and the left hand answers it. Keep the resting hand on its keys so it is ready when its turn comes.`,`Leg beide Hände in die C-Lage: rechter Daumen auf das mittlere C, linker kleiner Finger auf das C darunter.

Die rechte Hand spielt eine kurze Phrase, die linke antwortet. Lass die ruhende Hand auf ihren Tasten liegen, damit sie bereit ist, wenn sie dran ist.`),{highlight:[`C3`,`D3`,`E3`,`F3`,`G3`,`C4`,`D4`,`E4`,`F4`,`G4`]}),...I(P(`u5l1`,`Taking turns`,72,{R:`C4 D4 E4:2 | -:4 | E4 F4 G4:2 | -:4 | G4 F4 E4 D4 | -:4 | C4:4`,L:`-:4 | C3 D3 E3:2 | -:4 | E3 F3 G3:2 | -:4 | G3 F3 E3 D3 | C3:4`}),`timed`,R)]),L(`u5l2`,E(`Together`,`Zusammen`),E(`Both hands playing the same notes at once.`,`Beide Hände spielen gleichzeitig dieselben Töne.`),[F(E(`Two hands, one sound`,`Zwei Hände, ein Klang`),E(`Now both hands play at the same moment, the same letters an octave apart. The notes line up side by side on the highway.

The fingers do not match: when your right thumb plays C, your left little finger does. Go slowly and let the two hands land as one sound.`,`Jetzt spielen beide Hände im selben Moment, dieselben Töne im Abstand einer Oktave. Die Noten liegen auf der Notenbahn nebeneinander.

Die Finger stimmen nicht überein: Wenn dein rechter Daumen C spielt, spielt es links der kleine Finger. Lass dir Zeit und lass beide Hände wie ein Klang landen.`)),...I(P(`u5l2`,`Together`,66,{R:`C4:2 D4:2 | E4:2 F4:2 | G4:4 | G4:2 F4:2 | E4:2 D4:2 | C4:4`,L:`C3:2 D3:2 | E3:2 F3:2 | G3:4 | G3:2 F3:2 | E3:2 D3:2 | C3:4`}),`timed`,R)]),L(`u5l3`,E(`Melody over bass`,`Melodie über dem Bass`),E(`The left hand holds while the right hand moves.`,`Die linke Hand hält, die rechte bewegt sich.`),[F(E(`Doing two different things`,`Zwei verschiedene Dinge tun`),E(`This is the heart of piano playing: the left hand holds one long bass note while the right hand plays a melody above it.

It feels strange at first. Use the tools on the play screen to practise one hand at a time, then put them together.`,`Das ist das Herz des Klavierspiels: Die linke Hand hält einen langen Basston, während die rechte darüber eine Melodie spielt.

Am Anfang fühlt sich das seltsam an. Übe mit den Werkzeugen auf dem Spielbildschirm zuerst jede Hand allein und setz sie dann zusammen.`)),...I(P(`u5l3`,`Melody over bass`,72,{R:`E4 D4 C4:2 | E4 D4 C4:2 | C4 D4 E4 F4 | G4:4 | G4 F4 E4 D4 | C4:2 E4:2 | D4 D4 E4 D4 | C4:4`,L:`C3:4 | C3:4 | C3:4 | G3:4 | G3:4 | C3:4 | G3:4 | C3:4`}),`timed`,R)]),L(`u5l4`,E(`Ode to Joy`,`Ode an die Freude`),E(`Beethoven, with both hands.`,`Beethoven, mit beiden Händen.`),[F(E(`Your first two-handed piece`,`Dein erstes Stück für beide Hände`),E(`Ode to Joy is the big tune from Beethoven's ninth symphony, and it fits perfectly under five fingers.

The right hand moves almost entirely by step. The left hand swaps between just two bass notes, C and G, one per bar.`,`Die Ode an die Freude ist die große Melodie aus Beethovens neunter Sinfonie, und sie passt perfekt unter fünf Finger.

Die rechte Hand bewegt sich fast nur in Schritten. Die linke wechselt zwischen nur zwei Basstönen, C und G, einer pro Takt.`),{highlight:[`C3`,`G3`,`C4`,`D4`,`E4`,`F4`,`G4`]}),...I(P(`u5l4`,`Ode to Joy`,84,{R:`E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4 D4 D4:2 | E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4:2`,L:`C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2`}),`timed`,R)])],z=`[C3/5 E3/3 G3/1]`,fe=`[C3/5 F3/2 A3/1]`,pe=`[D3/5 G3/2 B3/1]`,me=`C4/1 C4/1 G4/5 G4/5 | A4/5 A4/5 G4/5:2 | F4 F4 E4 E4 | D4 D4 C4:2`,he=`E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4 D4 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4 | E4 D4 D4 E4 | D4:2 G4:2 | E4 E4 E4:2 | E4 E4 E4:2 | E4 G4 C4 D4 | E4:4 | F4 F4 F4 F4 | F4 E4 E4 E4 | G4 G4 F4 D4 | C4:4`,ge=[z,z,z,z,fe,z,pe,pe,z,z,z,z,fe,z,pe,z].map(e=>`${e}:4`).join(` | `),_e=[L(`u6l1`,E(`The C chord`,`Der C-Dur-Akkord`),E(`Three notes at once.`,`Drei Töne auf einmal.`),[F(E(`What a chord is`,`Was ein Akkord ist`),E(`A chord is several notes played together. The C chord is C, E and G: every other key, played with fingers 1, 3 and 5.

First play the three notes one at a time, then drop all three fingers together. Aim for one sound, not three.`,`Ein Akkord sind mehrere Töne, die zusammen erklingen. Der C-Dur-Akkord besteht aus C, E und G: jede zweite Taste, gespielt mit den Fingern 1, 3 und 5.

Spiel die drei Töne zuerst einzeln, dann lass alle drei Finger zusammen fallen. Ziel ist ein Klang, nicht drei.`),{highlight:[`C4`,`E4`,`G4`]}),...I(P(`u6l1`,`The C chord`,66,{R:`C4 E4 G4:2 | [C4 E4 G4]:4 | -:4 | -:4 | [C4 E4 G4]:2 [C4 E4 G4]:2 | -:4`,L:`-:4 | -:4 | C3 E3 G3:2 | [C3 E3 G3]:4 | -:4 | [C3 E3 G3]:2 [C3 E3 G3]:2`}),`timed`,R)]),L(`u6l2`,E(`F and G chords`,`F- und G-Dur-Akkord`),E(`Three chords that play thousands of songs.`,`Drei Akkorde für Tausende Lieder.`),[F(E(`Two new shapes`,`Zwei neue Griffe`),E(`With C, F and G you can accompany a huge number of songs. To keep your hand from jumping around, play F and G in close shapes.

F chord: keep finger 5 on C, and play F with finger 2 and A with your thumb. The thumb stretches up one key.`,`Mit C, F und G kannst du eine riesige Zahl von Liedern begleiten. Damit deine Hand nicht herumspringt, spielst du F und G in engen Griffen.

F-Dur: Finger 5 bleibt auf C, F spielst du mit Finger 2 und A mit dem Daumen. Der Daumen streckt sich eine Taste nach oben.`),{highlight:[`C3`,`F3`,`A3`]}),F(E(`The G chord`,`Der G-Dur-Akkord`),E(`G chord: move the whole hand up one key. Finger 5 plays D, finger 2 plays G and the thumb plays B.

Change chords by moving the hand as one shape. In the gaps between chords, get the next shape ready over the keys before you need it.`,`G-Dur: Rück die ganze Hand eine Taste nach oben. Finger 5 spielt D, Finger 2 spielt G und der Daumen spielt H.

Wechsle Akkorde, indem du die Hand als Ganzes bewegst. Bereite in den Lücken zwischen den Akkorden den nächsten Griff über den Tasten vor, bevor du ihn brauchst.`),{highlight:[`D3`,`G3`,`B3`]}),...I(P(`u6l2`,`F and G chords`,60,{L:`${z}:4 | ${fe}:4 | ${z}:4 | ${pe}:4 | ${z}:2 ${fe}:2 | ${z}:2 ${pe}:2 | ${z}:4`}),`timed`,R)]),L(`u6l3`,E(`Twinkle, Twinkle`,`Morgen kommt der Weihnachtsmann`),E(`A melody with chords underneath.`,`Eine Melodie mit Akkorden darunter.`),[F(E(`Melody plus chords`,`Melodie und Akkorde`),E(`This is how most songs are played: the tune in the right hand and chords in the left.

The melody goes one key above C position. Stretch your little finger up to A, then bring it back to G. The left hand uses all three of your chords.`,`So werden die meisten Lieder gespielt: die Melodie in der rechten Hand, Akkorde in der linken.

Die Melodie geht eine Taste über die C-Lage hinaus. Streck den kleinen Finger zum A und bring ihn dann zurück zum G. Die linke Hand nutzt alle drei Akkorde.`),{highlight:[`A4`,`C3`,`F3`,`G3`]}),...I(P(`u6l3`,`Twinkle, Twinkle`,76,{R:`${me} | ${me}`,L:`${z}:4 | ${fe}:2 ${z}:2 | ${fe}:2 ${z}:2 | ${pe}:2 ${z}:2 | ${z}:4 | ${fe}:2 ${z}:2 | ${fe}:2 ${z}:2 | ${pe}:2 ${z}:2`}),`timed`,R)]),L(`u6l4`,`Jingle Bells`,E(`A full song with both hands.`,`Ein ganzes Lied mit beiden Händen.`),[F(E(`Everything you have learned`,`Alles, was du gelernt hast`),E(`Sixteen bars, three chords, both hands. The right hand stays in C position the whole time, and the left hand changes chord only once a bar.

If it feels like a lot, practise each hand alone first. When you can play this, you can play the piano. Next, the hands start to travel: scales, crossings and the whole keyboard.`,`Sechzehn Takte, drei Akkorde, beide Hände. Die rechte Hand bleibt die ganze Zeit in der C-Lage, die linke wechselt den Akkord nur einmal pro Takt.

Wenn es dir viel vorkommt, übe zuerst jede Hand allein. Wenn du das spielen kannst, kannst du Klavier spielen. Danach gehen die Hände auf Reisen: Tonleitern, Über- und Untersetzen und die ganze Tastatur.`)),...I(P(`u6l4`,`Jingle Bells`,92,{R:he,L:ge}),`timed`,R)])],ve=`C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 C5/5`,B=`C5/5 B4/4 A4/3 G4/2 | F4/1 E4/3 D4/2 C4/1`,ye=`C3/5 D3/4 E3/3 F3/2 | G3/1 A3/3 B3/2 C4/1`,be=`C4/1 B3/2 A3/3 G3/1 | F3/2 E3/3 D3/4 C3/5`,xe=[L(`u7l1`,E(`Thumb under`,`Daumenuntersatz`),E(`Going past five fingers without lifting the hand.`,`Über fünf Finger hinaus, ohne die Hand abzuheben.`),[F(E(`Five fingers are not enough`,`Fünf Finger reichen nicht`),E(`A scale has eight notes, but your hand has five fingers. The trick is to pass the thumb under the hand.

Play C D E with fingers 1 2 3. While finger 3 holds E, slide the thumb underneath to F. The hand follows, and you carry on with 2 3 on G and A.`,`Eine Tonleiter hat acht Töne, deine Hand aber nur fünf Finger. Der Trick: Der Daumen geht unter der Hand hindurch.

Spiel C D E mit den Fingern 1 2 3. Während Finger 3 das E hält, schiebst du den Daumen darunter auf das F. Die Hand folgt, und du spielst mit 2 3 auf G und A weiter.`),{highlight:[`C4`,`D4`,`E4`,`F4`,`G4`,`A4`]}),F(E(`Keep it smooth`,`Schön gebunden`),E(`The thumb should already be moving while finger 3 plays, so there is no gap and no bump in the sound. Keep the wrist level; only the thumb travels.

Press F with your thumb to carry on.`,`Der Daumen sollte schon unterwegs sein, während Finger 3 spielt – so entsteht keine Lücke und kein Ruck im Klang. Halte das Handgelenk ruhig, nur der Daumen wandert.

Drück F mit dem Daumen, um weiterzumachen.`),{highlight:[`F4`],pressToContinue:`F4`}),...I(P(`u7l1`,`Thumb under`,76,{R:`C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3:2 -:1 | C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 B4/4 -:1 | C5/5:4`}),`pitch`)]),L(`u7l2`,E(`Crossing over`,`Übersetzen`),E(`Coming back down: a finger over the thumb.`,`Abwärts: ein Finger über den Daumen.`),[F(E(`The way back`,`Der Rückweg`),E(`Going down, it works the other way round. Play A G F with fingers 3 2 1, then lift finger 3 over the thumb onto E. From there, 2 and 1 take you home to D and C.

The thumb is the pivot: the hand turns around it like a door on its hinge.`,`Abwärts geht es andersherum. Spiel A G F mit den Fingern 3 2 1 und führe dann Finger 3 über den Daumen auf das E. Von dort bringen dich 2 und 1 zurück nach D und C.

Der Daumen ist der Drehpunkt: Die Hand dreht sich um ihn wie eine Tür um ihre Angel.`),{highlight:[`A4`,`G4`,`F4`,`E4`,`D4`,`C4`]}),...I(P(`u7l2`,`Crossing over`,76,{R:`A4/3 G4/2 F4/1 E4/3 | D4/2 C4/1:2 -:1 | C4/1 D4/2 E4/3 F4/1 | G4/2 A4/3 G4/2 F4/1 | E4/3 D4/2 C4/1:2`}),`pitch`)]),L(`u7l3`,E(`C major scale, right hand`,`C-Dur-Tonleiter rechts`),E(`Eight notes up and down, in time.`,`Acht Töne hinauf und hinab, im Takt.`),[F(E(`Your first scale`,`Deine erste Tonleiter`),E(`A scale walks up every note of a key, from one C to the next. In C major that means every white key.

Fingering going up: 1 2 3, thumb under, 1 2 3 4 5. Coming down: 5 4 3 2 1, finger 3 over, 3 2 1. Pianists practise scales every day; they make every piece in that key easier.`,`Eine Tonleiter läuft alle Töne einer Tonart hinauf, von einem C zum nächsten. In C-Dur sind das alle weißen Tasten.

Fingersatz aufwärts: 1 2 3, Daumen unter, 1 2 3 4 5. Abwärts: 5 4 3 2 1, Finger 3 über, 3 2 1. Pianisten üben Tonleitern jeden Tag – sie machen jedes Stück in dieser Tonart leichter.`),{highlight:[`C4`,`D4`,`E4`,`F4`,`G4`,`A4`,`B4`,`C5`]}),...I(P(`u7l3`,`C major scale, right hand`,72,{R:`${ve} | ${B} | ${ve} | ${B}`}),`timed`,R)]),L(`u7l4`,E(`C major scale, left hand`,`C-Dur-Tonleiter links`),E(`The same scale, mirrored.`,`Dieselbe Tonleiter, gespiegelt.`),[F(E(`Mirror fingering`,`Gespiegelter Fingersatz`),E(`In the left hand the crossings come in other places. Going up: 5 4 3 2 1 from C to G, then finger 3 crosses over the thumb onto A, and 2 1 finish on B and C.

Coming down: 1 2 3 on C B A, the thumb passes under onto G, and 2 3 4 5 bring you home.`,`In der linken Hand liegen die Übergänge an anderen Stellen. Aufwärts: 5 4 3 2 1 von C bis G, dann setzt Finger 3 über den Daumen auf das A, und 2 1 enden auf H und C.

Abwärts: 1 2 3 auf C H A, der Daumen geht unter auf das G, und 2 3 4 5 bringen dich nach Hause.`),{highlight:[`C3`,`D3`,`E3`,`F3`,`G3`,`A3`,`B3`,`C4`]}),...I(P(`u7l4`,`C major scale, left hand`,69,{L:`${ye} | ${be} | ${ye} | ${be}`}),`timed`,R)]),L(`u7l5`,E(`Scale, hands together`,`Tonleiter beidhändig`),E(`The C major scale with both hands at once.`,`Die C-Dur-Tonleiter mit beiden Händen zugleich.`),[F(E(`Different fingers, same notes`,`Verschiedene Finger, gleiche Töne`),E(`Both hands play the same notes an octave apart, but their crossings come at different moments: the right thumb passes under on F, the left finger 3 crosses over on A.

The music waits for you here, so put each crossing in its place before thinking about speed.`,`Beide Hände spielen dieselben Töne im Abstand einer Oktave, aber die Übergänge kommen zu verschiedenen Zeitpunkten: Der rechte Daumen geht beim F unter, der linke Finger 3 setzt beim A über.

Die Musik wartet hier auf dich – bring erst jeden Übergang an seinen Platz, bevor du an Tempo denkst.`)),...I(P(`u7l5`,`Scale, hands together`,60,{R:`${ve} | ${B}`,L:`${ye} | ${be}`}),`pitch`)]),L(`u7l6`,E(`G major`,`G-Dur`),E(`A scale with one black key.`,`Eine Tonleiter mit einer schwarzen Taste.`),[F(E(`F sharp`,`Fis`),E(`G major starts on G and uses every white key except F. In its place you play the black key just above it: F sharp.

The fingering is the same as in C major. In the right hand, F sharp falls to finger 4 on the way up, and the thumb passes under after B.

Press F sharp to carry on.`,`G-Dur beginnt auf G und nutzt alle weißen Tasten außer F. Stattdessen spielst du die schwarze Taste direkt darüber: Fis.

Der Fingersatz ist derselbe wie in C-Dur. In der rechten Hand fällt das Fis aufwärts auf Finger 4, und der Daumen geht nach dem H unter.

Drück Fis, um weiterzumachen.`),{highlight:[`F#4`,`F#5`],pressToContinue:`F#4`}),...I(P(`u7l6`,`G major`,72,{R:`G4/1 A4/2 B4/3 C5/1 | D5/2 E5/3 F#5/4 G5/5 | G5/5 F#5/4 E5/3 D5/2 | C5/1 B4/3 A4/2 G4/1 | G4/1 A4/2 B4/3 C5/1 | D5/2 E5/3 F#5/4 G5/5 | F#5/4 E5/3 D5/2 C5/1 | B4/3 A4/2 G4/1:2`}),`timed`,R)])],V=`C4/1 E4/3 G4/5 E4/3 | C4/1 F4/3 A4/5 F4/3 | B3/1 D4/2 G4/5 D4/2 | C4/1 E4/3 G4/5 E4/3`,Se=`C3/5:2 C5/2:2 | F2/5:2 C5/2:2 | G2/5:2 B4/2:2 | C3/5:2 C5/2:2`,H=[L(`u8l1`,E(`Broken chords`,`Gebrochene Akkorde`),E(`A chord played one note at a time.`,`Ein Akkord, Ton für Ton gespielt.`),[F(E(`Opening up a chord`,`Einen Akkord auffächern`),E(`Instead of striking C, E and G together, play them one after another: C E G E. This is a broken chord, and it turns a block of sound into movement.

The left hand holds the bass underneath. Keep the right-hand fingers over their keys, as if you were holding the chord the whole time.`,`Statt C, E und G gemeinsam anzuschlagen, spielst du sie nacheinander: C E G E. Das ist ein gebrochener Akkord – aus einem Klangblock wird Bewegung.

Die linke Hand hält darunter den Bass. Lass die Finger der rechten Hand über ihren Tasten, als würdest du den Akkord die ganze Zeit greifen.`),{highlight:[`C4`,`E4`,`G4`]}),...I(P(`u8l1`,`Broken chords`,76,{R:`${V} | ${V}`,L:`C3:4 | F3:4 | G3:4 | C3:4 | C3:4 | F3:4 | G3:4 | C3:4`}),`timed`,R)]),L(`u8l2`,E(`Hand over hand`,`Übergreifen`),E(`The left hand crosses over the right.`,`Die linke Hand greift über die rechte.`),[F(E(`Crossing the hands`,`Hände kreuzen`),E(`Some music reaches further than one hand can. Then the hands leapfrog: the left hand plays its bass note, then crosses over the right hand to play a note high above it.

Always cross over the top, never underneath, and let the right hand stay low and steady while the left hand passes.`,`Manche Musik reicht weiter, als eine Hand greifen kann. Dann springen die Hände übereinander: Die linke Hand spielt ihren Basston und greift dann über die rechte, um einen Ton weit darüber zu spielen.

Greif immer oben drüber, nie darunter, und lass die rechte Hand ruhig und tief liegen, während die linke vorbeizieht.`),{highlight:[`C3`,`C4`,`E4`,`G4`,`C5`]}),...I(P(`u8l2`,`Hand over hand`,60,{R:`${V} | ${V}`,L:`${Se} | ${Se}`}),`timed`,R)]),L(`u8l3`,E(`Arpeggios`,`Arpeggien`),E(`A chord spread over two octaves.`,`Ein Akkord über zwei Oktaven.`),[F(E(`Climbing the chord`,`Den Akkord hinaufklettern`),E(`An arpeggio is a broken chord that keeps climbing: C E G, then the thumb passes under to the next C, and on up.

It is the same thumb-under move as in the scale, only the gaps are wider. Let the arm glide sideways so the thumb arrives in time.`,`Ein Arpeggio ist ein gebrochener Akkord, der immer weiter steigt: C E G, dann geht der Daumen unter zum nächsten C, und weiter hinauf.

Es ist derselbe Daumenuntersatz wie in der Tonleiter, nur die Abstände sind größer. Lass den Arm seitlich mitgleiten, damit der Daumen rechtzeitig ankommt.`),{highlight:[`C4`,`E4`,`G4`,`C5`,`E5`,`G5`,`C6`]}),...I(P(`u8l3`,`Arpeggios`,69,{R:`C4/1 E4/2 G4/3 C5/1 | E5/2 G5/3 C6/5:2 | C6/5 G5/3 E5/2 C5/1 | G4/3 E4/2 C4/1:2 | C4/1 E4/2 G4/3 C5/1 | E5/2 G5/3 C6/5:2 | C6/5 G5/3 E5/2 C5/1 | G4/3 E4/2 C4/1:2`}),`timed`,R)]),L(`u8l4`,E(`Chord inversions`,`Akkordumkehrungen`),E(`The same chord, stacked three ways.`,`Derselbe Akkord, dreimal anders geschichtet.`),[F(E(`Same notes, new order`,`Gleiche Töne, neue Reihenfolge`),E(`A C chord does not have to start on C. Move the bottom note up an octave and you get E G C, the first inversion. Do it again for G C E, the second inversion.

Inversions let the hand reach the next chord without jumping. The chord names on the highway show the bass note after a slash, like C/E.`,`Ein C-Dur-Akkord muss nicht auf C beginnen. Leg den untersten Ton eine Oktave höher und du erhältst E G C, die erste Umkehrung. Noch einmal, und es entsteht G C E, die zweite Umkehrung.

Mit Umkehrungen erreicht die Hand den nächsten Akkord, ohne zu springen. Die Akkordnamen auf der Notenbahn zeigen den Basston hinter einem Schrägstrich, etwa C/E.`),{highlight:[`C4`,`E4`,`G4`,`C5`,`E5`]}),...I(P(`u8l4`,`Chord inversions`,66,{R:`[C4/1 E4/3 G4/5]:2 [E4/1 G4/2 C5/5]:2 | [G4/1 C5/3 E5/5]:4 | [G4/1 C5/3 E5/5]:2 [E4/1 G4/2 C5/5]:2 | [C4/1 E4/3 G4/5]:4 | [C4/1 F4/3 A4/5]:2 [B3/1 D4/2 G4/5]:2 | [C4/1 E4/3 G4/5]:4`,L:`C3:4 | C3:4 | C3:4 | C3:4 | F3:2 G3:2 | C3:4`}),`timed`,R)])],U=[{n:1,title:E(`Meet the keyboard`,`Die Tastatur kennenlernen`),blurb:E(`Find your way around the keys.`,`Finde dich auf den Tasten zurecht.`)},{n:2,title:E(`Right hand`,`Rechte Hand`),blurb:E(`Five fingers and your first tunes.`,`Fünf Finger und deine ersten Melodien.`)},{n:3,title:E(`Rhythm`,`Rhythmus`),blurb:E(`Play in time with the beat.`,`Im Takt mit dem Grundschlag spielen.`)},{n:4,title:E(`Left hand`,`Linke Hand`),blurb:E(`Bring in the other half.`,`Die andere Hälfte kommt dazu.`)},{n:5,title:E(`Hands together`,`Beide Hände`),blurb:E(`Two hands, one piece of music.`,`Zwei Hände, ein Musikstück.`)},{n:6,title:E(`Chords and songs`,`Akkorde und Lieder`),blurb:E(`Three chords and real songs.`,`Drei Akkorde und echte Lieder.`)},{n:7,title:E(`Scales`,`Tonleitern`),blurb:E(`Thumb under, crossing over, and your first scales.`,`Daumenuntersatz, Übersetzen und deine ersten Tonleitern.`)},{n:8,title:E(`Across the keyboard`,`Über die ganze Tastatur`),blurb:E(`Broken chords, hand over hand, arpeggios and inversions.`,`Gebrochene Akkorde, Übergreifen, Arpeggien und Umkehrungen.`)}],Ce=[...se,...ce,...le,...ue,...de,..._e,...xe,...H],we=`E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4 D4 D4:2`,Te=`E4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4 C4 C4:2`,Ee=[{id:`hot-cross-buns`,title:`Hot Cross Buns`,composer:E(`Traditional`,`Volksweise`),chart:P(`hot-cross-buns`,`Hot Cross Buns`,96,{R:`E4:2 D4:2 | C4:4 | E4:2 D4:2 | C4:4 | C4 C4 C4 C4 | D4 D4 D4 D4 | E4:2 D4:2 | C4:4`,L:`C3:4 | C3:4 | C3:4 | C3:4 | C3:4 | G3:4 | C3:2 G3:2 | C3:4`})},{id:`mary`,title:E(`Mary Had a Little Lamb`,`Mary hatte ein kleines Lamm`),composer:E(`Traditional`,`Volksweise`),chart:P(`mary`,`Mary Had a Little Lamb`,100,{R:`E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 D4:2 | E4 G4 G4:2 | E4 D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:4`,L:`C3:4 | C3:4 | G3:4 | C3:4 | C3:4 | C3:4 | G3:4 | C3:4`})},{id:`ode-to-joy`,title:E(`Ode to Joy`,`Ode an die Freude`),composer:`Ludwig van Beethoven`,chart:P(`ode-to-joy`,`Ode to Joy`,100,{R:`${we} | ${Te} | D4 D4 E4 C4 | D4 E4/3:0.5 F4:0.5 E4 C4 | D4 E4/3:0.5 F4:0.5 E4 D4 | C4 D4 G3/1:2 | ${Te}`,L:`C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2 | G3:4 | C3:4 | G3:4 | C3:4 | C3:4 | G3:4 | C3:4 | G3:2 C3:2`})},{id:`twinkle`,title:E(`Twinkle, Twinkle, Little Star`,`Morgen kommt der Weihnachtsmann`),composer:E(`Traditional`,`Volksweise`),chart:P(`twinkle`,`Twinkle, Twinkle, Little Star`,88,{R:`${me} | G4/5 G4/5 F4 F4 | E4 E4 D4:2 | G4/5 G4/5 F4 F4 | E4 E4 D4:2 | ${me}`,L:`${z}:4 | ${fe}:2 ${z}:2 | ${fe}:2 ${z}:2 | ${pe}:2 ${z}:2 | ${z}:2 ${fe}:2 | ${z}:2 ${pe}:2 | ${z}:2 ${fe}:2 | ${z}:2 ${pe}:2 | ${z}:4 | ${fe}:2 ${z}:2 | ${fe}:2 ${z}:2 | ${pe}:2 ${z}:2`})},{id:`frere-jacques`,title:E(`Frère Jacques`,`Bruder Jakob`),composer:E(`Traditional`,`Volksweise`),chart:P(`frere-jacques`,`Frère Jacques`,96,{R:`C4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4 F4 G4:2 | G4:0.5 A4/5:0.5 G4/4:0.5 F4/3:0.5 E4/2 C4 | G4:0.5 A4/5:0.5 G4/4:0.5 F4/3:0.5 E4/2 C4 | C4 G3/1 C4:2 | C4 G3/1 C4:2`,L:Array(8).fill(`C3:4`).join(` | `)})},{id:`jingle-bells`,title:`Jingle Bells`,composer:`James Lord Pierpont`,chart:P(`jingle-bells`,`Jingle Bells`,104,{R:he,L:ge})}],De=[{pc:0,name:`C`},{pc:7,name:`G`},{pc:5,name:`F`},{pc:2,name:`D`}],Oe=[0,2,4,5,7,9,11,12];function ke(e){let t=De[(e%De.length+De.length)%De.length],n=60+t.pc-(t.pc>5?12:0),r=[],i=[...Oe,...Oe.slice(0,-1).reverse()];i.forEach((e,t)=>{let a=t===i.length-1;for(let[i,o]of[[`R`,n],[`L`,n-12]])r.push({pitch:o+e,startBeat:t,durationBeats:a?2:1,hand:i})});let a=[[0,4,7],[0,5,9],[-1,2,7],[0,4,7]],o=[0,5,7,0];return a.forEach((e,t)=>{let i=16+t*4;for(let t of e)r.push({pitch:n+t,startBeat:i,durationBeats:4,hand:`R`});let a=n-12+o[t];r.push({pitch:a>n-5?a-12:a,startBeat:i,durationBeats:4,hand:`L`})}),r.sort((e,t)=>e.startBeat-t.startBeat||e.pitch-t.pitch),{key:t.name,chart:{id:`warmup-${t.name}`,title:`Warm-up in ${t.name} major`,bpm:76,beatsPerBar:4,notes:r,lengthBeats:32}}}function Ae(e=new Date){return Math.floor(Date.UTC(e.getFullYear(),e.getMonth(),e.getDate())/864e5)}function je(e){let t=e.notes,n=e.beatsPerBar,r=e=>{let n=t.filter(t=>t.hand===e).map(e=>e.pitch);return n.length?n.reduce((e,t)=>e+t,0)/n.length:-1/0},i=r(`R`)>=r(`L`)?`R`:`L`,a=new Map;return t.forEach((e,t)=>{let n=`${e.hand}|${Math.round(e.startBeat*1e6)}`;a.set(n,[...a.get(n)??[],t])}),t.map(e=>{let r=a.get(`${e.hand}|${Math.round(e.startBeat*1e6)}`).map(e=>t[e].pitch),o=e.pitch===Math.max(...r),s=e.pitch===Math.min(...r),c=(e.startBeat%n+n)%n,l=Math.abs(c-Math.round(c))<1e-6,u=c<1e-6,d=u||n%2==0&&Math.abs(c-n/2)<1e-6||e.durationBeats>=2;return e.hand===i?o?d?1:l?2:3:s?4:5:s?u?3:l?4:5:5})}function Me(e,t,n,r=je(e)){let i=new Set;t.forEach((e,t)=>{let a=n[t]??5,o=e.notes.filter(e=>r[e]<=a);if(!o.length&&e.notes.length){let t=Math.min(...e.notes.map(e=>r[e]));o=e.notes.filter(e=>r[e]===t)}for(let e of o)i.add(e)});let a=e.notes.map((e,t)=>t).filter(e=>i.has(e));return{chart:{...e,notes:a.map(t=>e.notes[t])},source:a}}function Ne(e,t,n){return e.notes.filter(e=>n[e]<=t).length||(e.notes.length?e.notes.filter(t=>n[t]===Math.min(...e.notes.map(e=>n[e]))).length:0)}function Pe(e,t){let n=0,r=0;return e.forEach((e,i)=>{n+=e.notes.length,r+=e.notes.length*Math.min(1,t[i]??0)}),n?r/n:0}function Fe(e,t,n,r){return e.notes.length?Ne(e,t,r)/e.notes.length*n:0}var Ie=1e-6;function Le(e){let t=e.beatsPerBar,n=t%2==0?t/2:t,r=Math.max(e.lengthBeats,n),i=[],a=null;for(let t=0;t<r-Ie;t+=n){let o=t+n,s=Array(12).fill(0),c=1/0;for(let n of e.notes){let e=Math.min(o,n.startBeat+n.durationBeats)-Math.max(t,n.startBeat);if(e<=Ie)continue;let r=n.startBeat>=t-Ie?1:.5;s[n.pitch%12]+=e*r*(n.hand===`L`?1.5:1),c=Math.min(c,n.pitch)}let l=s.reduce((e,t)=>e+t,0),u=a;if(l>Ie){let e=-1/0;for(let t=0;t<12;t++)for(let n of[!1,!0]){let r=(t+(n?3:4))%12,i=(t+7)%12,o=s[t]+s[r]*.9+s[i]*.8-(l-s[t]-s[r]-s[i])*.6;c%12===t&&(o+=l*.25),n&&(o-=l*.02),a&&a.root===t&&a.minor===n&&(o+=l*.05),o>e+Ie&&(e=o,u={root:t,minor:n})}}if(!u)continue;let d=i[i.length-1];d&&d.root===u.root&&d.minor===u.minor&&Math.abs(d.startBeat+d.durationBeats-t)<Ie?d.durationBeats+=Math.min(n,r-t):i.push({startBeat:t,durationBeats:Math.min(n,r-t),...u}),a=u}return i}var Re=[{id:`melody`,name:E(`Melody`,`Melodie`),blurb:E(`The tune alone, right hand.`,`Nur die Melodie, rechte Hand.`)},{id:`chords`,name:E(`Chords`,`Akkorde`),blurb:E(`Left-hand chords while the tune plays along.`,`Akkorde links, die Melodie spielt mit.`)},{id:`simple`,name:E(`Two hands, simple`,`Zweihändig, leicht`),blurb:E(`The tune over one bass note per chord.`,`Die Melodie über einem Basston pro Akkord.`)},{id:`full`,name:E(`Full`,`Vollständig`),blurb:E(`Every note, both hands.`,`Jede Note, beide Hände.`)}],ze=1e-6;function Be(e){let t=t=>{let n=e.notes.filter(e=>e.hand===t).map(e=>e.pitch);return n.length?n.reduce((e,t)=>e+t,0)/n.length:-1/0};return t(`R`)>=t(`L`)?`R`:`L`}function Ve(e){let t=Be(e),n=new Map;for(let r of e.notes){if(r.hand!==t)continue;let e=Math.round(r.startBeat*1e6),i=n.get(e);(!i||r.pitch>i.pitch)&&n.set(e,r)}let r=[...n.values()].sort((e,t)=>e.startBeat-t.startBeat),i=t===`L`&&r.length&&Math.min(...r.map(e=>e.pitch))<55?12:0;return r.map((e,n)=>{let a=r[n+1],o=a?a.startBeat-e.startBeat:e.durationBeats;return{pitch:e.pitch+i,startBeat:e.startBeat,durationBeats:Math.min(e.durationBeats,o),hand:`R`,finger:t===`R`?e.finger:void 0}})}function He(e){let t=[],n=null;for(let r of e){let e=[r.root,(r.root+(r.minor?3:4))%12,(r.root+7)%12],i=[];for(let t=0;t<3;t++){let n=[e[t],e[(t+1)%3],e[(t+2)%3]];for(let e=36;e<=60;e++){if(e%12!==n[0])continue;let t=[e];for(let e of n.slice(1)){let n=t[t.length-1]+1;for(;n%12!==e;)n++;t.push(n)}t[0]>=45&&t[2]<=62&&i.push(t)}}let a=e=>e.reduce((e,t)=>e+t,0)/e.length,o=e=>n?e.reduce((e,t,r)=>e+Math.abs(t-n[r]),0):Math.abs(a(e)-52)+(e[0]%12===r.root?0:3);i.sort((e,t)=>o(e)-o(t)),n=i[0],t.push(n)}return t}function Ue(e,t,n,r){let i=[],a=e,o=e+t;for(;a<o-ze;){let e=(Math.floor(a/n+ze)+1)*n,t=Math.min(r,o-a,e-a);i.push([a,t]),a+=t}return i}function We(e,t,n){let r=[...t].sort((e,t)=>e.startBeat-t.startBeat||e.pitch-t.pitch);return{...e,id:`${e.id}${n}`,notes:r}}function Ge(e,t){let n=e.beatsPerBar,r=e=>Math.abs(e/n-Math.round(e/n))<ze;if(t===`full`)return{chart:e,hands:[`L`,`R`].filter(t=>e.notes.some(e=>e.hand===t)),tiers:je(e)};let i=Ve(e);if(t===`melody`){let t=We(e,i,`@melody`);return{chart:t,hands:[`R`],tiers:t.notes.map(e=>r(e.startBeat)?1:Math.abs(e.startBeat-Math.round(e.startBeat))<ze?2:3)}}let a=Le(e);if(t===`chords`){let t=He(a),o=[];a.forEach((e,r)=>{for(let[a,s]of Ue(e.startBeat,e.durationBeats,n,n%2==0?2:n))for(let e of t[r])i.some(t=>t.pitch===e&&Math.abs(t.startBeat-a)<ze)||o.push({pitch:e,startBeat:a,durationBeats:s,hand:`L`})});let s=We(e,[...i,...o],`@chords`);return{chart:s,hands:[`L`],tiers:s.notes.map(e=>{if(e.hand===`R`)return 1;let t=s.notes.filter(t=>t.hand===`L`&&Math.abs(t.startBeat-e.startBeat)<ze).map(e=>e.pitch);return e.pitch===Math.min(...t)?r(e.startBeat)?1:2:e.pitch===Math.max(...t)?4:3})}}let o=[];for(let e of a){let t=48+e.root;t>55&&(t-=12);for(let[r,i]of Ue(e.startBeat,e.durationBeats,n,n))o.push({pitch:t,startBeat:r,durationBeats:i,hand:`L`})}let s=We(e,[...i,...o],`@simple`);return{chart:s,hands:[`L`,`R`],tiers:s.notes.map(e=>e.hand===`L`?r(e.startBeat)?2:3:r(e.startBeat)?1:2)}}function Ke(e){if(e.notes.every(e=>e.finger))return e;let t=e.notes.map(e=>({...e}));for(let e of[`L`,`R`])tt(t,e);return{...e,notes:t}}var qe=[0,0,1,1,2,3,3,4,4,5,5,6],Je=[!1,!0,!1,!0,!1,!1,!0,!1,!0,!1,!0,!1],Ye=1,Xe=.12,Ze=2,Qe=.6,$e=.3,et=1.5;function tt(e,t){let n=e.map((e,t)=>t).filter(n=>e[n].hand===t);if(!n.length||n.every(t=>e[t].finger))return;let r=Array(12).fill(0);for(let t of n)r[nt(e[t].pitch)]++;let i=e=>{let t=nt(e),n=Math.floor(e/12)*7+qe[t];return Je[t]&&r[(t+11)%12]>r[(t+1)%12]?n+1:n},a=[];for(let t of[...n].sort((t,n)=>e[t].startBeat-e[n].startBeat||e[t].pitch-e[n].pitch)){let n=e[t],r=a[a.length-1];r&&Math.abs(r.start-n.startBeat)<1e-6?(r.notes.push(t),r.slots.push(i(n.pitch)),r.end=Math.max(r.end,n.startBeat+n.durationBeats)):a.push({notes:[t],slots:[i(n.pitch)],start:n.startBeat,end:n.startBeat+n.durationBeats})}let o=a.flatMap(e=>e.slots),s=Math.min(...o)-4,c=Math.max(...o),l=c-s+1,u=(e,n)=>t===`R`?e-n+1:5-(e-n),d=(t,n)=>{if(new Set(t.slots).size!==t.slots.length)return 1/0;let r=0;for(let i=0;i<t.notes.length;i++){let a=t.slots[i]-n;if(a<0||a>4)return 1/0;let o=u(t.slots[i],n),s=e[t.notes[i]];if(s.finger&&s.finger!==o)return 1/0;Je[nt(s.pitch)]&&(r+=o===1?Qe:o===5?$e:0)}return r},f=a.map(e=>{for(let t=s;t<=c;t++)if(d(e,t)<1/0)return null;return Math.min(...e.slots)}),p=(e,n,r)=>{let i=a[e-1],o=a[e];if(i.notes.length!==1||o.notes.length!==1||f[e-1]!==null||f[e]!==null)return 0;let s=o.slots[0]-i.slots[0];if(s===0||Math.abs(s)>2)return 0;let c=u(i.slots[0],n),l=u(o.slots[0],r);return((t===`R`?s>0:s<0)?l===1&&c>=2&&c<=4:c===1&&l>=2&&l<=4)?0:et},m=[],h=[];for(let e=0;e<a.length;e++){let t=a[e],n=Array(l).fill(1/0),r=Array(l).fill(-1);for(let i=0;i<l;i++){let o=i+s,c=f[e]===null?d(t,o):o===f[e]?0:1/0;if(c===1/0)continue;if(e===0){let e=t.slots.reduce((e,t)=>e+t,0)/t.slots.length-o;n[i]=c+.05*Math.abs(e-2);continue}let u=t.start-a[e-1].end>=Ze?.5:1,h=m[e-1];for(let t=0;t<l;t++){if(h[t]===1/0)continue;let a=i===t?0:u*(Ye+Xe*Math.abs(i-t))+(u===1?p(e,t+s,o):0),l=h[t]+a+c;l<n[i]&&(n[i]=l,r[i]=t)}}m.push(n),h.push(r)}let g=m[a.length-1].indexOf(Math.min(...m[a.length-1]));for(let t=a.length-1;t>=0;t--){let n=a[t];if(f[t]!==null)_(n);else for(let t=0;t<n.notes.length;t++)e[n.notes[t]].finger??=u(n.slots[t],g+s);g=h[t][g]}function _(n){let r=n.notes.map((e,t)=>t).sort((t,r)=>n.slots[t]-n.slots[r]||e[n.notes[t]].pitch-e[n.notes[r]].pitch),i=n.slots[r[0]],a=Math.max(1,n.slots[r[r.length-1]]-i),o=0;r.forEach((s,c)=>{let l=r.length-1-c,u=Math.round(1+4*(n.slots[s]-i)/a);u=Math.min(5-Math.min(l,4),Math.max(Math.min(o+1,5),u)),o=u;let d=e[n.notes[s]];d.finger??=t===`R`?u:6-u})}}function nt(e){return(e%12+12)%12}var rt=.6;function it(e){let t=e.beatsPerBar,n=Math.max(1,Math.ceil(e.lengthBeats/t-1e-9)),r=n>=64?8:n>=8?4:n>=4?2:n,i=[];for(let e=1;e<=n;e+=r)i.push([e,Math.min(n,e+r-1)]);let a=i[i.length-1],o=a[1]-a[0]+1;i.length>1&&(o===1||o<=r/4)&&(i.pop(),i[i.length-1][1]=a[1]);let s=i.map(([e,n])=>({fromBar:e,toBar:n,startBeat:(e-1)*t,endBeat:n*t,notes:[]}));e.notes.forEach((e,t)=>{(s.find(t=>e.startBeat<t.endBeat-1e-6)??s[s.length-1]).notes.push(t)}),s=s.reduceRight((e,t)=>!t.notes.length&&e.length?(e[0]={...e[0],fromBar:t.fromBar,startBeat:t.startBeat},e):[t,...e],[]);let c=[],l=new Map;return s.map(t=>{let n=new Set(t.notes.map(n=>{let r=e.notes[n];return`${r.pitch}@${Math.round((r.startBeat-t.startBeat)*1e3)}:${Math.round(r.durationBeats*1e3)}:${r.hand}`})),r=null;for(let e of c){let t=at(n,e.sig);(!r||t>r.score)&&(r={letter:e.letter,score:t})}let i;if(r&&r.score>=.999)i=r.letter;else if(r&&r.score>=rt){let e=(l.get(r.letter)??0)+1;l.set(r.letter,e),i=r.letter+(e===1?`′`:e===2?`″`:String(e))}else{let e=c.length<26?String.fromCharCode(65+c.length):String(c.length+1);c.push({letter:e,sig:n}),i=e}return{name:i,...t}})}function at(e,t){if(!e.size&&!t.size)return 1;let n=0;for(let r of e)t.has(r)&&n++;return n/Math.max(e.size,t.size)}function ot(e,t){let n=e.map(e=>({...e,notes:[]}));return t.notes.forEach((e,t)=>{(n.find(t=>e.startBeat<t.endBeat-1e-6)??n[n.length-1])?.notes.push(t)}),n}function st(e,t){for(let n=e.length-1;n>=0;n--)if(t>=e[n].startBeat-1e-6)return n;return 0}var ct=[{title:E(`Find the keys`,`Tasten finden`),text:E(`Play each note as it reaches the line. The music waits for you.`,`Spiel jede Note, wenn sie die Linie erreicht. Die Musik wartet auf dich.`),chart:P(`skill-1`,`Find the keys`,80,{R:`C4 E4 G4 F4 | D4 C4 A4 B4 | C5:2 G4:2`}),mode:`wait`},{title:E(`Right hand, in time`,`Rechte Hand im Takt`),text:E(`A short tune for your right hand, played in time with the click.`,`Eine kurze Melodie für die rechte Hand, im Takt mit dem Klick.`),chart:P(`skill-2`,`Right hand, in time`,84,{R:`C4 D4 E4 C4 | E4 F4 G4:2 | G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 | D4 G3 C4:2`}),mode:`timed`},{title:E(`Left hand, in time`,`Linke Hand im Takt`),text:E(`Now the left hand on its own, lower down the keyboard.`,`Jetzt die linke Hand allein, weiter unten auf der Tastatur.`),chart:P(`skill-3`,`Left hand, in time`,80,{L:`C3 E3 G3 E3 | F3 A3 C4:2 | G3 B3 D4 B3 | C3:4`}),mode:`timed`},{title:E(`Both hands`,`Beide Hände`),text:E(`A tune over chords: both hands together, in time.`,`Eine Melodie über Akkorden: beide Hände zusammen, im Takt.`),chart:P(`skill-4`,`Both hands`,80,{R:`E4 D4 C4 D4 | E4 E4 E4:2 | D4 D4 E4 D4 | C4:4`,L:`[C3 G3]:4 | [C3 G3]:4 | [B2 G3]:4 | [C3 G3]:4`}),mode:`timed`}],lt=[{openUnit:1,songLevel:1,label:E(`Starting from the first note`,`Los geht es mit dem ersten Ton`)},{openUnit:2,songLevel:1,label:E(`You know your way around the keys`,`Du kennst dich auf den Tasten aus`)},{openUnit:4,songLevel:2,label:E(`Your right hand keeps time`,`Deine rechte Hand hält den Takt`)},{openUnit:5,songLevel:3,label:E(`Both hands work on their own`,`Beide Hände spielen sicher allein`)},{openUnit:6,songLevel:4,label:E(`You can play hands together`,`Du spielst mit beiden Händen zusammen`)}];function ut(e){return lt[Math.max(0,Math.min(lt.length-1,e??0))]}var dt={perfect:10,good:7,miss:0},ft=5,pt=1e-6,mt=class{notes;mode;grades;shorts;holding=new Map;offsets=[];wrong=0;streak=0;bestStreak=0;constructor(e,t){this.notes=e,this.mode=t,this.grades=e.map(()=>void 0),this.shorts=e.map(()=>!1)}press(e,t){return this.mode===`pitch`?this.pressPitch(e):this.pressTimed(e,t)}pressTimed(e,t){let n=-1,r=1/0;for(let i=0;i<this.notes.length;i++){let a=this.notes[i];if(a.pitch!==e||this.grades[i]!==void 0)continue;let o=Math.round((t-a.time)*1e6)/1e3;Math.abs(o)<=120&&Math.abs(o)<Math.abs(r)&&(n=i,r=o)}if(n<0)return this.markWrong(e);let i=Math.abs(r)<=50?`perfect`:`good`;return this.markHit(n,i),this.holding.set(e,n),this.offsets.push(r),{kind:`hit`,index:n,grade:i,offsetMs:r}}pressPitch(e){let t=this.pendingGroup().find(t=>this.notes[t].pitch===e);return t===void 0?this.markWrong(e):(this.markHit(t,`perfect`),{kind:`hit`,index:t,grade:`perfect`,offsetMs:0})}release(e,t){let n=this.holding.get(e);if(n===void 0)return null;this.holding.delete(e);let r=this.notes[n];return!r.minHold||t>=r.time+r.minHold?null:(this.shorts[n]=!0,n)}markHit(e,t){this.grades[e]=t,this.streak++,this.bestStreak=Math.max(this.bestStreak,this.streak)}markWrong(e){return this.wrong++,this.streak=0,{kind:`wrong`,pitch:e}}advance(e){if(this.mode===`pitch`)return[];let t=[];for(let n=0;n<this.notes.length;n++)this.grades[n]===void 0&&e>this.notes[n].time+120/1e3&&(this.grades[n]=`miss`,t.push(n));return t.length&&(this.streak=0),t}pendingGroup(){let e=this.grades.findIndex(e=>e===void 0);if(e<0)return[];let t=this.notes[e].time,n=[];for(let r=e;r<this.notes.length;r++)Math.abs(this.notes[r].time-t)>pt||this.grades[r]===void 0&&n.push(r);return n}done(){return this.grades.every(e=>e!==void 0)}summary(){let e={total:this.notes.length,perfect:0,good:0,miss:0,wrong:this.wrong,short:this.shorts.filter(Boolean).length,accuracy:0,soFar:0,streak:this.streak,bestStreak:this.bestStreak,meanOffsetMs:this.offsets.length?this.offsets.reduce((e,t)=>e+t,0)/this.offsets.length:0,missedPitches:{}},t=e=>Math.round(this.notes[e].time/pt),n=e=>{let t=this.grades[e];return t?Math.min(dt[t],this.shorts[e]?ft:10):0},r=new Map,i=new Map;this.grades.forEach((a,o)=>{a&&e[a]++,a===`miss`&&(e.missedPitches[this.notes[o].pitch]=(e.missedPitches[this.notes[o].pitch]??0)+1),r.set(t(o),Math.min(r.get(t(o))??10,n(o))),a&&i.set(t(o),Math.min(i.get(t(o))??10,n(o)))});let a=0,o=0,s=0;return this.notes.forEach((e,n)=>{a+=r.get(t(n))??0,this.grades[n]&&(o+=i.get(t(n))??0,s++)}),e.accuracy=e.total?a/(10*(e.total+e.wrong)):0,e.soFar=s+e.wrong?o/(10*(s+e.wrong)):0,e}};function ht(e,t=.8){return e<t?0:e>=.97?3:e>=.9?2:1}var gt=.7,_t=.8,vt=.5,yt=.1;function bt(e){return{level:e,tempo:gt,rough:0}}function xt(e,t){if(t>=.9)return e.tempo<.999999?{state:{...e,rough:0,tempo:Ct(Math.min(1,e.tempo+yt))},event:`faster`}:e.level<5?{state:{level:e.level+1,tempo:_t,rough:0},event:`level-up`}:{state:{...e,rough:0},event:`learned`};if(t>=.6)return{state:{...e,rough:0},event:null};let n=e.rough+1;return n<2?{state:{...e,rough:n},event:null}:e.tempo>.500001?{state:{...e,rough:0,tempo:Ct(Math.max(vt,e.tempo-yt))},event:`slower`}:e.level>1?{state:{level:e.level-1,tempo:_t,rough:0},event:`level-down`}:{state:{...e,rough:0},event:null}}function St(e,t,n){let r=new Map;return e.forEach((e,t)=>{let i=n[t];i!==null&&r.set(e,[...r.get(e)??[],i])}),t.map((t,n)=>{let i=r.get(e[n]);if(!i)return t;let a=i.reduce((e,t)=>e+t,0)/i.length;return a>=.9?Math.min(5,t+1):a<.5?Math.max(1,t-1):t})}function Ct(e){return Math.round(e*100)/100}function W(e,t=null,...n){let r=document.createElement(e);for(let[e,n]of Object.entries(t??{}))n!=null&&n!==!1&&(e.startsWith(`on`)&&typeof n==`function`?r.addEventListener(e.slice(2),n):e===`class`?r.className=String(n):e in r?r[e]=n:r.setAttribute(e,String(n)));for(let e of n.flat())e!=null&&e!==!1&&r.append(e instanceof Node?e:String(e));return r}function wt(e){let t=W(`span`,{class:`icon`,"aria-hidden":`true`});return t.innerHTML=`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${Tt[e]}</svg>`,t}var Tt={lock:`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,back:`<path d="M15 5l-7 7 7 7"/>`,pause:`<rect x="6.500" y="5" width="4" height="14" rx="1.200" fill="currentColor" stroke="none"/><rect x="13.500" y="5" width="4" height="14" rx="1.200" fill="currentColor" stroke="none"/>`,play:`<path d="M7 5l12 7-12 7z" fill="currentColor"/>`,gear:`<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>`,music:`<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>`,nova:`<path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor" stroke="none"/>`,check:`<path d="M5 12l5 5 9-10"/>`,restart:`<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v5h5"/>`,target:`<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>`,flame:`<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.200 2-4.200.300 1.700 1 2.500 2 3 .200-3-.500-6 1-8.800z"/>`,loop:`<path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/>`,pedal:`<path d="M4 15h16l-2-6H6z"/><path d="M3 15v3h18v-3"/>`,checkCircle:`<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M8 12.500l2.800 2.800L16 9.500" stroke="#06140d"/>`,clock:`<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,cross:`<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>`,hourglass:`<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9"/>`};function Et(e,t=``){return W(`span`,{class:`stars ${t}`,"aria-label":w(`${e} of 3 stars`,`${e} von 3 Sternen`)},[0,1,2].map(t=>W(`span`,{class:t<e?`star lit`:`star`},`★`)))}var Dt=e=>{let t=Math.floor(e*100+1e-6);return S()===`de`?`${t} %`:`${t}%`},Ot=`modulepreload`,kt=function(e,t){return new URL(e,t).href},At={},jt=function(e){return e.pathname.endsWith(`.css`)},Mt=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},Nt=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=kt(t,n);let r=s(t),i=jt(r);return Mt(At,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:Ot,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{let i=a=>{t.removeEventListener(`load`,i),t.removeEventListener(`error`,i),a.type===`error`?n(Error(`Unable to preload CSS for ${r}`)):e(a)};t.addEventListener(`load`,i),t.addEventListener(`error`,i)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},Pt=21,Ft=108,It=60,Lt=.05,Rt=9;function zt(e){let t=e.tracks.map((e,t)=>{let n=!!e.instrument?.percussion||e.channel===Rt;return{index:t,name:e.name?.trim()||`Track ${t+1}`,instrument:n?`Drums`:e.instrument?.name||`Piano`,notes:e.notes.length,percussion:n,family:e.instrument?.family,role:`off`}}).filter(e=>e.notes>0),n=t.filter(e=>!e.percussion);if(n.length===2)n[0].role=`R`,n[1].role=`L`;else{let e=n.filter(e=>!e.family||e.family===`piano`);for(let t of e.length?e:n)t.role=`split`}return t.map(({family:e,...t})=>t)}function Bt(e,t,n){let r=e.header.ppq>0?e.header.ppq:480,i=n??Object.fromEntries(zt(e).map(e=>[e.index,e.role])),a=new Set,o=[];if(e.tracks.forEach((e,t)=>{let n=i[t]??`off`;if(n!==`off`)for(let t of e.notes){if(t.midi<Pt||t.midi>Ft)continue;let e=`${t.midi}@${t.ticks}`;if(a.has(e))continue;a.add(e);let i=n===`split`?t.midi>=It?`R`:`L`:n;o.push({pitch:t.midi,startBeat:t.ticks/r,durationBeats:Math.max(Lt,t.durationTicks/r),hand:i})}}),o.length===0)throw Error(`No notes found in this file`);o.sort((e,t)=>e.startBeat-t.startBeat||e.pitch-t.pitch);let[s,c]=e.header.timeSignatures[0]?.timeSignature??[4,4],l=Math.max(1,Math.round(s*4/(c||4)))||4,u=Math.floor(o[0].startBeat/l)*l;for(let e of o)e.startBeat-=u;let d=e.header.tempos[0]?.bpm,f=o.reduce((e,t)=>Math.max(e,t.startBeat+t.durationBeats),0);return{id:`import`,title:t,bpm:d&&d>0&&Number.isFinite(d)?Math.round(d*100)/100:120,beatsPerBar:l,notes:o,lengthBeats:Math.max(l,Math.ceil(f/l-1e-9)*l)}}async function Vt(e){let{Midi:t}=await Nt(async()=>{let{Midi:e}=await import(`./Midi-DdRz4a4o.js`).then(e=>u(e.default,1));return{Midi:e}},[],import.meta.url),n;try{n=new t(await e.arrayBuffer())}catch{throw Error(`This does not look like a MIDI file`)}if(!zt(n).some(e=>!e.percussion))throw Error(`No notes found in this file`);return{midi:n,title:e.name.replace(/\.(mid|midi)$/i,``)}}function Ht(e){let t=W(`span`,{class:`dot`}),n=W(`span`),r=W(`span`,{class:`pill`},t,n),i=e=>{let t=e.inputs.length>0;r.className=t?`pill ok`:`pill`,n.textContent=t?w(`MIDI connected`,`MIDI verbunden`):w(`Computer keys`,`Computertasten`),r.title=t?e.inputs.map(e=>e.name).join(`, `):w(`No MIDI keyboard found. Your computer keys play notes.`,`Kein MIDI-Keyboard gefunden. Deine Computertasten spielen Töne.`)};return i(e.input.status),{el:r,destroy:e.input.onStatus(i)}}var Ut=1e-6;function Wt(e){return e===4?[[0,`kick`,1],[1,`snare`,.8],[2,`kick`,.85],[2.5,`kick`,.45],[3,`snare`,.8],...[0,.5,1,1.5,2,2.5,3,3.5].map(e=>[e,`hat`,e%1?.45:.7])]:e===3?[[0,`kick`,1],[1,`hat`,.6],[1,`snare`,.35],[2,`hat`,.6],[2,`snare`,.35]]:e===2?[[0,`kick`,1],[1,`snare`,.75],...[0,.5,1,1.5].map(e=>[e,`hat`,e%1?.45:.65])]:[[0,`kick`,1],...Array.from({length:e},(e,t)=>[t,`hat`,.6])]}function Gt(e){let t=e.beatsPerBar,n=e.lengthBeats,r=[],i=Math.ceil(n/t-Ut);for(let e=0;e<i;e++){let a=e===i-1;for(let[i,o,s]of Wt(t)){let c=e*t+i;c>=n-Ut||a&&i>0||r.push({beat:c,sound:o,pitches:[],durationBeats:.25,velocity:a&&o===`kick`?1:s})}}for(let n of Le(e)){let e=36+n.root;e>43&&(e-=12);let i=n.root+(n.minor?3:4),a=[n.root,i,n.root+7].map(e=>{let t=55+((e-55)%12+12)%12;return t>66&&(t-=12),t});r.push({beat:n.startBeat,sound:`pad`,pitches:a.sort((e,t)=>e-t),durationBeats:n.durationBeats,velocity:.6});for(let i=n.startBeat;i<n.startBeat+n.durationBeats-Ut;){let a=(Math.floor(i/t+Ut)+1)*t,o=Math.min(a,n.startBeat+n.durationBeats),s=o-i;t===4&&s>=3.999999?(r.push({beat:i,sound:`bass`,pitches:[e],durationBeats:1.9,velocity:.9}),r.push({beat:i+2,sound:`bass`,pitches:[e+7],durationBeats:1.9,velocity:.75})):r.push({beat:i,sound:`bass`,pitches:[e],durationBeats:s*.95,velocity:.9}),i=o}}return r.sort((e,t)=>e.beat-t.beat)}var Kt={L:`#35dfe8`,R:`#ffb340`,miss:`#56607f`,wrong:`#ff4d6d`,neutral:`#aab2ff`,hint:`#ffd76a`},qt=`ui-sans-serif, system-ui, "Segoe UI", sans-serif`;function Jt(e){let t=48,n=72;for(let r of e?.notes??[])t=Math.min(t,r.pitch-r.pitch%12),n=Math.max(n,r.pitch%12==0?r.pitch:r.pitch-r.pitch%12+11);return{lo:Math.max(21,t-5),hi:Math.min(108,n+5)}}function Yt(e){let t=parseInt(e.slice(1),16);return[t>>16&255,t>>8&255,t&255]}function Xt(e,t){let[n,r,i]=Yt(e);return`rgba(${n}, ${r}, ${i}, ${t})`}function Zt(e,t){let[n,r,i]=Yt(e).map(e=>Math.round(e+(255-e)*t));return`#${(1<<24|n<<16|r<<8|i).toString(16).slice(1)}`}var Qt=[`KeyZ`,`KeyS`,`KeyX`,`KeyD`,`KeyC`,`KeyV`,`KeyG`,`KeyB`,`KeyH`,`KeyN`,`KeyJ`,`KeyM`,`KeyQ`,`Digit2`,`KeyW`,`Digit3`,`KeyE`,`KeyR`,`Digit5`,`KeyT`,`Digit6`,`KeyY`,`Digit7`,`KeyU`,`KeyI`],$t=48,en=new Map(Qt.map((e,t)=>[e,t]));function tn(e,t){let n=en.get(e);if(n===void 0)return null;let r=$t+n+t*12;return r>=21&&r<=108?r:null}var nn=new Map,rn=0,an=()=>rn;async function on(){let e=navigator.keyboard;try{let t=await e?.getLayoutMap?.();if(!t)return;nn=new Map(Qt.flatMap(e=>t.get(e)?[[e,t.get(e).toUpperCase()]]:[])),rn++}catch{}}function sn(e,t){let n=Qt[e-$t-t*12];return n?nn.get(n)??n.replace(/^Key|^Digit/,``):null}var cn=class{emit;octaveShift=0;shiftEnabled=!1;down=new Map;constructor(e){this.emit=e,window.addEventListener(`keydown`,this.onDown),window.addEventListener(`keyup`,this.onUp),window.addEventListener(`blur`,this.releaseAll)}onDown=e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||ln(e.target))return;if(e.code===`BracketLeft`||e.code===`BracketRight`){if(!this.shiftEnabled)return;this.octaveShift=Math.max(-2,Math.min(3,this.octaveShift+(e.code===`BracketLeft`?-1:1)));return}let t=tn(e.code,this.octaveShift);t===null||this.down.has(e.code)||(e.preventDefault(),this.down.set(e.code,t),this.emit(t,!0,e.timeStamp,.75))};onUp=e=>{let t=this.down.get(e.code);t!==void 0&&(this.down.delete(e.code),this.emit(t,!1,e.timeStamp,0))};releaseAll=()=>{for(let e of this.down.values())this.emit(e,!1,performance.now(),0);this.down.clear()}};function ln(e){return e instanceof HTMLElement?e instanceof HTMLInputElement?![`range`,`checkbox`,`button`,`file`].includes(e.type):e instanceof HTMLTextAreaElement||e instanceof HTMLSelectElement||e.isContentEditable:!1}var un=1.9,dn=.2,fn=.6,pn=650,mn=400,hn=class{canvas;g;lo=43;hi=77;labels=!0;keyHints=!1;hintShift=0;held=new Set;sparks=[];lastSustainSpark=0;w=0;h=0;dpr=1;cache=null;observer;constructor(e){this.canvas=e,this.g=e.getContext(`2d`),this.observer=new ResizeObserver(()=>this.resize()),this.observer.observe(e),this.resize()}destroy(){this.observer.disconnect()}setRange(e){let{lo:t,hi:n}=Jt(e);this.lo=t,this.hi=n}setOptions(e){this.labels=e.labels,this.keyHints=e.keyHints,this.hintShift=e.hintShift??0}setHeld(e){this.held=e}flash(e,t,n){if(t===`miss`)return;let r=t===`wrong`?Kt.wrong:n?Kt[n]:Kt.neutral;this.burst(e,r,t===`perfect`?16:t===`wrong`?6:9)}resize(){let e=this.dpr=Math.min(2,window.devicePixelRatio||1);this.w=this.canvas.clientWidth,this.h=this.canvas.clientHeight,this.canvas.width=Math.max(1,Math.round(this.w*e)),this.canvas.height=Math.max(1,Math.round(this.h*e)),this.g.setTransform(e,0,0,e,0,0)}get layout(){let e=0;for(let t=this.lo;t<=this.hi;t++)N(t)||e++;let t=this.w/e,n=Math.max(110,Math.min(this.h*.3,t*4.2));return{whiteW:t,keyH:n,hitY:this.h-n,horizon:-this.h*.04}}key(e){let{whiteW:t}=this.layout,n=0;for(let t=this.lo;t<e;t++)N(t)||n++;return N(e)?{x:n*t,width:t*.56}:{x:(n+.5)*t,width:t}}depth(e){let t=Math.max(0,Math.min(1,e/8));return(1-t)/(1+un*t)}project(e,t){let{hitY:n,horizon:r}=this.layout,i=dn+.8*t;return{x:this.w/2+(e-this.w/2)*i,y:r+(n-r)*t,scale:i}}onKeys(e,t){let{hitY:n,keyH:r}=this.layout;return{x:this.w/2+(e-this.w/2)*(1+.10000000000000009*t),y:n+r*t}}draw(e){this.w!==0&&this.h!==0&&(this.g.clearRect(0,0,this.w,this.h),this.drawLanes(e),e.chart&&this.drawNotes(e,e.chart),this.drawKeyboard(e),this.drawHitLine(),this.drawSparks())}drawLanes(e){let t=this.g,{hitY:n}=this.layout,r=t.createLinearGradient(0,n-this.h*.45,0,n);r.addColorStop(0,`rgba(60, 80, 190, 0)`),r.addColorStop(1,`rgba(60, 80, 190, 0.16)`),t.fillStyle=r,t.fillRect(0,0,this.w,n),t.lineWidth=1;for(let e=this.lo;e<=this.hi;e++){if(e%12!=0&&e%12!=5)continue;let n=this.key(e).x-this.key(e).width/2,r=this.project(n,0),i=this.project(n,1),a=t.createLinearGradient(0,r.y,0,i.y);a.addColorStop(0,`rgba(150, 170, 255, 0)`),a.addColorStop(.25,`rgba(150, 170, 255, 0.1)`),a.addColorStop(1,e%12==0?`rgba(150, 170, 255, 0.26)`:`rgba(150, 170, 255, 0.14)`),t.strokeStyle=a,t.beginPath(),t.moveTo(r.x,r.y),t.lineTo(i.x,i.y),t.stroke()}if(e.chart){let n=e.chart.beatsPerBar;for(let r=Math.ceil(e.beat/n)*n;r<e.beat+8;r+=n){let n=this.depth(r-e.beat),i=this.project(0,n),a=this.project(this.w,n);t.strokeStyle=`rgba(150, 170, 255, ${.13*Math.min(1,n*5+.1)})`,t.beginPath(),t.moveTo(i.x,i.y),t.lineTo(a.x,a.y),t.stroke()}}}drawNotes(e,t){let n=this.g,r=performance.now(),i=r-this.lastSustainSpark>45;for(let r=t.notes.length-1;r>=0;r--){let a=t.notes[r],o=a.startBeat-e.beat,s=o+a.durationBeats;if(o>8||s<0)continue;let c=e.noteState?.[r]??`pending`,l=e.active?.[r]??!0,u=c===`perfect`||c===`good`,d=!!e.cut?.[r],f=o<=0&&!d&&(u||!l||!e.active),p=this.depth(Math.max(0,o)),m=this.depth(Math.min(8,Math.max(.1,s))),h=this.key(a.pitch),g=(N(a.pitch)?h.width*1.05:h.width*.68)/2,_=this.project(h.x-g,m),v=this.project(h.x+g,m),y=this.project(h.x+g,p),b=this.project(h.x-g,p),x=c===`miss`?Kt.miss:Kt[a.hand],S=Math.min(1,m*7+.2);n.globalAlpha=(c===`miss`?.45:d?.3:l?1:.5)*S;let C=n.createLinearGradient(0,_.y,0,b.y);C.addColorStop(0,Xt(x,.42)),C.addColorStop(1,Xt(f?Zt(x,.55):x,f?1:.9)),n.fillStyle=C,n.shadowColor=x,n.shadowBlur=c===`miss`?0:f?34:8+16*p;let w=Math.max(1,Math.min(7*y.scale,(b.y-_.y)/2,(y.x-b.x)/2));n.beginPath(),n.moveTo(_.x+w,_.y),n.lineTo(v.x-w,v.y),n.quadraticCurveTo(v.x,v.y,v.x,v.y+w),n.lineTo(y.x,y.y-w),n.quadraticCurveTo(y.x,y.y,y.x-w,y.y),n.lineTo(b.x+w,b.y),n.quadraticCurveTo(b.x,b.y,b.x,b.y-w),n.lineTo(_.x,_.y+w),n.quadraticCurveTo(_.x,_.y,_.x+w,_.y),n.closePath(),n.fill(),n.shadowBlur=0,n.strokeStyle=Xt(Zt(x,.5),c===`miss`?.3:.85),n.lineWidth=Math.max(.75,1.5*y.scale),n.stroke();let T=a.finger?String(a.finger):this.labels?O(a.pitch):``,E=17*y.scale;T&&l&&c===`pending`&&o>-.05&&E>=9&&b.y-_.y>E*1.5&&(n.fillStyle=`rgba(6, 10, 30, 0.82)`,n.font=`800 ${E}px ${qt}`,n.textAlign=`center`,n.textBaseline=`alphabetic`,n.fillText(T,(y.x+b.x)/2,b.y-E*.45)),n.globalAlpha=1,f&&i&&s>.05&&c!==`miss`&&this.burst(a.pitch,Kt[a.hand],1)}i&&(this.lastSustainSpark=r)}drawHitLine(){let e=this.g,{hitY:t}=this.layout,n=e.createLinearGradient(0,0,this.w,0);n.addColorStop(0,`rgba(255, 255, 255, 0.35)`),n.addColorStop(.5,`rgba(255, 255, 255, 1)`),n.addColorStop(1,`rgba(255, 255, 255, 0.35)`),e.shadowColor=`#b8c4ff`,e.shadowBlur=18,e.fillStyle=n,e.fillRect(0,t-1.5,this.w,3),e.shadowBlur=0}litColor(e,t){if(!this.held.has(e))return null;let n=t.keyHands?.get(e);return n?Kt[n]:Kt.neutral}quad(e,t,n,r){let i=this.g,a=this.onKeys(e,n),o=this.onKeys(t,n),s=this.onKeys(t,r),c=this.onKeys(e,r);i.beginPath(),i.moveTo(a.x,a.y),i.lineTo(o.x,o.y),i.lineTo(s.x,s.y),i.lineTo(c.x,c.y),i.closePath()}drawKeyboard(e){let t=this.g,{keyH:n,hitY:r}=this.layout,i=t=>{let n=e.highlight?.get(t);return n?n===`hint`?Kt.hint:Kt[n]:null},{white:a,black:o}=this.keyboardCache();t.drawImage(a,0,r,this.w,n);for(let t=this.lo;t<=this.hi;t++){if(N(t))continue;let n=this.litColor(t,e),r=i(t);(n||r)&&this.paintWhite(t,n,r)}t.drawImage(o,0,r,this.w,n);for(let t=this.lo;t<=this.hi;t++){if(!N(t))continue;let n=this.litColor(t,e),r=i(t);(n||r)&&this.paintBlack(t,n,r)}}keyboardCache(){let{keyH:e,hitY:t}=this.layout,n=[this.w,this.h,this.dpr,this.lo,this.hi,this.labels,this.keyHints,this.hintShift,an()].join(`|`);if(this.cache?.key===n)return this.cache;let r=n=>{let r=document.createElement(`canvas`);r.width=Math.max(1,Math.round(this.w*this.dpr)),r.height=Math.max(1,Math.round(e*this.dpr));let i=this.g;return this.g=r.getContext(`2d`),this.g.setTransform(this.dpr,0,0,this.dpr,0,-t*this.dpr),n(),this.g=i,r},i=r(()=>{for(let e=this.lo;e<=this.hi;e++)N(e)||this.paintWhite(e,null,null)}),a=r(()=>{for(let e=this.lo;e<=this.hi;e++)N(e)&&this.paintBlack(e,null,null)});return this.cache={key:n,white:i,black:a},this.cache}paintWhite(e,t,n){let r=this.g,{whiteW:i,keyH:a,hitY:o}=this.layout,s=this.key(e),c=s.x-s.width/2,l=s.x+s.width/2;if(t){let e=r.createLinearGradient(0,o,0,o+a);e.addColorStop(0,Xt(t,.75)),e.addColorStop(.75,Xt(Zt(t,.35),.95)),e.addColorStop(1,Xt(t,.9)),r.fillStyle=e,r.shadowColor=t,r.shadowBlur=26,this.quad(c,l,0,1),r.fill(),r.shadowBlur=0}else if(n){let e=r.createLinearGradient(0,o,0,o+a);e.addColorStop(0,Xt(n,.6)),e.addColorStop(1,Xt(n,.25)),r.fillStyle=e,this.quad(c,l,0,1),r.fill()}else{let e=r.createLinearGradient(0,o,0,o+a);e.addColorStop(0,`#cfcbc2`),e.addColorStop(.12,`#f1ede4`),e.addColorStop(.9,`#e7e2d7`),e.addColorStop(1,`#bdb8ad`),r.fillStyle=e,this.quad(c,l,0,1),r.fill()}r.strokeStyle=`rgba(40, 36, 30, 0.6)`,r.lineWidth=1.2;for(let e of[c,l]){let t=this.onKeys(e,0),n=this.onKeys(e,1);r.beginPath(),r.moveTo(t.x,t.y),r.lineTo(n.x,n.y),r.stroke()}let u=e%12==0,d=this.onKeys(s.x,.86);r.textAlign=`center`,r.textBaseline=`alphabetic`,(u||this.labels&&i>=30)&&(r.fillStyle=t?`rgba(10, 20, 40, 0.7)`:u?`rgba(70, 66, 60, 0.85)`:`rgba(70, 66, 60, 0.42)`,r.font=`${u?`italic 600`:`500`} ${Math.min(u?19:14,i*.34)}px ${qt}`,r.fillText(O(e)+(u?String(Math.floor(e/12)-1):``),d.x,d.y));let f=this.keyHints?sn(e,this.hintShift):null;if(f&&i>=30){let e=this.onKeys(s.x,.7);r.fillStyle=`rgba(70, 66, 60, 0.5)`,r.font=`700 ${Math.min(12,i*.22)}px ${qt}`,r.fillText(f,e.x,e.y)}let p=r.createLinearGradient(0,o,0,o+a*.14);p.addColorStop(0,`rgba(8, 10, 26, 0.5)`),p.addColorStop(1,`rgba(8, 10, 26, 0)`),r.fillStyle=p,this.quad(c,l,0,.14),r.fill()}paintBlack(e,t,n){let r=this.g,{whiteW:i,keyH:a,hitY:o}=this.layout,s=this.key(e),c=s.x-s.width/2,l=s.x+s.width/2;!t&&!n&&(r.fillStyle=`rgba(0, 0, 0, 0.2)`,this.quad(c+s.width*.1,l+s.width*.14,0,.62),r.fill()),r.fillStyle=`#08080b`,this.quad(c,l,0,fn),r.fill();let u=s.width*.13,d=r.createLinearGradient(0,o,0,o+a*fn),f=t??n;f?(d.addColorStop(0,Xt(f,t?.75:.7)),d.addColorStop(1,Xt(Zt(f,.3),t?1:.9)),t&&(r.shadowColor=f,r.shadowBlur=22)):(d.addColorStop(0,`#1b1b21`),d.addColorStop(.7,`#34343c`),d.addColorStop(1,`#4a4a54`)),r.fillStyle=d,this.quad(c+u,l-u,0,fn*.87),r.fill(),r.shadowBlur=0;let p=this.onKeys(c+u,.02),m=this.onKeys(c+u,fn*.86);r.strokeStyle=`rgba(255, 255, 255, 0.16)`,r.lineWidth=1,r.beginPath(),r.moveTo(p.x,p.y),r.lineTo(m.x,m.y),r.stroke();let h=this.keyHints?sn(e,this.hintShift):null;if(h&&i>=30){let e=this.onKeys(s.x,fn*.72);r.fillStyle=f?`rgba(10, 20, 40, 0.8)`:`rgba(255, 255, 255, 0.5)`,r.font=`700 ${Math.min(11,i*.2)}px ${qt}`,r.textAlign=`center`,r.textBaseline=`alphabetic`,r.fillText(h,e.x,e.y)}}burst(e,t,n){if(e<this.lo||e>this.hi)return;let{hitY:r}=this.layout,i=this.key(e),a=performance.now();for(let e=0;e<n;e++)this.sparks.push({x:i.x+(Math.random()-.5)*i.width*1.1,y:r-Math.random()*4,vx:(Math.random()-.5)*70,vy:-(30+Math.random()*110),born:a,color:t,size:.8+Math.random()*1.6});this.sparks.length>mn&&this.sparks.splice(0,this.sparks.length-mn)}drawSparks(){let e=this.g,t=performance.now();this.sparks=this.sparks.filter(e=>t-e.born<pn),e.globalCompositeOperation=`lighter`;for(let n of this.sparks){let r=(t-n.born)/1e3,i=1-(t-n.born)/pn;e.globalAlpha=i*i,e.fillStyle=n.color,e.shadowColor=n.color,e.shadowBlur=8,e.beginPath(),e.arc(n.x+n.vx*r,n.y+n.vy*r*(1-r*.6),n.size,0,Math.PI*2),e.fill()}e.shadowBlur=0,e.globalAlpha=1,e.globalCompositeOperation=`source-over`}},gn=1e3,_n=1001,vn=1002,yn=1003,bn=1004,xn=1005,Sn=1006,Cn=1007,wn=1008,Tn=1009,En=1010,Dn=1011,On=1012,kn=1013,An=1014,jn=1015,Mn=1016,Nn=1017,Pn=1018,Fn=1020,In=35902,Ln=35899,Rn=1021,zn=1022,Bn=1023,Vn=1026,Hn=1027,Un=1028,Wn=1029,Gn=1030,Kn=1031,qn=1033,Jn=33776,Yn=33777,Xn=33778,Zn=33779,Qn=35840,$n=35841,er=35842,tr=35843,nr=36196,rr=37492,ir=37496,ar=37488,or=37489,sr=37490,cr=37491,lr=37808,ur=37809,dr=37810,fr=37811,pr=37812,mr=37813,hr=37814,gr=37815,_r=37816,vr=37817,yr=37818,br=37819,xr=37820,Sr=37821,Cr=36492,wr=36494,Tr=36495,Er=36283,Dr=36284,Or=36285,kr=36286,Ar=2300,jr=2301,Mr=2302,Nr=2303,Pr=2400,Fr=2401,Ir=2402,Lr=3200,Rr=`srgb`,zr=`srgb-linear`,Br=`linear`,Vr=`srgb`,Hr=7680,Ur=35044,Wr=35048,Gr=2e3;function Kr(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function qr(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function Jr(e){return document.createElementNS(`http://www.w3.org/1999/xhtml`,e)}function Yr(){let e=Jr(`canvas`);return e.style.display=`block`,e}var Xr={};function Zr(...e){let t=`THREE.`+e.shift();console.log(t,...e)}function Qr(e){let t=e[0];if(typeof t==`string`&&t.startsWith(`TSL:`)){let t=e[1];t&&t.isStackTrace?e[0]+=` `+t.getLocation():e[1]=`Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`}return e}function G(...e){e=Qr(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function K(...e){e=Qr(e);let t=`THREE.`+e.shift();{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function $r(...e){let t=e.join(` `);t in Xr||(Xr[t]=!0,G(...e))}function ei(e,t,n){return new Promise(function(r,i){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:i();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:r()}}setTimeout(a,n)})}var ti={0:0,2:6,4:4,3:5,1:1,6:2,7:7,5:3},ni=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){let n=this._listeners;return n!==void 0&&n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){let n=this._listeners;if(n===void 0)return;let r=n[e];if(r!==void 0){let e=r.indexOf(t);e!==-1&&r.splice(e,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let n=t[e.type];if(n!==void 0){e.target=this;let t=n.slice(0);for(let n=0,r=t.length;n<r;n++)t[n].call(this,e);e.target=null}}},ri=`00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(`.`),ii=Math.PI/180,ai=180/Math.PI;function oi(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,r=Math.random()*4294967295|0;return(ri[e&255]+ri[e>>8&255]+ri[e>>16&255]+ri[e>>24&255]+`-`+ri[t&255]+ri[t>>8&255]+`-`+ri[t>>16&15|64]+ri[t>>24&255]+`-`+ri[n&63|128]+ri[n>>8&255]+`-`+ri[n>>16&255]+ri[n>>24&255]+ri[r&255]+ri[r>>8&255]+ri[r>>16&255]+ri[r>>24&255]).toLowerCase()}function q(e,t,n){return Math.max(t,Math.min(n,e))}function si(e,t){return(e%t+t)%t}function ci(e,t,n){return(1-n)*e+n*t}function li(e){return 2**Math.floor(Math.log(e)/Math.LN2)}function ui(e){switch(e.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function di(e,t){if(t.constructor===Float32Array)return e;let n=ui(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.max(e/n,-1)}function fi(e,t){if(t.constructor===Float32Array)return e;let n=ui(t);if(n===void 0)throw Error(`THREE.MathUtils: Invalid component type.`);return Math.round(e*n)}var J=class{static{this.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw Error(`THREE.Vector2: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw Error(`THREE.Vector2: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=q(this.x,e.x,t.x),this.y=q(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=q(this.x,e,t),this.y=q(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(q(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(q(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),r=Math.sin(t),i=this.x-e.x,a=this.y-e.y;return this.x=i*n-a*r+e.x,this.y=i*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},pi=class{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,i,a,o){let s=n[r+0],c=n[r+1],l=n[r+2],u=n[r+3],d=i[a+0],f=i[a+1],p=i[a+2],m=i[a+3];if(u!==m||s!==d||c!==f||l!==p){let e=s*d+c*f+l*p+u*m;e<0&&(d=-d,f=-f,p=-p,m=-m,e=-e);let t=1-o;if(e<.9995){let n=Math.acos(e),r=Math.sin(n);t=Math.sin(t*n)/r,o=Math.sin(o*n)/r,s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o}else{s=s*t+d*o,c=c*t+f*o,l=l*t+p*o,u=u*t+m*o;let e=1/Math.sqrt(s*s+c*c+l*l+u*u);s*=e,c*=e,l*=e,u*=e}}e[t]=s,e[t+1]=c,e[t+2]=l,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,r,i,a){let o=n[r],s=n[r+1],c=n[r+2],l=n[r+3],u=i[a],d=i[a+1],f=i[a+2],p=i[a+3];return e[t]=o*p+l*u+s*f-c*d,e[t+1]=s*p+l*d+c*u-o*f,e[t+2]=c*p+l*f+o*d-s*u,e[t+3]=l*p-o*u-s*d-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,r=e._y,i=e._z,a=e._order,o=Math.cos,s=Math.sin,c=o(n/2),l=o(r/2),u=o(i/2),d=s(n/2),f=s(r/2),p=s(i/2);switch(a){case`XYZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`YXZ`:this._x=d*l*u+c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`ZXY`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u-d*f*p;break;case`ZYX`:this._x=d*l*u-c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u+d*f*p;break;case`YZX`:this._x=d*l*u+c*f*p,this._y=c*f*u+d*l*p,this._z=c*l*p-d*f*u,this._w=c*l*u-d*f*p;break;case`XZY`:this._x=d*l*u-c*f*p,this._y=c*f*u-d*l*p,this._z=c*l*p+d*f*u,this._w=c*l*u+d*f*p;break;default:G(`Quaternion: .setFromEuler() encountered an unknown order: `+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],r=t[4],i=t[8],a=t[1],o=t[5],s=t[9],c=t[2],l=t[6],u=t[10],d=n+o+u;if(d>0){let e=.5/Math.sqrt(d+1);this._w=.25/e,this._x=(l-s)*e,this._y=(i-c)*e,this._z=(a-r)*e}else if(n>o&&n>u){let e=2*Math.sqrt(1+n-o-u);this._w=(l-s)/e,this._x=.25*e,this._y=(r+a)/e,this._z=(i+c)/e}else if(o>u){let e=2*Math.sqrt(1+o-n-u);this._w=(i-c)/e,this._x=(r+a)/e,this._y=.25*e,this._z=(s+l)/e}else{let e=2*Math.sqrt(1+u-n-o);this._w=(a-r)/e,this._x=(i+c)/e,this._y=(s+l)/e,this._z=.25*e}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(q(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x*=e,this._y*=e,this._z*=e,this._w*=e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=t._x,s=t._y,c=t._z,l=t._w;return this._x=n*l+a*o+r*c-i*s,this._y=r*l+a*s+i*o-n*c,this._z=i*l+a*c+n*s-r*o,this._w=a*l-n*o-r*s-i*c,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,i=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,i=-i,a=-a,o=-o);let s=1-t;if(o<.9995){let e=Math.acos(o),c=Math.sin(e);s=Math.sin(s*e)/c,t=Math.sin(t*e)/c,this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this._onChangeCallback()}else this._x=this._x*s+n*t,this._y=this._y*s+r*t,this._z=this._z*s+i*t,this._w=this._w*s+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),i=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),i*Math.sin(t),i*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},Y=class{static{this.prototype.isVector3=!0}constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw Error(`THREE.Vector3: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw Error(`THREE.Vector3: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(hi.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(hi.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[3]*n+i[6]*r,this.y=i[1]*t+i[4]*n+i[7]*r,this.z=i[2]*t+i[5]*n+i[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=e.elements,a=1/(i[3]*t+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*t+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*t+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*t+i[6]*n+i[10]*r+i[14])*a,this}applyQuaternion(e){let t=this.x,n=this.y,r=this.z,i=e.x,a=e.y,o=e.z,s=e.w,c=2*(a*r-o*n),l=2*(o*t-i*r),u=2*(i*n-a*t);return this.x=t+s*c+a*u-o*l,this.y=n+s*l+o*c-i*u,this.z=r+s*u+i*l-a*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,r=this.z,i=e.elements;return this.x=i[0]*t+i[4]*n+i[8]*r,this.y=i[1]*t+i[5]*n+i[9]*r,this.z=i[2]*t+i[6]*n+i[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=q(this.x,e.x,t.x),this.y=q(this.y,e.y,t.y),this.z=q(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=q(this.x,e,t),this.y=q(this.y,e,t),this.z=q(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(q(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,r=e.y,i=e.z,a=t.x,o=t.y,s=t.z;return this.x=r*s-i*o,this.y=i*a-n*s,this.z=n*o-r*a,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return mi.copy(this).projectOnVector(e),this.sub(mi)}reflect(e){return this.sub(mi.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(q(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},mi=new Y,hi=new pi,X=class{static{this.prototype.isMatrix3=!0}constructor(e,t,n,r,i,a,o,s,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c)}set(e,t,n,r,i,a,o,s,c){let l=this.elements;return l[0]=e,l[1]=r,l[2]=o,l[3]=t,l[4]=i,l[5]=s,l[6]=n,l[7]=a,l[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[3],s=n[6],c=n[1],l=n[4],u=n[7],d=n[2],f=n[5],p=n[8],m=r[0],h=r[3],g=r[6],_=r[1],v=r[4],y=r[7],b=r[2],x=r[5],S=r[8];return i[0]=a*m+o*_+s*b,i[3]=a*h+o*v+s*x,i[6]=a*g+o*y+s*S,i[1]=c*m+l*_+u*b,i[4]=c*h+l*v+u*x,i[7]=c*g+l*y+u*S,i[2]=d*m+f*_+p*b,i[5]=d*h+f*v+p*x,i[8]=d*g+f*y+p*S,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8];return t*a*l-t*o*c-n*i*l+n*o*s+r*i*c-r*a*s}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=l*a-o*c,d=o*s-l*i,f=c*i-a*s,p=t*u+n*d+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let m=1/p;return e[0]=u*m,e[1]=(r*c-l*n)*m,e[2]=(o*n-r*a)*m,e[3]=d*m,e[4]=(l*t-r*s)*m,e[5]=(r*i-o*t)*m,e[6]=f*m,e[7]=(n*s-c*t)*m,e[8]=(a*t-n*i)*m,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,i,a,o){let s=Math.cos(i),c=Math.sin(i);return this.set(n*s,n*c,-n*(s*a+c*o)+a+e,-r*c,r*s,-r*(-c*a+s*o)+o+t,0,0,1),this}scale(e,t){return $r(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),this.premultiply(gi.makeScale(e,t)),this}rotate(e){return $r(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),this.premultiply(gi.makeRotation(-e)),this}translate(e,t){return $r(`Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`),this.premultiply(gi.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<9;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},gi=new X,_i=new X().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),vi=new X().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function yi(){let e={enabled:!0,workingColorSpace:zr,spaces:{},convert:function(e,t,n){return this.enabled===!1||t===n||!t||!n||(this.spaces[t].transfer===`srgb`&&(e.r=xi(e.r),e.g=xi(e.g),e.b=xi(e.b)),this.spaces[t].primaries!==this.spaces[n].primaries&&(e.applyMatrix3(this.spaces[t].toXYZ),e.applyMatrix3(this.spaces[n].fromXYZ)),this.spaces[n].transfer===`srgb`&&(e.r=Si(e.r),e.g=Si(e.g),e.b=Si(e.b))),e},workingToColorSpace:function(e,t){return this.convert(e,this.workingColorSpace,t)},colorSpaceToWorking:function(e,t){return this.convert(e,t,this.workingColorSpace)},getPrimaries:function(e){return this.spaces[e].primaries},getTransfer:function(e){return e===``?Br:this.spaces[e].transfer},getToneMappingMode:function(e){return this.spaces[e].outputColorSpaceConfig.toneMappingMode||`standard`},getLuminanceCoefficients:function(e,t=this.workingColorSpace){return e.fromArray(this.spaces[t].luminanceCoefficients)},define:function(e){Object.assign(this.spaces,e)},_getMatrix:function(e,t,n){return e.copy(this.spaces[n].fromXYZ).multiply(this.spaces[t].toXYZ)},_getDrawingBufferColorSpace:function(e){return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(e=this.workingColorSpace){return this.spaces[e].workingColorSpaceConfig.unpackColorSpace}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],r=[.3127,.329];return e.define({[zr]:{primaries:t,whitePoint:r,transfer:Br,toXYZ:_i,fromXYZ:vi,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Rr},outputColorSpaceConfig:{drawingBufferColorSpace:Rr}},[Rr]:{primaries:t,whitePoint:r,transfer:Vr,toXYZ:_i,fromXYZ:vi,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Rr}}}),e}var bi=yi();function xi(e){return e<.04045?e*.0773993808:(e*.9478672986+.0521327014)**2.4}function Si(e){return e<.0031308?e*12.92:1.055*e**.41666-.055}var Ci,wi=class{static getDataURL(e,t=`image/png`){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>`u`)return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{Ci===void 0&&(Ci=Jr(`canvas`)),Ci.width=e.width,Ci.height=e.height;let t=Ci.getContext(`2d`);e instanceof ImageData?t.putImageData(e,0,0):t.drawImage(e,0,0,e.width,e.height),n=Ci}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap){let t=Jr(`canvas`);t.width=e.width,t.height=e.height;let n=t.getContext(`2d`);n.drawImage(e,0,0,e.width,e.height);let r=n.getImageData(0,0,e.width,e.height),i=r.data;for(let e=0;e<i.length;e++)i[e]=xi(i[e]/255)*255;return n.putImageData(r,0,0),t}if(e.data){let t=e.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(xi(t[e]/255)*255):t[e]=xi(t[e]);return{data:t,width:e.width,height:e.height}}return G(`ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`),e}},Ti=0,Ei=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Ti++}),this.uuid=oi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<`u`&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<`u`&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t===null?e.set(0,0,0):e.set(t.width||0,t.height||0,t.depth||0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:``},r=this.data;if(r!==null){let e;if(Array.isArray(r)){e=[];for(let t=0,n=r.length;t<n;t++)r[t].isDataTexture?e.push(Di(r[t].image)):e.push(Di(r[t]))}else e=Di(r);n.url=e}return t||(e.images[this.uuid]=n),n}};function Di(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap?wi.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(G(`Texture: Unable to serialize Texture.`),{})}var Oi=0,ki=new Y,Ai=class e extends ni{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,r=_n,i=_n,a=Sn,o=wn,s=Bn,c=Tn,l=e.DEFAULT_ANISOTROPY,u=``){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Oi++}),this.uuid=oi(),this.name=``,this.source=new Ei(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=r,this.wrapT=i,this.magFilter=a,this.minFilter=o,this.anisotropy=l,this.format=s,this.internalFormat=null,this.type=c,this.offset=new J(0,0),this.repeat=new J(1,1),this.center=new J(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new X,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(ki).x}get height(){return this.source.getSize(ki).y}get depth(){return this.source.getSize(ki).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let n=e[t];if(n===void 0){G(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?G(`Texture.setValues(): property '${t}' does not exist.`):r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.7,type:`Texture`,generator:`Texture.toJSON`},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:`dispose`})}transformUv(e){if(this.mapping!==300)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case gn:e.x-=Math.floor(e.x);break;case _n:e.x=e.x<0?0:1;break;case vn:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x-=Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case gn:e.y-=Math.floor(e.y);break;case _n:e.y=e.y<0?0:1;break;case vn:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y-=Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Ai.DEFAULT_IMAGE=null,Ai.DEFAULT_MAPPING=300,Ai.DEFAULT_ANISOTROPY=1;var ji=class{static{this.prototype.isVector4=!0}constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw Error(`THREE.Vector4: index is out of range: `+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw Error(`THREE.Vector4: index is out of range: `+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w===void 0?1:e.w,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,r=this.z,i=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*i,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*i,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*i,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*i,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,i,a=.01,o=.1,s=e.elements,c=s[0],l=s[4],u=s[8],d=s[1],f=s[5],p=s[9],m=s[2],h=s[6],g=s[10];if(Math.abs(l-d)<a&&Math.abs(u-m)<a&&Math.abs(p-h)<a){if(Math.abs(l+d)<o&&Math.abs(u+m)<o&&Math.abs(p+h)<o&&Math.abs(c+f+g-3)<o)return this.set(1,0,0,0),this;t=Math.PI;let e=(c+1)/2,s=(f+1)/2,_=(g+1)/2,v=(l+d)/4,y=(u+m)/4,b=(p+h)/4;return e>s&&e>_?e<a?(n=0,r=.707106781,i=.707106781):(n=Math.sqrt(e),r=v/n,i=y/n):s>_?s<a?(n=.707106781,r=0,i=.707106781):(r=Math.sqrt(s),n=v/r,i=b/r):_<a?(n=.707106781,r=.707106781,i=0):(i=Math.sqrt(_),n=y/i,r=b/i),this.set(n,r,i,t),this}let _=Math.sqrt((h-p)*(h-p)+(u-m)*(u-m)+(d-l)*(d-l));return Math.abs(_)<.001&&(_=1),this.x=(h-p)/_,this.y=(u-m)/_,this.z=(d-l)/_,this.w=Math.acos((c+f+g-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=q(this.x,e.x,t.x),this.y=q(this.y,e.y,t.y),this.z=q(this.z,e.z,t.z),this.w=q(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=q(this.x,e,t),this.y=q(this.y,e,t),this.z=q(this.z,e,t),this.w=q(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(q(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Mi=class extends ni{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Sn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ji(0,0,e,t),this.scissorTest=!1,this.viewport=new ji(0,0,e,t),this.textures=[];let r=n.count;for(let i=0;i<r;i++)this.textures[i]=new Ai({width:e,height:t,depth:n.depth}),this.textures[i].isRenderTargetTexture=!0,this.textures[i].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Sn,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let e=0;e<this.textures.length;e++)this.textures[e].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,i=this.textures.length;r<i;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let n=Object.assign({},e.textures[t].image);this.textures[t].source=new Ei(n)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null){if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture}else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:`dispose`})}},Ni=class extends Mi{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Pi=class extends Ai{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=yn,this.minFilter=yn,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},Fi=class extends Ai{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=yn,this.minFilter=yn,this.wrapR=_n,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}},Ii=class e{static{this.prototype.isMatrix4=!0}constructor(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h)}set(e,t,n,r,i,a,o,s,c,l,u,d,f,p,m,h){let g=this.elements;return g[0]=e,g[4]=t,g[8]=n,g[12]=r,g[1]=i,g[5]=a,g[9]=o,g[13]=s,g[2]=c,g[6]=l,g[10]=u,g[14]=d,g[3]=f,g[7]=p,g[11]=m,g[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,n=e.elements,r=1/Li.setFromMatrixColumn(e,0).length(),i=1/Li.setFromMatrixColumn(e,1).length(),a=1/Li.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*i,t[5]=n[5]*i,t[6]=n[6]*i,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,r=e.y,i=e.z,a=Math.cos(n),o=Math.sin(n),s=Math.cos(r),c=Math.sin(r),l=Math.cos(i),u=Math.sin(i);if(e.order===`XYZ`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=-s*u,t[8]=c,t[1]=n+r*c,t[5]=e-i*c,t[9]=-o*s,t[2]=i-e*c,t[6]=r+n*c,t[10]=a*s}else if(e.order===`YXZ`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e+i*o,t[4]=r*o-n,t[8]=a*c,t[1]=a*u,t[5]=a*l,t[9]=-o,t[2]=n*o-r,t[6]=i+e*o,t[10]=a*s}else if(e.order===`ZXY`){let e=s*l,n=s*u,r=c*l,i=c*u;t[0]=e-i*o,t[4]=-a*u,t[8]=r+n*o,t[1]=n+r*o,t[5]=a*l,t[9]=i-e*o,t[2]=-a*c,t[6]=o,t[10]=a*s}else if(e.order===`ZYX`){let e=a*l,n=a*u,r=o*l,i=o*u;t[0]=s*l,t[4]=r*c-n,t[8]=e*c+i,t[1]=s*u,t[5]=i*c+e,t[9]=n*c-r,t[2]=-c,t[6]=o*s,t[10]=a*s}else if(e.order===`YZX`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=i-e*u,t[8]=r*u+n,t[1]=u,t[5]=a*l,t[9]=-o*l,t[2]=-c*l,t[6]=n*u+r,t[10]=e-i*u}else if(e.order===`XZY`){let e=a*s,n=a*c,r=o*s,i=o*c;t[0]=s*l,t[4]=-u,t[8]=c*l,t[1]=e*u+i,t[5]=a*l,t[9]=n*u-r,t[2]=r*u-n,t[6]=o*l,t[10]=i*u+e}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(zi,e,Bi)}lookAt(e,t,n){let r=this.elements;return Ui.subVectors(e,t),Ui.lengthSq()===0&&(Ui.z=1),Ui.normalize(),Vi.crossVectors(n,Ui),Vi.lengthSq()===0&&(Math.abs(n.z)===1?Ui.x+=1e-4:Ui.z+=1e-4,Ui.normalize(),Vi.crossVectors(n,Ui)),Vi.normalize(),Hi.crossVectors(Ui,Vi),r[0]=Vi.x,r[4]=Hi.x,r[8]=Ui.x,r[1]=Vi.y,r[5]=Hi.y,r[9]=Ui.y,r[2]=Vi.z,r[6]=Hi.z,r[10]=Ui.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,r=t.elements,i=this.elements,a=n[0],o=n[4],s=n[8],c=n[12],l=n[1],u=n[5],d=n[9],f=n[13],p=n[2],m=n[6],h=n[10],g=n[14],_=n[3],v=n[7],y=n[11],b=n[15],x=r[0],S=r[4],C=r[8],w=r[12],T=r[1],E=r[5],D=r[9],O=r[13],k=r[2],A=r[6],j=r[10],ee=r[14],M=r[3],N=r[7],te=r[11],ne=r[15];return i[0]=a*x+o*T+s*k+c*M,i[4]=a*S+o*E+s*A+c*N,i[8]=a*C+o*D+s*j+c*te,i[12]=a*w+o*O+s*ee+c*ne,i[1]=l*x+u*T+d*k+f*M,i[5]=l*S+u*E+d*A+f*N,i[9]=l*C+u*D+d*j+f*te,i[13]=l*w+u*O+d*ee+f*ne,i[2]=p*x+m*T+h*k+g*M,i[6]=p*S+m*E+h*A+g*N,i[10]=p*C+m*D+h*j+g*te,i[14]=p*w+m*O+h*ee+g*ne,i[3]=_*x+v*T+y*k+b*M,i[7]=_*S+v*E+y*A+b*N,i[11]=_*C+v*D+y*j+b*te,i[15]=_*w+v*O+y*ee+b*ne,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[12],a=e[1],o=e[5],s=e[9],c=e[13],l=e[2],u=e[6],d=e[10],f=e[14],p=e[3],m=e[7],h=e[11],g=e[15],_=s*f-c*d,v=o*f-c*u,y=o*d-s*u,b=a*f-c*l,x=a*d-s*l,S=a*u-o*l;return t*(m*_-h*v+g*y)-n*(p*_-h*b+g*x)+r*(p*v-m*b+g*S)-i*(p*y-m*x+h*S)}determinantAffine(){let e=this.elements,t=e[0],n=e[4],r=e[8],i=e[1],a=e[5],o=e[9],s=e[2],c=e[6],l=e[10];return t*(a*l-o*c)-n*(i*l-o*s)+r*(i*c-a*s)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],r=e[2],i=e[3],a=e[4],o=e[5],s=e[6],c=e[7],l=e[8],u=e[9],d=e[10],f=e[11],p=e[12],m=e[13],h=e[14],g=e[15],_=t*o-n*a,v=t*s-r*a,y=t*c-i*a,b=n*s-r*o,x=n*c-i*o,S=r*c-i*s,C=l*m-u*p,w=l*h-d*p,T=l*g-f*p,E=u*h-d*m,D=u*g-f*m,O=d*g-f*h,k=_*O-v*D+y*E+b*T-x*w+S*C;if(k===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/k;return e[0]=(o*O-s*D+c*E)*A,e[1]=(r*D-n*O-i*E)*A,e[2]=(m*S-h*x+g*b)*A,e[3]=(d*x-u*S-f*b)*A,e[4]=(s*T-a*O-c*w)*A,e[5]=(t*O-r*T+i*w)*A,e[6]=(h*y-p*S-g*v)*A,e[7]=(l*S-d*y+f*v)*A,e[8]=(a*D-o*T+c*C)*A,e[9]=(n*T-t*D-i*C)*A,e[10]=(p*x-m*y+g*_)*A,e[11]=(u*y-l*x-f*_)*A,e[12]=(o*w-a*E-s*C)*A,e[13]=(t*E-n*w+r*C)*A,e[14]=(m*v-p*b-h*_)*A,e[15]=(l*b-u*v+d*_)*A,this}scale(e){let t=this.elements,n=e.x,r=e.y,i=e.z;return t[0]*=n,t[4]*=r,t[8]*=i,t[1]*=n,t[5]*=r,t[9]*=i,t[2]*=n,t[6]*=r,t[10]*=i,t[3]*=n,t[7]*=r,t[11]*=i,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),r=Math.sin(t),i=1-n,a=e.x,o=e.y,s=e.z,c=i*a,l=i*o;return this.set(c*a+n,c*o-r*s,c*s+r*o,0,c*o+r*s,l*o+n,l*s-r*a,0,c*s-r*o,l*s+r*a,i*s*s+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,i,a){return this.set(1,n,i,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){let r=this.elements,i=t._x,a=t._y,o=t._z,s=t._w,c=i+i,l=a+a,u=o+o,d=i*c,f=i*l,p=i*u,m=a*l,h=a*u,g=o*u,_=s*c,v=s*l,y=s*u,b=n.x,x=n.y,S=n.z;return r[0]=(1-(m+g))*b,r[1]=(f+y)*b,r[2]=(p-v)*b,r[3]=0,r[4]=(f-y)*x,r[5]=(1-(d+g))*x,r[6]=(h+_)*x,r[7]=0,r[8]=(p+v)*S,r[9]=(h-_)*S,r[10]=(1-(d+m))*S,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let i=this.determinantAffine();if(i===0)return n.set(1,1,1),t.identity(),this;let a=Li.set(r[0],r[1],r[2]).length(),o=Li.set(r[4],r[5],r[6]).length(),s=Li.set(r[8],r[9],r[10]).length();i<0&&(a=-a),Ri.copy(this);let c=1/a,l=1/o,u=1/s;return Ri.elements[0]*=c,Ri.elements[1]*=c,Ri.elements[2]*=c,Ri.elements[4]*=l,Ri.elements[5]*=l,Ri.elements[6]*=l,Ri.elements[8]*=u,Ri.elements[9]*=u,Ri.elements[10]*=u,t.setFromRotationMatrix(Ri),n.x=a,n.y=o,n.z=s,this}makePerspective(e,t,n,r,i,a,o=Gr,s=!1){let c=this.elements,l=2*i/(t-e),u=2*i/(n-r),d=(t+e)/(t-e),f=(n+r)/(n-r),p,m;if(s)p=i/(a-i),m=a*i/(a-i);else if(o===2e3)p=-(a+i)/(a-i),m=-2*a*i/(a-i);else if(o===2001)p=-a/(a-i),m=-a*i/(a-i);else throw Error(`THREE.Matrix4.makePerspective(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=u,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,r,i,a,o=Gr,s=!1){let c=this.elements,l=2/(t-e),u=2/(n-r),d=-(t+e)/(t-e),f=-(n+r)/(n-r),p,m;if(s)p=1/(a-i),m=a/(a-i);else if(o===2e3)p=-2/(a-i),m=-(a+i)/(a-i);else if(o===2001)p=-1/(a-i),m=-i/(a-i);else throw Error(`THREE.Matrix4.makeOrthographic(): Invalid coordinate system: `+o);return c[0]=l,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=u,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=p,c[14]=m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let e=0;e<16;e++)if(t[e]!==n[e])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Li=new Y,Ri=new Ii,zi=new Y(0,0,0),Bi=new Y(1,1,1),Vi=new Y,Hi=new Y,Ui=new Y,Wi=new Ii,Gi=new pi,Ki=class e{constructor(t=0,n=0,r=0,i=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=r,this._order=i}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let r=e.elements,i=r[0],a=r[4],o=r[8],s=r[1],c=r[5],l=r[9],u=r[2],d=r[6],f=r[10];switch(t){case`XYZ`:this._y=Math.asin(q(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-l,f),this._z=Math.atan2(-a,i)):(this._x=Math.atan2(d,c),this._z=0);break;case`YXZ`:this._x=Math.asin(-q(l,-1,1)),Math.abs(l)<.9999999?(this._y=Math.atan2(o,f),this._z=Math.atan2(s,c)):(this._y=Math.atan2(-u,i),this._z=0);break;case`ZXY`:this._x=Math.asin(q(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(s,i));break;case`ZYX`:this._y=Math.asin(-q(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(s,i)):(this._x=0,this._z=Math.atan2(-a,c));break;case`YZX`:this._z=Math.asin(q(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-l,c),this._y=Math.atan2(-u,i)):(this._x=0,this._y=Math.atan2(o,f));break;case`XZY`:this._z=Math.asin(-q(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(o,i)):(this._x=Math.atan2(-l,f),this._y=0);break;default:G(`Euler: .setFromRotationMatrix() encountered an unknown order: `+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return Wi.makeRotationFromQuaternion(e),this.setFromRotationMatrix(Wi,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return Gi.setFromEuler(this),this.setFromQuaternion(Gi,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Ki.DEFAULT_ORDER=`XYZ`;var qi=class{constructor(){this.mask=1}set(e){this.mask=1<<e>>>0}enable(e){this.mask|=1<<e}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e}disable(e){this.mask&=~(1<<e)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return!!(this.mask&1<<e)}},Ji=0,Yi=new Y,Xi=new pi,Zi=new Ii,Qi=new Y,$i=new Y,ea=new Y,ta=new pi,na=new Y(1,0,0),ra=new Y(0,1,0),ia=new Y(0,0,1),aa={type:`added`},oa={type:`removed`},sa={type:`childadded`,child:null},ca={type:`childremoved`,child:null},la=class e extends ni{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Ji++}),this.uuid=oi(),this.name=``,this.type=`Object3D`,this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new Y,n=new Ki,r=new pi,i=new Y(1,1,1);function a(){r.setFromEuler(n,!1)}function o(){n.setFromQuaternion(r,void 0,!1)}n._onChange(a),r._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:r},scale:{configurable:!0,enumerable:!0,value:i},modelViewMatrix:{value:new Ii},normalMatrix:{value:new X}}),this.matrix=new Ii,this.matrixWorld=new Ii,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new qi,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Xi.setFromAxisAngle(e,t),this.quaternion.multiply(Xi),this}rotateOnWorldAxis(e,t){return Xi.setFromAxisAngle(e,t),this.quaternion.premultiply(Xi),this}rotateX(e){return this.rotateOnAxis(na,e)}rotateY(e){return this.rotateOnAxis(ra,e)}rotateZ(e){return this.rotateOnAxis(ia,e)}translateOnAxis(e,t){return Yi.copy(e).applyQuaternion(this.quaternion),this.position.add(Yi.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(na,e)}translateY(e){return this.translateOnAxis(ra,e)}translateZ(e){return this.translateOnAxis(ia,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zi.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Qi.copy(e):Qi.set(e,t,n);let r=this.parent;this.updateWorldMatrix(!0,!1),$i.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zi.lookAt($i,Qi,this.up):Zi.lookAt(Qi,$i,this.up),this.quaternion.setFromRotationMatrix(Zi),r&&(Zi.extractRotation(r.matrixWorld),Xi.setFromRotationMatrix(Zi),this.quaternion.premultiply(Xi.invert()))}add(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return e===this?(K(`Object3D.add: object can't be added as a child of itself.`,e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(aa),sa.child=e,this.dispatchEvent(sa),sa.child=null):K(`Object3D.add: object not an instance of THREE.Object3D.`,e),this)}remove(e){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(oa),ca.child=e,this.dispatchEvent(ca),ca.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zi.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(aa),sa.child=e,this.dispatchEvent(sa),sa.child=null,this}getObjectById(e){return this.getObjectByProperty(`id`,e)}getObjectByName(e){return this.getObjectByProperty(`name`,e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){let r=this.children[n].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let r=this.children;for(let i=0,a=r.length;i<a;i++)r[i].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($i,e,ea),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($i,ta,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,n=e.y,r=e.z,i=this.matrix.elements;i[12]+=t-i[0]*t-i[4]*n-i[8]*r,i[13]+=n-i[1]*t-i[5]*n-i[9]*r,i[14]+=r-i[2]*t-i[6]*n-i[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){let e=this.children;for(let t=0,r=e.length;t<r;t++)e[t].updateWorldMatrix(!1,!0,n)}}toJSON(e){let t=e===void 0||typeof e==`string`,n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:`Object`,generator:`Object3D.toJSON`});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type=`InstancedMesh`,r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type=`BatchedMesh`,r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(e=>({...e,boundingBox:e.boundingBox?e.boundingBox.toJSON():void 0,boundingSphere:e.boundingSphere?e.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(e=>({...e})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function i(t,n){return t[n.uuid]===void 0&&(t[n.uuid]=n.toJSON(e)),n.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=i(e.geometries,this.geometry);let t=this.geometry.parameters;if(t!==void 0&&t.shapes!==void 0){let n=t.shapes;if(Array.isArray(n))for(let t=0,r=n.length;t<r;t++){let r=n[t];i(e.shapes,r)}else i(e.shapes,n)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(i(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0){if(Array.isArray(this.material)){let t=[];for(let n=0,r=this.material.length;n<r;n++)t.push(i(e.materials,this.material[n]));r.material=t}else r.material=i(e.materials,this.material)}if(this.children.length>0){r.children=[];for(let t=0;t<this.children.length;t++)r.children.push(this.children[t].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let t=0;t<this.animations.length;t++){let n=this.animations[t];r.animations.push(i(e.animations,n))}}if(t){let t=a(e.geometries),r=a(e.materials),i=a(e.textures),o=a(e.images),s=a(e.shapes),c=a(e.skeletons),l=a(e.animations),u=a(e.nodes);t.length>0&&(n.geometries=t),r.length>0&&(n.materials=r),i.length>0&&(n.textures=i),o.length>0&&(n.images=o),s.length>0&&(n.shapes=s),c.length>0&&(n.skeletons=c),l.length>0&&(n.animations=l),u.length>0&&(n.nodes=u)}return n.object=r,n;function a(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot===null?null:e.pivot.clone(),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let t=0;t<e.children.length;t++){let n=e.children[t];this.add(n.clone())}return this}dispose(){this.dispatchEvent({type:`dispose`})}};la.DEFAULT_UP=new Y(0,1,0),la.DEFAULT_MATRIX_AUTO_UPDATE=!0,la.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ua=class extends la{constructor(){super(),this.isGroup=!0,this.type=`Group`}},da={type:`move`},fa=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ua,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ua,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new Y,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new Y),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ua,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new Y,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new Y,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:`connected`,data:e}),this}disconnect(e){return this.dispatchEvent({type:`disconnected`,data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,i=null,a=null,o=this._targetRay,s=this._grip,c=this._hand;if(e&&t.session.visibilityState!==`visible-blurred`){if(c&&e.hand){a=!0;for(let r of e.hand.values()){let e=t.getJointPose(r,n),i=this._getHandJoint(c,r);e!==null&&(i.matrix.fromArray(e.transform.matrix),i.matrix.decompose(i.position,i.quaternion,i.scale),i.matrixWorldNeedsUpdate=!0,i.jointRadius=e.radius),i.visible=e!==null}let r=c.joints[`index-finger-tip`],i=c.joints[`thumb-tip`],o=r.position.distanceTo(i.position);c.inputState.pinching&&o>.025?(c.inputState.pinching=!1,this.dispatchEvent({type:`pinchend`,handedness:e.handedness,target:this})):!c.inputState.pinching&&o<=.015&&(c.inputState.pinching=!0,this.dispatchEvent({type:`pinchstart`,handedness:e.handedness,target:this}))}else s!==null&&e.gripSpace&&(i=t.getPose(e.gripSpace,n),i!==null&&(s.matrix.fromArray(i.transform.matrix),s.matrix.decompose(s.position,s.quaternion,s.scale),s.matrixWorldNeedsUpdate=!0,i.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(i.linearVelocity)):s.hasLinearVelocity=!1,i.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(i.angularVelocity)):s.hasAngularVelocity=!1,s.eventsEnabled&&s.dispatchEvent({type:`gripUpdated`,data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&i!==null&&(r=i),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(da)))}return o!==null&&(o.visible=r!==null),s!==null&&(s.visible=i!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new ua;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},pa={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ma={h:0,s:0,l:0},ha={h:0,s:0,l:0};function ga(e,t,n){return n<0&&(n+=1),n>1&&--n,n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Z=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let t=e;t&&t.isColor?this.copy(t):typeof t==`number`?this.setHex(t):typeof t==`string`&&this.setStyle(t)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Rr){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,bi.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=bi.workingColorSpace){return this.r=e,this.g=t,this.b=n,bi.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=bi.workingColorSpace){if(e=si(e,1),t=q(t,0,1),n=q(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,i=2*n-r;this.r=ga(i,r,e+1/3),this.g=ga(i,r,e),this.b=ga(i,r,e-1/3)}return bi.colorSpaceToWorking(this,r),this}setStyle(e,t=Rr){function n(t){t!==void 0&&parseFloat(t)<1&&G(`Color: Alpha component of `+e+` will be ignored.`)}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let i,a=r[1],o=r[2];switch(a){case`rgb`:case`rgba`:if(i=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(255,parseInt(i[1],10))/255,Math.min(255,parseInt(i[2],10))/255,Math.min(255,parseInt(i[3],10))/255,t);if(i=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setRGB(Math.min(100,parseFloat(i[1]))/100,Math.min(100,parseFloat(i[2]))/100,Math.min(100,parseFloat(i[3]))/100,t);break;case`hsl`:case`hsla`:if(i=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(i[4]),this.setHSL(parseFloat(i[1])/360,parseFloat(i[2])/100,parseFloat(i[3])/100,t);break;default:G(`Color: Unknown color model `+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let n=r[1],i=n.length;if(i===3)return this.setRGB(parseInt(n.charAt(0),16)/15,parseInt(n.charAt(1),16)/15,parseInt(n.charAt(2),16)/15,t);if(i===6)return this.setHex(parseInt(n,16),t);G(`Color: Invalid hex color `+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Rr){let n=pa[e.toLowerCase()];return n===void 0?G(`Color: Unknown color `+e):this.setHex(n,t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=xi(e.r),this.g=xi(e.g),this.b=xi(e.b),this}copyLinearToSRGB(e){return this.r=Si(e.r),this.g=Si(e.g),this.b=Si(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Rr){return bi.workingToColorSpace(_a.copy(this),e),Math.round(q(_a.r*255,0,255))*65536+Math.round(q(_a.g*255,0,255))*256+Math.round(q(_a.b*255,0,255))}getHexString(e=Rr){return(`000000`+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=bi.workingColorSpace){bi.workingToColorSpace(_a.copy(this),t);let n=_a.r,r=_a.g,i=_a.b,a=Math.max(n,r,i),o=Math.min(n,r,i),s,c,l=(o+a)/2;if(o===a)s=0,c=0;else{let e=a-o;switch(c=l<=.5?e/(a+o):e/(2-a-o),a){case n:s=(r-i)/e+(r<i?6:0);break;case r:s=(i-n)/e+2;break;case i:s=(n-r)/e+4}s/=6}return e.h=s,e.s=c,e.l=l,e}getRGB(e,t=bi.workingColorSpace){return bi.workingToColorSpace(_a.copy(this),t),e.r=_a.r,e.g=_a.g,e.b=_a.b,e}getStyle(e=Rr){bi.workingToColorSpace(_a.copy(this),e);let t=_a.r,n=_a.g,r=_a.b;return e===`srgb`?`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`:`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`}offsetHSL(e,t,n){return this.getHSL(ma),this.setHSL(ma.h+e,ma.s+t,ma.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(ma),e.getHSL(ha);let n=ci(ma.h,ha.h,t),r=ci(ma.s,ha.s,t),i=ci(ma.l,ha.l,t);return this.setHSL(n,r,i),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,r=this.b,i=e.elements;return this.r=i[0]*t+i[3]*n+i[6]*r,this.g=i[1]*t+i[4]*n+i[7]*r,this.b=i[2]*t+i[5]*n+i[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},_a=new Z;Z.NAMES=pa;var va=class extends la{constructor(){super(),this.isScene=!0,this.type=`Scene`,this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Ki,this.environmentIntensity=1,this.environmentRotation=new Ki,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background===null?null:e.background.clone(),this.environment=e.environment===null?null:e.environment.clone(),this.fog=e.fog===null?null:e.fog.clone(),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial===null?null:e.overrideMaterial.clone(),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},ya=new Y,ba=new Y,xa=new Y,Sa=new Y,Ca=new Y,wa=new Y,Ta=new Y,Ea=new Y,Da=new Y,Oa=new Y,ka=new ji,Aa=new ji,ja=new ji,Ma=class e{constructor(e=new Y,t=new Y,n=new Y){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),ya.subVectors(e,t),r.cross(ya);let i=r.lengthSq();return i>0?r.multiplyScalar(1/Math.sqrt(i)):r.set(0,0,0)}static getBarycoord(e,t,n,r,i){ya.subVectors(r,t),ba.subVectors(n,t),xa.subVectors(e,t);let a=ya.dot(ya),o=ya.dot(ba),s=ya.dot(xa),c=ba.dot(ba),l=ba.dot(xa),u=a*c-o*o;if(u===0)return i.set(0,0,0),null;let d=1/u,f=(c*s-o*l)*d,p=(a*l-o*s)*d;return i.set(1-f-p,p,f)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Sa)!==null&&Sa.x>=0&&Sa.y>=0&&Sa.x+Sa.y<=1}static getInterpolation(e,t,n,r,i,a,o,s){return this.getBarycoord(e,t,n,r,Sa)===null?(s.x=0,s.y=0,`z`in s&&(s.z=0),`w`in s&&(s.w=0),null):(s.setScalar(0),s.addScaledVector(i,Sa.x),s.addScaledVector(a,Sa.y),s.addScaledVector(o,Sa.z),s)}static getInterpolatedAttribute(e,t,n,r,i,a){return ka.setScalar(0),Aa.setScalar(0),ja.setScalar(0),ka.fromBufferAttribute(e,t),Aa.fromBufferAttribute(e,n),ja.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ka,i.x),a.addScaledVector(Aa,i.y),a.addScaledVector(ja,i.z),a}static isFrontFacing(e,t,n,r){return ya.subVectors(n,t),ba.subVectors(e,t),ya.cross(ba).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ya.subVectors(this.c,this.b),ba.subVectors(this.a,this.b),ya.cross(ba).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,r,i,a){return e.getInterpolation(t,this.a,this.b,this.c,n,r,i,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,r=this.b,i=this.c,a,o;Ca.subVectors(r,n),wa.subVectors(i,n),Ea.subVectors(e,n);let s=Ca.dot(Ea),c=wa.dot(Ea);if(s<=0&&c<=0)return t.copy(n);Da.subVectors(e,r);let l=Ca.dot(Da),u=wa.dot(Da);if(l>=0&&u<=l)return t.copy(r);let d=s*u-l*c;if(d<=0&&s>=0&&l<=0&&s-l>0)return a=s/(s-l),t.copy(n).addScaledVector(Ca,a);Oa.subVectors(e,i);let f=Ca.dot(Oa),p=wa.dot(Oa);if(p>=0&&f<=p)return t.copy(i);let m=f*c-s*p;if(m<=0&&c>=0&&p<=0)return o=c/(c-p),t.copy(n).addScaledVector(wa,o);let h=l*p-f*u;if(h<=0&&u-l>=0&&f-p>=0)return Ta.subVectors(i,r),o=(u-l)/(u-l+(f-p)),t.copy(r).addScaledVector(Ta,o);let g=1/(h+m+d);return a=m*g,o=d*g,t.copy(n).addScaledVector(Ca,a).addScaledVector(wa,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Na=class{constructor(e=new Y(1/0,1/0,1/0),t=new Y(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(Fa.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(Fa.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=Fa.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute(`position`);if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let t=0,n=r.count;t<n;t++)e.isMesh===!0?e.getVertexPosition(t,Fa):Fa.fromBufferAttribute(r,t),Fa.applyMatrix4(e.matrixWorld),this.expandByPoint(Fa);else e.boundingBox===void 0?(n.boundingBox===null&&n.computeBoundingBox(),Ia.copy(n.boundingBox)):(e.boundingBox===null&&e.computeBoundingBox(),Ia.copy(e.boundingBox)),Ia.applyMatrix4(e.matrixWorld),this.union(Ia)}let r=e.children;for(let e=0,n=r.length;e<n;e++)this.expandByObject(r[e],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Fa),Fa.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ua),Wa.subVectors(this.max,Ua),La.subVectors(e.a,Ua),Ra.subVectors(e.b,Ua),za.subVectors(e.c,Ua),Ba.subVectors(Ra,La),Va.subVectors(za,Ra),Ha.subVectors(La,za);let t=[0,-Ba.z,Ba.y,0,-Va.z,Va.y,0,-Ha.z,Ha.y,Ba.z,0,-Ba.x,Va.z,0,-Va.x,Ha.z,0,-Ha.x,-Ba.y,Ba.x,0,-Va.y,Va.x,0,-Ha.y,Ha.x,0];return!qa(t,La,Ra,za,Wa)||(t=[1,0,0,0,1,0,0,0,1],!qa(t,La,Ra,za,Wa))?!1:(Ga.crossVectors(Ba,Va),t=[Ga.x,Ga.y,Ga.z],qa(t,La,Ra,za,Wa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Fa).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Fa).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Pa[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Pa[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Pa[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Pa[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Pa[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Pa[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Pa[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Pa[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Pa)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Pa=[new Y,new Y,new Y,new Y,new Y,new Y,new Y,new Y],Fa=new Y,Ia=new Na,La=new Y,Ra=new Y,za=new Y,Ba=new Y,Va=new Y,Ha=new Y,Ua=new Y,Wa=new Y,Ga=new Y,Ka=new Y;function qa(e,t,n,r,i){for(let a=0,o=e.length-3;a<=o;a+=3){Ka.fromArray(e,a);let o=i.x*Math.abs(Ka.x)+i.y*Math.abs(Ka.y)+i.z*Math.abs(Ka.z),s=t.dot(Ka),c=n.dot(Ka),l=r.dot(Ka);if(Math.max(-Math.max(s,c,l),Math.min(s,c,l))>o)return!1}return!0}var Ja=new Y,Ya=new J,Xa=0,Za=class extends ni{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw TypeError(`THREE.BufferAttribute: array should be a Typed Array.`);this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Xa++}),this.name=``,this.array=e,this.itemSize=t,this.count=e===void 0?0:e.length/t,this.normalized=n,this.usage=Ur,this.updateRanges=[],this.gpuType=jn,this.version=0,this._normalizationScale=e===void 0?void 0:ui(e)}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,i=this.itemSize;r<i;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Ya.fromBufferAttribute(this,t),Ya.applyMatrix3(e),this.setXY(t,Ya.x,Ya.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ja.fromBufferAttribute(this,t),Ja.applyMatrix3(e),this.setXYZ(t,Ja.x,Ja.y,Ja.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ja.fromBufferAttribute(this,t),Ja.applyMatrix4(e),this.setXYZ(t,Ja.x,Ja.y,Ja.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ja.fromBufferAttribute(this,t),Ja.applyNormalMatrix(e),this.setXYZ(t,Ja.x,Ja.y,Ja.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ja.fromBufferAttribute(this,t),Ja.transformDirection(e),this.setXYZ(t,Ja.x,Ja.y,Ja.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=i,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:`dispose`})}_denormalize(e){let t=this._normalizationScale;return t===void 0?di(e,this.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?fi(e,this.array):Math.round(e*t)}},Qa=class extends Za{constructor(e,t,n){super(new Uint16Array(e),t,n)}},$a=class extends Za{constructor(e,t,n){super(new Uint32Array(e),t,n)}},eo=class extends Za{constructor(e,t,n){super(new Float32Array(e),t,n)}},to=new Na,no=new Y,ro=new Y,io=class{constructor(e=new Y,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t===void 0?to.setFromPoints(e).getCenter(n):n.copy(t);let r=0;for(let t=0,i=e.length;t<i;t++)r=Math.max(r,n.distanceToSquared(e[t]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius*=e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;no.subVectors(e,this.center);let t=no.lengthSq();if(t>this.radius*this.radius){let e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(no,n/e),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ro.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(no.copy(e.center).add(ro)),this.expandByPoint(no.copy(e.center).sub(ro))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},ao=0,oo=new Ii,so=new la,co=new Y,lo=new Na,uo=new Na,fo=new Y,po=class e extends ni{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:ao++}),this.uuid=oi(),this.name=``,this.type=`BufferGeometry`,this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return this.index=Array.isArray(e)?new(Kr(e)?$a:Qa)(e,1):e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let t=new X().getNormalMatrix(e);n.applyNormalMatrix(t),n.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return oo.makeRotationFromQuaternion(e),this.applyMatrix4(oo),this}rotateX(e){return oo.makeRotationX(e),this.applyMatrix4(oo),this}rotateY(e){return oo.makeRotationY(e),this.applyMatrix4(oo),this}rotateZ(e){return oo.makeRotationZ(e),this.applyMatrix4(oo),this}translate(e,t,n){return oo.makeTranslation(e,t,n),this.applyMatrix4(oo),this}scale(e,t,n){return oo.makeScale(e,t,n),this.applyMatrix4(oo),this}lookAt(e){return so.lookAt(e),so.updateMatrix(),this.applyMatrix4(so.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(co).negate(),this.translate(co.x,co.y,co.z),this}setFromPoints(e){let t=this.getAttribute(`position`);if(t===void 0){let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];t.push(r.x,r.y,r.z||0)}this.setAttribute(`position`,new eo(t,3))}else{let n=Math.min(e.length,t.count);for(let r=0;r<n;r++){let n=e[r];t.setXYZ(r,n.x,n.y,n.z||0)}e.length>t.count&&G(`BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Na);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)K(`BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,this),this.boundingBox.set(new Y(-1/0,-1/0,-1/0),new Y(1/0,1/0,1/0));else{if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];lo.setFromBufferAttribute(n),this.morphTargetsRelative?(fo.addVectors(this.boundingBox.min,lo.min),this.boundingBox.expandByPoint(fo),fo.addVectors(this.boundingBox.max,lo.max),this.boundingBox.expandByPoint(fo)):(this.boundingBox.expandByPoint(lo.min),this.boundingBox.expandByPoint(lo.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&K(`BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,this)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new io);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)K(`BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,this),this.boundingSphere.set(new Y,1/0);else if(e){let n=this.boundingSphere.center;if(lo.setFromBufferAttribute(e),t)for(let e=0,n=t.length;e<n;e++){let n=t[e];uo.setFromBufferAttribute(n),this.morphTargetsRelative?(fo.addVectors(lo.min,uo.min),lo.expandByPoint(fo),fo.addVectors(lo.max,uo.max),lo.expandByPoint(fo)):(lo.expandByPoint(uo.min),lo.expandByPoint(uo.max))}lo.getCenter(n);let r=0;for(let t=0,i=e.count;t<i;t++)fo.fromBufferAttribute(e,t),r=Math.max(r,n.distanceToSquared(fo));if(t)for(let i=0,a=t.length;i<a;i++){let a=t[i],o=this.morphTargetsRelative;for(let t=0,i=a.count;t<i;t++)fo.fromBufferAttribute(a,t),o&&(co.fromBufferAttribute(e,t),fo.add(co)),r=Math.max(r,n.distanceToSquared(fo))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&K(`BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){K(`BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`);return}let n=t.position,r=t.normal,i=t.uv,a=this.getAttribute(`tangent`);(a===void 0||a.count!==n.count)&&(a=new Za(new Float32Array(4*n.count),4),this.setAttribute(`tangent`,a));let o=[],s=[],c=new Uint8Array(n.count);for(let e=0;e<n.count;e++)o[e]=new Y,s[e]=new Y;let l=new Y,u=new Y,d=new Y,f=new J,p=new J,m=new J,h=new Y,g=new Y;function _(e,t,r){c[e]=c[t]=c[r]=1,l.fromBufferAttribute(n,e),u.fromBufferAttribute(n,t),d.fromBufferAttribute(n,r),f.fromBufferAttribute(i,e),p.fromBufferAttribute(i,t),m.fromBufferAttribute(i,r),u.sub(l),d.sub(l),p.sub(f),m.sub(f);let a=1/(p.x*m.y-m.x*p.y);isFinite(a)&&(h.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(a),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(a),o[e].add(h),o[t].add(h),o[r].add(h),s[e].add(g),s[t].add(g),s[r].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:e.count}]);for(let t=0,n=v.length;t<n;++t){let n=v[t],r=n.start,i=n.count;for(let t=r,n=r+i;t<n;t+=3)_(e.getX(t+0),e.getX(t+1),e.getX(t+2))}let y=new Y,b=new Y,x=new Y,S=new Y;function C(e){x.fromBufferAttribute(r,e),S.copy(x);let t=o[e];y.copy(t),y.sub(x.multiplyScalar(x.dot(t))).normalize(),b.crossVectors(S,t);let n=b.dot(s[e])<0?-1:1;a.setXYZW(e,y.x,y.y,y.z,n)}for(let e=0,t=n.count;e<t;++e)c[e]&&C(e);this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute(`position`);if(t!==void 0){let n=this.getAttribute(`normal`);if(n===void 0||n.count!==t.count)n=new Za(new Float32Array(t.count*3),3),this.setAttribute(`normal`,n);else for(let e=0,t=n.count;e<t;e++)n.setXYZ(e,0,0,0);let r=new Y,i=new Y,a=new Y,o=new Y,s=new Y,c=new Y,l=new Y,u=new Y;if(e)for(let d=0,f=e.count;d<f;d+=3){let f=e.getX(d+0),p=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,f),i.fromBufferAttribute(t,p),a.fromBufferAttribute(t,m),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),o.fromBufferAttribute(n,f),s.fromBufferAttribute(n,p),c.fromBufferAttribute(n,m),o.add(l),s.add(l),c.add(l),n.setXYZ(f,o.x,o.y,o.z),n.setXYZ(p,s.x,s.y,s.z),n.setXYZ(m,c.x,c.y,c.z)}else for(let e=0,o=t.count;e<o;e+=3)r.fromBufferAttribute(t,e+0),i.fromBufferAttribute(t,e+1),a.fromBufferAttribute(t,e+2),l.subVectors(a,i),u.subVectors(r,i),l.cross(u),n.setXYZ(e+0,l.x,l.y,l.z),n.setXYZ(e+1,l.x,l.y,l.z),n.setXYZ(e+2,l.x,l.y,l.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)fo.fromBufferAttribute(e,t),fo.normalize(),e.setXYZ(t,fo.x,fo.y,fo.z)}toNonIndexed(){function t(e,t){let n=e.array,r=e.itemSize,i=e.normalized,a=new n.constructor(t.length*r),o=0,s=0;for(let i=0,c=t.length;i<c;i++){o=e.isInterleavedBufferAttribute?t[i]*e.data.stride+e.offset:t[i]*r;for(let e=0;e<r;e++)a[s++]=n[o++]}return new Za(a,r,i)}if(this.index===null)return G(`BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`),this;let n=new e,r=this.index.array,i=this.attributes;for(let e in i){let a=i[e],o=t(a,r);n.setAttribute(e,o)}let a=this.morphAttributes;for(let e in a){let i=[],o=a[e];for(let e=0,n=o.length;e<n;e++){let n=o[e],a=t(n,r);i.push(a)}n.morphAttributes[e]=i}n.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let e=0,t=o.length;e<t;e++){let t=o[e];n.addGroup(t.start,t.count,t.materialIndex)}return n}toJSON(){let e={metadata:{version:4.7,type:`BufferGeometry`,generator:`BufferGeometry.toJSON`}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?`BufferGeometry`:this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let t=this.parameters;for(let n in t)t[n]!==void 0&&(e[n]=t[n]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let t in n){let r=n[t];e.data.attributes[t]=r.toJSON(e.data)}let r={},i=!1;for(let t in this.morphAttributes){let n=this.morphAttributes[t],a=[];for(let t=0,r=n.length;t<r;t++){let r=n[t];a.push(r.toJSON(e.data))}a.length>0&&(r[t]=a,i=!0)}i&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone());let r=e.attributes;for(let e in r){let n=r[e];this.setAttribute(e,n.clone(t))}let i=e.morphAttributes;for(let e in i){let n=[],r=i[e];for(let e=0,i=r.length;e<i;e++)n.push(r[e].clone(t));this.morphAttributes[e]=n}this.morphTargetsRelative=e.morphTargetsRelative;let a=e.groups;for(let e=0,t=a.length;e<t;e++){let t=a[e];this.addGroup(t.start,t.count,t.materialIndex)}let o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());let s=e.boundingSphere;return s!==null&&(this.boundingSphere=s.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:`dispose`})}},mo=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e===void 0?0:e.length/t,this.usage=Ur,this.updateRanges=[],this.version=0,this.uuid=oi()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let r=0,i=this.stride;r<i;r++)this.array[e+r]=t.array[n+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=ho(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=this.array.slice(0).buffer);let n=new this.array.constructor(e.arrayBuffers[t]),r=new this.constructor(n,this.stride);return r.setUsage(this.usage),r}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){e.arrayBuffers===void 0&&(e.arrayBuffers={});let t=ho(this.array);e.arrayBuffers[t]===void 0&&(e.arrayBuffers[t]=Array.from(new Uint32Array(this.array.slice(0).buffer)));let n={uuid:this.uuid,buffer:t,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}};function ho(e){return e.buffer._uuid===void 0&&(e.buffer._uuid=oi()),e.byteOffset===0&&e.byteLength===e.buffer.byteLength?e.buffer._uuid:e.buffer._uuid+`:`+e.byteOffset+`:`+e.byteLength}var go=new Y,_o=class e{constructor(e,t,n,r=!1){this.isInterleavedBufferAttribute=!0,this.name=``,this.data=e,this.itemSize=t,this.offset=n,this.normalized=r,this._normalizationScale=e===void 0?void 0:ui(e.array)}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)go.fromBufferAttribute(this,t),go.applyMatrix4(e),this.setXYZ(t,go.x,go.y,go.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)go.fromBufferAttribute(this,t),go.applyNormalMatrix(e),this.setXYZ(t,go.x,go.y,go.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)go.fromBufferAttribute(this,t),go.transformDirection(e),this.setXYZ(t,go.x,go.y,go.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=this._denormalize(t)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=this._denormalize(t)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=this._denormalize(t)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=this._denormalize(t)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this}setXYZW(e,t,n,r,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),i=this._normalize(i)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=r,this.data.array[e+3]=i,this}clone(t){if(t===void 0){Zr(`InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return new Za(new this.array.constructor(e),this.itemSize,this.normalized)}return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Zr(`InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.`);let e=[];for(let t=0;t<this.count;t++){let n=t*this.data.stride+this.offset;for(let t=0;t<this.itemSize;t++)e.push(this.data.array[n+t])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:e,normalized:this.normalized}}return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}_denormalize(e){let t=this._normalizationScale;return t===void 0?di(e,this.data.array):Math.max(e/t,-1)}_normalize(e){let t=this._normalizationScale;return t===void 0?fi(e,this.data.array):Math.round(e*t)}},vo=new Y,yo=new Y,bo=new X,xo=class{constructor(e=new Y(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let r=vo.subVectors(n,t).cross(yo.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){let r=e.delta(vo),i=this.normal.dot(r);if(i===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let a=-(e.start.dot(this.normal)+this.constant)/i;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||bo.getNormalMatrix(e),r=this.coplanarPoint(vo).applyMatrix4(e),i=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(i),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},So=0,Co=class extends ni{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:So++}),this.uuid=oi(),this.name=``,this.type=`Material`,this.blending=1,this.side=0,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=204,this.blendDst=205,this.blendEquation=100,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Z(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Hr,this.stencilZFail=Hr,this.stencilZPass=Hr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){G(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];r===void 0?G(`Material: '${t}' is not a property of THREE.${this.type}.`):r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e==`string`;t&&(e={textures:{},images:{}});let n={metadata:{version:4.7,type:`Material`,generator:`Material.toJSON`}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(e=>e.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(e){let t=[];for(let n in e){let r=e[n];delete r.metadata,t.push(r)}return t}if(t){let t=r(e.textures),i=r(e.images);t.length>0&&(n.textures=t),i.length>0&&(n.images=i)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Z().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(e=>new xo().fromJSON(e))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(this.vertexColors=typeof e.vertexColors==`number`?e.vertexColors>0:e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let t=e.normalScale;Array.isArray(t)===!1&&(t=[t,t]),this.normalScale=new J().fromArray(t)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new J().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let e=t.length;n=Array(e);for(let r=0;r!==e;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:`dispose`})}set needsUpdate(e){e===!0&&this.version++}},wo=class extends Co{constructor(e){super(),this.isSpriteMaterial=!0,this.type=`SpriteMaterial`,this.color=new Z(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.rotation=e.rotation,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},To,Eo=new Y,Do=new Y,Oo=new Y,ko=new J,Ao=new J,jo=new Ii,Mo=new Y,No=new Y,Po=new Y,Fo=new J,Io=new J,Lo=new J,Ro=class extends la{constructor(e=new wo){if(super(),this.isSprite=!0,this.type=`Sprite`,To===void 0){To=new po;let e=new mo(new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),5);To.setIndex([0,1,2,0,2,3]),To.setAttribute(`position`,new _o(e,3,0,!1)),To.setAttribute(`uv`,new _o(e,2,3,!1))}this.geometry=To,this.material=e,this.center=new J(.5,.5),this.count=1}intersectsFrustum(e){return e.intersectsSprite(this)}raycast(e,t){e.camera===null&&K(`Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.`),Do.setFromMatrixScale(this.matrixWorld),jo.copy(e.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(e.camera.matrixWorldInverse,this.matrixWorld),Oo.setFromMatrixPosition(this.modelViewMatrix),e.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&Do.multiplyScalar(-Oo.z);let n=this.material.rotation,r,i;n!==0&&(i=Math.cos(n),r=Math.sin(n));let a=this.center;zo(Mo.set(-.5,-.5,0),Oo,a,Do,r,i),zo(No.set(.5,-.5,0),Oo,a,Do,r,i),zo(Po.set(.5,.5,0),Oo,a,Do,r,i),Fo.set(0,0),Io.set(1,0),Lo.set(1,1);let o=e.ray.intersectTriangle(Mo,No,Po,!1,Eo);if(o===null&&(zo(No.set(-.5,.5,0),Oo,a,Do,r,i),Io.set(0,1),o=e.ray.intersectTriangle(Mo,Po,No,!1,Eo),o===null))return;let s=e.ray.origin.distanceTo(Eo);s<e.near||s>e.far||t.push({distance:s,point:Eo.clone(),uv:Ma.getInterpolation(Eo,Mo,No,Po,Fo,Io,Lo,new J),face:null,object:this})}copy(e,t){return super.copy(e,t),e.center!==void 0&&this.center.copy(e.center),this.material=e.material,this}toJSON(e){let t=super.toJSON(e);return t.object.center=this.center.toArray(),t}};function zo(e,t,n,r,i,a){ko.subVectors(e,n).addScalar(.5).multiply(r),i===void 0?Ao.copy(ko):(Ao.x=a*ko.x-i*ko.y,Ao.y=i*ko.x+a*ko.y),e.copy(t),e.x+=Ao.x,e.y+=Ao.y,e.applyMatrix4(jo)}var Bo=new Y,Vo=new Y,Ho=new Y,Uo=new Y,Wo=class{constructor(e=new Y,t=new Y(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Bo)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Bo.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Bo.copy(this.origin).addScaledVector(this.direction,t),Bo.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Vo.copy(e).add(t).multiplyScalar(.5),Ho.copy(t).sub(e).normalize(),Uo.copy(this.origin).sub(Vo);let i=e.distanceTo(t)*.5,a=-this.direction.dot(Ho),o=Uo.dot(this.direction),s=-Uo.dot(Ho),c=Uo.lengthSq(),l=Math.abs(1-a*a),u,d,f,p;if(l>0){if(u=a*s-o,d=a*o-s,p=i*l,u>=0){if(d>=-p){if(d<=p){let e=1/l;u*=e,d*=e,f=u*(u+a*d+2*o)+d*(a*u+d+2*s)+c}else d=i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d=-i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c}else d<=-p?(u=Math.max(0,-(-a*i+o)),d=u>0?-i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c):d<=p?(u=0,d=Math.min(Math.max(-i,-s),i),f=d*(d+2*s)+c):(u=Math.max(0,-(a*i+o)),d=u>0?i:Math.min(Math.max(-i,-s),i),f=-u*u+d*(d+2*s)+c)}else d=a>0?-i:i,u=Math.max(0,-(a*d+o)),f=-u*u+d*(d+2*s)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),r&&r.copy(Vo).addScaledVector(Ho,d),f}intersectSphere(e,t){if(e.radius<0)return null;Bo.subVectors(e.center,this.origin);let n=Bo.dot(this.direction),r=Bo.dot(Bo)-n*n,i=e.radius*e.radius;if(r>i)return null;let a=Math.sqrt(i-r),o=n-a,s=n+a;return s<0?null:o<0?this.at(s,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,i,a,o,s,c=1/this.direction.x,l=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(n=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(n=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),l>=0?(i=(e.min.y-d.y)*l,a=(e.max.y-d.y)*l):(i=(e.max.y-d.y)*l,a=(e.min.y-d.y)*l),n>a||i>r||((i>n||isNaN(n))&&(n=i),(a<r||isNaN(r))&&(r=a),u>=0?(o=(e.min.z-d.z)*u,s=(e.max.z-d.z)*u):(o=(e.max.z-d.z)*u,s=(e.min.z-d.z)*u),n>s||o>r)||((o>n||n!==n)&&(n=o),(s<r||r!==r)&&(r=s),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,Bo)!==null}intersectTriangle(e,t,n,r,i){let a=this.origin,o=this.direction,s=o.x,c=o.y,l=o.z,u=e.x-a.x,d=e.y-a.y,f=e.z-a.z,p=t.x-a.x,m=t.y-a.y,h=t.z-a.z,g=n.x-a.x,_=n.y-a.y,v=n.z-a.z,y=Math.abs(s),b=Math.abs(c),x=Math.abs(l),S,C,w,T,E,D,O,k,A,j,ee,M;if(y>=b&&y>=x?(w=s,D=u,A=p,M=g,s>=0?(S=c,C=l,T=d,E=f,O=m,k=h,j=_,ee=v):(S=l,C=c,T=f,E=d,O=h,k=m,j=v,ee=_)):b>=x?(w=c,D=d,A=m,M=_,c>=0?(S=l,C=s,T=f,E=u,O=h,k=p,j=v,ee=g):(S=s,C=l,T=u,E=f,O=p,k=h,j=g,ee=v)):(w=l,D=f,A=h,M=v,l>=0?(S=s,C=c,T=u,E=d,O=p,k=m,j=g,ee=_):(S=c,C=s,T=d,E=u,O=m,k=p,j=_,ee=g)),w===0)return null;let N=S/w,te=C/w,ne=1/w,re=T-N*D,ie=E-te*D,ae=O-N*A,P=k-te*A,oe=j-N*M,F=ee-te*M,I=oe*P-F*ae,L=re*F-ie*oe,R=ae*ie-P*re;if(r){if(I<0||L<0||R<0)return null}else if((I<0||L<0||R<0)&&(I>0||L>0||R>0))return null;let se=I+L+R;if(se===0)return null;let ce=ne*(I*D+L*A+R*M);return(se>0?ce<0:ce>0)?null:this.at(ce/se,i)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Go=class extends Co{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type=`MeshBasicMaterial`,this.color=new Z(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ki,this.combine=0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Ko=new Ii,qo=new Wo,Jo=new io,Yo=new Y,Xo=new Y,Zo=new Y,Qo=new Y,$o=new Y,es=new Y,ts=new Y,ns=new Y,rs=class extends la{constructor(e=new po,t=new Go){super(),this.isMesh=!0,this.type=`Mesh`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}getVertexPosition(e,t){let n=this.geometry,r=n.attributes.position,i=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);let o=this.morphTargetInfluences;if(i&&o){es.set(0,0,0);for(let n=0,r=i.length;n<r;n++){let r=o[n],s=i[n];r!==0&&($o.fromBufferAttribute(s,e),a?es.addScaledVector($o,r):es.addScaledVector($o.sub(t),r))}t.add(es)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.material,i=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Jo.copy(n.boundingSphere),Jo.applyMatrix4(i),qo.copy(e.ray).recast(e.near),Jo.containsPoint(qo.origin)===!1&&(qo.intersectSphere(Jo,Yo)===null||qo.origin.distanceToSquared(Yo)>(e.far-e.near)**2)||(Ko.copy(i).invert(),qo.copy(e.ray).applyMatrix4(Ko),(n.boundingBox===null||qo.intersectsBox(n.boundingBox)!==!1)&&this._computeIntersections(e,t,qo)))}_computeIntersections(e,t,n){let r,i=this.geometry,a=this.material,o=i.index,s=i.attributes.position,c=i.attributes.uv,l=i.attributes.uv1,u=i.attributes.normal,d=i.groups,f=i.drawRange;if(o!==null){if(Array.isArray(a))for(let i=0,s=d.length;i<s;i++){let s=d[i],p=a[s.materialIndex],m=Math.max(s.start,f.start),h=Math.min(o.count,Math.min(s.start+s.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=o.getX(i),d=o.getX(i+1),f=o.getX(i+2);r=as(this,p,e,n,c,l,u,a,d,f),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=s.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),s=Math.min(o.count,f.start+f.count);for(let d=i,f=s;d<f;d+=3){let i=o.getX(d),s=o.getX(d+1),f=o.getX(d+2);r=as(this,a,e,n,c,l,u,i,s,f),r&&(r.faceIndex=Math.floor(d/3),t.push(r))}}}else if(s!==void 0){if(Array.isArray(a))for(let i=0,o=d.length;i<o;i++){let o=d[i],p=a[o.materialIndex],m=Math.max(o.start,f.start),h=Math.min(s.count,Math.min(o.start+o.count,f.start+f.count));for(let i=m,a=h;i<a;i+=3){let a=i,s=i+1,d=i+2;r=as(this,p,e,n,c,l,u,a,s,d),r&&(r.faceIndex=Math.floor(i/3),r.face.materialIndex=o.materialIndex,t.push(r))}}else{let i=Math.max(0,f.start),o=Math.min(s.count,f.start+f.count);for(let s=i,d=o;s<d;s+=3){let i=s,o=s+1,d=s+2;r=as(this,a,e,n,c,l,u,i,o,d),r&&(r.faceIndex=Math.floor(s/3),t.push(r))}}}}};function is(e,t,n,r,i,a,o,s){let c;if(c=t.side===1?r.intersectTriangle(o,a,i,!0,s):r.intersectTriangle(i,a,o,t.side===0,s),c===null)return null;ns.copy(s),ns.applyMatrix4(e.matrixWorld);let l=n.ray.origin.distanceTo(ns);return l<n.near||l>n.far?null:{distance:l,point:ns.clone(),object:e}}function as(e,t,n,r,i,a,o,s,c,l){e.getVertexPosition(s,Xo),e.getVertexPosition(c,Zo),e.getVertexPosition(l,Qo);let u=is(e,t,n,r,Xo,Zo,Qo,ts);if(u){let e=new Y;Ma.getBarycoord(ts,Xo,Zo,Qo,e),i&&(u.uv=Ma.getInterpolatedAttribute(i,s,c,l,e,new J)),a&&(u.uv1=Ma.getInterpolatedAttribute(a,s,c,l,e,new J)),o&&(u.normal=Ma.getInterpolatedAttribute(o,s,c,l,e,new Y),u.normal.dot(r.direction)>0&&u.normal.multiplyScalar(-1));let t={a:s,b:c,c:l,normal:new Y,materialIndex:0};Ma.getNormal(Xo,Zo,Qo,t.normal),u.face=t,u.barycoord=e}return u}var os=class extends Ai{constructor(e=null,t=1,n=1,r,i,a,o,s,c=yn,l=yn,u,d){super(null,a,o,s,c,l,r,i,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},ss=class extends Za{constructor(e,t,n,r=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},cs=new Ii,ls=new Ii,us=[],ds=new Na,fs=new Ii,ps=new rs,ms=new io,hs=class extends rs{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new ss(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let e=0;e<n;e++)this.setMatrixAt(e,fs)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Na),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,cs),ds.copy(e.boundingBox).applyMatrix4(cs),this.boundingBox.union(ds)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new io),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,cs),ms.copy(e.boundingSphere).applyMatrix4(cs),this.boundingSphere.union(ms)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),this.morphTexture=e.morphTexture===null?null:e.morphTexture.clone(),this.instanceColor=e.instanceColor===null?null:e.instanceColor.clone(),this.count=e.count,this.boundingBox=e.boundingBox===null?null:e.boundingBox.clone(),this.boundingSphere=e.boundingSphere===null?null:e.boundingSphere.clone(),this}getColorAt(e,t){return this.instanceColor===null?t.setRGB(1,1,1):t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){return t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,r=this.morphTexture.source.data.data,i=e*(n.length+1)+1;for(let e=0;e<n.length;e++)n[e]=r[i+e]}raycast(e,t){let n=this.matrixWorld,r=this.count;if(ps.geometry=this.geometry,ps.material=this.material,ps.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),ms.copy(this.boundingSphere),ms.applyMatrix4(n),e.ray.intersectsSphere(ms)!==!1))for(let i=0;i<r;i++){this.getMatrixAt(i,cs),ls.multiplyMatrices(n,cs),ps.matrixWorld=ls,ps.raycast(e,us);for(let e=0,n=us.length;e<n;e++){let n=us[e];n.instanceId=i,n.object=this,t.push(n)}us.length=0}}setColorAt(e,t){return this.instanceColor===null&&(this.instanceColor=new ss(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3),this}setMatrixAt(e,t){return t.toArray(this.instanceMatrix.array,e*16),this}setMorphAt(e,t){let n=t.morphTargetInfluences,r=n.length+1;this.morphTexture===null&&(this.morphTexture=new os(new Float32Array(r*this.count),r,this.count,Un,jn));let i=this.morphTexture.source.data.data,a=0;for(let e=0;e<n.length;e++)a+=n[e];let o=this.geometry.morphTargetsRelative?1:1-a,s=r*e;return i[s]=o,i.set(n,s+1),this}updateMorphTargets(){}dispose(){super.dispose(),this.instanceMatrix.dispose(),this.instanceColor!==null&&this.instanceColor.dispose(),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}},gs=new io,_s=new J(.5,.5),vs=new Y,ys=class{constructor(e=new xo,t=new xo,n=new xo,r=new xo,i=new xo,a=new xo){this.planes=[e,t,n,r,i,a]}set(e,t,n,r,i,a){let o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(i),o[5].copy(a),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=Gr,n=!1){let r=this.planes,i=e.elements,a=i[0],o=i[1],s=i[2],c=i[3],l=i[4],u=i[5],d=i[6],f=i[7],p=i[8],m=i[9],h=i[10],g=i[11],_=i[12],v=i[13],y=i[14],b=i[15];if(r[0].setComponents(c-a,f-l,g-p,b-_).normalize(),r[1].setComponents(c+a,f+l,g+p,b+_).normalize(),r[2].setComponents(c+o,f+u,g+m,b+v).normalize(),r[3].setComponents(c-o,f-u,g-m,b-v).normalize(),n)r[4].setComponents(s,d,h,y).normalize(),r[5].setComponents(c-s,f-d,g-h,b-y).normalize();else if(r[4].setComponents(c-s,f-d,g-h,b-y).normalize(),t===2e3)r[5].setComponents(c+s,f+d,g+h,b+y).normalize();else if(t===2001)r[5].setComponents(s,d,h,y).normalize();else throw Error(`THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: `+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),gs.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),gs.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(gs)}intersectsSprite(e){return gs.center.set(0,0,0),gs.radius=.7071067811865476+_s.distanceTo(e.center),gs.applyMatrix4(e.matrixWorld),this.intersectsSphere(gs)}intersectsSphere(e){let t=this.planes,n=e.center,r=-e.radius;for(let e=0;e<6;e++)if(t[e].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let r=t[n];if(vs.x=r.normal.x>0?e.max.x:e.min.x,vs.y=r.normal.y>0?e.max.y:e.min.y,vs.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(vs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},bs=new Ii,xs=class e{constructor(){this.coordinateSystem=Gr,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,n=this._frustums;for(let e=0;e<t.length;e++){let r=t[e];bs.multiplyMatrices(r.projectionMatrix,r.matrixWorldInverse),n[e]===void 0&&(n[e]=new ys),n[e].setFromProjectionMatrix(bs,r.coordinateSystem,r.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new ys),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new e().copy(this)}},Ss=class extends Co{constructor(e){super(),this.isPointsMaterial=!0,this.type=`PointsMaterial`,this.color=new Z(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Cs=new Ii,ws=new Wo,Ts=new io,Es=new Y,Ds=class extends la{constructor(e=new po,t=new Ss){super(),this.isPoints=!0,this.type=`Points`,this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.morphTargetInfluences=e.morphTargetInfluences===void 0?void 0:e.morphTargetInfluences.slice(),this.morphTargetDictionary=e.morphTargetDictionary===void 0?void 0:Object.assign({},e.morphTargetDictionary),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let n=this.geometry,r=this.matrixWorld,i=e.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Ts.copy(n.boundingSphere),Ts.applyMatrix4(r),Ts.radius+=i,e.ray.intersectsSphere(Ts)===!1)return;Cs.copy(r).invert(),ws.copy(e.ray).applyMatrix4(Cs);let o=i/((this.scale.x+this.scale.y+this.scale.z)/3),s=o*o,c=n.index,l=n.attributes.position;if(c!==null){let n=Math.max(0,a.start),i=Math.min(c.count,a.start+a.count);for(let a=n,o=i;a<o;a++){let n=c.getX(a);Es.fromBufferAttribute(l,n),Os(Es,n,s,r,e,t,this)}}else{let n=Math.max(0,a.start),i=Math.min(l.count,a.start+a.count);for(let a=n,o=i;a<o;a++)Es.fromBufferAttribute(l,a),Os(Es,a,s,r,e,t,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let n=e[t[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let e=0,t=n.length;e<t;e++){let t=n[e].name||String(e);this.morphTargetInfluences.push(0),this.morphTargetDictionary[t]=e}}}}};function Os(e,t,n,r,i,a,o){let s=ws.distanceSqToPoint(e);if(s<n){let n=new Y;ws.closestPointToPoint(e,n),n.applyMatrix4(r);let c=i.ray.origin.distanceTo(n);if(c<i.near||c>i.far)return;a.push({distance:c,distanceToRay:Math.sqrt(s),point:n,index:t,face:null,faceIndex:null,barycoord:null,object:o})}}var ks=class extends Ai{constructor(e=[],t=301,n,r,i,a,o,s,c,l){super(e,t,n,r,i,a,o,s,c,l),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},As=class extends Ai{constructor(e,t,n,r,i,a,o,s,c){super(e,t,n,r,i,a,o,s,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},js=class extends Ai{constructor(e,t,n=An,r,i,a,o=yn,s=yn,c,l=Vn,u=1){if(l!==1026&&l!==1027)throw Error(`THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat`);super({width:e,height:t,depth:u},r,i,a,o,s,l,n,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ei(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},Ms=class extends js{constructor(e,t=An,n=301,r,i,a=yn,o=yn,s,c=Vn){let l={width:e,height:e,depth:1},u=[l,l,l,l,l,l];super(e,e,t,n,r,i,a,o,s,c),this.image=u,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},Ns=class extends Ai{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Ps=class e extends po{constructor(e=1,t=1,n=1,r=1,i=1,a=1){super(),this.type=`BoxGeometry`,this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:i,depthSegments:a};let o=this;r=Math.floor(r),i=Math.floor(i),a=Math.floor(a);let s=[],c=[],l=[],u=[],d=0,f=0;p(`z`,`y`,`x`,-1,-1,n,t,e,a,i,0),p(`z`,`y`,`x`,1,-1,n,t,-e,a,i,1),p(`x`,`z`,`y`,1,1,e,n,t,r,a,2),p(`x`,`z`,`y`,1,-1,e,n,-t,r,a,3),p(`x`,`y`,`z`,1,-1,e,t,n,r,i,4),p(`x`,`y`,`z`,-1,-1,e,t,-n,r,i,5),this.setIndex(s),this.setAttribute(`position`,new eo(c,3)),this.setAttribute(`normal`,new eo(l,3)),this.setAttribute(`uv`,new eo(u,2));function p(e,t,n,r,i,a,p,m,h,g,_){let v=a/h,y=p/g,b=a/2,x=p/2,S=m/2,C=h+1,w=g+1,T=0,E=0,D=new Y;for(let a=0;a<w;a++){let o=a*y-x;for(let s=0;s<C;s++)D[e]=(s*v-b)*r,D[t]=o*i,D[n]=S,c.push(D.x,D.y,D.z),D[e]=0,D[t]=0,D[n]=m>0?1:-1,l.push(D.x,D.y,D.z),u.push(s/h),u.push(1-a/g),T+=1}for(let e=0;e<g;e++)for(let t=0;t<h;t++){let n=d+t+C*e,r=d+t+C*(e+1),i=d+(t+1)+C*(e+1),a=d+(t+1)+C*e;s.push(n,r,a),s.push(r,i,a),E+=6}o.addGroup(f,E,_),f+=E,d+=T}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}},Fs=class e extends po{constructor(e=1,t=1,n=1,r=1){super(),this.type=`PlaneGeometry`,this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};let i=e/2,a=t/2,o=Math.floor(n),s=Math.floor(r),c=o+1,l=s+1,u=e/o,d=t/s,f=[],p=[],m=[],h=[];for(let e=0;e<l;e++){let t=e*d-a;for(let n=0;n<c;n++){let r=n*u-i;p.push(r,-t,0),m.push(0,0,1),h.push(n/o),h.push(1-e/s)}}for(let e=0;e<s;e++)for(let t=0;t<o;t++){let n=t+c*e,r=t+c*(e+1),i=t+1+c*(e+1),a=t+1+c*e;f.push(n,r,a),f.push(r,i,a)}this.setIndex(f),this.setAttribute(`position`,new eo(p,3)),this.setAttribute(`normal`,new eo(m,3)),this.setAttribute(`uv`,new eo(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}},Is=class e extends po{constructor(e=.5,t=1,n=32,r=1,i=0,a=Math.PI*2){super(),this.type=`RingGeometry`,this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:i,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);let o=[],s=[],c=[],l=[],u=e,d=(t-e)/r,f=new Y,p=new J;for(let e=0;e<=r;e++){for(let e=0;e<=n;e++){let r=i+e/n*a;f.x=u*Math.cos(r),f.y=u*Math.sin(r),s.push(f.x,f.y,f.z),c.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,l.push(p.x,p.y)}u+=d}for(let e=0;e<r;e++){let t=e*(n+1);for(let e=0;e<n;e++){let r=e+t,i=r,a=r+n+1,s=r+n+2,c=r+1;o.push(i,a,c),o.push(a,s,c)}}this.setIndex(o),this.setAttribute(`position`,new eo(s,3)),this.setAttribute(`normal`,new eo(c,3)),this.setAttribute(`uv`,new eo(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(t){return new e(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};function Ls(e){let t={};for(let n in e){t[n]={};for(let r in e[n]){let i=e[n][r];if(zs(i))i.isRenderTargetTexture?(G(`UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().`),t[n][r]=null):t[n][r]=i.clone();else if(Array.isArray(i)){if(zs(i[0])){let e=[];for(let t=0,n=i.length;t<n;t++)e[t]=i[t].clone();t[n][r]=e}else t[n][r]=i.slice()}else t[n][r]=i}}return t}function Rs(e){let t={};for(let n=0;n<e.length;n++){let r=Ls(e[n]);for(let e in r)t[e]=r[e]}return t}function zs(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function Bs(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Vs(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:bi.workingColorSpace}var Hs={clone:Ls,merge:Rs},Us=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Ws=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Gs=class extends Co{constructor(e){super(),this.isShaderMaterial=!0,this.type=`ShaderMaterial`,this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Us,this.fragmentShader=Ws,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ls(e.uniforms),this.uniformsGroups=Bs(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:`t`,value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:`c`,value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:`v2`,value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:`v3`,value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:`v4`,value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:`m3`,value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:`m4`,value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let e in this.extensions)this.extensions[e]===!0&&(n[e]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let n in e.uniforms){let r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case`t`:this.uniforms[n].value=t[r.value]||null;break;case`c`:this.uniforms[n].value=new Z().setHex(r.value);break;case`v2`:this.uniforms[n].value=new J().fromArray(r.value);break;case`v3`:this.uniforms[n].value=new Y().fromArray(r.value);break;case`v4`:this.uniforms[n].value=new ji().fromArray(r.value);break;case`m3`:this.uniforms[n].value=new X().fromArray(r.value);break;case`m4`:this.uniforms[n].value=new Ii().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let t in e.extensions)this.extensions[t]=e.extensions[t];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Ks=class extends Gs{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type=`RawShaderMaterial`}},qs=class extends Co{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type=`MeshStandardMaterial`,this.defines={STANDARD:``},this.color=new Z(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Z(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new J(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ki,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:``},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Js=class extends qs{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:``,PHYSICAL:``},this.type=`MeshPhysicalMaterial`,this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new J(1,1),this.clearcoatNormalMap=null,this.diffuseRoughnessMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return q(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessMinimum=100,this.iridescenceThicknessMaximum=400,this.iridescenceThicknessMap=null,this.sheenColor=new Z(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Z(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Z(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._diffuseRoughness=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get diffuseRoughness(){return this._diffuseRoughness}set diffuseRoughness(e){this._diffuseRoughness>0!=e>0&&this.version++,this._diffuseRoughness=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(e){this._retroreflectivity>0!=e>0&&this.version++,this._retroreflectivity=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}get iridescenceThicknessRange(){return $r(`MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".`),[this.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum]}set iridescenceThicknessRange(e){$r(`MeshPhysicalMaterial: The "iridescenceThicknessRange" property has been replaced by "iridescenceThicknessMinimum" and "iridescenceThicknessMaximum".`),this.iridescenceThicknessMinimum=e[0],this.iridescenceThicknessMaximum=e[1]}copy(e){return super.copy(e),this.defines={STANDARD:``,PHYSICAL:``},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.diffuseRoughness=e.diffuseRoughness,this.diffuseRoughnessMap=e.diffuseRoughnessMap,this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum,this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum,this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.retroreflectivity=e.retroreflectivity,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}},Ys=class extends Co{constructor(e){super(),this.isMeshLambertMaterial=!0,this.type=`MeshLambertMaterial`,this.color=new Z(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Z(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new J(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Ki,this.combine=0,this.reflectivity=1,this.envMapIntensity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap=`round`,this.wireframeLinejoin=`round`,this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.envMapIntensity=e.envMapIntensity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},Xs=class extends Co{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type=`MeshDepthMaterial`,this.depthPacking=Lr,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Zs=class extends Co{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type=`MeshDistanceMaterial`,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Qs(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT==`number`?new t(e):Array.prototype.slice.call(e)}function $s(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var ec=class{constructor(e,t,n,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r===void 0?new t.constructor(n):r,this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,r=t[n],i=t[n-1];validate_interval:{seek:{let a;linear_scan:{forward_scan:if(!(e<r)){for(let a=n+2;;){if(r===void 0){if(e<i)break forward_scan;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(i=r,r=t[++n],e<r)break seek}a=t.length;break linear_scan}if(!(e>=i)){let o=t[1];e<o&&(n=2,i=o);for(let a=n-2;;){if(i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===a)break;if(r=i,i=t[--n-1],e>=i)break seek}a=n,n=0;break linear_scan}break validate_interval}for(;n<a;){let r=n+a>>>1;e<t[r]?a=r:n=r+1}if(r=t[n],i=t[n-1],i===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,i,r)}return this.interpolate_(n,i,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,r=this.valueSize,i=e*r;for(let e=0;e!==r;++e)t[e]=n[i+e];return t}interpolate_(){throw Error(`THREE.Interpolant: Call to abstract method.`)}intervalChanged_(){}},tc=class extends ec{constructor(e,t,n,r){super(e,t,n,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Pr,endingEnd:Pr}}intervalChanged_(e,t,n){let r=this.parameterPositions,i=e-2,a=e+1,o=r[i],s=r[a];if(o===void 0)switch(this.getSettings_().endingStart){case Fr:i=e,o=2*t-n;break;case Ir:i=r.length-2,o=t+r[i]-r[i+1];break;default:i=e,o=n}if(s===void 0)switch(this.getSettings_().endingEnd){case Fr:a=e,s=2*n-t;break;case Ir:a=1,s=n+r[1]-r[0];break;default:a=e-1,s=t}let c=(n-t)*.5,l=this.valueSize;this._weightPrev=c/(t-o),this._weightNext=c/(s-n),this._offsetPrev=i*l,this._offsetNext=a*l}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,p=(n-t)/(r-t),m=p*p,h=m*p,g=-d*h+2*d*m-d*p,_=(1+d)*h+(-1.5-2*d)*m+(-.5+d)*p+1,v=(-1-f)*h+(1.5+f)*m+.5*p,y=f*h-f*m;for(let e=0;e!==o;++e)i[e]=g*a[l+e]+_*a[c+e]+v*a[s+e]+y*a[u+e];return i}},nc=class extends ec{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=(n-t)/(r-t),u=1-l;for(let e=0;e!==o;++e)i[e]=a[c+e]*u+a[s+e]*l;return i}},rc=class extends ec{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e){return this.copySampleValue_(e-1)}},ic=class extends ec{interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=e*o,c=s-o,l=this.inTangents,u=this.outTangents;if(!l||!u){let e=(n-t)/(r-t),l=1-e;for(let t=0;t!==o;++t)i[t]=a[c+t]*l+a[s+t]*e;return i}let d=o*2,f=e-1;for(let p=0;p!==o;++p){let o=a[c+p],m=a[s+p],h=f*d+p*2,g=u[h],_=u[h+1],v=e*d+p*2,y=l[v],b=l[v+1],x=sc(n,t,g,y,r);i[p]=ac(x,o,_,b,m)}return i}};function ac(e,t,n,r,i){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*r+e*e*e*i}function oc(e,t,n,r,i){let a=1-e;return 3*a*a*(n-t)+6*a*e*(r-n)+3*e*e*(i-r)}function sc(e,t,n,r,i){let a=(e-t)/(i-t);for(let o=0;o<8;o++){let o=ac(a,t,n,r,i)-e;if(Math.abs(o)<1e-10)break;let s=oc(a,t,n,r,i);if(Math.abs(s)<1e-10)break;a=Math.max(0,Math.min(1,a-o/s))}return a}var cc=class{constructor(e,t,n,r){if(e===void 0)throw Error(`THREE.KeyframeTrack: track name is undefined`);if(t===void 0||t.length===0)throw Error(`THREE.KeyframeTrack: no keyframes in track named `+e);this.name=e,this.times=Qs(t,this.TimeBufferType),this.values=Qs(n,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:Qs(e.times,Array),values:Qs(e.values,Array)};let t=e.getInterpolation();t!==e.DefaultInterpolation&&(n.interpolation=t),$s(e.settings)&&(n.settings={inTangents:Qs(e.settings.inTangents,Array),outTangents:Qs(e.settings.outTangents,Array)})}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new rc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new nc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new tc(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new ic(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Ar:t=this.InterpolantFactoryMethodDiscrete;break;case jr:t=this.InterpolantFactoryMethodLinear;break;case Mr:t=this.InterpolantFactoryMethodSmooth;break;case Nr:t=this.InterpolantFactoryMethodBezier}if(t===void 0){let t=`unsupported interpolation for `+this.ValueTypeName+` keyframe track named `+this.name;if(this.createInterpolant===void 0){if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw Error(t)}return G(`KeyframeTrack:`,t),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Ar;case this.InterpolantFactoryMethodLinear:return jr;case this.InterpolantFactoryMethodSmooth:return Mr;case this.InterpolantFactoryMethodBezier:return Nr}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]+=e;$s(this.settings)&&(lc(this.settings.inTangents,e),lc(this.settings.outTangents,e))}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,r=t.length;n!==r;++n)t[n]*=e;$s(this.settings)&&(uc(this.settings.inTangents,e),uc(this.settings.outTangents,e))}return this}trim(e,t){let n=this.times,r=n.length,i=0,a=r-1;for(;i!==r&&n[i]<e;)++i;for(;a!==-1&&n[a]>t;)--a;if(++a,i!==0||a!==r){i>=a&&(a=Math.max(a,1),i=a-1);let e=this.getValueSize();this.times=n.slice(i,a),this.values=this.values.slice(i*e,a*e)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(K(`KeyframeTrack: Invalid value size in track.`,this),e=!1);let n=this.times,r=this.values,i=n.length;i===0&&(K(`KeyframeTrack: Track is empty.`,this),e=!1);let a=null;for(let t=0;t!==i;t++){let r=n[t];if(typeof r==`number`&&isNaN(r)){K(`KeyframeTrack: Time is not a valid number.`,this,t,r),e=!1;break}if(a!==null&&a>r){K(`KeyframeTrack: Out of order keys.`,this,t,r,a),e=!1;break}a=r}if(r!==void 0&&qr(r))for(let t=0,n=r.length;t!==n;++t){let n=r[t];if(isNaN(n)){K(`KeyframeTrack: Value is not a valid number.`,this,t,n),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),r=this.getInterpolation()===Mr,i=e.length-1,a=1;for(let o=1;o<i;++o){let i=!1,s=e[o];if(s!==e[o+1]&&(o!==1||s!==e[0])){if(r)i=!0;else{let e=o*n,r=e-n,a=e+n;for(let o=0;o!==n;++o){let n=t[e+o];if(n!==t[r+o]||n!==t[a+o]){i=!0;break}}}}if(i){if(o!==a){e[a]=e[o];let r=o*n,i=a*n;for(let e=0;e!==n;++e)t[i+e]=t[r+e]}++a}}if(i>0){e[a]=e[i];for(let e=i*n,r=a*n,o=0;o!==n;++o)t[r+o]=t[e+o];++a}return a===e.length?(this.times=e,this.values=t):(this.times=e.slice(0,a),this.values=t.slice(0,a*n)),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,r=new n(this.name,e,t);return r.createInterpolant=this.createInterpolant,$s(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function lc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]+=t}function uc(e,t){for(let n=0,r=e.length;n!==r;n+=2)e[n]*=t}cc.prototype.ValueTypeName=``,cc.prototype.TimeBufferType=Float32Array,cc.prototype.ValueBufferType=Float32Array,cc.prototype.DefaultInterpolation=jr;var dc=class extends cc{constructor(e,t,n){super(e,t,n)}};dc.prototype.ValueTypeName=`bool`,dc.prototype.ValueBufferType=Array,dc.prototype.DefaultInterpolation=Ar,dc.prototype.InterpolantFactoryMethodLinear=void 0,dc.prototype.InterpolantFactoryMethodSmooth=void 0;var fc=class extends cc{constructor(e,t,n,r){super(e,t,n,r)}};fc.prototype.ValueTypeName=`color`;var pc=class extends cc{constructor(e,t,n,r){super(e,t,n,r)}};pc.prototype.ValueTypeName=`number`;var mc=class extends ec{constructor(e,t,n,r){super(e,t,n,r)}interpolate_(e,t,n,r){let i=this.resultBuffer,a=this.sampleValues,o=this.valueSize,s=(n-t)/(r-t),c=e*o;for(let e=c+o;c!==e;c+=4)pi.slerpFlat(i,0,a,c-o,a,c,s);return i}},hc=class extends cc{constructor(e,t,n,r){super(e,t,n,r)}InterpolantFactoryMethodLinear(e){return new mc(this.times,this.values,this.getValueSize(),e)}};hc.prototype.ValueTypeName=`quaternion`,hc.prototype.InterpolantFactoryMethodSmooth=void 0;var gc=class extends cc{constructor(e,t,n){super(e,t,n)}};gc.prototype.ValueTypeName=`string`,gc.prototype.ValueBufferType=Array,gc.prototype.DefaultInterpolation=Ar,gc.prototype.InterpolantFactoryMethodLinear=void 0,gc.prototype.InterpolantFactoryMethodSmooth=void 0;var _c=class extends cc{constructor(e,t,n,r){super(e,t,n,r)}};_c.prototype.ValueTypeName=`vector`;var vc=class extends la{static registerNode(e){this.prototype._lightNode=e}constructor(e,t=1){super(),this.isLight=!0,this.type=`Light`,this.color=new Z(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},yc=class extends vc{constructor(e,t,n){super(e,n),this.isHemisphereLight=!0,this.type=`HemisphereLight`,this.position.copy(la.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Z(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},bc=new Ii,xc=new Y,Sc=new Y,Cc=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new J(512,512),this.mapType=Tn,this.map=null,this.mapPass=null,this.matrix=new Ii,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ys,this._frameExtents=new J(1,1),this._viewportCount=1,this._viewports=[new ji(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;xc.setFromMatrixPosition(e.matrixWorld),t.position.copy(xc),Sc.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Sc),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,n,r){bc.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),n.setFromProjectionMatrix(bc,e.coordinateSystem,e.reversedDepth);let i=this._frameExtents,a=r?r.z/i.x:1,o=r?r.w/i.y:1,s=r?r.x/i.x:0,c=r?r.y/i.y:0;e.coordinateSystem===2001||e.reversedDepth?t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,1,0,0,0,0,1):t.set(.5*a,0,0,.5*a+s,0,.5*o,0,.5*o+c,0,0,.5,.5,0,0,0,1),t.multiply(bc)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.mapType=e.mapType,this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.mapType=this.mapType,e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},wc=new Y,Tc=new pi,Ec=new Y,Dc=class extends la{constructor(){super(),this.isCamera=!0,this.type=`Camera`,this.matrixWorldInverse=new Ii,this.projectionMatrix=new Ii,this.projectionMatrixInverse=new Ii,this.coordinateSystem=Gr,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(wc,Tc,Ec),Ec.x===1&&Ec.y===1&&Ec.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(wc,Tc,Ec.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(wc,Tc,Ec),Ec.x===1&&Ec.y===1&&Ec.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(wc,Tc,Ec.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Oc=new Y,kc=new J,Ac=new J,jc=class extends Dc{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type=`PerspectiveCamera`,this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ai*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(ii*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ai*2*Math.atan(Math.tan(ii*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Oc.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Oc.x,Oc.y).multiplyScalar(-e/Oc.z),Oc.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Oc.x,Oc.y).multiplyScalar(-e/Oc.z)}getViewSize(e,t){return this.getViewBounds(e,kc,Ac),t.subVectors(Ac,kc)}setViewOffset(e,t,n,r,i,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(ii*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,i=-.5*r,a=this.view;if(this.view!==null&&this.view.enabled){let e=a.fullWidth,o=a.fullHeight;i+=a.offsetX*r/e,t-=a.offsetY*n/o,r*=a.width/e,n*=a.height/o}let o=this.filmOffset;o!==0&&(i+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(i,i+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Mc=class extends Cc{constructor(){super(new jc(90,1,.5,500)),this.isPointLightShadow=!0}},Nc=class extends vc{constructor(e,t,n=0,r=2){super(e,t),this.isPointLight=!0,this.type=`PointLight`,this.distance=n,this.decay=r,this.shadow=new Mc}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}},Pc=class extends Dc{constructor(e=-1,t=1,n=1,r=-1,i=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type=`OrthographicCamera`,this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=i,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,i,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=i,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2,i=n-e,a=n+e,o=r+t,s=r-t;if(this.view!==null&&this.view.enabled){let e=(this.right-this.left)/this.view.fullWidth/this.zoom,t=(this.top-this.bottom)/this.view.fullHeight/this.zoom;i+=e*this.view.offsetX,a=i+e*this.view.width,o-=t*this.view.offsetY,s=o-t*this.view.height}this.projectionMatrix.makeOrthographic(i,a,o,s,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Fc=class extends Cc{constructor(){super(new Pc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ic=class extends vc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type=`DirectionalLight`,this.position.copy(la.DEFAULT_UP),this.updateMatrix(),this.target=new la,this.shadow=new Fc}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}},Lc=-90,Rc=1,zc=class extends la{constructor(e,t,n){super(),this.type=`CubeCamera`,this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new jc(Lc,Rc,e,t);r.layers=this.layers,this.add(r);let i=new jc(Lc,Rc,e,t);i.layers=this.layers,this.add(i);let a=new jc(Lc,Rc,e,t);a.layers=this.layers,this.add(a);let o=new jc(Lc,Rc,e,t);o.layers=this.layers,this.add(o);let s=new jc(Lc,Rc,e,t);s.layers=this.layers,this.add(s);let c=new jc(Lc,Rc,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,r,i,a,o,s]=t;for(let e of t)this.remove(e);if(e===2e3)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),i.up.set(0,0,-1),i.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),s.up.set(0,1,0),s.lookAt(0,0,-1);else if(e===2001)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),i.up.set(0,0,1),i.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),s.up.set(0,-1,0),s.lookAt(0,0,-1);else throw Error(`THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: `+e);for(let e of t)this.add(e),e.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[i,a,o,s,c,l]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let m=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let h=!1;h=e.isWebGLRenderer===!0?e.state.buffers.depth.getReversed():e.reversedDepthBuffer,e.setRenderTarget(n,0,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,i),e.setRenderTarget(n,1,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,4,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),n.texture.mipmapsAutoUpdate=m,e.setRenderTarget(n,5,r),h&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(u,d,f),e.xr.enabled=p,n.texture.needsPMREMUpdate=!0}},Bc=class extends jc{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}},Vc=class{constructor(){this._previousTime=0,this._currentTime=0,this._startTime=performance.now(),this._delta=0,this._elapsed=0,this._timescale=1,this._document=null,this._pageVisibilityHandler=null}connect(e){this._document=e,e.hidden!==void 0&&(this._pageVisibilityHandler=Hc.bind(this),e.addEventListener(`visibilitychange`,this._pageVisibilityHandler,!1))}disconnect(){this._pageVisibilityHandler!==null&&(this._document.removeEventListener(`visibilitychange`,this._pageVisibilityHandler),this._pageVisibilityHandler=null),this._document=null}getDelta(){return this._delta/1e3}getElapsed(){return this._elapsed/1e3}getTimescale(){return this._timescale}setTimescale(e){return this._timescale=e,this}reset(){return this._currentTime=performance.now()-this._startTime,this}dispose(){this.disconnect()}update(e){return this._pageVisibilityHandler!==null&&this._document.hidden===!0?this._delta=0:(this._previousTime=this._currentTime,this._currentTime=(e===void 0?performance.now():e)-this._startTime,this._delta=(this._currentTime-this._previousTime)*this._timescale,this._elapsed+=this._delta),this}};function Hc(){this._document.hidden===!1&&this.reset()}var Uc=`\\[\\]\\.:\\/`,Wc=RegExp(`[\\[\\]\\.:\\/]`,`g`),Gc=`[^\\[\\]\\.:\\/]`,Kc=`[^`+Uc.replace(`\\.`,``)+`]`,qc=`((?:WC+[\\/:])*)`.replace(`WC`,Gc),Jc=`(WCOD+)?`.replace(`WCOD`,Kc),Yc=`(?:\\.(WC+)(?:\\[(.+)\\])?)?`.replace(`WC`,Gc),Xc=`\\.(WC+)(?:\\[(.+)\\])?`.replace(`WC`,Gc),Zc=RegExp(`^`+qc+Jc+Yc+Xc+`$`),Qc=[`material`,`materials`,`bones`,`map`],$c=class{constructor(e,t,n){let r=n||el.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,r=this._bindings[n];r!==void 0&&r.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let r=this._targetGroup.nCachedObjects_,i=n.length;r!==i;++r)n[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},el=class e{constructor(t,n,r){this.path=n,this.parsedPath=r||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,r){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,r):new e(t,n,r)}static sanitizeNodeName(e){return e.replace(/\s/g,`_`).replace(Wc,``)}static parseTrackName(e){let t=Zc.exec(e);if(t===null)throw Error(`THREE.PropertyBinding: Cannot parse trackName: `+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=n.nodeName&&n.nodeName.lastIndexOf(`.`);if(r!==void 0&&r!==-1){let e=n.nodeName.substring(r+1);Qc.indexOf(e)!==-1&&(n.nodeName=n.nodeName.substring(0,r),n.objectName=e)}if(n.propertyName===null||n.propertyName.length===0)throw Error(`THREE.PropertyBinding: can not parse propertyName from trackName: `+e);return n}static findNode(e,t){if(t===void 0||t===``||t===`.`||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(e){for(let r=0;r<e.length;r++){let i=e[r];if(i.name===t||i.uuid===t)return i;let a=n(i.children);if(a)return a}return null},r=n(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)e[t++]=n[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let r=0,i=n.length;r!==i;++r)n[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let t=this.node,n=this.parsedPath,r=n.objectName,i=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){G(`PropertyBinding: No target node found for track: `+this.path+`.`);return}if(r){let e=n.objectIndex;switch(r){case`materials`:if(!t.material){K(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.materials){K(`PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,this);return}t=t.material.materials;break;case`bones`:if(!t.skeleton){K(`PropertyBinding: Can not bind to bones as node does not have a skeleton.`,this);return}t=t.skeleton.bones;for(let n=0;n<t.length;n++)if(t[n].name===e){e=n;break}break;case`map`:if(`map`in t){t=t.map;break}if(!t.material){K(`PropertyBinding: Can not bind to material as node does not have a material.`,this);return}if(!t.material.map){K(`PropertyBinding: Can not bind to material.map as node.material does not have a map.`,this);return}t=t.material.map;break;default:if(t[r]===void 0){K(`PropertyBinding: Can not bind to objectName of node undefined.`,this);return}t=t[r]}if(e!==void 0){if(t[e]===void 0){K(`PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,this,t);return}t=t[e]}}let o=t[i];if(o===void 0){let e=n.nodeName;K(`PropertyBinding: Trying to update property for track: `+e+`.`+i+` but it wasn't found.`,t);return}let s=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?s=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(a!==void 0){if(i===`morphTargetInfluences`){if(!t.geometry){K(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,this);return}if(!t.geometry.morphAttributes){K(`PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=a}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=i;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};el.Composite=$c,el.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},el.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},el.prototype.GetterByBindingType=[el.prototype._getValue_direct,el.prototype._getValue_array,el.prototype._getValue_arrayElement,el.prototype._getValue_toArray],el.prototype.SetterByBindingTypeAndVersioning=[[el.prototype._setValue_direct,el.prototype._setValue_direct_setNeedsUpdate,el.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[el.prototype._setValue_array,el.prototype._setValue_array_setNeedsUpdate,el.prototype._setValue_array_setMatrixWorldNeedsUpdate],[el.prototype._setValue_arrayElement,el.prototype._setValue_arrayElement_setNeedsUpdate,el.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[el.prototype._setValue_fromArray,el.prototype._setValue_fromArray_setNeedsUpdate,el.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var tl=new Ii,nl=class{constructor(e,t,n=0,r=1/0){this.ray=new Wo(e,t),this.near=n,this.far=r,this.camera=null,this.layers=new qi,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,t.projectionMatrix.elements[14]).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):K(`Raycaster: Unsupported camera type: `+t.type)}setFromXRController(e){return tl.identity().extractRotation(e.matrixWorld),this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(tl),this}intersectObject(e,t=!0,n=[]){return il(e,this,n,t),n.sort(rl),n}intersectObjects(e,t=!0,n=[]){for(let r=0,i=e.length;r<i;r++)il(e[r],this,n,t);return n.sort(rl),n}};function rl(e,t){return e.distance-t.distance}function il(e,t,n,r){let i=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(i=!1),i===!0&&r===!0){let r=e.children;for(let e=0,i=r.length;e<i;e++)il(r[e],t,n,!0)}}(class{static{this.prototype.isMatrix2=!0}constructor(e,t,n,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,n,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let n=0;n<4;n++)this.elements[n]=e[n+t];return this}set(e,t,n,r){let i=this.elements;return i[0]=e,i[2]=t,i[1]=n,i[3]=r,this}});function al(e,t,n,r){let i=ol(r);switch(n){case Rn:return e*t;case Un:return e*t/i.components*i.byteLength;case Wn:return e*t/i.components*i.byteLength;case Gn:return e*t*2/i.components*i.byteLength;case Kn:return e*t*2/i.components*i.byteLength;case zn:return e*t*3/i.components*i.byteLength;case Bn:return e*t*4/i.components*i.byteLength;case qn:return e*t*4/i.components*i.byteLength;case Jn:case Yn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Xn:case Zn:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case $n:case tr:return Math.max(e,16)*Math.max(t,8)/4;case Qn:case er:return Math.max(e,8)*Math.max(t,8)/2;case nr:case rr:case ar:case or:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case ir:case sr:case cr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case lr:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ur:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case dr:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case fr:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case pr:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case mr:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case hr:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case gr:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case _r:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case vr:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case yr:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case br:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case xr:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Sr:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Cr:case wr:case Tr:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Er:case Dr:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Or:case kr:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw Error(`Unable to determine texture byte length for ${n} format.`)}function ol(e){switch(e){case Tn:case En:return{byteLength:1,components:1};case On:case Dn:case Mn:return{byteLength:2,components:1};case Nn:case Pn:return{byteLength:2,components:4};case An:case kn:case jn:return{byteLength:4,components:1};case In:case Ln:return{byteLength:4,components:3}}throw Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`register`,{detail:{revision:`187`}})),typeof window<`u`&&(window.__THREE__?G(`WARNING: Multiple instances of Three.js being imported.`):window.__THREE__=`187`);function sl(){let e=null,t=!1,n=null,r=null;function i(t,a){r=e.requestAnimationFrame(i),n(t,a)}return{start:function(){t!==!0&&n!==null&&e!==null&&(r=e.requestAnimationFrame(i),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(r),t=!1},setAnimationLoop:function(e){n=e},setContext:function(t){e=t}}}function cl(e){let t=new WeakMap;function n(t,n){let r=t.array,i=t.usage,a=r.byteLength,o=e.createBuffer();e.bindBuffer(n,o),e.bufferData(n,r,i),t.onUploadCallback();let s;if(r instanceof Float32Array)s=e.FLOAT;else if(typeof Float16Array<`u`&&r instanceof Float16Array)s=e.HALF_FLOAT;else if(r instanceof Uint16Array)s=t.isFloat16BufferAttribute?e.HALF_FLOAT:e.UNSIGNED_SHORT;else if(r instanceof Int16Array)s=e.SHORT;else if(r instanceof Uint32Array)s=e.UNSIGNED_INT;else if(r instanceof Int32Array)s=e.INT;else if(r instanceof Int8Array)s=e.BYTE;else if(r instanceof Uint8Array)s=e.UNSIGNED_BYTE;else if(r instanceof Uint8ClampedArray)s=e.UNSIGNED_BYTE;else throw Error(`THREE.WebGLAttributes: Unsupported buffer data format: `+r);return{buffer:o,type:s,bytesPerElement:r.BYTES_PER_ELEMENT,version:t.version,size:a}}function r(t,n,r){let i=n.array,a=n.updateRanges;if(e.bindBuffer(r,t),a.length===0)e.bufferSubData(r,0,i);else{a.sort((e,t)=>e.start-t.start);let t=0;for(let e=1;e<a.length;e++){let n=a[t],r=a[e];r.start<=n.start+n.count+1?n.count=Math.max(n.count,r.start+r.count-n.start):(++t,a[t]=r)}a.length=t+1;for(let t=0,n=a.length;t<n;t++){let n=a[t];e.bufferSubData(r,n.start*i.BYTES_PER_ELEMENT,i,n.start,n.count)}n.clearUpdateRanges()}n.onUploadCallback()}function i(e){return e.isInterleavedBufferAttribute&&(e=e.data),t.get(e)}function a(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=t.get(n);r&&(e.deleteBuffer(r.buffer),t.delete(n))}function o(e,i){if(e.isInterleavedBufferAttribute&&(e=e.data),e.isGLBufferAttribute){let n=t.get(e);(!n||n.version<e.version)&&t.set(e,{buffer:e.buffer,type:e.type,bytesPerElement:e.elementSize,version:e.version});return}let a=t.get(e);if(a===void 0)t.set(e,n(e,i));else if(a.version<e.version){if(a.size!==e.array.byteLength)throw Error(`THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.`);r(a.buffer,e,i),a.version=e.version}}return{get:i,remove:a,update:o}}var Q={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:`gl_FragColor = linearToOutputTexel( gl_FragColor );`,colorspace_pars_fragment:`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,lightprobes_pars_fragment:`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphinstance_vertex:`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,distance_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distance_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},$={common:{diffuse:{value:new Z(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new X},alphaMap:{value:null},alphaMapTransform:{value:new X},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new X}},envmap:{envMap:{value:null},envMapRotation:{value:new X},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new X}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new X}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new X},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new X},normalScale:{value:new J(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new X},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new X}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new X}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new X}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Z(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new Z(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new X},alphaTest:{value:0},uvTransform:{value:new X}},sprite:{diffuse:{value:new Z(16777215)},opacity:{value:1},center:{value:new J(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new X},alphaMap:{value:null},alphaMapTransform:{value:new X},alphaTest:{value:0}}},ll={basic:{uniforms:Rs([$.common,$.specularmap,$.envmap,$.aomap,$.lightmap,$.fog]),vertexShader:Q.meshbasic_vert,fragmentShader:Q.meshbasic_frag},lambert:{uniforms:Rs([$.common,$.specularmap,$.envmap,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.fog,$.lights,{emissive:{value:new Z(0)},envMapIntensity:{value:1}}]),vertexShader:Q.meshlambert_vert,fragmentShader:Q.meshlambert_frag},phong:{uniforms:Rs([$.common,$.specularmap,$.envmap,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.fog,$.lights,{emissive:{value:new Z(0)},specular:{value:new Z(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Q.meshphong_vert,fragmentShader:Q.meshphong_frag},standard:{uniforms:Rs([$.common,$.envmap,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.roughnessmap,$.metalnessmap,$.fog,$.lights,{emissive:{value:new Z(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Q.meshphysical_vert,fragmentShader:Q.meshphysical_frag},toon:{uniforms:Rs([$.common,$.aomap,$.lightmap,$.emissivemap,$.bumpmap,$.normalmap,$.displacementmap,$.gradientmap,$.fog,$.lights,{emissive:{value:new Z(0)}}]),vertexShader:Q.meshtoon_vert,fragmentShader:Q.meshtoon_frag},matcap:{uniforms:Rs([$.common,$.bumpmap,$.normalmap,$.displacementmap,$.fog,{matcap:{value:null}}]),vertexShader:Q.meshmatcap_vert,fragmentShader:Q.meshmatcap_frag},points:{uniforms:Rs([$.points,$.fog]),vertexShader:Q.points_vert,fragmentShader:Q.points_frag},dashed:{uniforms:Rs([$.common,$.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Q.linedashed_vert,fragmentShader:Q.linedashed_frag},depth:{uniforms:Rs([$.common,$.displacementmap]),vertexShader:Q.depth_vert,fragmentShader:Q.depth_frag},normal:{uniforms:Rs([$.common,$.bumpmap,$.normalmap,$.displacementmap,{opacity:{value:1}}]),vertexShader:Q.meshnormal_vert,fragmentShader:Q.meshnormal_frag},sprite:{uniforms:Rs([$.sprite,$.fog]),vertexShader:Q.sprite_vert,fragmentShader:Q.sprite_frag},background:{uniforms:{uvTransform:{value:new X},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Q.background_vert,fragmentShader:Q.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new X}},vertexShader:Q.backgroundCube_vert,fragmentShader:Q.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Q.cube_vert,fragmentShader:Q.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Q.equirect_vert,fragmentShader:Q.equirect_frag},distance:{uniforms:Rs([$.common,$.displacementmap,{referencePosition:{value:new Y},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Q.distance_vert,fragmentShader:Q.distance_frag},shadow:{uniforms:Rs([$.lights,$.fog,{color:{value:new Z(0)},opacity:{value:1}}]),vertexShader:Q.shadow_vert,fragmentShader:Q.shadow_frag}};ll.physical={uniforms:Rs([ll.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new X},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new X},clearcoatNormalScale:{value:new J(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new X},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new X},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new X},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new X},sheen:{value:0},sheenColor:{value:new Z(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new X},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new X},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new X},transmissionSamplerSize:{value:new J},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new X},attenuationDistance:{value:0},attenuationColor:{value:new Z(0)},specularColor:{value:new Z(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new X},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new X},anisotropyVector:{value:new J},anisotropyMap:{value:null},anisotropyMapTransform:{value:new X}}]),vertexShader:Q.meshphysical_vert,fragmentShader:Q.meshphysical_frag};var ul={r:0,b:0,g:0},dl=new Ii,fl=new X;fl.set(-1,0,0,0,1,0,0,0,1);function pl(e,t,n,r,i,a){let o=new Z(0),s=i===!0?0:1,c,l,u=null,d=0,f=null;function p(e){let n=e.isScene===!0?e.background:null;if(n&&n.isTexture){let r=e.backgroundBlurriness>0;n=t.get(n,r)}return n}function m(t){let r=!1,i=p(t);i===null?g(o,s):i&&i.isColor&&(g(i,1),r=!0);let c=e.xr.getEnvironmentBlendMode();c===`additive`?n.buffers.color.setClear(0,0,0,1,a):c===`alpha-blend`&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||r)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function h(t,n){let i=p(n);i&&i.isCubeTexture?(l===void 0&&(l=new rs(new Ps(1,1,1),new Gs({name:`BackgroundCubeMaterial`,uniforms:Ls(ll.backgroundCube.uniforms),vertexShader:ll.backgroundCube.vertexShader,fragmentShader:ll.backgroundCube.fragmentShader,side:1,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute(`normal`),l.geometry.deleteAttribute(`uv`),l.onBeforeRender=function(e,t,n){this.matrixWorld.copyPosition(n.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),r.update(l)),l.material.uniforms.envMap.value=i,l.material.uniforms.backgroundBlurriness.value=n.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(dl.makeRotationFromEuler(n.backgroundRotation)).transpose(),i.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(fl),l.material.toneMapped=bi.getTransfer(i.colorSpace)!==Vr,(u!==i||d!==i.version||f!==e.toneMapping)&&(l.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),l.layers.enableAll(),t.unshift(l,l.geometry,l.material,0,0,null)):i&&i.isTexture&&(c===void 0&&(c=new rs(new Fs(2,2),new Gs({name:`BackgroundMaterial`,uniforms:Ls(ll.background.uniforms),vertexShader:ll.background.vertexShader,fragmentShader:ll.background.fragmentShader,side:0,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute(`normal`),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),r.update(c)),c.material.uniforms.t2D.value=i,c.material.uniforms.backgroundIntensity.value=n.backgroundIntensity,c.material.toneMapped=bi.getTransfer(i.colorSpace)!==Vr,i.matrixAutoUpdate===!0&&i.updateMatrix(),c.material.uniforms.uvTransform.value.copy(i.matrix),(u!==i||d!==i.version||f!==e.toneMapping)&&(c.material.needsUpdate=!0,u=i,d=i.version,f=e.toneMapping),c.layers.enableAll(),t.unshift(c,c.geometry,c.material,0,0,null))}function g(t,r){t.getRGB(ul,Vs(e)),n.buffers.color.setClear(ul.r,ul.g,ul.b,r,a)}function _(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(e,t=1){o.set(e),s=t,g(o,s)},getClearAlpha:function(){return s},setClearAlpha:function(e){s=e,g(o,s)},render:m,addToRenderList:h,dispose:_}}function ml(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),r={},i=f(null),a=i,o=!1;function s(n,r,i,s,c){let u=!1,f=d(n,s,i,r);a!==f&&(a=f,l(a.object)),u=p(n,s,i,c),u&&m(n,s,i,c),c!==null&&t.update(c,e.ELEMENT_ARRAY_BUFFER),(u||o)&&(o=!1,b(n,r,i,s),c!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(c).buffer))}function c(){return e.createVertexArray()}function l(t){return e.bindVertexArray(t)}function u(t){return e.deleteVertexArray(t)}function d(e,t,n,i){let a=i.wireframe===!0,o=r[t.id];o===void 0&&(o={},r[t.id]=o);let s=e.isInstancedMesh===!0?e.id:0,l=o[s];l===void 0&&(l={},o[s]=l);let u=l[n.id];u===void 0&&(u={},l[n.id]=u);let d=u[a];return d===void 0&&(d=f(c()),u[a]=d),d}function f(e){let t=[],r=[],i=[];for(let e=0;e<n;e++)t[e]=0,r[e]=0,i[e]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:t,enabledAttributes:r,attributeDivisors:i,object:e,attributes:{},index:null}}function p(e,t,n,r){let i=a.attributes,o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=i[t],r=o[t];if(r===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(r=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(r=e.instanceColor)),n===void 0||n.attribute!==r||r&&n.data!==r.data)return!0;s++}return a.attributesNum!==s||a.index!==r}function m(e,t,n,r){let i={},o=t.attributes,s=0,c=n.getAttributes();for(let t in c)if(c[t].location>=0){let n=o[t];n===void 0&&(t===`instanceMatrix`&&e.instanceMatrix&&(n=e.instanceMatrix),t===`instanceColor`&&e.instanceColor&&(n=e.instanceColor));let r={};r.attribute=n,n&&n.data&&(r.data=n.data),i[t]=r,s++}a.attributes=i,a.attributesNum=s,a.index=r}function h(){let e=a.newAttributes;for(let t=0,n=e.length;t<n;t++)e[t]=0}function g(e){_(e,0)}function _(t,n){let r=a.newAttributes,i=a.enabledAttributes,o=a.attributeDivisors;r[t]=1,i[t]===0&&(e.enableVertexAttribArray(t),i[t]=1),o[t]!==n&&(e.vertexAttribDivisor(t,n),o[t]=n)}function v(){let t=a.newAttributes,n=a.enabledAttributes;for(let r=0,i=n.length;r<i;r++)n[r]!==t[r]&&(e.disableVertexAttribArray(r),n[r]=0)}function y(t,n,r,i,a,o,s){s===!0?e.vertexAttribIPointer(t,n,r,a,o):e.vertexAttribPointer(t,n,r,i,a,o)}function b(n,r,i,a){h();let o=a.attributes,s=i.getAttributes(),c=r.defaultAttributeValues;for(let r in s){let i=s[r];if(i.location>=0){let s=o[r];if(s===void 0&&(r===`instanceMatrix`&&n.instanceMatrix&&(s=n.instanceMatrix),r===`instanceColor`&&n.instanceColor&&(s=n.instanceColor)),s!==void 0){let r=s.normalized,o=s.itemSize,c=t.get(s);if(c===void 0)continue;let l=c.buffer,u=c.type,d=c.bytesPerElement,f=u===e.INT||u===e.UNSIGNED_INT||s.gpuType===1013;if(s.isInterleavedBufferAttribute){let t=s.data,c=t.isInterleavedBuffer===!0?t.stride:t.itemSize,p=s.offset;if(t.isInstancedInterleavedBuffer||t.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,t.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=t.meshPerAttribute*t.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,c*d,(p+o/i.locationSize*e)*d,f)}else{if(s.isInstancedBufferAttribute){for(let e=0;e<i.locationSize;e++)_(i.location+e,s.meshPerAttribute);n.isInstancedMesh!==!0&&a._maxInstanceCount===void 0&&(a._maxInstanceCount=s.meshPerAttribute*s.count)}else for(let e=0;e<i.locationSize;e++)g(i.location+e);e.bindBuffer(e.ARRAY_BUFFER,l);for(let e=0;e<i.locationSize;e++)y(i.location+e,o/i.locationSize,u,r,o*d,o/i.locationSize*e*d,f)}}else if(c!==void 0){let t=c[r];if(t!==void 0)switch(t.length){case 2:e.vertexAttrib2fv(i.location,t);break;case 3:e.vertexAttrib3fv(i.location,t);break;case 4:e.vertexAttrib4fv(i.location,t);break;default:e.vertexAttrib1fv(i.location,t)}}}}v()}function x(){T();for(let e in r){let t=r[e];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e]}}function S(e){if(r[e.id]===void 0)return;let t=r[e.id];for(let e in t){let n=t[e];for(let e in n){let t=n[e];for(let e in t)u(t[e].object),delete t[e];delete n[e]}}delete r[e.id]}function C(e){for(let t in r){let n=r[t];for(let t in n){let r=n[t];if(r[e.id]===void 0)continue;let i=r[e.id];for(let e in i)u(i[e].object),delete i[e];delete r[e.id]}}}function w(e){for(let t in r){let n=r[t],i=e.isInstancedMesh===!0?e.id:0,a=n[i];if(a!==void 0){for(let e in a){let t=a[e];for(let e in t)u(t[e].object),delete t[e];delete a[e]}delete n[i],Object.keys(n).length===0&&delete r[t]}}}function T(){E(),o=!0,a!==i&&(a=i,l(a.object))}function E(){i.geometry=null,i.program=null,i.wireframe=!1}return{setup:s,reset:T,resetDefaultState:E,dispose:x,releaseStatesOfGeometry:S,releaseStatesOfObject:w,releaseStatesOfProgram:C,initAttributes:h,enableAttribute:g,disableUnusedAttributes:v}}function hl(e,t,n){let r;function i(e){r=e}function a(t,i){e.drawArrays(r,t,i),n.update(i,r,1)}function o(t,i,a){a!==0&&(e.drawArraysInstanced(r,t,i,a),n.update(i,r,a))}function s(e,i,a){if(a===0)return;t.get(`WEBGL_multi_draw`).multiDrawArraysWEBGL(r,e,0,i,0,a);let o=0;for(let e=0;e<a;e++)o+=i[e];n.update(o,r,1)}this.setMode=i,this.render=a,this.renderInstances=o,this.renderMultiDraw=s}function gl(e,t,n,r){let i;function a(){if(i!==void 0)return i;if(t.has(`EXT_texture_filter_anisotropic`)===!0){let n=t.get(`EXT_texture_filter_anisotropic`);i=e.getParameter(n.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i}function o(t){return t===1023||r.convert(t)===e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT)}function s(n){let i=n===1016&&(t.has(`EXT_color_buffer_half_float`)||t.has(`EXT_color_buffer_float`));return!(n!==1009&&n!==1015&&!i&&r.convert(n)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function c(t){if(t===`highp`){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return`highp`;t=`mediump`}return t===`mediump`&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?`mediump`:`lowp`}let l=n.precision===void 0?`highp`:n.precision,u=c(l);u!==l&&(G(`WebGLRenderer:`,l,`not supported, using`,u,`instead.`),l=u);let d=n.reversedDepthBuffer===!0&&t.has(`EXT_clip_control`),f=n.logarithmicDepthBuffer===!0&&d===!1;n.reversedDepthBuffer===!0&&d===!1&&G(`WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.`),n.logarithmicDepthBuffer===!0&&d===!0&&G(`WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.`);let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),h=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),_=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),y=e.getParameter(e.MAX_VARYING_VECTORS),b=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),x=e.getParameter(e.MAX_SAMPLES),S=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:s,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:d,maxTextures:p,maxVertexTextures:m,maxTextureSize:h,maxCubemapSize:g,maxAttributes:_,maxVertexUniforms:v,maxVaryings:y,maxFragmentUniforms:b,maxSamples:x,samples:S}}function _l(e){let t=this,n=null,r=0,i=!1,a=!1,o=new xo,s=new X,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(e,t){let n=e.length!==0||t||r!==0||i;return i=t,r=e.length,n},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(e,t){n=u(e,t,0)},this.setState=function(t,o,s){let d=t.clippingPlanes,f=t.clipIntersection,p=t.clipShadows,m=e.get(t);if(!i||d===null||d.length===0||a&&!p)a?u(null):l();else{let e=a?0:r,t=e*4,i=m.clippingState||null;c.value=i,i=u(d,o,t,s);for(let e=0;e!==t;++e)i[e]=n[e];m.clippingState=i,this.numIntersection=f?this.numPlanes:0,this.numPlanes+=e}};function l(){c.value!==n&&(c.value=n,c.needsUpdate=r>0),t.numPlanes=r,t.numIntersection=0}function u(e,n,r,i){let a=e===null?0:e.length,l=null;if(a!==0){if(l=c.value,i!==!0||l===null){let t=r+a*4,i=n.matrixWorldInverse;s.getNormalMatrix(i),(l===null||l.length<t)&&(l=new Float32Array(t));for(let t=0,n=r;t!==a;++t,n+=4)o.copy(e[t]).applyMatrix4(i,s),o.normal.toArray(l,n),l[n+3]=o.constant}c.value=l,c.needsUpdate=!0}return t.numPlanes=a,t.numIntersection=0,l}}var vl=class extends Ni{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new ks(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Ps(5,5,5),i=new Gs({name:`CubemapFromEquirect`,uniforms:Ls(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:1,blending:0});i.uniforms.tEquirect.value=t;let a=new rs(r,i),o=t.minFilter;return t.minFilter===1008&&(t.minFilter=Sn),new zc(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){let i=e.getRenderTarget();for(let i=0;i<6;i++)e.setRenderTarget(this,i),e.clear(t,n,r);e.setRenderTarget(i)}},yl=256,bl=3,xl=20,Sl=256,Cl=16,wl=3,Tl=new Y,El=new Z,Dl=class e{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new zc(1,10,null),this._boxMesh=new rs(new Ps(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,i={}){let{size:a=256,position:o=Tl}=i,s=this._renderer;this._setSize(a);let c=this._allocateTarget(),l=this._getSourceTarget(!0);t>0&&(l.texture.mipmapsAutoUpdate=!1);let u=s.autoClear,d=s.autoClearColor,f=s.autoClearDepth,p=s.autoClearStencil,m=e.background;s.autoClear=!0,s.autoClearColor=!0,s.autoClearDepth=!0,s.autoClearStencil=!0,m===null&&(e.background=s.getClearColor(El));let h=new zc(n,r,l);return h.position.copy(o),h.update(s,e),s.autoClear=u,s.autoClearColor=d,s.autoClearDepth=f,s.autoClearStencil=p,e.background=m,t>0&&(l.texture.mipmapsAutoUpdate=!0,this._blur(c,t)),this._applyPMREM(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Pl(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Nl(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(yl,li(e))}_fromTexture(e,t){e.mapping===301||e.mapping===302?this._setSize(e.image.length===0?yl:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);let n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){let e=this._cubeSize,t=Ol(e,!1,!1),n=Math.log2(e)-bl;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name=`PMREM`,t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){let t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Ol(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){let r=this._boxMesh,i=this._cubeCamera;r.material=n,i.renderTarget=e,i.activeMipmapLevel=t;let a=e.width>>t;e.viewport.set(0,0,a,a),i.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===301||e.mapping===302?(this._cubemapMaterial===null&&(this._cubemapMaterial=Pl()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Nl()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(t){this._ggxMaterial===null&&(this._ggxMaterial=Al(),this._integrationMaterial=jl());let n=this._cubeSize,r=t.texture.mipmaps.length-1,i=this._ggxMaterial.uniforms;i.envMap.value=this._sourceTarget.texture;let a=this._integrationMaterial.uniforms;a.envMap.value=this._sourceTarget.texture,a.sourceLod.value=Math.log2(n/Cl);for(let o=0;o<=r;o++){let s=e.lodToRoughness(o,r);if(o>r-wl)a.roughness.value=s,this._renderCube(t,o,this._integrationMaterial);else{let e=s>0?Math.log2(n)+.5*Math.log2(6/(Sl*s**4))+.5:0;i.roughness.value=s,i.lodBias.value=e,this._renderCube(t,o,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Ml());let n=this._blurMaterial,r=n.uniforms,i=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=i.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(i,0,n)}};function Ol(e,t,n){return new vl(e,{minFilter:wn,generateMipmaps:t,type:Mn,colorSpace:zr,depthBuffer:n})}function kl(e,t,n){return new Gs({name:e,uniforms:t,vertexShader:Q.cube_vert,fragmentShader:n,side:1,blending:0,depthTest:!1,depthWrite:!1})}function Al(){return kl(`PMREMGGXConvolution`,{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Sl}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function jl(){return kl(`PMREMGGXIntegration`,{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:Cl}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Ml(){return kl(`PMREMSphericalGaussianBlur`,{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${xl}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Nl(){return kl(`PMREMEquirectangularToCubemap`,{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Pl(){return kl(`PMREMCubemapToCubemap`,{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function Fl(e){let t=new WeakMap,n=new WeakMap,r=null;function i(e,t=!1){return e==null?null:t?o(e):a(e)}function a(n){if(n&&n.isTexture){let r=n.mapping;if(r===303||r===304){if(t.has(n)){let e=t.get(n).texture;return s(e,n.mapping)}{let r=n.image;if(r&&r.height>0){let i=new vl(r.height);return i.fromEquirectangularTexture(e,n),t.set(n,i),n.addEventListener(`dispose`,l),s(i.texture,n.mapping)}return null}}}return n}function o(t){if(t&&t.isTexture&&t.isPMREMTexture!==!0){let i=t.mapping,a=i===303||i===304,o=i===301||i===302;if(a||o){let i=n.get(t),s=i===void 0?0:i.texture.pmremVersion;if(t.isRenderTargetTexture&&t.pmremVersion!==s)return r===null&&(r=new Dl(e)),i=a?r.fromEquirectangular(t,i):r.fromCubemap(t,i),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),i.texture;if(i!==void 0)return i.texture;{let s=t.image;return a&&s&&s.height>0||o&&s&&c(s)?(r===null&&(r=new Dl(e)),i=a?r.fromEquirectangular(t):r.fromCubemap(t),i.texture.pmremVersion=t.pmremVersion,n.set(t,i),t.addEventListener(`dispose`,u),i.texture):null}}}return t}function s(e,t){return t===303?e.mapping=301:t===304&&(e.mapping=302),e}function c(e){let t=0;for(let n=0;n<6;n++)e[n]!==void 0&&t++;return t===6}function l(e){let n=e.target;n.removeEventListener(`dispose`,l);let r=t.get(n);r!==void 0&&(t.delete(n),r.dispose())}function u(e){let t=e.target;t.removeEventListener(`dispose`,u);let r=n.get(t);r!==void 0&&(n.delete(t),r.dispose())}function d(){t=new WeakMap,n=new WeakMap,r!==null&&(r.dispose(),r=null)}return{get:i,dispose:d}}function Il(e){let t={};function n(n){if(t[n]!==void 0)return t[n];let r=e.getExtension(n);return t[n]=r,r}return{has:function(e){return n(e)!==null},init:function(){n(`EXT_color_buffer_float`),n(`WEBGL_clip_cull_distance`),n(`OES_texture_float_linear`),n(`EXT_color_buffer_half_float`),n(`WEBGL_multisampled_render_to_texture`),n(`WEBGL_render_shared_exponent`)},get:function(e){let t=n(e);return t===null&&$r(`WebGLRenderer: `+e+` extension not supported.`),t}}}function Ll(e,t,n,r){let i={},a=new WeakMap,o=new FinalizationRegistry(e=>delete i[e]);function s(e){c(e.target)}function c(e){e.index!==null&&t.remove(e.index);for(let n in e.attributes)t.remove(e.attributes[n]);e.removeEventListener(`dispose`,s),delete i[e.id],o.unregister(e);let c=a.get(e);c&&(t.remove(c),a.delete(e)),r.releaseStatesOfGeometry(e),e.isInstancedBufferGeometry===!0&&delete e._maxInstanceCount,n.memory.geometries--}function l(e,t){return i[t.id]===void 0&&(t.addEventListener(`dispose`,s),i[t.id]=new WeakRef(t),o.register(t,t.id,t),n.memory.geometries++),t}function u(n){let r=n.attributes;for(let n in r)t.update(r[n],e.ARRAY_BUFFER)}function d(e){let n=e.index,r=e.attributes.position,i=0;if(r===void 0)return;let o=n===null?r.array.length/3-1:n.array.length,s=new(r.count>=65535?$a:Qa)(Math.ceil(o/3)*6,1),c=s.array;if(n!==null){let e=n.array;i=n.version;for(let t=0,n=0;t<o;t+=3){let r=e[t+0],i=e[t+1],a=e[t+2];c[n++]=r,c[n++]=i,c[n++]=i,c[n++]=a,c[n++]=a,c[n++]=r}}else{i=r.version;for(let e=0,t=0;e<o;e+=3){let n=e+0,r=e+1,i=e+2;c[t++]=n,c[t++]=r,c[t++]=r,c[t++]=i,c[t++]=i,c[t++]=n}}s.version=i;let l=a.get(e);l&&t.remove(l),a.set(e,s)}function f(e){let t=a.get(e);if(t){let n=e.index;n!==null&&t.version<n.version&&d(e)}else d(e);return a.get(e)}function p(){for(let e in i){let t=i[e].deref();t!==void 0&&c(t)}}return{get:l,update:u,getWireframeAttribute:f,dispose:p}}function Rl(e,t,n){let r;function i(e){r=e}let a,o;function s(e){a=e.type,o=e.bytesPerElement}function c(t,i){e.drawElements(r,i,a,t*o),n.update(i,r,1)}function l(t,i,s){s!==0&&(e.drawElementsInstanced(r,i,a,t*o,s),n.update(i,r,s))}function u(e,i,o){if(o===0)return;t.get(`WEBGL_multi_draw`).multiDrawElementsWEBGL(r,i,0,a,e,0,o);let s=0;for(let e=0;e<o;e++)s+=i[e];n.update(s,r,1)}this.setMode=i,this.setIndex=s,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function zl(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function r(t,r,i){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=t/3*i;break;case e.LINES:n.lines+=t/2*i;break;case e.LINE_STRIP:n.lines+=i*(t-1);break;case e.LINE_LOOP:n.lines+=i*t;break;case e.POINTS:n.points+=i*t;break;default:K(`WebGLInfo: Unknown draw mode:`,r)}}function i(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:i,update:r}}function Bl(e,t,n){let r=new WeakMap,i=new ji;function a(a,o,s){let c=a.morphTargetInfluences,l=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,u=l===void 0?0:l.length,d=r.get(o);if(d===void 0||d.count!==u){d!==void 0&&d.texture.dispose();let e=o.morphAttributes.position!==void 0,n=o.morphAttributes.normal!==void 0,a=o.morphAttributes.color!==void 0,s=o.morphAttributes.position||[],c=o.morphAttributes.normal||[],l=o.morphAttributes.color||[],f=0;e===!0&&(f=1),n===!0&&(f=2),a===!0&&(f=3);let p=o.attributes.position.count*f,m=1;p>t.maxTextureSize&&(m=Math.ceil(p/t.maxTextureSize),p=t.maxTextureSize);let h=new Float32Array(p*m*4*u),g=new Pi(h,p,m,u);g.type=jn,g.needsUpdate=!0;let _=f*4;for(let t=0;t<u;t++){let r=s[t],o=c[t],u=l[t],d=p*m*4*t;for(let t=0;t<r.count;t++){let s=t*_;e===!0&&(i.fromBufferAttribute(r,t),h[d+s+0]=i.x,h[d+s+1]=i.y,h[d+s+2]=i.z,h[d+s+3]=0),n===!0&&(i.fromBufferAttribute(o,t),h[d+s+4]=i.x,h[d+s+5]=i.y,h[d+s+6]=i.z,h[d+s+7]=0),a===!0&&(i.fromBufferAttribute(u,t),h[d+s+8]=i.x,h[d+s+9]=i.y,h[d+s+10]=i.z,h[d+s+11]=u.itemSize===4?i.w:1)}}d={count:u,texture:g,size:new J(p,m)},r.set(o,d);function v(){g.dispose(),r.delete(o),o.removeEventListener(`dispose`,v)}o.addEventListener(`dispose`,v)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)s.getUniforms().setValue(e,`morphTexture`,a.morphTexture,n);else{let t=0;for(let e=0;e<c.length;e++)t+=c[e];let n=o.morphTargetsRelative?1:1-t;s.getUniforms().setValue(e,`morphTargetBaseInfluence`,n),s.getUniforms().setValue(e,`morphTargetInfluences`,c)}s.getUniforms().setValue(e,`morphTargetsTexture`,d.texture,n),s.getUniforms().setValue(e,`morphTargetsTextureSize`,d.size)}return{update:a}}function Vl(e,t,n,r,i){let a=new WeakMap;function o(r){let o=i.render.frame,s=r.geometry,l=t.get(r,s);if(a.get(l)!==o&&(t.update(l),a.set(l,o)),r.isInstancedMesh&&(r.hasEventListener(`dispose`,c)===!1&&r.addEventListener(`dispose`,c),a.get(r)!==o&&(n.update(r.instanceMatrix,e.ARRAY_BUFFER),r.instanceColor!==null&&n.update(r.instanceColor,e.ARRAY_BUFFER),a.set(r,o))),r.isSkinnedMesh){let e=r.skeleton;a.get(e)!==o&&(e.update(),a.set(e,o))}return l}function s(){a=new WeakMap}function c(e){let t=e.target;t.removeEventListener(`dispose`,c),r.releaseStatesOfObject(t),n.remove(t.instanceMatrix),t.instanceColor!==null&&n.remove(t.instanceColor)}return{update:o,dispose:s}}var Hl={1:`LINEAR_TONE_MAPPING`,2:`REINHARD_TONE_MAPPING`,3:`CINEON_TONE_MAPPING`,4:`ACES_FILMIC_TONE_MAPPING`,6:`AGX_TONE_MAPPING`,7:`NEUTRAL_TONE_MAPPING`,5:`CUSTOM_TONE_MAPPING`};function Ul(e,t,n,r,i,a){let o=new Ni(t,n,{type:e,depthBuffer:i,stencilBuffer:a,samples:r?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),s=null,c=null,l=null,u=new po;u.setAttribute(`position`,new eo([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute(`uv`,new eo([0,2,0,0,2,0],2));let d=new Ks({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new rs(u,d),p=new Pc(-1,1,1,-1,0,1),m=null,h=null,g=!1,_,v=null,y=[],b=!1;this.setSize=function(e,t){o.setSize(e,t),s!==null&&s.setSize(e,t),c!==null&&c.setSize(e,t);for(let n=0;n<y.length;n++){let r=y[n];r.setSize&&r.setSize(e,t)}},this.setEffects=function(e){y=e,b=y.length>0&&y[0].isRenderPass===!0;let t=o.width,n=o.height;y.length>0&&s===null&&(s=new Ni(t,n,{type:Mn,depthBuffer:!1,stencilBuffer:!1}),c=new Ni(t,n,{type:Mn,depthBuffer:!1,stencilBuffer:!1}));let r=i===!0&&y.some(e=>e.needsDepthTexture===!0);r!==(o.depthTexture!==null)&&(r===!0&&l===null&&(l=new js(t,n),a===!0&&(l.format=Hn,l.type=Fn)),o.dispose(),o.depthTexture=r?l:null,o.resolveDepthBuffer=r,o.storeMultisampledDepthBuffer=r);for(let e=0;e<y.length;e++){let i=y[e];i.setSize&&i.setSize(t,n),r&&i.needsDepthTexture===!0&&i.setDepthTexture&&i.setDepthTexture(l)}},this.begin=function(e,t){if(g||e.toneMapping===0&&y.length===0)return!1;if(v=t,t!==null){let e=t.width,n=t.height;(o.width!==e||o.height!==n)&&this.setSize(e,n)}return b===!1&&e.setRenderTarget(o),_=e.toneMapping,e.toneMapping=0,!0},this.hasRenderPass=function(){return b},this.end=function(e,t){e.toneMapping=_,g=!0;let n=o,r=s;for(let i=0;i<y.length;i++){let a=y[i];a.enabled!==!1&&(a.render(e,r,n,t),a.needsSwap!==!1&&(n=r,r=r===s?c:s))}if(m!==e.outputColorSpace||h!==e.toneMapping){m=e.outputColorSpace,h=e.toneMapping,d.defines={},bi.getTransfer(m)===`srgb`&&(d.defines.SRGB_TRANSFER=``);let t=Hl[h];t&&(d.defines[t]=``),d.needsUpdate=!0}d.uniforms.tDiffuse.value=n.texture,e.setRenderTarget(v),e.render(f,p),v=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){o.dispose(),s!==null&&s.dispose(),c!==null&&c.dispose(),u.dispose(),d.dispose()}}var Wl=new Ai,Gl=new js(1,1),Kl=new Ms(1),ql=new Pi,Jl=new Fi,Yl=new ks,Xl=[],Zl=[],Ql=new Float32Array(16),$l=new Float32Array(9),eu=new Float32Array(4);function tu(e,t,n){let r=e[0];if(r<=0||r>0)return e;let i=t*n,a=Xl[i];if(a===void 0&&(a=new Float32Array(i),Xl[i]=a),t!==0){r.toArray(a,0);for(let r=1,i=0;r!==t;++r)i+=n,e[r].toArray(a,i)}return a}function nu(e,t){if(e.length!==t.length)return!1;for(let n=0,r=e.length;n<r;n++)if(e[n]!==t[n])return!1;return!0}function ru(e,t){for(let n=0,r=t.length;n<r;n++)e[n]=t[n]}function iu(e,t){let n=Zl[t];n===void 0&&(n=new Int32Array(t),Zl[t]=n);for(let r=0;r!==t;++r)n[r]=e.allocateTextureUnit();return n}function au(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function ou(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(nu(n,t))return;e.uniform2fv(this.addr,t),ru(n,t)}}function su(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(nu(n,t))return;e.uniform3fv(this.addr,t),ru(n,t)}}function cu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(nu(n,t))return;e.uniform4fv(this.addr,t),ru(n,t)}}function lu(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(nu(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),ru(n,t)}else{if(nu(n,r))return;eu.set(r),e.uniformMatrix2fv(this.addr,!1,eu),ru(n,r)}}function uu(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(nu(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),ru(n,t)}else{if(nu(n,r))return;$l.set(r),e.uniformMatrix3fv(this.addr,!1,$l),ru(n,r)}}function du(e,t){let n=this.cache,r=t.elements;if(r===void 0){if(nu(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),ru(n,t)}else{if(nu(n,r))return;Ql.set(r),e.uniformMatrix4fv(this.addr,!1,Ql),ru(n,r)}}function fu(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function pu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(nu(n,t))return;e.uniform2iv(this.addr,t),ru(n,t)}}function mu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(nu(n,t))return;e.uniform3iv(this.addr,t),ru(n,t)}}function hu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(nu(n,t))return;e.uniform4iv(this.addr,t),ru(n,t)}}function gu(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function _u(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(nu(n,t))return;e.uniform2uiv(this.addr,t),ru(n,t)}}function vu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(nu(n,t))return;e.uniform3uiv(this.addr,t),ru(n,t)}}function yu(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(nu(n,t))return;e.uniform4uiv(this.addr,t),ru(n,t)}}function bu(e){return e.version===0&&(e.compareFunction=519,e.needsUpdate=!0),e}function xu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_2D_SHADOW?bu(Gl):Wl,n.setTexture2D(t||a,i)}function Su(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture3D(t||Jl,i)}function Cu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i);let a;a=this.type===e.SAMPLER_CUBE_SHADOW?bu(Kl):Yl,n.setTextureCube(t||a,i)}function wu(e,t,n){let r=this.cache,i=n.allocateTextureUnit();r[0]!==i&&(e.uniform1i(this.addr,i),r[0]=i),n.setTexture2DArray(t||ql,i)}function Tu(e){switch(e){case 5126:return au;case 35664:return ou;case 35665:return su;case 35666:return cu;case 35674:return lu;case 35675:return uu;case 35676:return du;case 5124:case 35670:return fu;case 35667:case 35671:return pu;case 35668:case 35672:return mu;case 35669:case 35673:return hu;case 5125:return gu;case 36294:return _u;case 36295:return vu;case 36296:return yu;case 35678:case 36198:case 36298:case 36306:case 35682:return xu;case 35679:case 36299:case 36307:return Su;case 35680:case 36300:case 36308:case 36293:return Cu;case 36289:case 36303:case 36311:case 36292:return wu}}function Eu(e,t){e.uniform1fv(this.addr,t)}function Du(e,t){let n=tu(t,this.size,2);e.uniform2fv(this.addr,n)}function Ou(e,t){let n=tu(t,this.size,3);e.uniform3fv(this.addr,n)}function ku(e,t){let n=tu(t,this.size,4);e.uniform4fv(this.addr,n)}function Au(e,t){let n=tu(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function ju(e,t){let n=tu(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function Mu(e,t){let n=tu(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function Nu(e,t){e.uniform1iv(this.addr,t)}function Pu(e,t){e.uniform2iv(this.addr,t)}function Fu(e,t){e.uniform3iv(this.addr,t)}function Iu(e,t){e.uniform4iv(this.addr,t)}function Lu(e,t){e.uniform1uiv(this.addr,t)}function Ru(e,t){e.uniform2uiv(this.addr,t)}function zu(e,t){e.uniform3uiv(this.addr,t)}function Bu(e,t){e.uniform4uiv(this.addr,t)}function Vu(e,t,n){let r=this.cache,i=t.length,a=iu(n,i);nu(r,a)||(e.uniform1iv(this.addr,a),ru(r,a));let o;o=this.type===e.SAMPLER_2D_SHADOW?bu(Gl):Wl;for(let e=0;e!==i;++e)n.setTexture2D(t[e]||o,a[e])}function Hu(e,t,n){let r=this.cache,i=t.length,a=iu(n,i);nu(r,a)||(e.uniform1iv(this.addr,a),ru(r,a));for(let e=0;e!==i;++e)n.setTexture3D(t[e]||Jl,a[e])}function Uu(e,t,n){let r=this.cache,i=t.length,a=iu(n,i);nu(r,a)||(e.uniform1iv(this.addr,a),ru(r,a));let o;o=this.type===e.SAMPLER_CUBE_SHADOW?bu(Kl):Yl;for(let e=0;e!==i;++e)n.setTextureCube(t[e]||o,a[e])}function Wu(e,t,n){let r=this.cache,i=t.length,a=iu(n,i);nu(r,a)||(e.uniform1iv(this.addr,a),ru(r,a));for(let e=0;e!==i;++e)n.setTexture2DArray(t[e]||ql,a[e])}function Gu(e){switch(e){case 5126:return Eu;case 35664:return Du;case 35665:return Ou;case 35666:return ku;case 35674:return Au;case 35675:return ju;case 35676:return Mu;case 5124:case 35670:return Nu;case 35667:case 35671:return Pu;case 35668:case 35672:return Fu;case 35669:case 35673:return Iu;case 5125:return Lu;case 36294:return Ru;case 36295:return zu;case 36296:return Bu;case 35678:case 36198:case 36298:case 36306:case 35682:return Vu;case 35679:case 36299:case 36307:return Hu;case 35680:case 36300:case 36308:case 36293:return Uu;case 36289:case 36303:case 36311:case 36292:return Wu}}var Ku=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=Tu(t.type)}},qu=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Gu(t.type)}},Ju=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let r=this.seq;for(let i=0,a=r.length;i!==a;++i){let a=r[i];a.setValue(e,t[a.id],n)}}},Yu=/(\w+)(\])?(\[|\.)?/g;function Xu(e,t){e.seq.push(t),e.map[t.id]=t}function Zu(e,t,n){let r=e.name,i=r.length;for(Yu.lastIndex=0;;){let a=Yu.exec(r),o=Yu.lastIndex,s=a[1],c=a[2]===`]`,l=a[3];if(c&&(s|=0),l===void 0||l===`[`&&o+2===i){Xu(n,l===void 0?new Ku(s,e,t):new qu(s,e,t));break}{let e=n.map[s];e===void 0&&(e=new Ju(s),Xu(n,e)),n=e}}}var Qu=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let r=0;r<n;++r){let n=e.getActiveUniform(t,r);Zu(n,e.getUniformLocation(t,n.name),this)}let r=[],i=[];for(let t of this.seq)t.type===e.SAMPLER_2D_SHADOW||t.type===e.SAMPLER_CUBE_SHADOW||t.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(t):i.push(t);r.length>0&&(this.seq=r.concat(i))}setValue(e,t,n,r){let i=this.map[t];i!==void 0&&i.setValue(e,n,r)}setOptional(e,t,n){let r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let i=0,a=t.length;i!==a;++i){let a=t[i],o=n[a.id];o.needsUpdate!==!1&&a.setValue(e,o.value,r)}}static seqWithValue(e,t){let n=[];for(let r=0,i=e.length;r!==i;++r){let i=e[r];i.id in t&&n.push(i)}return n}};function $u(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}var ed=37297,td=0;function nd(e,t){let n=e.split(`
`),r=[],i=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let e=i;e<a;e++){let i=e+1;r.push(`${i===t?`>`:` `} ${i}: ${n[e]}`)}return r.join(`
`)}var rd=new X;function id(e){bi._getMatrix(rd,bi.workingColorSpace,e);let t=`mat3( ${rd.elements.map(e=>e.toFixed(4))} )`;switch(bi.getTransfer(e)){case Br:return[t,`LinearTransferOETF`];case Vr:return[t,`sRGBTransferOETF`];default:return G(`WebGLProgram: Unsupported color space: `,e),[t,`LinearTransferOETF`]}}function ad(e,t,n){let r=e.getShaderParameter(t,e.COMPILE_STATUS),i=(e.getShaderInfoLog(t)||``).trim();if(r&&i===``)return``;let a=/ERROR: 0:(\d+)/.exec(i);if(a){let r=parseInt(a[1]);return n.toUpperCase()+`

`+i+`

`+nd(e.getShaderSource(t),r)}return i}function od(e,t){let n=id(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( ${n[0]} * value.rgb, value.a ) );`,`}`].join(`
`)}var sd={1:`Linear`,2:`Reinhard`,3:`Cineon`,4:`ACESFilmic`,6:`AgX`,7:`Neutral`,5:`Custom`};function cd(e,t){let n=sd[t];return n===void 0?(G(`WebGLProgram: Unsupported toneMapping:`,t),`vec3 `+e+`( vec3 color ) { return LinearToneMapping( color ); }`):`vec3 `+e+`( vec3 color ) { return `+n+`ToneMapping( color ); }`}var ld=new Y;function ud(){return bi.getLuminanceCoefficients(ld),[`float luminance( const in vec3 rgb ) {`,`	const vec3 weights = vec3( ${ld.x.toFixed(4)}, ${ld.y.toFixed(4)}, ${ld.z.toFixed(4)} );`,`	return dot( weights, rgb );`,`}`].join(`
`)}function dd(e){return[e.extensionClipCullDistance?`#extension GL_ANGLE_clip_cull_distance : require`:``,e.extensionMultiDraw?`#extension GL_ANGLE_multi_draw : require`:``].filter(md).join(`
`)}function fd(e){let t=[];for(let n in e){let r=e[n];r!==!1&&t.push(`#define `+n+` `+r)}return t.join(`
`)}function pd(e,t){let n={},r=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let i=0;i<r;i++){let r=e.getActiveAttrib(t,i),a=r.name,o=1;r.type===e.FLOAT_MAT2&&(o=2),r.type===e.FLOAT_MAT3&&(o=3),r.type===e.FLOAT_MAT4&&(o=4),n[a]={type:r.type,location:e.getAttribLocation(t,a),locationSize:o}}return n}function md(e){return e!==``}function hd(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,t.numLightProbeGrids)}function gd(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var _d=/^[ \t]*#include +<([\w\d./]+)>/gm;function vd(e){return e.replace(_d,yd)}function yd(e,t){let n=Q[t];if(n===void 0)throw Error(`THREE.WebGLProgram: Can not resolve #include <`+t+`>`);return vd(n)}var bd=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function xd(e){return e.replace(bd,Sd)}function Sd(e,t,n,r){let i=``;for(let e=parseInt(t);e<parseInt(n);e++)i+=r.replace(/\[\s*i\s*\]/g,`[ `+e+` ]`).replace(/UNROLLED_LOOP_INDEX/g,e);return i}function Cd(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision===`highp`?t+=`
#define HIGH_PRECISION`:e.precision===`mediump`?t+=`
#define MEDIUM_PRECISION`:e.precision===`lowp`&&(t+=`
#define LOW_PRECISION`),t}var wd={1:`SHADOWMAP_TYPE_PCF`,3:`SHADOWMAP_TYPE_VSM`};function Td(e){return wd[e.shadowMapType]||`SHADOWMAP_TYPE_BASIC`}var Ed={302:`ENVMAP_MODE_REFRACTION`};function Dd(e){return e.envMap===!1?`ENVMAP_MODE_REFLECTION`:Ed[e.envMapMode]||`ENVMAP_MODE_REFLECTION`}var Od={0:`ENVMAP_BLENDING_MULTIPLY`,1:`ENVMAP_BLENDING_MIX`,2:`ENVMAP_BLENDING_ADD`};function kd(e){return e.envMap===!1?`ENVMAP_BLENDING_NONE`:Od[e.combine]||`ENVMAP_BLENDING_NONE`}function Ad(e,t,n,r){let i=e.getContext(),a=n.defines,o=n.vertexShader,s=n.fragmentShader,c=Td(n),l=n.envMapPMREM===!0?`ENVMAP_TYPE_PMREM`:`ENVMAP_TYPE_CUBE`,u=Dd(n),d=kd(n),f=dd(n),p=fd(a),m=i.createProgram(),h,g,_=n.glslVersion?`#version `+n.glslVersion+`
`:``;n.isRawShaderMaterial?(h=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(md).join(`
`),h.length>0&&(h+=`
`),g=[`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p].filter(md).join(`
`),g.length>0&&(g+=`
`)):(h=[Cd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.extensionClipCullDistance?`#define USE_CLIP_DISTANCE`:``,n.batching?`#define USE_BATCHING`:``,n.batchingColor?`#define USE_BATCHING_COLOR`:``,n.instancing?`#define USE_INSTANCING`:``,n.instancingColor?`#define USE_INSTANCING_COLOR`:``,n.instancingMorph?`#define USE_INSTANCING_MORPH`:``,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.map?`#define USE_MAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+u:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.displacementMap?`#define USE_DISPLACEMENTMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.mapUv?`#define MAP_UV `+n.mapUv:``,n.alphaMapUv?`#define ALPHAMAP_UV `+n.alphaMapUv:``,n.lightMapUv?`#define LIGHTMAP_UV `+n.lightMapUv:``,n.aoMapUv?`#define AOMAP_UV `+n.aoMapUv:``,n.emissiveMapUv?`#define EMISSIVEMAP_UV `+n.emissiveMapUv:``,n.bumpMapUv?`#define BUMPMAP_UV `+n.bumpMapUv:``,n.normalMapUv?`#define NORMALMAP_UV `+n.normalMapUv:``,n.displacementMapUv?`#define DISPLACEMENTMAP_UV `+n.displacementMapUv:``,n.metalnessMapUv?`#define METALNESSMAP_UV `+n.metalnessMapUv:``,n.roughnessMapUv?`#define ROUGHNESSMAP_UV `+n.roughnessMapUv:``,n.anisotropyMapUv?`#define ANISOTROPYMAP_UV `+n.anisotropyMapUv:``,n.clearcoatMapUv?`#define CLEARCOATMAP_UV `+n.clearcoatMapUv:``,n.clearcoatNormalMapUv?`#define CLEARCOAT_NORMALMAP_UV `+n.clearcoatNormalMapUv:``,n.clearcoatRoughnessMapUv?`#define CLEARCOAT_ROUGHNESSMAP_UV `+n.clearcoatRoughnessMapUv:``,n.diffuseRoughnessMapUv?`#define DIFFUSE_ROUGHNESSMAP_UV `+n.diffuseRoughnessMapUv:``,n.iridescenceMapUv?`#define IRIDESCENCEMAP_UV `+n.iridescenceMapUv:``,n.iridescenceThicknessMapUv?`#define IRIDESCENCE_THICKNESSMAP_UV `+n.iridescenceThicknessMapUv:``,n.sheenColorMapUv?`#define SHEEN_COLORMAP_UV `+n.sheenColorMapUv:``,n.sheenRoughnessMapUv?`#define SHEEN_ROUGHNESSMAP_UV `+n.sheenRoughnessMapUv:``,n.specularMapUv?`#define SPECULARMAP_UV `+n.specularMapUv:``,n.specularColorMapUv?`#define SPECULAR_COLORMAP_UV `+n.specularColorMapUv:``,n.specularIntensityMapUv?`#define SPECULAR_INTENSITYMAP_UV `+n.specularIntensityMapUv:``,n.transmissionMapUv?`#define TRANSMISSIONMAP_UV `+n.transmissionMapUv:``,n.thicknessMapUv?`#define THICKNESSMAP_UV `+n.thicknessMapUv:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexNormals?`#define HAS_NORMAL`:``,n.vertexColors?`#define USE_COLOR`:``,n.vertexAlphas?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.flatShading?`#define FLAT_SHADED`:``,n.skinning?`#define USE_SKINNING`:``,n.morphTargets?`#define USE_MORPHTARGETS`:``,n.morphNormals&&n.flatShading===!1?`#define USE_MORPHNORMALS`:``,n.morphColors?`#define USE_MORPHCOLORS`:``,n.morphTargetsCount>0?`#define MORPHTARGETS_TEXTURE_STRIDE `+n.morphTextureStride:``,n.morphTargetsCount>0?`#define MORPHTARGETS_COUNT `+n.morphTargetsCount:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.sizeAttenuation?`#define USE_SIZEATTENUATION`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 modelMatrix;`,`uniform mat4 modelViewMatrix;`,`uniform mat4 projectionMatrix;`,`uniform mat4 viewMatrix;`,`uniform mat3 normalMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,`#ifdef USE_INSTANCING`,`	attribute mat4 instanceMatrix;`,`#endif`,`#ifdef USE_INSTANCING_COLOR`,`	attribute vec3 instanceColor;`,`#endif`,`#ifdef USE_INSTANCING_MORPH`,`	uniform sampler2D morphTexture;`,`#endif`,`attribute vec3 position;`,`attribute vec3 normal;`,`attribute vec2 uv;`,`#ifdef USE_UV1`,`	attribute vec2 uv1;`,`#endif`,`#ifdef USE_UV2`,`	attribute vec2 uv2;`,`#endif`,`#ifdef USE_UV3`,`	attribute vec2 uv3;`,`#endif`,`#ifdef USE_TANGENT`,`	attribute vec4 tangent;`,`#endif`,`#if defined( USE_COLOR_ALPHA )`,`	attribute vec4 color;`,`#elif defined( USE_COLOR )`,`	attribute vec3 color;`,`#endif`,`#ifdef USE_SKINNING`,`	attribute vec4 skinIndex;`,`	attribute vec4 skinWeight;`,`#endif`,`
`].filter(md).join(`
`),g=[Cd(n),`#define SHADER_TYPE `+n.shaderType,`#define SHADER_NAME `+n.shaderName,p,n.useFog&&n.fog?`#define USE_FOG`:``,n.useFog&&n.fogExp2?`#define FOG_EXP2`:``,n.alphaToCoverage?`#define ALPHA_TO_COVERAGE`:``,n.map?`#define USE_MAP`:``,n.matcap?`#define USE_MATCAP`:``,n.envMap?`#define USE_ENVMAP`:``,n.envMap?`#define `+l:``,n.envMap?`#define `+u:``,n.envMap?`#define `+d:``,n.envMapPMREM?`#define ENVMAP_MAX_LOD `+n.envMapMaxLod+`.0`:``,n.envMapPMREM?`#define ENVMAP_SIZE `+n.envMapSize+`.0`:``,n.lightMap?`#define USE_LIGHTMAP`:``,n.aoMap?`#define USE_AOMAP`:``,n.bumpMap?`#define USE_BUMPMAP`:``,n.normalMap?`#define USE_NORMALMAP`:``,n.normalMapObjectSpace?`#define USE_NORMALMAP_OBJECTSPACE`:``,n.normalMapTangentSpace?`#define USE_NORMALMAP_TANGENTSPACE`:``,n.packedNormalMap?`#define USE_PACKED_NORMALMAP`:``,n.emissiveMap?`#define USE_EMISSIVEMAP`:``,n.anisotropy?`#define USE_ANISOTROPY`:``,n.anisotropyMap?`#define USE_ANISOTROPYMAP`:``,n.clearcoat?`#define USE_CLEARCOAT`:``,n.clearcoatMap?`#define USE_CLEARCOATMAP`:``,n.clearcoatRoughnessMap?`#define USE_CLEARCOAT_ROUGHNESSMAP`:``,n.clearcoatNormalMap?`#define USE_CLEARCOAT_NORMALMAP`:``,n.diffuseRoughness?`#define USE_DIFFUSE_ROUGHNESS`:``,n.diffuseRoughnessMap?`#define USE_DIFFUSE_ROUGHNESSMAP`:``,n.dispersion?`#define USE_DISPERSION`:``,n.retroreflection?`#define USE_RETROREFLECTION`:``,n.iridescence?`#define USE_IRIDESCENCE`:``,n.iridescenceMap?`#define USE_IRIDESCENCEMAP`:``,n.iridescenceThicknessMap?`#define USE_IRIDESCENCE_THICKNESSMAP`:``,n.specularMap?`#define USE_SPECULARMAP`:``,n.specularColorMap?`#define USE_SPECULAR_COLORMAP`:``,n.specularIntensityMap?`#define USE_SPECULAR_INTENSITYMAP`:``,n.roughnessMap?`#define USE_ROUGHNESSMAP`:``,n.metalnessMap?`#define USE_METALNESSMAP`:``,n.alphaMap?`#define USE_ALPHAMAP`:``,n.alphaTest?`#define USE_ALPHATEST`:``,n.alphaHash?`#define USE_ALPHAHASH`:``,n.sheen?`#define USE_SHEEN`:``,n.sheenColorMap?`#define USE_SHEEN_COLORMAP`:``,n.sheenRoughnessMap?`#define USE_SHEEN_ROUGHNESSMAP`:``,n.transmission?`#define USE_TRANSMISSION`:``,n.transmissionMap?`#define USE_TRANSMISSIONMAP`:``,n.thicknessMap?`#define USE_THICKNESSMAP`:``,n.vertexTangents&&n.flatShading===!1?`#define USE_TANGENT`:``,n.vertexColors||n.instancingColor?`#define USE_COLOR`:``,n.vertexAlphas||n.batchingColor?`#define USE_COLOR_ALPHA`:``,n.vertexUv1s?`#define USE_UV1`:``,n.vertexUv2s?`#define USE_UV2`:``,n.vertexUv3s?`#define USE_UV3`:``,n.pointsUvs?`#define USE_POINTS_UV`:``,n.gradientMap?`#define USE_GRADIENTMAP`:``,n.flatShading?`#define FLAT_SHADED`:``,n.doubleSided?`#define DOUBLE_SIDED`:``,n.flipSided?`#define FLIP_SIDED`:``,n.shadowMapEnabled?`#define USE_SHADOWMAP`:``,n.shadowMapEnabled?`#define `+c:``,n.premultipliedAlpha?`#define PREMULTIPLIED_ALPHA`:``,n.numLightProbes>0?`#define USE_LIGHT_PROBES`:``,n.decodeVideoTexture?`#define DECODE_VIDEO_TEXTURE`:``,n.decodeVideoTextureEmissive?`#define DECODE_VIDEO_TEXTURE_EMISSIVE`:``,n.logarithmicDepthBuffer?`#define USE_LOGARITHMIC_DEPTH_BUFFER`:``,n.reversedDepthBuffer?`#define USE_REVERSED_DEPTH_BUFFER`:``,`uniform mat4 viewMatrix;`,`uniform vec3 cameraPosition;`,`uniform bool isOrthographic;`,n.toneMapping===0?``:`#define TONE_MAPPING`,n.toneMapping===0?``:Q.tonemapping_pars_fragment,n.toneMapping===0?``:cd(`toneMapping`,n.toneMapping),n.dithering?`#define DITHERING`:``,n.opaque?`#define OPAQUE`:``,Q.colorspace_pars_fragment,od(`linearToOutputTexel`,n.outputColorSpace),ud(),n.useDepthPacking?`#define DEPTH_PACKING `+n.depthPacking:``,`
`].filter(md).join(`
`)),o=vd(o),o=hd(o,n),o=gd(o,n),s=vd(s),s=hd(s,n),s=gd(s,n),o=xd(o),s=xd(s),n.isRawShaderMaterial!==!0&&(_=`#version 300 es
`,h=[f,`#define attribute in`,`#define varying out`,`#define texture2D texture`].join(`
`)+`
`+h,g=[`#define varying in`,n.glslVersion===`300 es`?``:`layout(location = 0) out highp vec4 pc_fragColor;`,n.glslVersion===`300 es`?``:`#define gl_FragColor pc_fragColor`,`#define gl_FragDepthEXT gl_FragDepth`,`#define texture2D texture`,`#define textureCube texture`,`#define texture2DProj textureProj`,`#define texture2DLodEXT textureLod`,`#define texture2DProjLodEXT textureProjLod`,`#define textureCubeLodEXT textureLod`,`#define texture2DGradEXT textureGrad`,`#define texture2DProjGradEXT textureProjGrad`,`#define textureCubeGradEXT textureGrad`].join(`
`)+`
`+g);let v=_+h+o,y=_+g+s,b=$u(i,i.VERTEX_SHADER,v),x=$u(i,i.FRAGMENT_SHADER,y);i.attachShader(m,b),i.attachShader(m,x),n.index0AttributeName===void 0?n.hasPositionAttribute===!0&&i.bindAttribLocation(m,0,`position`):i.bindAttribLocation(m,0,n.index0AttributeName),i.linkProgram(m);function S(t){if(e.debug.checkShaderErrors){let n=i.getProgramInfoLog(m)||``,r=i.getShaderInfoLog(b)||``,a=i.getShaderInfoLog(x)||``,o=n.trim(),s=r.trim(),c=a.trim(),l=!0,u=!0;if(i.getProgramParameter(m,i.LINK_STATUS)===!1){if(l=!1,typeof e.debug.onShaderError==`function`)e.debug.onShaderError(i,m,b,x);else{let e=ad(i,b,`vertex`),n=ad(i,x,`fragment`);K(`WebGLProgram: Shader Error `+i.getError()+` - VALIDATE_STATUS `+i.getProgramParameter(m,i.VALIDATE_STATUS)+`

Material Name: `+t.name+`
Material Type: `+t.type+`

Program Info Log: `+o+`
`+e+`
`+n)}}else o===``?(s===``||c===``)&&(u=!1):G(`WebGLProgram: Program Info Log:`,o);u&&(t.diagnostics={runnable:l,programLog:o,vertexShader:{log:s,prefix:h},fragmentShader:{log:c,prefix:g}})}i.deleteShader(b),i.deleteShader(x),C=new Qu(i,m),w=pd(i,m)}let C;this.getUniforms=function(){return C===void 0&&S(this),C};let w;this.getAttributes=function(){return w===void 0&&S(this),w};let T=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=i.getProgramParameter(m,ed)),T},this.destroy=function(){r.releaseStatesOfProgram(this),i.deleteProgram(m),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=td++,this.cacheKey=t,this.usedTimes=1,this.program=m,this.vertexShader=b,this.fragmentShader=x,this}var jd=0,Md=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new Nd(e),t.set(e,n)),n}},Nd=class{constructor(e){this.id=jd++,this.code=e,this.usedTimes=0}};function Pd(e){return e===1030||e===37490||e===36285}function Fd(e,t,n,r,i,a){let o=new qi,s=new Md,c=new Set,l=[],u=new Map,d=r.logarithmicDepthBuffer,f={MeshDepthMaterial:`depth`,MeshDistanceMaterial:`distance`,MeshNormalMaterial:`normal`,MeshBasicMaterial:`basic`,MeshLambertMaterial:`lambert`,MeshPhongMaterial:`phong`,MeshToonMaterial:`toon`,MeshStandardMaterial:`physical`,MeshPhysicalMaterial:`physical`,MeshMatcapMaterial:`matcap`,LineBasicMaterial:`basic`,LineDashedMaterial:`dashed`,PointsMaterial:`points`,ShadowMaterial:`shadow`,SpriteMaterial:`sprite`};function p(e){return c.add(e),e===0?`uv`:`uv${e}`}function m(i,o,l,u,m,h){let g=u.fog,_=m.geometry,v=i.isMeshStandardMaterial||i.isMeshLambertMaterial||i.isMeshPhongMaterial?u.environment:null,y=i.isMeshStandardMaterial||i.isMeshLambertMaterial&&!i.envMap||i.isMeshPhongMaterial&&!i.envMap,b=t.get(i.envMap||v,y),x=f[i.type],S=r.precision;i.precision!==null&&(S=r.getMaxPrecision(i.precision),S!==i.precision&&G(`WebGLProgram.getParameters:`,i.precision,`not supported, using`,S,`instead.`));let C=_.morphAttributes.position||_.morphAttributes.normal||_.morphAttributes.color,w=C===void 0?0:C.length,T=0;_.morphAttributes.position!==void 0&&(T=1),_.morphAttributes.normal!==void 0&&(T=2),_.morphAttributes.color!==void 0&&(T=3);let E,D,O,k;if(x){let e=ll[x];E=e.vertexShader,D=e.fragmentShader}else{E=i.vertexShader,D=i.fragmentShader;let e=s.getVertexShaderStage(i),t=s.getFragmentShaderStage(i);s.update(i,e,t),O=e.id,k=t.id}let A=e.getRenderTarget(),j=e.state.buffers.depth.getReversed(),ee=m.isInstancedMesh===!0,M=m.isBatchedMesh===!0,N=!!i.map,te=!!i.matcap,ne=!!b,re=ne&&b.isPMREMTexture===!0,ie=!!i.aoMap,ae=!!i.lightMap,P=!!i.bumpMap&&i.wireframe===!1,oe=!!i.normalMap,F=!!i.displacementMap,I=!!i.emissiveMap,L=!!i.metalnessMap,R=!!i.roughnessMap,se=i.anisotropy>0,ce=i.clearcoat>0,le=i.diffuseRoughness>0,ue=i.dispersion>0,de=i.retroreflectivity>0,z=i.iridescence>0,fe=i.sheen>0,pe=i.transmission>0,me=se&&!!i.anisotropyMap,he=ce&&!!i.clearcoatMap,ge=ce&&!!i.clearcoatNormalMap,_e=ce&&!!i.clearcoatRoughnessMap,ve=le&&!!i.diffuseRoughnessMap,B=z&&!!i.iridescenceMap,ye=z&&!!i.iridescenceThicknessMap,be=fe&&!!i.sheenColorMap,xe=fe&&!!i.sheenRoughnessMap,V=!!i.specularMap,Se=!!i.specularColorMap,H=!!i.specularIntensityMap,U=pe&&!!i.transmissionMap,Ce=pe&&!!i.thicknessMap,we=!!i.gradientMap,Te=!!i.alphaMap,Ee=i.alphaTest>0,De=!!i.alphaHash,Oe=!!i.extensions,ke=0;i.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(ke=e.toneMapping);let Ae=re?b.isCompressedCubeTexture?b.image[0].mipmaps:b.mipmaps:null,je={shaderID:x,shaderType:i.type,shaderName:i.name,vertexShader:E,fragmentShader:D,defines:i.defines,customVertexShaderID:O,customFragmentShaderID:k,isRawShaderMaterial:i.isRawShaderMaterial===!0,glslVersion:i.glslVersion,precision:S,batching:M,batchingColor:M&&m._colorsTexture!==null,instancing:ee,instancingColor:ee&&m.instanceColor!==null,instancingMorph:ee&&m.morphTexture!==null,outputColorSpace:A===null?e.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:bi.workingColorSpace,alphaToCoverage:!!i.alphaToCoverage,map:N,matcap:te,envMap:ne,envMapMode:ne&&b.mapping,envMapPMREM:re,envMapMaxLod:re?Ae.length-1:null,envMapSize:re?Ae[0].width:null,aoMap:ie,lightMap:ae,bumpMap:P,normalMap:oe,displacementMap:F,emissiveMap:I,normalMapObjectSpace:oe&&i.normalMapType===1,normalMapTangentSpace:oe&&i.normalMapType===0,packedNormalMap:oe&&i.normalMapType===0&&Pd(i.normalMap.format),metalnessMap:L,roughnessMap:R,anisotropy:se,anisotropyMap:me,clearcoat:ce,clearcoatMap:he,clearcoatNormalMap:ge,clearcoatRoughnessMap:_e,diffuseRoughness:le,diffuseRoughnessMap:ve,dispersion:ue,retroreflection:de,iridescence:z,iridescenceMap:B,iridescenceThicknessMap:ye,sheen:fe,sheenColorMap:be,sheenRoughnessMap:xe,specularMap:V,specularColorMap:Se,specularIntensityMap:H,transmission:pe,transmissionMap:U,thicknessMap:Ce,gradientMap:we,opaque:i.transparent===!1&&i.blending===1&&i.alphaToCoverage===!1,alphaMap:Te,alphaTest:Ee,alphaHash:De,combine:i.combine,mapUv:N&&p(i.map.channel),aoMapUv:ie&&p(i.aoMap.channel),lightMapUv:ae&&p(i.lightMap.channel),bumpMapUv:P&&p(i.bumpMap.channel),normalMapUv:oe&&p(i.normalMap.channel),displacementMapUv:F&&p(i.displacementMap.channel),emissiveMapUv:I&&p(i.emissiveMap.channel),metalnessMapUv:L&&p(i.metalnessMap.channel),roughnessMapUv:R&&p(i.roughnessMap.channel),anisotropyMapUv:me&&p(i.anisotropyMap.channel),clearcoatMapUv:he&&p(i.clearcoatMap.channel),clearcoatNormalMapUv:ge&&p(i.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:_e&&p(i.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:ve&&p(i.diffuseRoughnessMap.channel),iridescenceMapUv:B&&p(i.iridescenceMap.channel),iridescenceThicknessMapUv:ye&&p(i.iridescenceThicknessMap.channel),sheenColorMapUv:be&&p(i.sheenColorMap.channel),sheenRoughnessMapUv:xe&&p(i.sheenRoughnessMap.channel),specularMapUv:V&&p(i.specularMap.channel),specularColorMapUv:Se&&p(i.specularColorMap.channel),specularIntensityMapUv:H&&p(i.specularIntensityMap.channel),transmissionMapUv:U&&p(i.transmissionMap.channel),thicknessMapUv:Ce&&p(i.thicknessMap.channel),alphaMapUv:Te&&p(i.alphaMap.channel),vertexTangents:!!_.attributes.tangent&&(oe||se),vertexNormals:!!_.attributes.normal,vertexColors:i.vertexColors,vertexAlphas:i.vertexColors===!0&&!!_.attributes.color&&_.attributes.color.itemSize===4,pointsUvs:m.isPoints===!0&&!!_.attributes.uv&&(N||Te),fog:!!g,useFog:i.fog===!0,fogExp2:!!g&&g.isFogExp2,flatShading:i.wireframe===!1&&(i.flatShading===!0||_.attributes.normal===void 0&&oe===!1&&(i.isMeshLambertMaterial||i.isMeshPhongMaterial||i.isMeshStandardMaterial||i.isMeshPhysicalMaterial)),sizeAttenuation:i.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:j,skinning:m.isSkinnedMesh===!0,hasPositionAttribute:_.attributes.position!==void 0,morphTargets:_.morphAttributes.position!==void 0,morphNormals:_.morphAttributes.normal!==void 0,morphColors:_.morphAttributes.color!==void 0,morphTargetsCount:w,morphTextureStride:T,numSunLights:o.sun.length,numDirLights:o.directional.length,numPointLights:o.point.length,numSpotLights:o.spot.length,numSpotLightMaps:o.spotLightMap.length,numRectAreaLights:o.rectArea.length,numHemiLights:o.hemi.length,numSunLightShadows:o.sunShadowMap.length,numDirLightShadows:o.directionalShadowMap.length,numPointLightShadows:o.pointShadowMap.length,numSpotLightShadows:o.spotShadowMap.length,numSpotLightShadowsWithMaps:o.numSpotLightShadowsWithMaps,numLightProbes:o.numLightProbes,numLightProbeGrids:h.filter(e=>e.texture!==null).length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:i.dithering,shadowMapEnabled:e.shadowMap.enabled&&l.length>0,shadowMapType:e.shadowMap.type,toneMapping:ke,decodeVideoTexture:N&&i.map.isVideoTexture===!0&&bi.getTransfer(i.map.colorSpace)===`srgb`,decodeVideoTextureEmissive:I&&i.emissiveMap.isVideoTexture===!0&&bi.getTransfer(i.emissiveMap.colorSpace)===`srgb`,premultipliedAlpha:i.premultipliedAlpha,doubleSided:i.side===2,flipSided:i.side===1,useDepthPacking:i.depthPacking>=0,depthPacking:i.depthPacking||0,index0AttributeName:i.index0AttributeName,extensionClipCullDistance:Oe&&i.extensions.clipCullDistance===!0&&n.has(`WEBGL_clip_cull_distance`),extensionMultiDraw:(Oe&&i.extensions.multiDraw===!0||M)&&n.has(`WEBGL_multi_draw`),rendererExtensionParallelShaderCompile:n.has(`KHR_parallel_shader_compile`),customProgramCacheKey:i.customProgramCacheKey()};return je.vertexUv1s=c.has(1),je.vertexUv2s=c.has(2),je.vertexUv3s=c.has(3),c.clear(),je}function h(t){let n=[];if(t.shaderID?n.push(t.shaderID):(n.push(t.customVertexShaderID),n.push(t.customFragmentShaderID)),t.defines!==void 0)for(let e in t.defines)n.push(e),n.push(t.defines[e]);return t.isRawShaderMaterial===!1&&(g(n,t),_(n,t),n.push(e.outputColorSpace)),n.push(t.customProgramCacheKey),n.join()}function g(e,t){e.push(t.precision),e.push(t.outputColorSpace),e.push(t.envMapMode),e.push(t.envMapPMREM),e.push(t.envMapMaxLod),e.push(t.envMapSize),e.push(t.mapUv),e.push(t.alphaMapUv),e.push(t.lightMapUv),e.push(t.aoMapUv),e.push(t.bumpMapUv),e.push(t.normalMapUv),e.push(t.displacementMapUv),e.push(t.emissiveMapUv),e.push(t.metalnessMapUv),e.push(t.roughnessMapUv),e.push(t.anisotropyMapUv),e.push(t.clearcoatMapUv),e.push(t.clearcoatNormalMapUv),e.push(t.clearcoatRoughnessMapUv),e.push(t.diffuseRoughnessMapUv),e.push(t.iridescenceMapUv),e.push(t.iridescenceThicknessMapUv),e.push(t.sheenColorMapUv),e.push(t.sheenRoughnessMapUv),e.push(t.specularMapUv),e.push(t.specularColorMapUv),e.push(t.specularIntensityMapUv),e.push(t.transmissionMapUv),e.push(t.thicknessMapUv),e.push(t.combine),e.push(t.fogExp2),e.push(t.sizeAttenuation),e.push(t.morphTargetsCount),e.push(t.numSunLights),e.push(t.numDirLights),e.push(t.numPointLights),e.push(t.numSpotLights),e.push(t.numSpotLightMaps),e.push(t.numHemiLights),e.push(t.numRectAreaLights),e.push(t.numSunLightShadows),e.push(t.numDirLightShadows),e.push(t.numPointLightShadows),e.push(t.numSpotLightShadows),e.push(t.numSpotLightShadowsWithMaps),e.push(t.numLightProbes),e.push(t.numLightProbeGrids),e.push(t.shadowMapType),e.push(t.toneMapping),e.push(t.numClippingPlanes),e.push(t.numClipIntersection),e.push(t.depthPacking)}function _(e,t){o.disableAll(),t.instancing&&o.enable(0),t.instancingColor&&o.enable(1),t.instancingMorph&&o.enable(2),t.matcap&&o.enable(3),t.envMap&&o.enable(4),t.normalMapObjectSpace&&o.enable(5),t.normalMapTangentSpace&&o.enable(6),t.clearcoat&&o.enable(7),t.iridescence&&o.enable(8),t.alphaTest&&o.enable(9),t.vertexColors&&o.enable(10),t.vertexAlphas&&o.enable(11),t.vertexUv1s&&o.enable(12),t.vertexUv2s&&o.enable(13),t.vertexUv3s&&o.enable(14),t.vertexTangents&&o.enable(15),t.anisotropy&&o.enable(16),t.alphaHash&&o.enable(17),t.batching&&o.enable(18),t.dispersion&&o.enable(19),t.retroreflection&&o.enable(24),t.diffuseRoughness&&o.enable(25),t.batchingColor&&o.enable(20),t.gradientMap&&o.enable(21),t.packedNormalMap&&o.enable(22),t.vertexNormals&&o.enable(23),e.push(o.mask),o.disableAll(),t.fog&&o.enable(0),t.useFog&&o.enable(1),t.flatShading&&o.enable(2),t.logarithmicDepthBuffer&&o.enable(3),t.reversedDepthBuffer&&o.enable(4),t.skinning&&o.enable(5),t.morphTargets&&o.enable(6),t.morphNormals&&o.enable(7),t.morphColors&&o.enable(8),t.premultipliedAlpha&&o.enable(9),t.shadowMapEnabled&&o.enable(10),t.doubleSided&&o.enable(11),t.flipSided&&o.enable(12),t.useDepthPacking&&o.enable(13),t.dithering&&o.enable(14),t.transmission&&o.enable(15),t.sheen&&o.enable(16),t.opaque&&o.enable(17),t.pointsUvs&&o.enable(18),t.decodeVideoTexture&&o.enable(19),t.decodeVideoTextureEmissive&&o.enable(20),t.alphaToCoverage&&o.enable(21),t.numLightProbeGrids>0&&o.enable(22),t.hasPositionAttribute&&o.enable(23),e.push(o.mask)}function v(e){let t=f[e.type],n;if(t){let e=ll[t];n=Hs.clone(e.uniforms)}else n=e.uniforms;return n}function y(t,n){let r=u.get(n);return r===void 0?(r=new Ad(e,n,t,i),l.push(r),u.set(n,r)):++r.usedTimes,r}function b(e){if(--e.usedTimes===0){let t=l.indexOf(e);l[t]=l[l.length-1],l.pop(),u.delete(e.cacheKey),e.destroy()}}function x(e){s.remove(e)}function S(){s.dispose()}return{getParameters:m,getProgramCacheKey:h,getUniforms:v,acquireProgram:y,releaseProgram:b,releaseShaderCache:x,programs:l,dispose:S}}function Id(){let e=new WeakMap;function t(t){return e.has(t)}function n(t){let n=e.get(t);return n===void 0&&(n={},e.set(t,n)),n}function r(t){e.delete(t)}function i(t,n,r){e.get(t)[n]=r}function a(){e=new WeakMap}return{has:t,get:n,remove:r,update:i,dispose:a}}function Ld(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.material.id===t.material.id?e.materialVariant===t.materialVariant?e.z===t.z?e.id-t.id:e.z-t.z:e.materialVariant-t.materialVariant:e.material.id-t.material.id:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function Rd(e,t){return e.groupOrder===t.groupOrder?e.renderOrder===t.renderOrder?e.z===t.z?e.id-t.id:t.z-e.z:e.renderOrder-t.renderOrder:e.groupOrder-t.groupOrder}function zd(){let e=[],t=0,n=[],r=[],i=[];function a(){t=0,n.length=0,r.length=0,i.length=0}function o(e){let t=0;return e.isInstancedMesh&&(t+=2),e.isSkinnedMesh&&(t+=1),t}function s(n,r,i,a,s,c){let l=e[t];return l===void 0?(l={id:n.id,object:n,geometry:r,material:i,materialVariant:o(n),groupOrder:a,renderOrder:n.renderOrder,z:s,group:c},e[t]=l):(l.id=n.id,l.object=n,l.geometry=r,l.material=i,l.materialVariant=o(n),l.groupOrder=a,l.renderOrder=n.renderOrder,l.z=s,l.group=c),t++,l}function c(e,t,a,o,c,l,u){u.reversedDepth===!0&&(c=-c);let d=s(e,t,a,o,c,l);a.transmission>0?r.push(d):a.transparent===!0?i.push(d):n.push(d)}function l(e,t,a,o,c,l){let u=s(e,t,a,o,c,l);a.transmission>0?r.unshift(u):a.transparent===!0?i.unshift(u):n.unshift(u)}function u(e,t){n.length>1&&n.sort(e||Ld),r.length>1&&r.sort(t||Rd),i.length>1&&i.sort(t||Rd)}function d(){for(let n=t,r=e.length;n<r;n++){let t=e[n];if(t.id===null)break;t.id=null,t.object=null,t.geometry=null,t.material=null,t.group=null}}return{opaque:n,transmissive:r,transparent:i,init:a,push:c,unshift:l,finish:d,sort:u}}function Bd(){let e=new WeakMap;function t(t,n){let r=e.get(t),i;return r===void 0?(i=new zd,e.set(t,[i])):n>=r.length?(i=new zd,r.push(i)):i=r[n],i}function n(){e=new WeakMap}return{get:t,dispose:n}}function Vd(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={direction:new Y,color:new Z};break;case`SpotLight`:n={position:new Y,direction:new Y,color:new Z,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case`PointLight`:n={position:new Y,color:new Z,distance:0,decay:0};break;case`HemisphereLight`:n={direction:new Y,skyColor:new Z,groundColor:new Z};break;case`RectAreaLight`:n={color:new Z,position:new Y,halfWidth:new Y,halfHeight:new Y}}return e[t.id]=n,n}}}function Hd(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case`SunLight`:case`DirectionalLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new J};break;case`SpotLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new J};break;case`PointLight`:n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new J,shadowCameraNear:1,shadowCameraFar:1e3}}return e[t.id]=n,n}}}var Ud=0;function Wd(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+ +!!t.map-!!e.map}function Gd(e){let t=new Vd,n=Hd(),r={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let e=0;e<9;e++)r.probe.push(new Y);let i=new Y,a=new Ii,o=new Ii;function s(i){let a=0,o=0,s=0;for(let e=0;e<9;e++)r.probe[e].set(0,0,0);let c=0,l=0,u=0,d=0,f=0,p=0,m=0,h=0,g=0,_=0,v=0,y=0,b=0,x=0;i.sort(Wd);for(let e=0,S=i.length;e<S;e++){let S=i[e],C=S.color,w=S.intensity,T=S.distance,E=null;if(S.shadow&&S.shadow.map&&(E=S.shadow.map.texture.format===1030?S.shadow.map.texture:S.shadow.map.depthTexture||S.shadow.map.texture),S.isAmbientLight)a+=C.r*w,o+=C.g*w,s+=C.b*w;else if(S.isLightProbe){for(let e=0;e<9;e++)r.probe[e].addScaledVector(S.sh.coefficients[e],w);x++}else if(S.isSunLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize.copy(e.mapSize).multiply(e.getFrameExtents()),r.sunShadow[l]=t,r.sunShadowMap[l]=E;let i=e.getViewportCount();for(let t=0;t<i;t++)r.sunShadowMatrix[u+t]=e.getMatrix(t),r.sunShadowCascade[u+t]=e._cascadeData[t];u+=i,l++}r.sun[c]=e,c++}else if(S.isDirectionalLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,r.directionalShadow[d]=t,r.directionalShadowMap[d]=E,r.directionalShadowMatrix[d]=S.shadow.matrix,g++}r.directional[d]=e,d++}else if(S.isSpotLight){let e=t.get(S);e.position.setFromMatrixPosition(S.matrixWorld),e.color.copy(C).multiplyScalar(w),e.distance=T,e.coneCos=Math.cos(S.angle),e.penumbraCos=Math.cos(S.angle*(1-S.penumbra)),e.decay=S.decay,r.spot[p]=e;let i=S.shadow;if(S.map&&(r.spotLightMap[y]=S.map,y++,i.updateMatrices(S),S.castShadow&&b++),r.spotLightMatrix[p]=i.matrix,S.castShadow){let e=n.get(S);e.shadowIntensity=i.intensity,e.shadowBias=i.bias,e.shadowNormalBias=i.normalBias,e.shadowRadius=i.radius,e.shadowMapSize=i.mapSize,r.spotShadow[p]=e,r.spotShadowMap[p]=E,v++}p++}else if(S.isRectAreaLight){let e=t.get(S);e.color.copy(C).multiplyScalar(w),e.halfWidth.set(S.width*.5,0,0),e.halfHeight.set(0,S.height*.5,0),r.rectArea[m]=e,m++}else if(S.isPointLight){let e=t.get(S);if(e.color.copy(S.color).multiplyScalar(S.intensity),e.distance=S.distance,e.decay=S.decay,S.castShadow){let e=S.shadow,t=n.get(S);t.shadowIntensity=e.intensity,t.shadowBias=e.bias,t.shadowNormalBias=e.normalBias,t.shadowRadius=e.radius,t.shadowMapSize=e.mapSize,t.shadowCameraNear=e.camera.near,t.shadowCameraFar=e.camera.far,r.pointShadow[f]=t,r.pointShadowMap[f]=E,r.pointShadowMatrix[f]=S.shadow.matrix,_++}r.point[f]=e,f++}else if(S.isHemisphereLight){let e=t.get(S);e.skyColor.copy(S.color).multiplyScalar(w),e.groundColor.copy(S.groundColor).multiplyScalar(w),r.hemi[h]=e,h++}}m>0&&(e.has(`OES_texture_float_linear`)===!0?(r.rectAreaLTC1=$.LTC_FLOAT_1,r.rectAreaLTC2=$.LTC_FLOAT_2):(r.rectAreaLTC1=$.LTC_HALF_1,r.rectAreaLTC2=$.LTC_HALF_2)),r.ambient[0]=a,r.ambient[1]=o,r.ambient[2]=s;let S=r.hash;(S.sunLength!==c||S.directionalLength!==d||S.pointLength!==f||S.spotLength!==p||S.rectAreaLength!==m||S.hemiLength!==h||S.numSunShadows!==l||S.numDirectionalShadows!==g||S.numPointShadows!==_||S.numSpotShadows!==v||S.numSpotMaps!==y||S.numLightProbes!==x)&&(r.sun.length=c,r.directional.length=d,r.spot.length=p,r.rectArea.length=m,r.point.length=f,r.hemi.length=h,r.sunShadow.length=l,r.sunShadowMap.length=l,r.sunShadowMatrix.length=u,r.sunShadowCascade.length=u,r.directionalShadow.length=g,r.directionalShadowMap.length=g,r.directionalShadowMatrix.length=g,r.pointShadow.length=_,r.pointShadowMap.length=_,r.pointShadowMatrix.length=_,r.spotShadow.length=v,r.spotShadowMap.length=v,r.spotLightMatrix.length=v+y-b,r.spotLightMap.length=y,r.numSpotLightShadowsWithMaps=b,r.numLightProbes=x,S.sunLength=c,S.directionalLength=d,S.pointLength=f,S.spotLength=p,S.rectAreaLength=m,S.hemiLength=h,S.numSunShadows=l,S.numDirectionalShadows=g,S.numPointShadows=_,S.numSpotShadows=v,S.numSpotMaps=y,S.numLightProbes=x,r.version=Ud++)}function c(e,t){let n=0,s=0,c=0,l=0,u=0,d=0,f=t.matrixWorldInverse;for(let t=0,p=e.length;t<p;t++){let p=e[t];if(p.isSunLight){let e=r.sun[n];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),n++}else if(p.isDirectionalLight){let e=r.directional[s];e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),s++}else if(p.isSpotLight){let e=r.spot[l];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),e.direction.setFromMatrixPosition(p.matrixWorld),i.setFromMatrixPosition(p.target.matrixWorld),e.direction.sub(i),e.direction.transformDirection(f),l++}else if(p.isRectAreaLight){let e=r.rectArea[u];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),o.identity(),a.copy(p.matrixWorld),a.premultiply(f),o.extractRotation(a),e.halfWidth.set(p.width*.5,0,0),e.halfHeight.set(0,p.height*.5,0),e.halfWidth.applyMatrix4(o),e.halfHeight.applyMatrix4(o),u++}else if(p.isPointLight){let e=r.point[c];e.position.setFromMatrixPosition(p.matrixWorld),e.position.applyMatrix4(f),c++}else if(p.isHemisphereLight){let e=r.hemi[d];e.direction.setFromMatrixPosition(p.matrixWorld),e.direction.transformDirection(f),d++}}}return{setup:s,setupView:c,state:r}}function Kd(e){let t=new Gd(e),n=[],r=[],i=[];function a(e){u.camera=e,n.length=0,r.length=0,i.length=0}function o(e){e.isLightProbeGrid?i.push(e):n.push(e)}function s(e){r.push(e)}function c(){t.setup(n),i.sort((e,t)=>e.priority-t.priority||e.id-t.id)}function l(e){t.setupView(n,e)}let u={lightsArray:n,shadowsArray:r,lightProbeGridArray:i,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:u,setupLights:c,setupLightsView:l,pushLight:o,pushShadow:s}}function qd(e){let t=new WeakMap;function n(n,r=0){let i=t.get(n),a;return i===void 0?(a=new Kd(e),t.set(n,[a])):r>=i.length?(a=new Kd(e),i.push(a)):a=i[r],a}function r(){t=new WeakMap}return{get:n,dispose:r}}var Jd=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Yd=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,Xd=[new Y(1,0,0),new Y(-1,0,0),new Y(0,1,0),new Y(0,-1,0),new Y(0,0,1),new Y(0,0,-1)],Zd=[new Y(0,-1,0),new Y(0,-1,0),new Y(0,0,1),new Y(0,0,-1),new Y(0,-1,0),new Y(0,-1,0)],Qd=new Ii,$d=new Y,ef=new Y;function tf(e,t,n){let r=new ys,i=new J,a=new J,o=new ji,s=new Xs,c=new Zs,l={},u=n.maxTextureSize,d={0:1,1:0,2:2},f=new Gs({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new J},radius:{value:4}},vertexShader:Jd,fragmentShader:Yd}),p=f.clone();p.defines.HORIZONTAL_PASS=1;let m=new po;m.setAttribute(`position`,new Za(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let h=new rs(m,f),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=1;let _=this.type;this.render=function(t,n,s){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||t.length===0)return;this.type===2&&(G(`WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.`),this.type=1);let c=e.getRenderTarget(),l=e.getActiveCubeFace(),d=e.getActiveMipmapLevel(),f=e.state;f.setBlending(0),f.buffers.depth.getReversed()===!0?f.buffers.color.setClear(0,0,0,0):f.buffers.color.setClear(1,1,1,1),f.buffers.depth.setTest(!0),f.setScissorTest(!1);let p=_!==this.type;p&&n.traverse(function(e){e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.needsUpdate=!0):e.material.needsUpdate=!0)});for(let c=0,l=t.length;c<l;c++){let l=t[c],d=l.shadow;if(d===void 0){G(`WebGLShadowMap:`,l,`has no shadow.`);continue}if(d.autoUpdate===!1&&d.needsUpdate===!1)continue;i.copy(d.mapSize);let m=d.getFrameExtents();i.multiply(m),a.copy(d.mapSize),(i.x>u||i.y>u)&&(i.x>u&&(a.x=Math.floor(u/m.x),i.x=a.x*m.x,d.mapSize.x=a.x),i.y>u&&(a.y=Math.floor(u/m.y),i.y=a.y*m.y,d.mapSize.y=a.y));let h=e.state.buffers.depth.getReversed();if(d.camera._reversedDepth=h,d.map===null||p===!0){if(d.map!==null&&(d.map.depthTexture!==null&&(d.map.depthTexture.dispose(),d.map.depthTexture=null),d.map.dispose()),this.type===3){if(l.isPointLight){G(`WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.`);continue}d.map=new Ni(i.x,i.y,{format:Gn,type:Mn,minFilter:Sn,magFilter:Sn,generateMipmaps:!1}),d.map.texture.name=l.name+`.shadowMap`,d.map.depthTexture=new js(i.x,i.y,jn),d.map.depthTexture.name=l.name+`.shadowMapDepth`,d.map.depthTexture.format=Vn,d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=yn,d.map.depthTexture.magFilter=yn}else l.isPointLight?(d.map=new vl(i.x),d.map.depthTexture=new Ms(i.x,An)):(d.map=new Ni(i.x,i.y),d.map.depthTexture=new js(i.x,i.y,An)),d.map.depthTexture.name=l.name+`.shadowMap`,d.map.depthTexture.format=Vn,this.type===1?(d.map.depthTexture.compareFunction=h?518:515,d.map.depthTexture.minFilter=Sn,d.map.depthTexture.magFilter=Sn):(d.map.depthTexture.compareFunction=null,d.map.depthTexture.minFilter=yn,d.map.depthTexture.magFilter=yn);d.camera.updateProjectionMatrix()}d.map.isWebGLCubeRenderTarget!==!0&&(d.map.width!==i.x||d.map.height!==i.y)&&d.map.setSize(i.x,i.y);let g=d.map.isWebGLCubeRenderTarget?6:d.getViewportCount();l.isPointLight!==!0&&d.updateMatrices(l,s);let _=d.camera.layers.mask&4294967294?d.camera.layers:s.layers;for(let t=0;t<g;t++){let i=d.getCamera(t);if(l.isPointLight){let e=d.camera,n=d.matrix,r=l.distance||e.far;r!==e.far&&(e.far=r,e.updateProjectionMatrix()),$d.setFromMatrixPosition(l.matrixWorld),e.position.copy($d),ef.copy(e.position),ef.add(Xd[t]),e.up.copy(Zd[t]),e.lookAt(ef),e.updateMatrixWorld(),n.makeTranslation(-$d.x,-$d.y,-$d.z),Qd.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),d._frustum.setFromProjectionMatrix(Qd,e.coordinateSystem,e.reversedDepth)}if(d.map.isWebGLCubeRenderTarget)e.setRenderTarget(d.map,t),e.clear();else{t===0&&(e.setRenderTarget(d.map),e.clear());let n=d.getViewport(t);o.set(a.x*n.x,a.y*n.y,a.x*n.z,a.y*n.w),f.viewport(o)}r=d.getFrustum(t),b(n,s,i,l,_,this.type)}d.isPointLightShadow!==!0&&this.type===3&&v(d,s),d.needsUpdate=!1}_=this.type,g.needsUpdate=!1,e.setRenderTarget(c,l,d)};function v(n,r){let a=t.update(h);f.defines.VSM_SAMPLES!==n.blurSamples&&(f.defines.VSM_SAMPLES=n.blurSamples,p.defines.VSM_SAMPLES=n.blurSamples,f.needsUpdate=!0,p.needsUpdate=!0),n.mapPass===null?n.mapPass=new Ni(i.x,i.y,{format:Gn,type:Mn}):(n.mapPass.width!==n.map.width||n.mapPass.height!==n.map.height)&&n.mapPass.setSize(n.map.width,n.map.height),f.uniforms.shadow_pass.value=n.map.depthTexture,f.uniforms.resolution.value.set(n.map.width,n.map.height),f.uniforms.radius.value=n.radius,e.setRenderTarget(n.mapPass),e.clear(),e.renderBufferDirect(r,null,a,f,h,null),p.uniforms.shadow_pass.value=n.mapPass.texture,p.uniforms.resolution.value.set(n.map.width,n.map.height),p.uniforms.radius.value=n.radius,e.setRenderTarget(n.map),e.clear(),e.renderBufferDirect(r,null,a,p,h,null)}function y(t,n,r,i){let a=null,o=r.isPointLight===!0?t.customDistanceMaterial:t.customDepthMaterial;if(o!==void 0)a=o;else if(a=r.isPointLight===!0?c:s,e.localClippingEnabled&&n.clipShadows===!0&&Array.isArray(n.clippingPlanes)&&n.clippingPlanes.length!==0||n.displacementMap&&n.displacementScale!==0||n.alphaMap&&n.alphaTest>0||n.map&&n.alphaTest>0||n.alphaToCoverage===!0){let e=a.uuid,t=n.uuid,r=l[e];r===void 0&&(r={},l[e]=r);let i=r[t];i===void 0&&(i=a.clone(),r[t]=i,n.addEventListener(`dispose`,x)),a=i}if(a.visible=n.visible,a.wireframe=n.wireframe,i===3?a.side=n.shadowSide===null?n.side:n.shadowSide:a.side=n.shadowSide===null?d[n.side]:n.shadowSide,a.alphaMap=n.alphaMap,a.alphaTest=n.alphaToCoverage===!0?.5:n.alphaTest,a.map=n.map,a.clipShadows=n.clipShadows,a.clippingPlanes=n.clippingPlanes,a.clipIntersection=n.clipIntersection,a.displacementMap=n.displacementMap,a.displacementScale=n.displacementScale,a.displacementBias=n.displacementBias,a.wireframeLinewidth=n.wireframeLinewidth,a.linewidth=n.linewidth,r.isPointLight===!0&&a.isMeshDistanceMaterial===!0){let t=e.properties.get(a);t.light=r}return a}function b(n,i,a,o,s,c){if(n.visible===!1)return;if(n.layers.test(s)&&(n.isMesh||n.isLine||n.isPoints)&&(n.castShadow||n.receiveShadow&&c===3)&&(!n.frustumCulled||n.intersectsFrustum(r))){n.modelViewMatrix.multiplyMatrices(a.matrixWorldInverse,n.matrixWorld);let r=t.update(n),s=n.material;if(Array.isArray(s)){let t=r.groups;for(let l=0,u=t.length;l<u;l++){let u=t[l],d=s[u.materialIndex];if(d&&d.visible){let t=y(n,d,o,c);n.onBeforeShadow(e,n,i,a,r,t,u),e.renderBufferDirect(a,null,r,t,n,u),n.onAfterShadow(e,n,i,a,r,t,u)}}}else if(s.visible){let t=y(n,s,o,c);n.onBeforeShadow(e,n,i,a,r,t,null),e.renderBufferDirect(a,null,r,t,n,null),n.onAfterShadow(e,n,i,a,r,t,null)}}let l=n.children;for(let e=0,t=l.length;e<t;e++)b(l[e],i,a,o,s,c)}function x(e){e.target.removeEventListener(`dispose`,x);for(let t in l){let n=l[t],r=e.target.uuid;r in n&&(n[r].dispose(),delete n[r])}}}function nf(e,t){function n(){let t=!1,n=new ji,r=null,i=new ji(0,0,0,0);return{setMask:function(n){r!==n&&!t&&(e.colorMask(n,n,n,n),r=n)},setLocked:function(e){t=e},setClear:function(t,r,a,o,s){s===!0&&(t*=o,r*=o,a*=o),n.set(t,r,a,o),i.equals(n)===!1&&(e.clearColor(t,r,a,o),i.copy(n))},reset:function(){t=!1,r=null,i.set(-1,0,0,0)}}}function r(){let n=!1,r=!1,i=null,a=null,o=null;return{setReversed:function(e){if(r!==e){let n=t.get(`EXT_clip_control`);e?n.clipControlEXT(n.LOWER_LEFT_EXT,n.ZERO_TO_ONE_EXT):n.clipControlEXT(n.LOWER_LEFT_EXT,n.NEGATIVE_ONE_TO_ONE_EXT),r=e;let i=o;o=null,this.setClear(i)}},getReversed:function(){return r},setTest:function(t){t?L(e.DEPTH_TEST):R(e.DEPTH_TEST)},setMask:function(t){i!==t&&!n&&(e.depthMask(t),i=t)},setFunc:function(t){if(r&&(t=ti[t]),a!==t){switch(t){case 0:e.depthFunc(e.NEVER);break;case 1:e.depthFunc(e.ALWAYS);break;case 2:e.depthFunc(e.LESS);break;case 3:e.depthFunc(e.LEQUAL);break;case 4:e.depthFunc(e.EQUAL);break;case 5:e.depthFunc(e.GEQUAL);break;case 6:e.depthFunc(e.GREATER);break;case 7:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}a=t}},setLocked:function(e){n=e},setClear:function(t){o!==t&&(o=t,r&&(t=1-t),e.clearDepth(t))},reset:function(){n=!1,i=null,a=null,o=null,r=!1}}}function i(){let t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null;return{setTest:function(n){t||(n?L(e.STENCIL_TEST):R(e.STENCIL_TEST))},setMask:function(r){n!==r&&!t&&(e.stencilMask(r),n=r)},setFunc:function(t,n,o){(r!==t||i!==n||a!==o)&&(e.stencilFunc(t,n,o),r=t,i=n,a=o)},setOp:function(t,n,r){(o!==t||s!==n||c!==r)&&(e.stencilOp(t,n,r),o=t,s=n,c=r)},setLocked:function(e){t=e},setClear:function(t){l!==t&&(e.clearStencil(t),l=t)},reset:function(){t=!1,n=null,r=null,i=null,a=null,o=null,s=null,c=null,l=null}}}let a=new n,o=new r,s=new i,c={},l=new WeakMap,u={},d={},f={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Z(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,ee=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),M=!1,N=0,te=e.getParameter(e.VERSION);te.indexOf(`WebGL`)===-1?te.indexOf(`OpenGL ES`)!==-1&&(N=parseFloat(/^OpenGL ES (\d)/.exec(te)[1]),M=N>=2):(N=parseFloat(/^WebGL (\d)/.exec(te)[1]),M=N>=1);let ne=null,re={},ie=e.getParameter(e.SCISSOR_BOX),ae=e.getParameter(e.VIEWPORT),P=new ji().fromArray(ie),oe=new ji().fromArray(ae);function F(t,n,r,i){let a=new Uint8Array(4),o=e.createTexture();e.bindTexture(t,o),e.texParameteri(t,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(t,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let o=0;o<r;o++)t===e.TEXTURE_3D||t===e.TEXTURE_2D_ARRAY?e.texImage3D(n,0,e.RGBA,1,1,i,0,e.RGBA,e.UNSIGNED_BYTE,a):e.texImage2D(n+o,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,a);return o}let I={};I[e.TEXTURE_2D]=F(e.TEXTURE_2D,e.TEXTURE_2D,1),I[e.TEXTURE_CUBE_MAP]=F(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),I[e.TEXTURE_2D_ARRAY]=F(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),I[e.TEXTURE_3D]=F(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),o.setClear(1),s.setClear(0),L(e.DEPTH_TEST),o.setFunc(3),pe(!1),me(1),L(e.CULL_FACE),z(0);function L(t){u[t]!==!0&&(e.enable(t),u[t]=!0)}function R(t){u[t]!==!1&&(e.disable(t),u[t]=!1)}function se(t,n){return f[t]!==n&&(e.bindFramebuffer(t,n),f[t]=n,t===e.DRAW_FRAMEBUFFER&&(f[e.FRAMEBUFFER]=n),t===e.FRAMEBUFFER&&(f[e.DRAW_FRAMEBUFFER]=n),!0)}function ce(t,n){let r=m,i=!1;if(t){r=p.get(n),r===void 0&&(r=[],p.set(n,r));let a=t.textures;if(r.length!==a.length||r[0]!==e.COLOR_ATTACHMENT0){for(let t=0,n=a.length;t<n;t++)r[t]=e.COLOR_ATTACHMENT0+t;r.length=a.length,i=!0}}else r[0]!==e.BACK&&(r[0]=e.BACK,i=!0);i&&e.drawBuffers(r)}function le(t){return h!==t&&(e.useProgram(t),h=t,!0)}let ue={100:e.FUNC_ADD,101:e.FUNC_SUBTRACT,102:e.FUNC_REVERSE_SUBTRACT};ue[103]=e.MIN,ue[104]=e.MAX;let de={200:e.ZERO,201:e.ONE,202:e.SRC_COLOR,204:e.SRC_ALPHA,210:e.SRC_ALPHA_SATURATE,208:e.DST_COLOR,206:e.DST_ALPHA,203:e.ONE_MINUS_SRC_COLOR,205:e.ONE_MINUS_SRC_ALPHA,209:e.ONE_MINUS_DST_COLOR,207:e.ONE_MINUS_DST_ALPHA,211:e.CONSTANT_COLOR,212:e.ONE_MINUS_CONSTANT_COLOR,213:e.CONSTANT_ALPHA,214:e.ONE_MINUS_CONSTANT_ALPHA};function z(t,n,r,i,a,o,s,c,l,u){if(t===0)g===!0&&(R(e.BLEND),g=!1);else if(g===!1&&(L(e.BLEND),g=!0),t!==5){if(t!==_||u!==E){if((v!==100||x!==100)&&(e.blendEquation(e.FUNC_ADD),v=100,x=100),u)switch(t){case 1:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFunc(e.ONE,e.ONE);break;case 3:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case 4:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:K(`WebGLState: Invalid blending: `,t)}else switch(t){case 1:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case 2:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case 3:K(`WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true`);break;case 4:K(`WebGLState: MultiplyBlending requires material.premultipliedAlpha = true`);break;default:K(`WebGLState: Invalid blending: `,t)}y=null,b=null,S=null,C=null,w.set(0,0,0),T=0,_=t,E=u}}else a||=n,o||=r,s||=i,(n!==v||a!==x)&&(e.blendEquationSeparate(ue[n],ue[a]),v=n,x=a),(r!==y||i!==b||o!==S||s!==C)&&(e.blendFuncSeparate(de[r],de[i],de[o],de[s]),y=r,b=i,S=o,C=s),(c.equals(w)===!1||l!==T)&&(e.blendColor(c.r,c.g,c.b,l),w.copy(c),T=l),_=t,E=!1}function fe(t,n){t.side===2?R(e.CULL_FACE):L(e.CULL_FACE);let r=t.side===1;n&&(r=!r),pe(r),t.blending===1&&t.transparent===!1?z(0):z(t.blending,t.blendEquation,t.blendSrc,t.blendDst,t.blendEquationAlpha,t.blendSrcAlpha,t.blendDstAlpha,t.blendColor,t.blendAlpha,t.premultipliedAlpha),o.setFunc(t.depthFunc),o.setTest(t.depthTest),o.setMask(t.depthWrite),a.setMask(t.colorWrite);let i=t.stencilWrite;s.setTest(i),i&&(s.setMask(t.stencilWriteMask),s.setFunc(t.stencilFunc,t.stencilRef,t.stencilFuncMask),s.setOp(t.stencilFail,t.stencilZFail,t.stencilZPass)),ge(t.polygonOffset,t.polygonOffsetFactor,t.polygonOffsetUnits),t.alphaToCoverage===!0?L(e.SAMPLE_ALPHA_TO_COVERAGE):R(e.SAMPLE_ALPHA_TO_COVERAGE)}function pe(t){D!==t&&(t?e.frontFace(e.CW):e.frontFace(e.CCW),D=t)}function me(t){t===0?R(e.CULL_FACE):(L(e.CULL_FACE),t!==O&&(t===1?e.cullFace(e.BACK):t===2?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))),O=t}function he(t){t!==k&&(M&&e.lineWidth(t),k=t)}function ge(t,n,r){t?(L(e.POLYGON_OFFSET_FILL),(A!==n||j!==r)&&(A=n,j=r,o.getReversed()&&(n=-n,r=-r),e.polygonOffset(n,r))):R(e.POLYGON_OFFSET_FILL)}function _e(t){t?L(e.SCISSOR_TEST):R(e.SCISSOR_TEST)}function ve(t){t===void 0&&(t=e.TEXTURE0+ee-1),ne!==t&&(e.activeTexture(t),ne=t)}function B(t,n,r){r===void 0&&(r=ne===null?e.TEXTURE0+ee-1:ne);let i=re[r];i===void 0&&(i={type:void 0,texture:void 0},re[r]=i),(i.type!==t||i.texture!==n)&&(ne!==r&&(e.activeTexture(r),ne=r),e.bindTexture(t,n||I[t]),i.type=t,i.texture=n)}function ye(){let t=re[ne];t!==void 0&&t.type!==void 0&&(e.bindTexture(t.type,null),t.type=void 0,t.texture=void 0)}function be(){try{e.compressedTexImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function xe(){try{e.compressedTexImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function V(){try{e.texSubImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Se(){try{e.texSubImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function H(){try{e.compressedTexSubImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function U(){try{e.compressedTexSubImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Ce(){try{e.texStorage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function we(){try{e.texStorage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Te(){try{e.texImage2D(...arguments)}catch(e){K(`WebGLState:`,e)}}function Ee(){try{e.texImage3D(...arguments)}catch(e){K(`WebGLState:`,e)}}function De(t){return d[t]===void 0?e.getParameter(t):d[t]}function Oe(t,n){d[t]!==n&&(e.pixelStorei(t,n),d[t]=n)}function ke(t){P.equals(t)===!1&&(e.scissor(t.x,t.y,t.z,t.w),P.copy(t))}function Ae(t){oe.equals(t)===!1&&(e.viewport(t.x,t.y,t.z,t.w),oe.copy(t))}function je(t,n){let r=l.get(n);r===void 0&&(r=new WeakMap,l.set(n,r));let i=r.get(t);i===void 0&&(i=e.getUniformBlockIndex(n,t.name),e.uniformBlockBinding(n,i,i),r.set(t,i))}function Me(t,n,r){let i=l.get(n).get(t);c[i]!==r&&(e.bindBufferBase(e.UNIFORM_BUFFER,i,r),c[i]=r)}function Ne(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),o.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},ne=null,re={},f={},c={},p=new WeakMap,m=[],h=null,g=!1,_=null,v=null,y=null,b=null,x=null,S=null,C=null,w=new Z(0,0,0),T=0,E=!1,D=null,O=null,k=null,A=null,j=null,P.set(0,0,e.canvas.width,e.canvas.height),oe.set(0,0,e.canvas.width,e.canvas.height),a.reset(),o.reset(),s.reset()}return{buffers:{color:a,depth:o,stencil:s},enable:L,disable:R,bindFramebuffer:se,drawBuffers:ce,useProgram:le,setBlending:z,setMaterial:fe,setFlipSided:pe,setCullFace:me,setLineWidth:he,setPolygonOffset:ge,setScissorTest:_e,activeTexture:ve,bindTexture:B,unbindTexture:ye,compressedTexImage2D:be,compressedTexImage3D:xe,texImage2D:Te,texImage3D:Ee,pixelStorei:Oe,getParameter:De,updateUBOMapping:je,uniformBlockBinding:Me,texStorage2D:Ce,texStorage3D:we,texSubImage2D:V,texSubImage3D:Se,compressedTexSubImage2D:H,compressedTexSubImage3D:U,scissor:ke,viewport:Ae,reset:Ne}}function rf(e,t,n,r,i,a,o){let s=t.has(`WEBGL_multisampled_render_to_texture`)?t.get(`WEBGL_multisampled_render_to_texture`):null,c=typeof navigator>`u`?!1:/OculusBrowser/g.test(navigator.userAgent),l=new J,u=new WeakMap,d=new Set,f,p=new WeakMap,m=new Set,h=new FinalizationRegistry(e=>m.delete(e)),g=!1;try{g=typeof OffscreenCanvas<`u`&&new OffscreenCanvas(1,1).getContext(`2d`)!==null}catch{}function _(e,t){return g?new OffscreenCanvas(e,t):Jr(`canvas`)}function v(e,t,n){let r=1,i=Ce(e);if((i.width>n||i.height>n)&&(r=n/Math.max(i.width,i.height)),r<1){if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof VideoFrame<`u`&&e instanceof VideoFrame){let n=Math.floor(r*i.width),a=Math.floor(r*i.height);f===void 0&&(f=_(n,a));let o=t?_(n,a):f;return o.width=n,o.height=a,o.getContext(`2d`).drawImage(e,0,0,n,a),G(`WebGLRenderer: Texture has been resized from (`+i.width+`x`+i.height+`) to (`+n+`x`+a+`).`),o}return`data`in e&&G(`WebGLRenderer: Image in DataTexture is too big (`+i.width+`x`+i.height+`).`),e}return e}function y(e){return e.generateMipmaps}function b(t){e.generateMipmap(t)}function x(t){return t.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:t.isWebGL3DRenderTarget?e.TEXTURE_3D:t.isWebGLArrayRenderTarget||t.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function S(n,r,i,a,o,s=!1){if(n!==null){if(e[n]!==void 0)return e[n];G(`WebGLRenderer: Attempt to use non-existing WebGL internal format '`+n+`'`)}let c;a&&(c=t.get(`EXT_texture_norm16`),c||G(`WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension`));let l=r;if(r===e.RED&&(i===e.FLOAT&&(l=e.R32F),i===e.HALF_FLOAT&&(l=e.R16F),i===e.UNSIGNED_BYTE&&(l=e.R8),i===e.UNSIGNED_SHORT&&c&&(l=c.R16_EXT),i===e.SHORT&&c&&(l=c.R16_SNORM_EXT)),r===e.RED_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.R8UI),i===e.UNSIGNED_SHORT&&(l=e.R16UI),i===e.UNSIGNED_INT&&(l=e.R32UI),i===e.BYTE&&(l=e.R8I),i===e.SHORT&&(l=e.R16I),i===e.INT&&(l=e.R32I)),r===e.RG&&(i===e.FLOAT&&(l=e.RG32F),i===e.HALF_FLOAT&&(l=e.RG16F),i===e.UNSIGNED_BYTE&&(l=e.RG8),i===e.UNSIGNED_SHORT&&c&&(l=c.RG16_EXT),i===e.SHORT&&c&&(l=c.RG16_SNORM_EXT)),r===e.RG_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RG8UI),i===e.UNSIGNED_SHORT&&(l=e.RG16UI),i===e.UNSIGNED_INT&&(l=e.RG32UI),i===e.BYTE&&(l=e.RG8I),i===e.SHORT&&(l=e.RG16I),i===e.INT&&(l=e.RG32I)),r===e.RGB_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGB8UI),i===e.UNSIGNED_SHORT&&(l=e.RGB16UI),i===e.UNSIGNED_INT&&(l=e.RGB32UI),i===e.BYTE&&(l=e.RGB8I),i===e.SHORT&&(l=e.RGB16I),i===e.INT&&(l=e.RGB32I)),r===e.RGBA_INTEGER&&(i===e.UNSIGNED_BYTE&&(l=e.RGBA8UI),i===e.UNSIGNED_SHORT&&(l=e.RGBA16UI),i===e.UNSIGNED_INT&&(l=e.RGBA32UI),i===e.BYTE&&(l=e.RGBA8I),i===e.SHORT&&(l=e.RGBA16I),i===e.INT&&(l=e.RGBA32I)),r===e.RGB&&(i===e.UNSIGNED_SHORT&&c&&(l=c.RGB16_EXT),i===e.SHORT&&c&&(l=c.RGB16_SNORM_EXT),i===e.UNSIGNED_INT_5_9_9_9_REV&&(l=e.RGB9_E5),i===e.UNSIGNED_INT_10F_11F_11F_REV&&(l=e.R11F_G11F_B10F)),r===e.RGBA){let t=s?Br:bi.getTransfer(o);i===e.FLOAT&&(l=e.RGBA32F),i===e.HALF_FLOAT&&(l=e.RGBA16F),i===e.UNSIGNED_BYTE&&(l=t===`srgb`?e.SRGB8_ALPHA8:e.RGBA8),i===e.UNSIGNED_SHORT&&c&&(l=c.RGBA16_EXT),i===e.SHORT&&c&&(l=c.RGBA16_SNORM_EXT),i===e.UNSIGNED_SHORT_4_4_4_4&&(l=e.RGBA4),i===e.UNSIGNED_SHORT_5_5_5_1&&(l=e.RGB5_A1)}return(l===e.R16F||l===e.R32F||l===e.RG16F||l===e.RG32F||l===e.RGBA16F||l===e.RGBA32F)&&t.get(`EXT_color_buffer_float`),l}function C(t,n){let r;return t?n===null||n===1014||n===1020?r=e.DEPTH24_STENCIL8:n===1015?r=e.DEPTH32F_STENCIL8:n===1012&&(r=e.DEPTH24_STENCIL8,G(`DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.`)):n===null||n===1014||n===1020?r=e.DEPTH_COMPONENT24:n===1015?r=e.DEPTH_COMPONENT32F:n===1012&&(r=e.DEPTH_COMPONENT16),r}function w(e,t){return y(e)===!0||e.isFramebufferTexture&&e.minFilter!==1003&&e.minFilter!==1006?Math.log2(Math.max(t.width,t.height))+1:e.mipmaps.length>0?e.mipmaps.length:e.isCompressedTexture&&Array.isArray(e.image)?t.mipmaps.length:1}function T(e){let t=new WeakRef(e);r.get(e).__ref=t,m.add(t),h.register(e,t,t)}function E(e){let t=r.get(e).__ref;t!==void 0&&(m.delete(t),h.unregister(t))}function D(e){k(e.target)}function O(e){A(e.target)}function k(e){e.removeEventListener(`dispose`,D),E(e),ee(e),e.isVideoTexture&&u.delete(e),e.isHTMLTexture&&d.delete(e)}function A(e){e.removeEventListener(`dispose`,O),E(e),N(e)}function j(){for(let e of m){let t=e.deref();t!==void 0&&(t.isRenderTarget===!0?A(t):k(t))}m.clear(),d.clear()}function ee(e){let t=r.get(e);if(t.__webglInit===void 0)return;let n=e.source,i=p.get(n);if(i){let r=i[t.__cacheKey];r.usedTimes--,r.usedTimes===0&&M(e),Object.keys(i).length===0&&p.delete(n)}r.remove(e)}function M(t){let n=r.get(t);e.deleteTexture(n.__webglTexture);let i=t.source,a=p.get(i);delete a[n.__cacheKey],o.memory.textures--}function N(t){let n=r.get(t);n.__depthDisposeCallback&&n.__depthDisposeCallback();let i=t.depthTexture;if(i&&i.renderTarget===t&&k(i),t.isWebGLCubeRenderTarget)for(let t=0;t<6;t++){if(Array.isArray(n.__webglFramebuffer[t]))for(let r=0;r<n.__webglFramebuffer[t].length;r++)e.deleteFramebuffer(n.__webglFramebuffer[t][r]);else e.deleteFramebuffer(n.__webglFramebuffer[t]);n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer[t])}else{if(Array.isArray(n.__webglFramebuffer))for(let t=0;t<n.__webglFramebuffer.length;t++)e.deleteFramebuffer(n.__webglFramebuffer[t]);else e.deleteFramebuffer(n.__webglFramebuffer);if(n.__webglDepthbuffer&&e.deleteRenderbuffer(n.__webglDepthbuffer),n.__webglMultisampledFramebuffer&&e.deleteFramebuffer(n.__webglMultisampledFramebuffer),n.__webglColorRenderbuffer)for(let t=0;t<n.__webglColorRenderbuffer.length;t++)n.__webglColorRenderbuffer[t]&&e.deleteRenderbuffer(n.__webglColorRenderbuffer[t]);n.__webglDepthRenderbuffer&&e.deleteRenderbuffer(n.__webglDepthRenderbuffer)}let a=t.textures;for(let t=0,n=a.length;t<n;t++){let n=r.get(a[t]);n.__webglTexture&&(e.deleteTexture(n.__webglTexture),o.memory.textures--),r.remove(a[t])}r.remove(t)}let te=0;function ne(){te=0}function re(){return te}function ie(e){te=e}function ae(){let e=te;return e>=i.maxTextures&&G(`WebGLTextures: Trying to use `+(e+1)+` texture units while this GPU supports only `+i.maxTextures),te+=1,e}function P(e){let t=[];return t.push(e.wrapS),t.push(e.wrapT),t.push(e.wrapR||0),t.push(e.magFilter),t.push(e.minFilter),t.push(e.anisotropy),t.push(e.internalFormat),t.push(e.format),t.push(e.type),t.push(e.generateMipmaps),t.push(e.mipmapsAutoUpdate),t.push(e.premultiplyAlpha),t.push(e.flipY),t.push(e.unpackAlignment),t.push(e.colorSpace),t.join()}function oe(t,i){let a=r.get(t);if(t.isVideoTexture&&H(t),t.isRenderTargetTexture===!1&&t.isExternalTexture!==!0&&t.version>0&&a.__version!==t.version){let e=t.image;if(e===null)G(`WebGLRenderer: Texture marked for update but no image data found.`);else if(e.complete===!1)G(`WebGLRenderer: Texture marked for update but image is incomplete`);else{fe(a,t,i);return}}else t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,a.__webglTexture,e.TEXTURE0+i)}function F(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?fe(a,t,i):(t.isExternalTexture&&(a.__webglTexture=t.sourceTexture?t.sourceTexture:null),n.bindTexture(e.TEXTURE_2D_ARRAY,a.__webglTexture,e.TEXTURE0+i))}function I(t,i){let a=r.get(t);t.isRenderTargetTexture===!1&&t.version>0&&a.__version!==t.version?fe(a,t,i):n.bindTexture(e.TEXTURE_3D,a.__webglTexture,e.TEXTURE0+i)}function L(t,i){let a=r.get(t);t.version>0&&a.__version!==t.version?pe(a,t,i):n.bindTexture(e.TEXTURE_CUBE_MAP,a.__webglTexture,e.TEXTURE0+i)}let R={[gn]:e.REPEAT,[_n]:e.CLAMP_TO_EDGE,[vn]:e.MIRRORED_REPEAT},se={[yn]:e.NEAREST,[bn]:e.NEAREST_MIPMAP_NEAREST,[xn]:e.NEAREST_MIPMAP_LINEAR,[Sn]:e.LINEAR,[Cn]:e.LINEAR_MIPMAP_NEAREST,[wn]:e.LINEAR_MIPMAP_LINEAR},ce={512:e.NEVER,519:e.ALWAYS,513:e.LESS,515:e.LEQUAL,514:e.EQUAL,518:e.GEQUAL,516:e.GREATER,517:e.NOTEQUAL};function le(n,a){if(a.type===1015&&t.has(`OES_texture_float_linear`)===!1&&(a.magFilter===1006||a.magFilter===1007||a.magFilter===1005||a.magFilter===1008||a.minFilter===1006||a.minFilter===1007||a.minFilter===1005||a.minFilter===1008)&&G(`WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device.`),e.texParameteri(n,e.TEXTURE_WRAP_S,R[a.wrapS]),e.texParameteri(n,e.TEXTURE_WRAP_T,R[a.wrapT]),(n===e.TEXTURE_3D||n===e.TEXTURE_2D_ARRAY)&&e.texParameteri(n,e.TEXTURE_WRAP_R,R[a.wrapR]),e.texParameteri(n,e.TEXTURE_MAG_FILTER,se[a.magFilter]),e.texParameteri(n,e.TEXTURE_MIN_FILTER,se[a.minFilter]),a.compareFunction&&(e.texParameteri(n,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(n,e.TEXTURE_COMPARE_FUNC,ce[a.compareFunction])),t.has(`EXT_texture_filter_anisotropic`)===!0){if(a.magFilter===1003||a.minFilter!==1005&&a.minFilter!==1008||a.type===1015&&t.has(`OES_texture_float_linear`)===!1)return;if(a.anisotropy>1||r.get(a).__currentAnisotropy){let o=t.get(`EXT_texture_filter_anisotropic`);e.texParameterf(n,o.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(a.anisotropy,i.getMaxAnisotropy())),r.get(a).__currentAnisotropy=a.anisotropy}}}function ue(t,n){let r=!1;t.__webglInit===void 0&&(t.__webglInit=!0,n.addEventListener(`dispose`,D),T(n));let i=n.source,a=p.get(i);a===void 0&&(a={},p.set(i,a));let s=P(n);if(s!==t.__cacheKey){a[s]===void 0&&(a[s]={texture:e.createTexture(),usedTimes:0},o.memory.textures++,r=!0),a[s].usedTimes++;let i=a[t.__cacheKey];i!==void 0&&(a[t.__cacheKey].usedTimes--,i.usedTimes===0&&M(n)),t.__cacheKey=s,t.__webglTexture=a[s].texture}return r}function de(e,t,n){return Math.floor(Math.floor(e/n)/t)}function z(t,r,i,a){let o=t.updateRanges;if(o.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,r.width,r.height,i,a,r.data);else{o.sort((e,t)=>e.start-t.start);let s=0;for(let e=1;e<o.length;e++){let t=o[s],n=o[e],i=t.start+t.count,a=de(n.start,r.width,4),c=de(t.start,r.width,4);n.start<=i+1&&a===c&&de(n.start+n.count-1,r.width,4)===a?t.count=Math.max(t.count,n.start+n.count-t.start):(++s,o[s]=n)}o.length=s+1;let c=n.getParameter(e.UNPACK_ROW_LENGTH),l=n.getParameter(e.UNPACK_SKIP_PIXELS),u=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,r.width);for(let t=0,s=o.length;t<s;t++){let s=o[t],c=Math.floor(s.start/4),l=Math.ceil(s.count/4),u=c%r.width,d=Math.floor(c/r.width),f=l;n.pixelStorei(e.UNPACK_SKIP_PIXELS,u),n.pixelStorei(e.UNPACK_SKIP_ROWS,d),n.texSubImage2D(e.TEXTURE_2D,0,u,d,f,1,i,a,r.data)}t.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,c),n.pixelStorei(e.UNPACK_SKIP_PIXELS,l),n.pixelStorei(e.UNPACK_SKIP_ROWS,u)}}function fe(t,o,s){let c=e.TEXTURE_2D;(o.isDataArrayTexture||o.isCompressedArrayTexture)&&(c=e.TEXTURE_2D_ARRAY),o.isData3DTexture&&(c=e.TEXTURE_3D);let l=ue(t,o),u=o.source;n.bindTexture(c,t.__webglTexture,e.TEXTURE0+s);let f=r.get(u);if(u.version!==f.__version||l===!0){if(n.activeTexture(e.TEXTURE0+s),!(typeof ImageBitmap<`u`&&o.image instanceof ImageBitmap)){let t=bi.getPrimaries(bi.workingColorSpace),r=o.colorSpace===``?null:bi.getPrimaries(o.colorSpace),i=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,i)}n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment);let t=v(o.image,!1,i.maxTextureSize);t=U(o,t);let r=a.convert(o.format,o.colorSpace),p=a.convert(o.type),m=S(o.internalFormat,r,p,o.normalized,o.colorSpace,o.isVideoTexture);le(c,o);let h,g=o.mipmaps,_=o.isVideoTexture!==!0,x=f.__version===void 0||l===!0,T=u.dataReady,E=w(o,t);if(o.isDepthTexture)m=C(o.format===Hn,o.type),x&&(_?n.texStorage2D(e.TEXTURE_2D,1,m,t.width,t.height):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,null));else if(o.isDataTexture){if(g.length>0){_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data);o.generateMipmaps=!1}else _?(x&&n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height),T&&z(o,t,r,p)):n.texImage2D(e.TEXTURE_2D,0,m,t.width,t.height,0,r,p,t.data)}else if(o.isCompressedTexture){if(o.isCompressedArrayTexture){_&&x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,g[0].width,g[0].height,t.depth);for(let i=0,a=g.length;i<a;i++)if(h=g[i],o.format!==1023){if(r!==null){if(_){if(T){if(o.layerUpdates.size>0){let t=al(h.width,h.height,o.format,o.type);for(let a of o.layerUpdates){let o=h.data.subarray(a*t/h.data.BYTES_PER_ELEMENT,(a+1)*t/h.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,a,h.width,h.height,1,r,o)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,h.data)}}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,h.data,0,0)}else G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`)}else _?T&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,i,0,0,0,h.width,h.height,t.depth,r,p,h.data):n.texImage3D(e.TEXTURE_2D_ARRAY,i,m,h.width,h.height,t.depth,0,r,p,h.data);o.layerUpdates.size>0&&o.clearLayerUpdates()}else{_&&x&&n.texStorage2D(e.TEXTURE_2D,E,m,g[0].width,g[0].height);for(let t=0,i=g.length;t<i;t++)h=g[t],o.format===1023?_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,p,h.data):n.texImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,r,p,h.data):r===null?G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()`):_?T&&n.compressedTexSubImage2D(e.TEXTURE_2D,t,0,0,h.width,h.height,r,h.data):n.compressedTexImage2D(e.TEXTURE_2D,t,m,h.width,h.height,0,h.data)}}else if(o.isDataArrayTexture){if(_){if(x&&n.texStorage3D(e.TEXTURE_2D_ARRAY,E,m,t.width,t.height,t.depth),T){if(o.layerUpdates.size>0){let i=al(t.width,t.height,o.format,o.type);for(let a of o.layerUpdates){let o=t.data.subarray(a*i/t.data.BYTES_PER_ELEMENT,(a+1)*i/t.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,a,t.width,t.height,1,r,p,o)}o.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)}}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,m,t.width,t.height,t.depth,0,r,p,t.data)}else if(o.isData3DTexture)_?(x&&n.texStorage3D(e.TEXTURE_3D,E,m,t.width,t.height,t.depth),T&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,t.width,t.height,t.depth,r,p,t.data)):n.texImage3D(e.TEXTURE_3D,0,m,t.width,t.height,t.depth,0,r,p,t.data);else if(o.isFramebufferTexture){if(x){if(_)n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height);else{let i=t.width,a=t.height;for(let t=0;t<E;t++)n.texImage2D(e.TEXTURE_2D,t,m,i,a,0,r,p,null),i>>=1,a>>=1}}}else if(o.isHTMLTexture){if(`texElementImage2D`in e){let n=e.canvas;if(n.hasAttribute(`layoutsubtree`)||n.setAttribute(`layoutsubtree`,`true`),t.parentNode!==n){n.appendChild(t),d.add(o),n.onpaint=e=>{let t=e.changedElements;for(let e of d)t.includes(e.image)&&(e.needsUpdate=!0)},n.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,t);else{let n=e.RGBA,r=e.RGBA,i=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,n,r,i,t)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(g.length>0){if(_&&x){let t=Ce(g[0]);n.texStorage2D(e.TEXTURE_2D,E,m,t.width,t.height)}for(let t=0,i=g.length;t<i;t++)h=g[t],_?T&&n.texSubImage2D(e.TEXTURE_2D,t,0,0,r,p,h):n.texImage2D(e.TEXTURE_2D,t,m,r,p,h);o.generateMipmaps=!1}else if(_){if(x){let r=Ce(t);n.texStorage2D(e.TEXTURE_2D,E,m,r.width,r.height)}T&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,r,p,t)}else n.texImage2D(e.TEXTURE_2D,0,m,r,p,t);y(o)&&o.mipmapsAutoUpdate===!0&&b(c),f.__version=u.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function pe(t,o,s){if(o.image.length!==6)return;let c=ue(t,o),l=o.source;n.bindTexture(e.TEXTURE_CUBE_MAP,t.__webglTexture,e.TEXTURE0+s);let u=r.get(l);if(l.version!==u.__version||c===!0){n.activeTexture(e.TEXTURE0+s);let t=bi.getPrimaries(bi.workingColorSpace),r=o.colorSpace===``?null:bi.getPrimaries(o.colorSpace),d=o.colorSpace===``||t===r?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,o.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,o.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,o.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,d);let f=o.isCompressedTexture||o.image[0].isCompressedTexture,p=o.image[0]&&o.image[0].isDataTexture,m=[];for(let e=0;e<6;e++)!f&&!p?m[e]=v(o.image[e],!0,i.maxCubemapSize):m[e]=p?o.image[e].image:o.image[e],m[e]=U(o,m[e]);let h=m[0],g=a.convert(o.format,o.colorSpace),_=a.convert(o.type),x=S(o.internalFormat,g,_,o.normalized,o.colorSpace),T=o.isVideoTexture!==!0,E=u.__version===void 0||c===!0,D=l.dataReady,O=w(o,h);le(e.TEXTURE_CUBE_MAP,o);let k;if(o.isDepthTexture){if(x=C(o.format===Hn,o.type),E){if(T)n.texStorage2D(e.TEXTURE_CUBE_MAP,1,x,h.width,h.height);else for(let t=0;t<6;t++)n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,h.width,h.height,0,g,_,null)}}else if(f){T&&E&&n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,h.width,h.height);for(let t=0;t<6;t++){k=m[t].mipmaps;for(let r=0;r<k.length;r++){let i=k[r];o.format===1023?T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,g,_,i.data):g===null?G(`WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()`):T?D&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,0,0,i.width,i.height,g,i.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r,x,i.width,i.height,0,i.data)}}}else{if(k=o.mipmaps,T&&E){k.length>0&&O++;let t=Ce(m[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,O,x,t.width,t.height)}for(let t=0;t<6;t++)if(p){T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,m[t].width,m[t].height,g,_,m[t].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,m[t].width,m[t].height,0,g,_,m[t].data);for(let r=0;r<k.length;r++){let i=k[r].image[t].image;T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,i.width,i.height,g,_,i.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,i.width,i.height,0,g,_,i.data)}}else{T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,0,0,g,_,m[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,0,x,g,_,m[t]);for(let r=0;r<k.length;r++){let i=k[r];T?D&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,0,0,g,_,i.image[t]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+t,r+1,x,g,_,i.image[t])}}}y(o)&&o.mipmapsAutoUpdate===!0&&b(e.TEXTURE_CUBE_MAP),u.__version=l.version,o.onUpdate&&o.onUpdate(o)}t.__version=o.version}function me(t,i,o,c,l,u){let d=a.convert(o.format,o.colorSpace),f=a.convert(o.type),p=S(o.internalFormat,d,f,o.normalized,o.colorSpace),m=r.get(i),h=r.get(o);if(h.__renderTarget=i,!m.__hasExternalTextures){let t=Math.max(1,i.width>>u),r=Math.max(1,i.height>>u);l===e.TEXTURE_3D||l===e.TEXTURE_2D_ARRAY?n.texImage3D(l,u,p,t,r,i.depth,0,d,f,null):n.texImage2D(l,u,p,t,r,0,d,f,null)}n.bindFramebuffer(e.FRAMEBUFFER,t),Se(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,c,l,h.__webglTexture,0,V(i)):(l===e.TEXTURE_2D||l>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&l<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,c,l,h.__webglTexture,u),n.bindFramebuffer(e.FRAMEBUFFER,null)}function he(t,n,r){if(e.bindRenderbuffer(e.RENDERBUFFER,t),n.depthBuffer){let i=n.depthTexture,a=i&&i.isDepthTexture?i.type:null,o=C(n.stencilBuffer,a),c=n.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Se(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,V(n),o,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,V(n),o,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,o,n.width,n.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,c,e.RENDERBUFFER,t)}else{let t=n.textures;for(let i=0;i<t.length;i++){let o=t[i],c=a.convert(o.format,o.colorSpace),l=a.convert(o.type),u=S(o.internalFormat,c,l,o.normalized,o.colorSpace);Se(n)?s.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,V(n),u,n.width,n.height):r?e.renderbufferStorageMultisample(e.RENDERBUFFER,V(n),u,n.width,n.height):e.renderbufferStorage(e.RENDERBUFFER,u,n.width,n.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function ge(t,i,a){let o=i.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,t),!(i.depthTexture&&i.depthTexture.isDepthTexture))throw Error(`THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.`);let c=r.get(i.depthTexture);c.__renderTarget=i;let l=o?i.depthTexture.image[0]:i.depthTexture.image;c.__webglTexture&&l.width===i.width&&l.height===i.height||(l.width=i.width,l.height=i.height,i.depthTexture.needsUpdate=!0),o?L(i.depthTexture,0):oe(i.depthTexture,0);let u=c.__webglTexture,d=V(i),f=o?e.TEXTURE_CUBE_MAP_POSITIVE_X+a:e.TEXTURE_2D,p=i.depthTexture.format===1027?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(i.depthTexture.format===1026)Se(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else if(i.depthTexture.format===1027)Se(i)?s.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,p,f,u,0,d):e.framebufferTexture2D(e.FRAMEBUFFER,p,f,u,0);else throw Error(`THREE.WebGLTextures: Unknown depthTexture format.`)}function _e(t){let i=r.get(t),a=t.isWebGLCubeRenderTarget===!0;if(i.__boundDepthTexture!==t.depthTexture){let e=t.depthTexture;if(i.__depthDisposeCallback&&i.__depthDisposeCallback(),e){let t=()=>{delete i.__boundDepthTexture,delete i.__depthDisposeCallback,e.removeEventListener(`dispose`,t)};e.addEventListener(`dispose`,t),i.__depthDisposeCallback=t}i.__boundDepthTexture=e}if(t.depthTexture&&!i.__autoAllocateDepthBuffer){if(a)for(let e=0;e<6;e++)ge(i.__webglFramebuffer[e],t,e);else t.texture.mipmaps.length>0?ge(i.__webglFramebuffer[0],t,0):ge(i.__webglFramebuffer,t,0)}else if(a){i.__webglDepthbuffer=[];for(let r=0;r<6;r++)if(n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[r]),i.__webglDepthbuffer[r]===void 0)i.__webglDepthbuffer[r]=e.createRenderbuffer(),he(i.__webglDepthbuffer[r],t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,a=i.__webglDepthbuffer[r];e.bindRenderbuffer(e.RENDERBUFFER,a),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,a)}}else if(t.texture.mipmaps.length>0?n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,i.__webglFramebuffer),i.__webglDepthbuffer===void 0)i.__webglDepthbuffer=e.createRenderbuffer(),he(i.__webglDepthbuffer,t,!1);else{let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,r=i.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,r),e.framebufferRenderbuffer(e.FRAMEBUFFER,n,e.RENDERBUFFER,r)}n.bindFramebuffer(e.FRAMEBUFFER,null)}function ve(t,n,i){let a=r.get(t);n!==void 0&&me(a.__webglFramebuffer,t,t.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),i!==void 0&&_e(t)}function B(t){let i=t.texture,s=r.get(t),c=r.get(i);t.addEventListener(`dispose`,O),T(t);let l=t.textures,u=t.isWebGLCubeRenderTarget===!0,d=l.length>1;if(d||(c.__webglTexture===void 0&&(c.__webglTexture=e.createTexture()),c.__version=i.version,o.memory.textures++),u){s.__webglFramebuffer=[];for(let t=0;t<6;t++)if(i.mipmaps.length>0){s.__webglFramebuffer[t]=[];for(let n=0;n<i.mipmaps.length;n++)s.__webglFramebuffer[t][n]=e.createFramebuffer()}else s.__webglFramebuffer[t]=e.createFramebuffer()}else{if(i.mipmaps.length>0){s.__webglFramebuffer=[];for(let t=0;t<i.mipmaps.length;t++)s.__webglFramebuffer[t]=e.createFramebuffer()}else s.__webglFramebuffer=e.createFramebuffer();if(d)for(let t=0,n=l.length;t<n;t++){let n=r.get(l[t]);n.__webglTexture===void 0&&(n.__webglTexture=e.createTexture(),o.memory.textures++)}if(t.samples>0&&Se(t)===!1){s.__webglMultisampledFramebuffer=e.createFramebuffer(),s.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,s.__webglMultisampledFramebuffer);for(let n=0;n<l.length;n++){let r=l[n];s.__webglColorRenderbuffer[n]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,s.__webglColorRenderbuffer[n]);let i=a.convert(r.format,r.colorSpace),o=a.convert(r.type),c=S(r.internalFormat,i,o,r.normalized,r.colorSpace,t.isXRRenderTarget===!0),u=V(t);e.renderbufferStorageMultisample(e.RENDERBUFFER,u,c,t.width,t.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+n,e.RENDERBUFFER,s.__webglColorRenderbuffer[n])}e.bindRenderbuffer(e.RENDERBUFFER,null),t.depthBuffer&&(s.__webglDepthRenderbuffer=e.createRenderbuffer(),he(s.__webglDepthRenderbuffer,t,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(u){n.bindTexture(e.TEXTURE_CUBE_MAP,c.__webglTexture),le(e.TEXTURE_CUBE_MAP,i);for(let n=0;n<6;n++)if(i.mipmaps.length>0)for(let r=0;r<i.mipmaps.length;r++)me(s.__webglFramebuffer[n][r],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,r);else me(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+n,0);y(i)?b(e.TEXTURE_CUBE_MAP):i.mipmaps.length>0&&e.texParameteri(e.TEXTURE_CUBE_MAP,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}else if(d){for(let i=0,a=l.length;i<a;i++){let a=l[i],o=r.get(a),c=e.TEXTURE_2D;(t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(c=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(c,o.__webglTexture),le(c,a),me(s.__webglFramebuffer,t,a,e.COLOR_ATTACHMENT0+i,c,0),y(a)&&b(c)}n.unbindTexture()}else{let r=e.TEXTURE_2D;if((t.isWebGL3DRenderTarget||t.isWebGLArrayRenderTarget)&&(r=t.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(r,c.__webglTexture),le(r,i),i.mipmaps.length>0)for(let n=0;n<i.mipmaps.length;n++)me(s.__webglFramebuffer[n],t,i,e.COLOR_ATTACHMENT0,r,n);else me(s.__webglFramebuffer,t,i,e.COLOR_ATTACHMENT0,r,0);y(i)?b(r):i.mipmaps.length>0&&e.texParameteri(r,e.TEXTURE_MAX_LEVEL,i.mipmaps.length-1),n.unbindTexture()}t.depthBuffer&&_e(t)}function ye(e){let t=e.textures;for(let i=0,a=t.length;i<a;i++){let a=t[i];if(y(a)&&a.mipmapsAutoUpdate===!0){let t=x(e),i=r.get(a).__webglTexture;n.bindTexture(t,i),b(t),n.unbindTexture()}}}let be=[];function xe(t){if(t.samples>0){if(Se(t)===!1){let i=t.textures,a=t.width,o=t.height,s=e.COLOR_BUFFER_BIT,l=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,u=r.get(t),d=i.length>1;if(d)for(let t=0;t<i.length;t++)n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,u.__webglMultisampledFramebuffer),t.texture.mipmaps.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglFramebuffer);for(let n=0;n<i.length;n++){if(t.resolveDepthBuffer&&(t.depthBuffer&&(s|=e.DEPTH_BUFFER_BIT),t.stencilBuffer&&t.resolveStencilBuffer&&(s|=e.STENCIL_BUFFER_BIT)),d){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,u.__webglColorRenderbuffer[n]);let t=r.get(i[n]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,t,0)}e.blitFramebuffer(0,0,a,o,0,0,a,o,s,e.NEAREST),c===!0&&(be.length=0,be.push(e.COLOR_ATTACHMENT0+n),t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&be.push(l),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,be))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),d)for(let t=0;t<i.length;t++){n.bindFramebuffer(e.FRAMEBUFFER,u.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.RENDERBUFFER,u.__webglColorRenderbuffer[t]);let a=r.get(i[t]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,u.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+t,e.TEXTURE_2D,a,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,u.__webglMultisampledFramebuffer)}else if(t.depthBuffer&&t.storeMultisampledDepthBuffer===!1&&c){let n=t.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[n])}}}function V(e){return Math.min(i.maxSamples,e.samples)}function Se(e){let n=r.get(e);return e.samples>0&&t.has(`WEBGL_multisampled_render_to_texture`)===!0&&n.__useRenderToTexture!==!1}function H(e){let t=o.render.frame;u.get(e)!==t&&(u.set(e,t),e.update())}function U(e,t){let n=e.colorSpace,r=e.format,i=e.type;return e.isCompressedTexture===!0||e.isVideoTexture===!0||n!==`srgb-linear`&&n!==``&&(bi.getTransfer(n)===`srgb`?(r!==1023||i!==1009)&&G(`WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType.`):K(`WebGLTextures: Unsupported texture color space:`,n)),t}function Ce(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement?(l.width=e.naturalWidth||e.width,l.height=e.naturalHeight||e.height):typeof VideoFrame<`u`&&e instanceof VideoFrame?(l.width=e.displayWidth,l.height=e.displayHeight):(l.width=e.width,l.height=e.height),l}this.allocateTextureUnit=ae,this.resetTextureUnits=ne,this.getTextureUnits=re,this.setTextureUnits=ie,this.setTexture2D=oe,this.setTexture2DArray=F,this.setTexture3D=I,this.setTextureCube=L,this.rebindTextures=ve,this.setupRenderTarget=B,this.updateRenderTargetMipmap=ye,this.updateMultisampleRenderTarget=xe,this.setupDepthRenderbuffer=_e,this.setupFrameBufferTexture=me,this.useMultisampledRTT=Se,this.dispose=j}function af(e,t){function n(n,r=``){let i,a=bi.getTransfer(r);if(n===1009)return e.UNSIGNED_BYTE;if(n===1017)return e.UNSIGNED_SHORT_4_4_4_4;if(n===1018)return e.UNSIGNED_SHORT_5_5_5_1;if(n===35902)return e.UNSIGNED_INT_5_9_9_9_REV;if(n===35899)return e.UNSIGNED_INT_10F_11F_11F_REV;if(n===1010)return e.BYTE;if(n===1011)return e.SHORT;if(n===1012)return e.UNSIGNED_SHORT;if(n===1013)return e.INT;if(n===1014)return e.UNSIGNED_INT;if(n===1015)return e.FLOAT;if(n===1016)return e.HALF_FLOAT;if(n===1021)return e.ALPHA;if(n===1022)return e.RGB;if(n===1023)return e.RGBA;if(n===1026)return e.DEPTH_COMPONENT;if(n===1027)return e.DEPTH_STENCIL;if(n===1028)return e.RED;if(n===1029)return e.RED_INTEGER;if(n===1030)return e.RG;if(n===1031)return e.RG_INTEGER;if(n===1033)return e.RGBA_INTEGER;if(n===33776||n===33777||n===33778||n===33779){if(a===`srgb`){if(i=t.get(`WEBGL_compressed_texture_s3tc_srgb`),i!==null){if(n===33776)return i.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null}else if(i=t.get(`WEBGL_compressed_texture_s3tc`),i!==null){if(n===33776)return i.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===33777)return i.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===33778)return i.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===33779)return i.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null}if(n===35840||n===35841||n===35842||n===35843){if(i=t.get(`WEBGL_compressed_texture_pvrtc`),i!==null){if(n===35840)return i.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===35841)return i.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===35842)return i.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===35843)return i.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null}if(n===36196||n===37492||n===37496||n===37488||n===37489||n===37490||n===37491){if(i=t.get(`WEBGL_compressed_texture_etc`),i!==null){if(n===36196||n===37492)return a===`srgb`?i.COMPRESSED_SRGB8_ETC2:i.COMPRESSED_RGB8_ETC2;if(n===37496)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:i.COMPRESSED_RGBA8_ETC2_EAC;if(n===37488)return i.COMPRESSED_R11_EAC;if(n===37489)return i.COMPRESSED_SIGNED_R11_EAC;if(n===37490)return i.COMPRESSED_RG11_EAC;if(n===37491)return i.COMPRESSED_SIGNED_RG11_EAC}else return null}if(n===37808||n===37809||n===37810||n===37811||n===37812||n===37813||n===37814||n===37815||n===37816||n===37817||n===37818||n===37819||n===37820||n===37821){if(i=t.get(`WEBGL_compressed_texture_astc`),i!==null){if(n===37808)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:i.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===37809)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:i.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===37810)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:i.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===37811)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:i.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===37812)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:i.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===37813)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:i.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===37814)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:i.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===37815)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:i.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===37816)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:i.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===37817)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:i.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===37818)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:i.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===37819)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:i.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===37820)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:i.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===37821)return a===`srgb`?i.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:i.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null}if(n===36492||n===36494||n===36495){if(i=t.get(`EXT_texture_compression_bptc`),i!==null){if(n===36492)return a===`srgb`?i.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:i.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===36494)return i.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===36495)return i.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null}if(n===36283||n===36284||n===36285||n===36286){if(i=t.get(`EXT_texture_compression_rgtc`),i!==null){if(n===36283)return i.COMPRESSED_RED_RGTC1_EXT;if(n===36284)return i.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===36285)return i.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===36286)return i.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null}return n===1020?e.UNSIGNED_INT_24_8:e[n]===void 0?null:e[n]}return{convert:n}}var of=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,sf=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,cf=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let n=new Ns(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Gs({vertexShader:of,fragmentShader:sf,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new rs(new Fs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},lf=class extends ni{constructor(e,t){super();let n=this,r=null,i=1,a=null,o=`local-floor`,s=1,c=null,l=null,u=null,d=null,f=null,p=null,m=typeof XRWebGLBinding<`u`,h=new cf,g={},_=t.getContextAttributes(),v=null,y=null,b=[],x=[],S=new J,C=null,w=null,T=new jc;T.viewport=new ji;let E=new jc;E.viewport=new ji;let D=[T,E],O=new Bc,k=null,A=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(e){let t=b[e];return t===void 0&&(t=new fa,b[e]=t),t.getTargetRaySpace()},this.getControllerGrip=function(e){let t=b[e];return t===void 0&&(t=new fa,b[e]=t),t.getGripSpace()},this.getHand=function(e){let t=b[e];return t===void 0&&(t=new fa,b[e]=t),t.getHandSpace()};function j(e){let t=x.indexOf(e.inputSource);if(t===-1)return;let n=b[t];n!==void 0&&(n.update(e.inputSource,e.frame,c||a),n.dispatchEvent({type:e.type,data:e.inputSource}))}function ee(){r.removeEventListener(`select`,j),r.removeEventListener(`selectstart`,j),r.removeEventListener(`selectend`,j),r.removeEventListener(`squeeze`,j),r.removeEventListener(`squeezestart`,j),r.removeEventListener(`squeezeend`,j),r.removeEventListener(`end`,ee),r.removeEventListener(`inputsourceschange`,M);for(let e=0;e<b.length;e++){let t=x[e];t!==null&&(x[e]=null,b[e].disconnect(t))}k=null,A=null,h.reset();for(let e in g)delete g[e];if(e.setRenderTarget(v),f=null,d=null,u=null,r=null,y=null,ie.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(S.width,S.height,!1),w!==null){let e=w.camera;e.fov=w.fov,e.zoom=w.zoom,e.updateProjectionMatrix(),w=null}n.dispatchEvent({type:`sessionend`})}this.setFramebufferScaleFactor=function(e){i=e,n.isPresenting===!0&&G(`WebXRManager: Cannot change framebuffer scale while presenting.`)},this.setReferenceSpaceType=function(e){o=e,n.isPresenting===!0&&G(`WebXRManager: Cannot change reference space type while presenting.`)},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(e){c=e},this.getBaseLayer=function(){return d===null?f:d},this.getBinding=function(){return u===null&&m&&(u=new XRWebGLBinding(r,t)),u},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(l){if(r=l,r!==null){if(v=e.getRenderTarget(),r.addEventListener(`select`,j),r.addEventListener(`selectstart`,j),r.addEventListener(`selectend`,j),r.addEventListener(`squeeze`,j),r.addEventListener(`squeezestart`,j),r.addEventListener(`squeezeend`,j),r.addEventListener(`end`,ee),r.addEventListener(`inputsourceschange`,M),_.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(S),m&&`createProjectionLayer`in XRWebGLBinding.prototype){let n=null,a=null,o=null;_.depth&&(o=_.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,n=_.stencil?Hn:Vn,a=_.stencil?Fn:An);let s={colorFormat:t.RGBA8,depthFormat:o,scaleFactor:i};u=this.getBinding(),d=u.createProjectionLayer(s),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),y=new Ni(d.textureWidth,d.textureHeight,{format:Bn,type:Tn,depthTexture:new js(d.textureWidth,d.textureHeight,a,void 0,void 0,void 0,void 0,void 0,void 0,n),stencilBuffer:_.stencil,colorSpace:e.outputColorSpace,samples:_.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let n={antialias:_.antialias,alpha:!0,depth:_.depth,stencil:_.stencil,framebufferScaleFactor:i};f=new XRWebGLLayer(r,t,n),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),y=new Ni(f.framebufferWidth,f.framebufferHeight,{format:Bn,type:Tn,colorSpace:e.outputColorSpace,stencilBuffer:_.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(s),c=null,a=await r.requestReferenceSpace(o),ie.setContext(r),ie.start(),n.isPresenting=!0,n.dispatchEvent({type:`sessionstart`})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return h.getDepthTexture()};function M(e){for(let t=0;t<e.removed.length;t++){let n=e.removed[t],r=x.indexOf(n);r>=0&&(x[r]=null,b[r].disconnect(n))}for(let t=0;t<e.added.length;t++){let n=e.added[t],r=x.indexOf(n);if(r===-1){for(let e=0;e<b.length;e++)if(e>=x.length){x.push(n),r=e;break}else if(x[e]===null){x[e]=n,r=e;break}if(r===-1)break}let i=b[r];i&&i.connect(n)}}function N(e,t){t===null?e.matrixWorld.copy(e.matrix):e.matrixWorld.multiplyMatrices(t.matrixWorld,e.matrix),e.matrixWorldInverse.copy(e.matrixWorld).invert()}this.updateCamera=function(e){if(r===null)return;let t=e.near,n=e.far;h.texture!==null&&(h.depthNear>0&&(t=h.depthNear),h.depthFar>0&&(n=h.depthFar)),O.near=E.near=T.near=t,O.far=E.far=T.far=n,(k!==O.near||A!==O.far)&&(r.updateRenderState({depthNear:O.near,depthFar:O.far}),k=O.near,A=O.far),O.layers.mask=e.layers.mask|6,T.layers.mask=O.layers.mask&-5,E.layers.mask=O.layers.mask&-3;let i=e.parent,a=O.cameras;N(O,i);for(let e=0;e<a.length;e++)N(a[e],i);O.projectionMatrix.copy(T.projectionMatrix),O.projectionMatrixInverse.copy(T.projectionMatrixInverse),w===null&&e.isPerspectiveCamera&&(w={camera:e,fov:e.fov,zoom:e.zoom}),te(e,O,i)};function te(e,t,n){n===null?e.matrix.copy(t.matrixWorld):(e.matrix.copy(n.matrixWorld),e.matrix.invert(),e.matrix.multiply(t.matrixWorld)),e.matrix.decompose(e.position,e.quaternion,e.scale),e.updateMatrixWorld(!0),e.projectionMatrix.copy(t.projectionMatrix),e.projectionMatrixInverse.copy(t.projectionMatrixInverse),e.isPerspectiveCamera&&(e.fov=ai*2*Math.atan(1/e.projectionMatrix.elements[5]),e.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(d!==null||f!==null)return s},this.setFoveation=function(e){s=e,d!==null&&(d.fixedFoveation=e),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=e)},this.hasDepthSensing=function(){return h.texture!==null},this.getDepthSensingMesh=function(){return h.getMesh(O)},this.getCameraTexture=function(e){return g[e]};let ne=null;function re(t,i){if(l=i.getViewerPose(c||a),p=i,l!==null){let t=l.views;f!==null&&(e.setRenderTargetFramebuffer(y,f.framebuffer),e.setRenderTarget(y));let i=!1;t.length!==O.cameras.length&&(O.cameras.length=0,i=!0);for(let n=0;n<t.length;n++){let r=t[n],a=null;if(f!==null)a=f.getViewport(r);else{let t=u.getViewSubImage(d,r);a=t.viewport,n===0&&(e.setRenderTargetTextures(y,t.colorTexture,t.depthStencilTexture),e.setRenderTarget(y))}let o=D[n];o===void 0&&(o=new jc,o.layers.enable(n),o.viewport=new ji,D[n]=o),o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.projectionMatrix.fromArray(r.projectionMatrix),o.projectionMatrixInverse.copy(o.projectionMatrix).invert(),o.viewport.set(a.x,a.y,a.width,a.height),n===0&&(O.matrix.copy(o.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),i===!0&&O.cameras.push(o)}let a=r.enabledFeatures;if(a&&a.includes(`depth-sensing`)&&r.depthUsage==`gpu-optimized`&&m){u=n.getBinding();let e=u.getDepthInformation(t[0]);e&&e.isValid&&e.texture&&h.init(e,r.renderState)}if(a&&a.includes(`camera-access`)&&m){e.state.unbindTexture(),u=n.getBinding();for(let e=0;e<t.length;e++){let n=t[e].camera;if(n){let e=g[n];e||(e=new Ns,g[n]=e);let t=u.getCameraImage(n);e.sourceTexture=t}}}}for(let e=0;e<b.length;e++){let t=x[e],n=b[e];t!==null&&n!==void 0&&n.update(t,i,c||a)}ne&&ne(t,i),i.detectedPlanes&&n.dispatchEvent({type:`planesdetected`,data:i}),p=null}let ie=new sl;ie.setAnimationLoop(re),this.setAnimationLoop=function(e){ne=e},this.dispose=function(){}}},uf=new Ii,df=new X;df.set(-1,0,0,0,1,0,0,0,1);function ff(e,t){function n(e,t){e.matrixAutoUpdate===!0&&e.updateMatrix(),t.value.copy(e.matrix)}function r(t,n){n.color.getRGB(t.fogColor.value,Vs(e)),n.isFog?(t.fogNear.value=n.near,t.fogFar.value=n.far):n.isFogExp2&&(t.fogDensity.value=n.density)}function i(e,t,n,r,i){t.isNodeMaterial?t.uniformsNeedUpdate=!1:t.isMeshBasicMaterial?a(e,t):t.isMeshLambertMaterial?(a(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshToonMaterial?(a(e,t),d(e,t)):t.isMeshPhongMaterial?(a(e,t),u(e,t),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)):t.isMeshStandardMaterial?(a(e,t),f(e,t),t.isMeshPhysicalMaterial&&p(e,t,i)):t.isMeshMatcapMaterial?(a(e,t),m(e,t)):t.isMeshDepthMaterial?a(e,t):t.isMeshDistanceMaterial?(a(e,t),h(e,t)):t.isMeshNormalMaterial?a(e,t):t.isLineBasicMaterial?(o(e,t),t.isLineDashedMaterial&&s(e,t)):t.isPointsMaterial?c(e,t,n,r):t.isSpriteMaterial?l(e,t):t.isShadowMaterial?(e.color.value.copy(t.color),e.opacity.value=t.opacity):t.isShaderMaterial&&(t.uniformsNeedUpdate=!1)}function a(e,r){e.opacity.value=r.opacity,r.color&&e.diffuse.value.copy(r.color),r.emissive&&e.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(e.map.value=r.map,n(r.map,e.mapTransform)),r.alphaMap&&(e.alphaMap.value=r.alphaMap,n(r.alphaMap,e.alphaMapTransform)),r.bumpMap&&(e.bumpMap.value=r.bumpMap,n(r.bumpMap,e.bumpMapTransform),e.bumpScale.value=r.bumpScale,r.side===1&&(e.bumpScale.value*=-1)),r.normalMap&&(e.normalMap.value=r.normalMap,n(r.normalMap,e.normalMapTransform),e.normalScale.value.copy(r.normalScale),r.side===1&&e.normalScale.value.negate()),r.displacementMap&&(e.displacementMap.value=r.displacementMap,n(r.displacementMap,e.displacementMapTransform),e.displacementScale.value=r.displacementScale,e.displacementBias.value=r.displacementBias),r.emissiveMap&&(e.emissiveMap.value=r.emissiveMap,n(r.emissiveMap,e.emissiveMapTransform)),r.specularMap&&(e.specularMap.value=r.specularMap,n(r.specularMap,e.specularMapTransform)),r.alphaTest>0&&(e.alphaTest.value=r.alphaTest);let i=t.get(r),a=i.envMap,o=i.envMapRotation;a&&(e.envMap.value=a,e.envMapRotation.value.setFromMatrix4(uf.makeRotationFromEuler(o)).transpose(),a.isCubeTexture&&a.isRenderTargetTexture===!1&&e.envMapRotation.value.premultiply(df),e.reflectivity.value=r.reflectivity,e.ior.value=r.ior,e.refractionRatio.value=r.refractionRatio),r.lightMap&&(e.lightMap.value=r.lightMap,e.lightMapIntensity.value=r.lightMapIntensity,n(r.lightMap,e.lightMapTransform)),r.aoMap&&(e.aoMap.value=r.aoMap,e.aoMapIntensity.value=r.aoMapIntensity,n(r.aoMap,e.aoMapTransform))}function o(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform))}function s(e,t){e.dashSize.value=t.dashSize,e.totalSize.value=t.dashSize+t.gapSize,e.scale.value=t.scale}function c(e,t,r,i){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.size.value=t.size*r,e.scale.value=i*.5,t.map&&(e.map.value=t.map,n(t.map,e.uvTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function l(e,t){e.diffuse.value.copy(t.color),e.opacity.value=t.opacity,e.rotation.value=t.rotation,t.map&&(e.map.value=t.map,n(t.map,e.mapTransform)),t.alphaMap&&(e.alphaMap.value=t.alphaMap,n(t.alphaMap,e.alphaMapTransform)),t.alphaTest>0&&(e.alphaTest.value=t.alphaTest)}function u(e,t){e.specular.value.copy(t.specular),e.shininess.value=Math.max(t.shininess,1e-4)}function d(e,t){t.gradientMap&&(e.gradientMap.value=t.gradientMap)}function f(e,t){e.metalness.value=t.metalness,t.metalnessMap&&(e.metalnessMap.value=t.metalnessMap,n(t.metalnessMap,e.metalnessMapTransform)),e.roughness.value=t.roughness,t.roughnessMap&&(e.roughnessMap.value=t.roughnessMap,n(t.roughnessMap,e.roughnessMapTransform)),t.envMap&&(e.envMapIntensity.value=t.envMapIntensity)}function p(e,t,r){e.ior.value=t.ior,t.diffuseRoughness>0&&(e.diffuseRoughness.value=t.diffuseRoughness,t.diffuseRoughnessMap&&(e.diffuseRoughnessMap.value=t.diffuseRoughnessMap,n(t.diffuseRoughnessMap,e.diffuseRoughnessMapTransform))),t.sheen>0&&(e.sheenColor.value.copy(t.sheenColor).multiplyScalar(t.sheen),e.sheenRoughness.value=t.sheenRoughness,t.sheenColorMap&&(e.sheenColorMap.value=t.sheenColorMap,n(t.sheenColorMap,e.sheenColorMapTransform)),t.sheenRoughnessMap&&(e.sheenRoughnessMap.value=t.sheenRoughnessMap,n(t.sheenRoughnessMap,e.sheenRoughnessMapTransform))),t.clearcoat>0&&(e.clearcoat.value=t.clearcoat,e.clearcoatRoughness.value=t.clearcoatRoughness,t.clearcoatMap&&(e.clearcoatMap.value=t.clearcoatMap,n(t.clearcoatMap,e.clearcoatMapTransform)),t.clearcoatRoughnessMap&&(e.clearcoatRoughnessMap.value=t.clearcoatRoughnessMap,n(t.clearcoatRoughnessMap,e.clearcoatRoughnessMapTransform)),t.clearcoatNormalMap&&(e.clearcoatNormalMap.value=t.clearcoatNormalMap,n(t.clearcoatNormalMap,e.clearcoatNormalMapTransform),e.clearcoatNormalScale.value.copy(t.clearcoatNormalScale),t.side===1&&e.clearcoatNormalScale.value.negate())),t.dispersion>0&&(e.dispersion.value=t.dispersion),t.retroreflectivity>0&&(e.retroreflectivity.value=t.retroreflectivity),t.iridescence>0&&(e.iridescence.value=t.iridescence,e.iridescenceIOR.value=t.iridescenceIOR,e.iridescenceThicknessMinimum.value=t.iridescenceThicknessMinimum,e.iridescenceThicknessMaximum.value=t.iridescenceThicknessMaximum,t.iridescenceMap&&(e.iridescenceMap.value=t.iridescenceMap,n(t.iridescenceMap,e.iridescenceMapTransform)),t.iridescenceThicknessMap&&(e.iridescenceThicknessMap.value=t.iridescenceThicknessMap,n(t.iridescenceThicknessMap,e.iridescenceThicknessMapTransform))),t.transmission>0&&(e.transmission.value=t.transmission,e.transmissionSamplerMap.value=r.texture,e.transmissionSamplerSize.value.set(r.width,r.height),t.transmissionMap&&(e.transmissionMap.value=t.transmissionMap,n(t.transmissionMap,e.transmissionMapTransform)),e.thickness.value=t.thickness,t.thicknessMap&&(e.thicknessMap.value=t.thicknessMap,n(t.thicknessMap,e.thicknessMapTransform)),e.attenuationDistance.value=t.attenuationDistance,e.attenuationColor.value.copy(t.attenuationColor)),t.anisotropy>0&&(e.anisotropyVector.value.set(t.anisotropy*Math.cos(t.anisotropyRotation),t.anisotropy*Math.sin(t.anisotropyRotation)),t.anisotropyMap&&(e.anisotropyMap.value=t.anisotropyMap,n(t.anisotropyMap,e.anisotropyMapTransform))),e.specularIntensity.value=t.specularIntensity,e.specularColor.value.copy(t.specularColor),t.specularColorMap&&(e.specularColorMap.value=t.specularColorMap,n(t.specularColorMap,e.specularColorMapTransform)),t.specularIntensityMap&&(e.specularIntensityMap.value=t.specularIntensityMap,n(t.specularIntensityMap,e.specularIntensityMapTransform))}function m(e,t){t.matcap&&(e.matcap.value=t.matcap)}function h(e,n){let r=t.get(n).light;e.referencePosition.value.setFromMatrixPosition(r.matrixWorld),e.nearDistance.value=r.shadow.camera.near,e.farDistance.value=r.shadow.camera.far}return{refreshFogUniforms:r,refreshMaterialUniforms:i}}function pf(e,t,n,r){let i={},a={};function o(e,t){let n=t.program;r.uniformBlockBinding(e,n,i[e.id])}function s(e,n){let o=i[e.id];o===void 0&&(m(e),o=c(e),i[e.id]=o,e.addEventListener(`dispose`,g));let s=n.program;r.updateUBOMapping(e,s);let u=t.render.frame;a[e.id]!==u&&(l(e),a[e.id]=u)}function c(t){let n=e.createBuffer(),r=t.__size,i=t.usage;return e.bindBuffer(e.UNIFORM_BUFFER,n),e.bufferData(e.UNIFORM_BUFFER,r,i),e.bindBuffer(e.UNIFORM_BUFFER,null),n}function l(t){let n=i[t.id],r=t.uniforms,a=t.__cache;e.bindBuffer(e.UNIFORM_BUFFER,n);for(let e=0,t=r.length;e<t;e++){let t=r[e];if(Array.isArray(t))for(let n=0,r=t.length;n<r;n++)u(t[n],e,n,a);else u(t,e,0,a)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function u(t,n,r,i){if(f(t,n,r,i)===!0){let n=t.__offset,r=t.value;if(Array.isArray(r)){let e=0;for(let n=0;n<r.length;n++){let i=r[n],a=h(i,!0);d(i,t.__data,e),e+=a.storage/Float32Array.BYTES_PER_ELEMENT}}else d(r,t.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,n,t.__data)}}function d(e,t,n){typeof e==`number`||typeof e==`boolean`?t[n]=e:e.isMatrix3?(t[n]=e.elements[0],t[n+1]=e.elements[1],t[n+2]=e.elements[2],t[n+3]=0,t[n+4]=e.elements[3],t[n+5]=e.elements[4],t[n+6]=e.elements[5],t[n+7]=0,t[n+8]=e.elements[6],t[n+9]=e.elements[7],t[n+10]=e.elements[8],t[n+11]=0):ArrayBuffer.isView(e)?t.set(e.subarray(0,t.length-n),n):e.toArray(t,n)}function f(e,t,n,r){let i=e.value,a=t+`_`+n;if(Array.isArray(i)){r[a]===void 0&&(r[a]=[]);let e=r[a],t=!1;for(let n=0;n<i.length;n++)p(i[n],e,n)===!0&&(t=!0);return t}return p(i,r,a)}function p(e,t,n){if(t[n]===void 0)return t[n]=typeof e==`number`||typeof e==`boolean`?e:ArrayBuffer.isView(e)?e.slice():e.clone(),!0;{let r=t[n];if(typeof e==`number`||typeof e==`boolean`){if(r!==e)return t[n]=e,!0}else if(ArrayBuffer.isView(e))return!0;else if(r.equals(e)===!1)return r.copy(e),!0}return!1}function m(e){let t=e.uniforms,n=0;for(let e=0,r=t.length;e<r;e++){let r=Array.isArray(t[e])?t[e]:[t[e]];for(let i=0,a=r.length;i<a;i++){let a=r[i],o=Array.isArray(a.value)?a.value:[a.value],s=Array.isArray(t[e])||Array.isArray(a.value),c=n;for(let e=0,t=o.length;e<t;e++){let t=o[e],r=h(t,s),i=n%16,a=i%r.boundary,l=i+a;n+=a,l!==0&&16-l<r.storage&&(n+=16-l),e===0&&(c=n),n+=r.storage}a.__data=new(a.type===`int`?Int32Array:a.type===`uint`?Uint32Array:Float32Array)((n-c)/Float32Array.BYTES_PER_ELEMENT),a.__offset=c}}let r=n%16;return r>0&&(n+=16-r),e.__size=n,e.__cache={},this}function h(e,t){let n={boundary:0,storage:0};return typeof e==`number`||typeof e==`boolean`?(n.boundary=4,n.storage=4):e.isVector2?(n.boundary=8,n.storage=8):e.isVector3||e.isColor?(n.boundary=16,n.storage=12):e.isVector4?(n.boundary=16,n.storage=16):e.isMatrix3?(n.boundary=16,n.storage=48):e.isMatrix4?(n.boundary=16,n.storage=64):e.isTexture?G(`WebGLRenderer: Texture samplers can not be part of an uniforms group.`):ArrayBuffer.isView(e)?(n.boundary=16,n.storage=e.byteLength):G(`WebGLRenderer: Unsupported uniform value type.`,e),t===!0&&(n.boundary=16,n.storage=Math.ceil(n.storage/16)*16),n}function g(t){let n=t.target;n.removeEventListener(`dispose`,g),e.deleteBuffer(i[n.id]),delete i[n.id],delete a[n.id]}function _(){for(let t in i)e.deleteBuffer(i[t]);i={},a={}}return{bind:o,update:s,dispose:_}}var mf=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),hf=null;function gf(){return hf===null&&(hf=new os(mf,16,16,Gn,Mn),hf.name=`DFG_LUT`,hf.minFilter=Sn,hf.magFilter=Sn,hf.wrapS=_n,hf.wrapT=_n,hf.generateMipmaps=!1,hf.needsUpdate=!0),hf}var _f=class{constructor(e={}){let{canvas:t=Yr(),context:n=null,depth:r=!0,stencil:i=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:s=!0,preserveDrawingBuffer:c=!1,powerPreference:l=`default`,failIfMajorPerformanceCaveat:u=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Tn}=e;this.isWebGLRenderer=!0;let p;if(n!==null){if(typeof WebGLRenderingContext<`u`&&n instanceof WebGLRenderingContext)throw Error(`THREE.WebGLRenderer: WebGL 1 is not supported since r163.`);p=n.getContextAttributes().alpha}else p=a;let m=f,h=new Set([qn,Kn,Wn]),g=new Set([Tn,An,On,Fn,Nn,Pn]),_=new Uint32Array(4),v=new Int32Array(4),y={textures:[],min:[],max:[],resolution:[]},b=null,x=null,S=[],C=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=0,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let T=this,E=!1,D=null,O=null,k=null,A=null;this._outputColorSpace=Rr;let j=0,ee=0,M=null,N=-1,te=null,ne=new ji,re=new ji,ie=null,ae=new Z(0),P=0,oe=t.width,F=t.height,I=1,L=null,R=null,se=new ji(0,0,oe,F),ce=new ji(0,0,oe,F),le=!1,ue=new ys,de=new xs,z=!1,fe=!1,pe=new Ii,me=new Y,he=new ji,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},_e=!1;function ve(){return M===null?I:1}let B=n;function ye(e,n){return t.getContext(e,n)}let be,xe,V,Se,H,U,Ce,we,Te,Ee,De,Oe,ke,Ae,je,Me,Ne,Pe,Fe,Ie,Le,Re,ze;try{let e={alpha:!0,depth:r,stencil:i,antialias:o,premultipliedAlpha:s,preserveDrawingBuffer:c,powerPreference:l,failIfMajorPerformanceCaveat:u};if(`setAttribute`in t&&t.setAttribute(`data-engine`,`three.js r187`),t.addEventListener(`webglcontextlost`,He,!1),t.addEventListener(`webglcontextrestored`,Ue,!1),t.addEventListener(`webglcontextcreationerror`,We,!1),B===null){let t=`webgl2`;if(B=ye(t,e),B===null)throw ye(t)?Error(`THREE.WebGLRenderer: Error creating WebGL context with your selected attributes.`):Error(`THREE.WebGLRenderer: Error creating WebGL context.`)}Be()}catch(e){throw t.removeEventListener(`webglcontextlost`,He,!1),t.removeEventListener(`webglcontextrestored`,Ue,!1),t.removeEventListener(`webglcontextcreationerror`,We,!1),K(`WebGLRenderer: `+e.message),e}function Be(){be=new Il(B),be.init(),Le=new af(B,be),xe=new gl(B,be,e,Le),V=new nf(B,be),xe.reversedDepthBuffer&&d&&V.buffers.depth.setReversed(!0),O=B.createFramebuffer(),k=B.createFramebuffer(),A=B.createFramebuffer(),Se=new zl(B),H=new Id,U=new rf(B,be,V,H,xe,Le,Se),Ce=new Fl(T),we=new cl(B),Re=new ml(B,we),Te=new Ll(B,we,Se,Re),Ee=new Vl(B,Te,we,Re,Se),Pe=new Bl(B,xe,U),je=new _l(H),De=new Fd(T,Ce,be,xe,Re,je),Oe=new ff(T,H),ke=new Bd,Ae=new qd(be),Ne=new pl(T,Ce,V,Ee,p,s),Me=new tf(T,Ee,xe),ze=new pf(B,Se,xe,V),Fe=new hl(B,be,Se),Ie=new Rl(B,be,Se),Se.programs=De.programs,T.capabilities=xe,T.extensions=be,T.properties=H,T.renderLists=ke,T.shadowMap=Me,T.state=V,T.info=Se}m!==1009&&(w=new Ul(m,t.width,t.height,o,r,i));let Ve=new lf(T,B);this.xr=Ve,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let e=be.get(`WEBGL_lose_context`);e&&e.loseContext()},this.forceContextRestore=function(){let e=be.get(`WEBGL_lose_context`);e&&e.restoreContext()},this.getPixelRatio=function(){return I},this.setPixelRatio=function(e){e!==void 0&&(I=e,this.setSize(oe,F,!1))},this.getSize=function(e){return e.set(oe,F)},this.setSize=function(e,n,r=!0){Ve.isPresenting?G(`WebGLRenderer: Can't change size while VR device is presenting.`):(oe=e,F=n,t.width=Math.floor(e*I),t.height=Math.floor(n*I),r===!0&&(t.style.width=e+`px`,t.style.height=n+`px`),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,e,n))},this.getDrawingBufferSize=function(e){return e.set(oe*I,F*I).floor()},this.setDrawingBufferSize=function(e,n,r){oe=e,F=n,I=r,t.width=Math.floor(e*r),t.height=Math.floor(n*r),this.setViewport(0,0,e,n)},this.setEffects=function(e){if(m===1009)K(`WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.`);else{if(e){for(let t=0;t<e.length;t++)if(e[t].isOutputPass===!0){G(`WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.`);break}}w.setEffects(e||[])}},this.getCurrentViewport=function(e){return e.copy(ne)},this.getViewport=function(e){return e.copy(se)},this.setViewport=function(e,t,n,r){e.isVector4?se.set(e.x,e.y,e.z,e.w):se.set(e,t,n,r),V.viewport(ne.copy(se).multiplyScalar(ve()).round())},this.getScissor=function(e){return e.copy(ce)},this.setScissor=function(e,t,n,r){e.isVector4?ce.set(e.x,e.y,e.z,e.w):ce.set(e,t,n,r),V.scissor(re.copy(ce).multiplyScalar(ve()).round())},this.getScissorTest=function(){return le},this.setScissorTest=function(e){V.setScissorTest(le=e)},this.setOpaqueSort=function(e){L=e},this.setTransparentSort=function(e){R=e},this.getClearColor=function(e){return e.copy(Ne.getClearColor())},this.setClearColor=function(){Ne.setClearColor(...arguments)},this.getClearAlpha=function(){return Ne.getClearAlpha()},this.setClearAlpha=function(){Ne.setClearAlpha(...arguments)},this.clear=function(e=!0,t=!0,n=!0){let r=0;if(e){let e=!1;if(M!==null){let t=M.texture.format;e=h.has(t)}if(e){let e=M.texture.type,t=g.has(e),n=Ne.getClearColor(),r=Ne.getClearAlpha(),i=n.r,a=n.g,o=n.b;t?(_[0]=i,_[1]=a,_[2]=o,_[3]=r,B.clearBufferuiv(B.COLOR,0,_)):(v[0]=i,v[1]=a,v[2]=o,v[3]=r,B.clearBufferiv(B.COLOR,0,v))}else r|=B.COLOR_BUFFER_BIT}t&&(r|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),n&&(r|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),r!==0&&B.clear(r)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(e){e.setRenderer(this),D=e},this.dispose=function(){t.removeEventListener(`webglcontextlost`,He,!1),t.removeEventListener(`webglcontextrestored`,Ue,!1),t.removeEventListener(`webglcontextcreationerror`,We,!1),Ne.dispose(),ke.dispose(),Ae.dispose(),U.dispose(),H.dispose(),Ce.dispose(),Ee.dispose(),Te.dispose(),Re.dispose(),ze.dispose(),De.dispose(),Ve.dispose(),Ve.removeEventListener(`sessionstart`,Ze),Ve.removeEventListener(`sessionend`,Qe),$e.stop()};function He(e){e.preventDefault(),Zr(`WebGLRenderer: Context Lost.`),E=!0}function Ue(){Zr(`WebGLRenderer: Context Restored.`),E=!1;let e=Se.autoReset,t=Me.enabled,n=Me.autoUpdate,r=Me.needsUpdate,i=Me.type;Be(),Se.autoReset=e,Me.enabled=t,Me.autoUpdate=n,Me.needsUpdate=r,Me.type=i}function We(e){K(`WebGLRenderer: A WebGL context could not be created. Reason: `,e.statusMessage)}function Ge(e){let t=e.target;t.removeEventListener(`dispose`,Ge),Ke(t)}function Ke(e){qe(e),H.remove(e)}function qe(e){let t=H.get(e).programs;t!==void 0&&(t.forEach(function(e){De.releaseProgram(e)}),e.isShaderMaterial&&De.releaseShaderCache(e))}this.renderBufferDirect=function(e,t,n,r,i,a){t===null&&(t=ge);let o=i.isMesh&&i.matrixWorld.determinantAffine()<0,s=ut(e,t,n,r,i);V.setMaterial(r,o);let c=n.index,l=1;if(r.wireframe===!0){if(c=Te.getWireframeAttribute(n),c===void 0)return;l=2}let u=n.drawRange,d=n.attributes.position,f=u.start*l,p=(u.start+u.count)*l;a!==null&&(f=Math.max(f,a.start*l),p=Math.min(p,(a.start+a.count)*l)),c===null?d!=null&&(f=Math.max(f,0),p=Math.min(p,d.count)):(f=Math.max(f,0),p=Math.min(p,c.count));let m=p-f;if(m<0||m===1/0)return;Re.setup(i,r,s,n,c);let h,g=Fe;if(c!==null&&(h=we.get(c),g=Ie,g.setIndex(h)),i.isMesh)r.wireframe===!0?(V.setLineWidth(r.wireframeLinewidth*ve()),g.setMode(B.LINES)):g.setMode(B.TRIANGLES);else if(i.isLine){let e=r.linewidth;e===void 0&&(e=1),V.setLineWidth(e*ve()),i.isLineSegments?g.setMode(B.LINES):i.isLineLoop?g.setMode(B.LINE_LOOP):g.setMode(B.LINE_STRIP)}else i.isPoints?g.setMode(B.POINTS):i.isSprite&&g.setMode(B.TRIANGLES);if(i.isBatchedMesh){if(be.get(`WEBGL_multi_draw`))g.renderMultiDraw(i._multiDrawStarts,i._multiDrawCounts,i._multiDrawCount);else{let e=i._multiDrawStarts,t=i._multiDrawCounts,n=i._multiDrawCount,a=c?we.get(c).bytesPerElement:1,o=H.get(r).currentProgram.getUniforms();for(let r=0;r<n;r++)o.setValue(B,`_gl_DrawID`,r),g.render(e[r]/a,t[r])}}else if(i.isInstancedMesh)g.renderInstances(f,m,i.count);else if(n.isInstancedBufferGeometry){let e=n._maxInstanceCount===void 0?1/0:n._maxInstanceCount,t=Math.min(n.instanceCount,e);g.renderInstances(f,m,t)}else g.render(f,m)};function Je(e,t,n,r){D!==null&&e.isNodeMaterial&&D.setObject(r,e),z===!0&&je.setState(e,n,!1),e.transparent===!0&&e.side===2&&e.forceSinglePass===!1?(e.side=1,e.needsUpdate=!0,ot(e,t,r),e.side=0,e.needsUpdate=!0,ot(e,t,r),e.side=2):ot(e,t,r)}this.compile=function(e,t,n=null){n===null&&(n=e),D!==null&&D.renderStart(e,t,n),x=Ae.get(n),x.init(t),C.push(x),n.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),e!==n&&e.traverseVisible(function(e){e.isLight&&e.layers.test(t.layers)&&(x.pushLight(e),e.castShadow&&x.pushShadow(e))}),x.setupLights(),D!==null&&D.updateLights(x.state.lightsArray),fe=this.localClippingEnabled,z=je.init(this.clippingPlanes,fe),z===!0&&je.setGlobalState(this.clippingPlanes,t),D!==null&&Me.render(x.state.shadowsArray,n,t);let r=new Set;return e.traverse(function(e){if(!(e.isMesh||e.isPoints||e.isLine||e.isSprite))return;let i=e.material;if(i){if(Array.isArray(i))for(let a=0;a<i.length;a++){let o=i[a];Je(o,n,t,e),r.add(o)}else Je(i,n,t,e),r.add(i)}}),x=C.pop(),D!==null&&D.renderEnd(),r},this.compileAsync=function(e,t,n=null){let r=this.compile(e,t,n);return new Promise(t=>{function n(){r.forEach(function(e){let t=H.get(e).currentProgram;(t===void 0||t.isReady())&&r.delete(e)}),r.size===0?t(e):setTimeout(n,10)}be.get(`KHR_parallel_shader_compile`)===null?setTimeout(n,10):n()})};let Ye=null;function Xe(e){Ye&&Ye(e)}function Ze(){$e.stop()}function Qe(){$e.start()}let $e=new sl;$e.setAnimationLoop(Xe),typeof self<`u`&&$e.setContext(self),this.setAnimationLoop=function(e){Ye=e,Ve.setAnimationLoop(e),e===null?$e.stop():$e.start()},Ve.addEventListener(`sessionstart`,Ze),Ve.addEventListener(`sessionend`,Qe),this.render=function(e,t){if(t!==void 0&&t.isCamera!==!0){K(`WebGLRenderer.render: camera is not an instance of THREE.Camera.`);return}if(E===!0)return;D!==null&&D.renderStart(e,t);let n=Ve.enabled===!0&&Ve.isPresenting===!0,r=w!==null&&(M===null||n)&&w.begin(T,M);if(e.matrixWorldAutoUpdate===!0&&e.updateMatrixWorld(),t.parent===null&&t.matrixWorldAutoUpdate===!0&&t.updateMatrixWorld(),Ve.enabled===!0&&Ve.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Ve.cameraAutoUpdate===!0&&Ve.updateCamera(t),t=Ve.getCamera()),e.isScene===!0&&e.onBeforeRender(T,e,t,M),x=Ae.get(e,C.length),x.init(t),x.state.textureUnits=U.getTextureUnits(),C.push(x),pe.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),t.isArrayCamera?de.setFromArrayCamera(t):ue.setFromProjectionMatrix(pe,Gr,t.reversedDepth),fe=this.localClippingEnabled,z=je.init(this.clippingPlanes,fe),b=ke.get(e,S.length),b.init(),S.push(b),this.info.render.frame++,Ve.enabled===!0&&Ve.isPresenting===!0){let e=T.xr.getDepthSensingMesh();e!==null&&et(e,t,-1/0,T.sortObjects)}et(e,t,0,T.sortObjects),b.finish(),D!==null&&D.updateLights(x.state.lightsArray),T.sortObjects===!0&&b.sort(L,R),_e=Ve.enabled===!1||Ve.isPresenting===!1||Ve.hasDepthSensing()===!1,_e&&Ne.addToRenderList(b,e),this.info.autoReset===!0&&this.info.reset(),z===!0&&je.beginShadows();let i=x.state.shadowsArray;if(Me.render(i,e,t),z===!0&&je.endShadows(),(r&&w.hasRenderPass())===!1){let n=b.opaque,r=b.transmissive;if(x.setupLights(),t.isArrayCamera){let i=t.cameras;if(r.length>0)for(let t=0,a=i.length;t<a;t++){let a=i[t];nt(n,r,e,a)}_e&&Ne.render(e);for(let t=0,n=i.length;t<n;t++){let n=i[t];tt(b,e,n,n.viewport)}}else r.length>0&&nt(n,r,e,t),_e&&Ne.render(e),tt(b,e,t)}M!==null&&ee===0&&(U.updateMultisampleRenderTarget(M),U.updateRenderTargetMipmap(M)),r&&w.end(T),e.isScene===!0&&e.onAfterRender(T,e,t),Re.resetDefaultState(),N=-1,te=null,C.pop(),C.length>0?(x=C[C.length-1],U.setTextureUnits(x.state.textureUnits),z===!0&&je.setGlobalState(T.clippingPlanes,x.state.camera)):x=null,S.pop(),b=S.length>0?S[S.length-1]:null,D!==null&&D.renderEnd()};function et(e,t,n,r){if(e.visible===!1)return;if(e.layers.test(t.layers)){if(e.isGroup)n=e.renderOrder;else if(e.isLOD)e.autoUpdate===!0&&e.update(t);else if(e.isLight)x.pushLight(e),e.castShadow&&x.pushShadow(e);else if(e.isSprite){let i=t.isArrayCamera?de:ue;if(!e.frustumCulled||e.intersectsFrustum(i)){r&&he.setFromMatrixPosition(e.matrixWorld).applyMatrix4(pe);let i=Ee.update(e),a=e.material;a.visible&&b.push(e,i,a,n,he.z,null,t)}}else if(e.isMesh||e.isLine||e.isPoints){let i=t.isArrayCamera?de:ue;if(!e.frustumCulled||e.intersectsFrustum(i)){let i=Ee.update(e),a=e.material;if(r&&(e.boundingSphere===void 0?(i.boundingSphere===null&&i.computeBoundingSphere(),he.copy(i.boundingSphere.center)):(e.boundingSphere===null&&e.computeBoundingSphere(),he.copy(e.boundingSphere.center)),he.applyMatrix4(e.matrixWorld).applyMatrix4(pe)),Array.isArray(a)){let r=i.groups;for(let o=0,s=r.length;o<s;o++){let s=r[o],c=a[s.materialIndex];c&&c.visible&&b.push(e,i,c,n,he.z,s,t)}}else a.visible&&b.push(e,i,a,n,he.z,null,t)}}}let i=e.children;for(let e=0,a=i.length;e<a;e++)et(i[e],t,n,r)}function tt(e,t,n,r){let{opaque:i,transmissive:a,transparent:o}=e;x.setupLightsView(n),z===!0&&je.setGlobalState(T.clippingPlanes,n),r&&V.viewport(ne.copy(r)),i.length>0&&rt(i,t,n),a.length>0&&rt(a,t,n),o.length>0&&rt(o,t,n),V.buffers.depth.setTest(!0),V.buffers.depth.setMask(!0),V.buffers.color.setMask(!0),V.setPolygonOffset(!1)}function nt(e,t,n,r){if((n.isScene===!0?n.overrideMaterial:null)!==null)return;if(x.state.transmissionRenderTarget[r.id]===void 0){let e=be.has(`EXT_color_buffer_half_float`)||be.has(`EXT_color_buffer_float`);x.state.transmissionRenderTarget[r.id]=new Ni(1,1,{generateMipmaps:!0,type:e?Mn:Tn,minFilter:wn,samples:Math.max(4,xe.samples),stencilBuffer:i,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:bi.workingColorSpace})}let a=x.state.transmissionRenderTarget[r.id],o=r.viewport||ne;a.setSize(o.z*T.transmissionResolutionScale,o.w*T.transmissionResolutionScale);let s=T.getRenderTarget(),c=T.getActiveCubeFace(),l=T.getActiveMipmapLevel();T.setRenderTarget(a),T.getClearColor(ae),P=T.getClearAlpha(),P<1&&T.setClearColor(16777215,.5),T.clear(),_e&&Ne.render(n);let u=T.toneMapping;T.toneMapping=0;let d=r.viewport;if(r.viewport!==void 0&&(r.viewport=void 0),x.setupLightsView(r),z===!0&&je.setGlobalState(T.clippingPlanes,r),rt(e,n,r),U.updateMultisampleRenderTarget(a),U.updateRenderTargetMipmap(a),be.has(`WEBGL_multisampled_render_to_texture`)===!1){let e=!1;for(let i=0,a=t.length;i<a;i++){let{object:a,geometry:o,material:s,group:c}=t[i];if(s.side===2&&a.layers.test(r.layers)){let t=s.side;s.side=1,s.needsUpdate=!0,it(a,n,r,o,s,c),s.side=t,s.needsUpdate=!0,e=!0}}e===!0&&(U.updateMultisampleRenderTarget(a),U.updateRenderTargetMipmap(a))}T.setRenderTarget(s,c,l),T.setClearColor(ae,P),d!==void 0&&(r.viewport=d),T.toneMapping=u}function rt(e,t,n){let r=t.isScene===!0?t.overrideMaterial:null;for(let i=0,a=e.length;i<a;i++){let a=e[i],{object:o,geometry:s,group:c}=a,l=a.material;l.allowOverride===!0&&r!==null&&(l=r),o.layers.test(n.layers)&&it(o,t,n,s,l,c)}}function it(e,t,n,r,i,a){D!==null&&i.isNodeMaterial&&D.setObject(e,i),e.onBeforeRender(T,t,n,r,i,a),e.modelViewMatrix.multiplyMatrices(n.matrixWorldInverse,e.matrixWorld),e.normalMatrix.getNormalMatrix(e.modelViewMatrix),i.onBeforeRender(T,t,n,r,e,a),i.transparent===!0&&i.side===2&&i.forceSinglePass===!1?(i.side=1,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=0,i.needsUpdate=!0,T.renderBufferDirect(n,t,r,i,e,a),i.side=2):T.renderBufferDirect(n,t,r,i,e,a),e.onAfterRender(T,t,n,r,i,a)}function at(e){let t=0;for(let n of e)n.texture!==null&&t++;return t}function ot(e,t,n){t.isScene!==!0&&(t=ge);let r=H.get(e),i=x.state.lights,a=x.state.shadowsArray,o=i.state.version,s=De.getParameters(e,i.state,a,t,n,x.state.lightProbeGridArray),c=De.getProgramCacheKey(s),l=r.programs;r.environment=e.isMeshStandardMaterial||e.isMeshLambertMaterial||e.isMeshPhongMaterial?t.environment:null,r.fog=t.fog;let u=e.isMeshStandardMaterial||e.isMeshLambertMaterial&&!e.envMap||e.isMeshPhongMaterial&&!e.envMap;r.envMap=Ce.get(e.envMap||r.environment,u),r.envMapRotation=r.environment!==null&&e.envMap===null?t.environmentRotation:e.envMapRotation,l===void 0&&(e.addEventListener(`dispose`,Ge),l=new Map,r.programs=l,r.programVariants=new Map);let d=l.get(c);if(d!==void 0){if(r.currentProgram===d&&r.lightsStateVersion===o)return lt(e,s),d}else s.uniforms=De.getUniforms(e),D!==null&&e.isNodeMaterial&&D.build(e,n,s),e.onBeforeCompile(s,T),d=De.acquireProgram(s,c),l.set(c,d),r.uniforms=s.uniforms;let f=r.uniforms;return(!e.isShaderMaterial&&!e.isRawShaderMaterial||e.clipping===!0)&&(f.clippingPlanes=je.uniform),lt(e,s),r.needsLights=ft(e),r.lightsStateVersion=o,r.needsLights&&(f.ambientLightColor.value=i.state.ambient,f.lightProbe.value=i.state.probe,f.sunLights.value=i.state.sun,f.sunLightShadows.value=i.state.sunShadow,f.directionalLights.value=i.state.directional,f.directionalLightShadows.value=i.state.directionalShadow,f.spotLights.value=i.state.spot,f.spotLightShadows.value=i.state.spotShadow,f.rectAreaLights.value=i.state.rectArea,f.ltc_1.value=i.state.rectAreaLTC1,f.ltc_2.value=i.state.rectAreaLTC2,f.pointLights.value=i.state.point,f.pointLightShadows.value=i.state.pointShadow,f.hemisphereLights.value=i.state.hemi,f.sunShadowMatrix.value=i.state.sunShadowMatrix,f.sunShadowCascade.value=i.state.sunShadowCascade,f.directionalShadowMatrix.value=i.state.directionalShadowMatrix,f.spotLightMatrix.value=i.state.spotLightMatrix,f.spotLightMap.value=i.state.spotLightMap,f.pointShadowMatrix.value=i.state.pointShadowMatrix),r.numLightProbeGrids=at(x.state.lightProbeGridArray),r.currentProgram=d,r.uniformsList=null,d}function st(e,t,n,r,i){let a=H.get(e),o=a.currentProgram.id+`,`+r+`,`+i,s=a.programVariants.get(o);return s===void 0?(s=ot(e,t,n),a.programVariants.set(o,s)):(a.currentProgram=s,a.uniformsList=null,a.outputColorSpace=r,a.toneMapping=i),s}function ct(e){if(e.uniformsList===null){let t=e.currentProgram.getUniforms();e.uniformsList=Qu.seqWithValue(t.seq,e.uniforms)}return e.uniformsList}function lt(e,t){let n=H.get(e);n.outputColorSpace=t.outputColorSpace,n.batching=t.batching,n.batchingColor=t.batchingColor,n.instancing=t.instancing,n.instancingColor=t.instancingColor,n.instancingMorph=t.instancingMorph,n.skinning=t.skinning,n.morphTargets=t.morphTargets,n.morphNormals=t.morphNormals,n.morphColors=t.morphColors,n.morphTargetsCount=t.morphTargetsCount,n.numClippingPlanes=t.numClippingPlanes,n.numIntersection=t.numClipIntersection,n.vertexAlphas=t.vertexAlphas,n.vertexTangents=t.vertexTangents,n.toneMapping=t.toneMapping}function ut(e,t,n,r,i){t.isScene!==!0&&(t=ge),U.resetTextureUnits();let a=t.fog,o=r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial?t.environment:null,s=M===null?T.outputColorSpace:M.isXRRenderTarget===!0?M.texture.colorSpace:bi.workingColorSpace,c=r.isMeshStandardMaterial||r.isMeshLambertMaterial&&!r.envMap||r.isMeshPhongMaterial&&!r.envMap,l=Ce.get(r.envMap||o,c),u=r.vertexColors===!0&&!!n.attributes.color&&n.attributes.color.itemSize===4,d=!!n.attributes.tangent&&(!!r.normalMap||r.anisotropy>0),f=!!n.morphAttributes.position,p=!!n.morphAttributes.normal,m=!!n.morphAttributes.color,h=0;r.toneMapped&&(M===null||M.isXRRenderTarget===!0)&&(h=T.toneMapping);let g=n.morphAttributes.position||n.morphAttributes.normal||n.morphAttributes.color,_=g===void 0?0:g.length,v=H.get(r),b=x.state.lights;if(z===!0&&(fe===!0||e!==te)){let t=e===te&&r.id===N;je.setState(r,e,t)}let S=!1,C=!1;r.version===v.__version?v.needsLights&&v.lightsStateVersion!==b.state.version||i.isBatchedMesh&&v.batching===!1||!i.isBatchedMesh&&v.batching===!0||i.isBatchedMesh&&v.batchingColor===!0&&i._colorsTexture===null||i.isBatchedMesh&&v.batchingColor===!1&&i._colorsTexture!==null||i.isInstancedMesh&&v.instancing===!1||!i.isInstancedMesh&&v.instancing===!0||i.isSkinnedMesh&&v.skinning===!1||!i.isSkinnedMesh&&v.skinning===!0||i.isInstancedMesh&&v.instancingColor===!0&&i.instanceColor===null||i.isInstancedMesh&&v.instancingColor===!1&&i.instanceColor!==null||i.isInstancedMesh&&v.instancingMorph===!0&&i.morphTexture===null||i.isInstancedMesh&&v.instancingMorph===!1&&i.morphTexture!==null?S=!0:v.envMap===l?r.fog===!0&&v.fog!==a||v.numClippingPlanes!==void 0&&(v.numClippingPlanes!==je.numPlanes||v.numIntersection!==je.numIntersection)?S=!0:v.vertexAlphas===u&&v.vertexTangents===d&&v.morphTargets===f&&v.morphNormals===p&&v.morphColors===m&&v.morphTargetsCount===_&&v.numLightProbeGrids===at(x.state.lightProbeGridArray)?(v.outputColorSpace!==s||v.toneMapping!==h)&&(C=!0):S=!0:S=!0:(S=!0,v.__version=r.version);let w=v.currentProgram;(S===!0||C===!0)&&(w=C===!0?st(r,t,i,s,h):ot(r,t,i),D&&r.isNodeMaterial&&D.onUpdateProgram(r,w,v));let E=!1,O=!1,k=!1,A=w.getUniforms(),j=v.uniforms;if(V.useProgram(w.program)&&(E=!0,O=!0,k=!0),r.id!==N&&(N=r.id,O=!0),E||te!==e){V.buffers.depth.getReversed()&&e.reversedDepth!==!0&&(e._reversedDepth=!0,e.updateProjectionMatrix()),A.setValue(B,`projectionMatrix`,e.projectionMatrix),A.setValue(B,`viewMatrix`,e.matrixWorldInverse);let t=A.map.cameraPosition;t!==void 0&&t.setValue(B,me.setFromMatrixPosition(e.matrixWorld)),xe.logarithmicDepthBuffer&&A.setValue(B,`logDepthBufFC`,2/(Math.log(e.far+1)/Math.LN2)),(r.isMeshPhongMaterial||r.isMeshToonMaterial||r.isMeshLambertMaterial||r.isMeshBasicMaterial||r.isMeshStandardMaterial||r.isShaderMaterial)&&A.setValue(B,`isOrthographic`,e.isOrthographicCamera===!0),te!==e&&(te=e,O=!0,k=!0)}if(v.needsLights&&(b.state.sunShadowMap.length>0&&A.setValue(B,`sunShadowMap`,b.state.sunShadowMap,U),b.state.directionalShadowMap.length>0&&A.setValue(B,`directionalShadowMap`,b.state.directionalShadowMap,U),b.state.spotShadowMap.length>0&&A.setValue(B,`spotShadowMap`,b.state.spotShadowMap,U),b.state.pointShadowMap.length>0&&A.setValue(B,`pointShadowMap`,b.state.pointShadowMap,U)),i.isSkinnedMesh){A.setOptional(B,i,`bindMatrix`),A.setOptional(B,i,`bindMatrixInverse`);let e=i.skeleton;e&&(e.boneTexture===null&&e.computeBoneTexture(),A.setValue(B,`boneTexture`,e.boneTexture,U))}i.isBatchedMesh&&(A.setOptional(B,i,`batchingTexture`),A.setValue(B,`batchingTexture`,i._matricesTexture,U),A.setOptional(B,i,`batchingIdTexture`),A.setValue(B,`batchingIdTexture`,i._indirectTexture,U),A.setOptional(B,i,`batchingColorTexture`),i._colorsTexture!==null&&A.setValue(B,`batchingColorTexture`,i._colorsTexture,U));let ee=n.morphAttributes;if((ee.position!==void 0||ee.normal!==void 0||ee.color!==void 0)&&Pe.update(i,n,w),(O||v.receiveShadow!==i.receiveShadow)&&(v.receiveShadow=i.receiveShadow,A.setValue(B,`receiveShadow`,i.receiveShadow)),(r.isMeshStandardMaterial||r.isMeshLambertMaterial||r.isMeshPhongMaterial)&&r.envMap===null&&t.environment!==null&&(j.envMapIntensity.value=t.environmentIntensity),j.dfgLUT!==void 0&&(j.dfgLUT.value=gf()),O){if(A.setValue(B,`toneMappingExposure`,T.toneMappingExposure),v.needsLights&&dt(j,k),a&&r.fog===!0&&Oe.refreshFogUniforms(j,a),Oe.refreshMaterialUniforms(j,r,I,F,x.state.transmissionRenderTarget[e.id]),v.needsLights&&v.numLightProbeGrids>0){let e=y,t=0;for(let n of x.state.lightProbeGridArray)n.texture!==null&&(e.textures[t]=n.texture,e.min[t]=n.boundingBox.min,e.max[t]=n.boundingBox.max,e.resolution[t]=n.resolution,t++);for(let n in e)e[n].length=t;j.probesSH.value=e.textures,j.probesMin.value=e.min,j.probesMax.value=e.max,j.probesResolution.value=e.resolution}Qu.upload(B,ct(v),j,U)}if(r.isShaderMaterial&&r.uniformsNeedUpdate===!0&&(Qu.upload(B,ct(v),j,U),r.uniformsNeedUpdate=!1),r.isSpriteMaterial&&A.setValue(B,`center`,i.center),A.setValue(B,`modelViewMatrix`,i.modelViewMatrix),A.setValue(B,`normalMatrix`,i.normalMatrix),A.setValue(B,`modelMatrix`,i.matrixWorld),r.uniformsGroups!==void 0){let e=r.uniformsGroups;for(let t=0,n=e.length;t<n;t++){let n=e[t];ze.update(n,w),ze.bind(n,w)}}return w}function dt(e,t){e.ambientLightColor.needsUpdate=t,e.lightProbe.needsUpdate=t,e.sunLights.needsUpdate=t,e.sunLightShadows.needsUpdate=t,e.directionalLights.needsUpdate=t,e.directionalLightShadows.needsUpdate=t,e.pointLights.needsUpdate=t,e.pointLightShadows.needsUpdate=t,e.spotLights.needsUpdate=t,e.spotLightShadows.needsUpdate=t,e.rectAreaLights.needsUpdate=t,e.hemisphereLights.needsUpdate=t}function ft(e){return e.isMeshLambertMaterial||e.isMeshToonMaterial||e.isMeshPhongMaterial||e.isMeshStandardMaterial||e.isShadowMaterial||e.isShaderMaterial&&e.lights===!0}this.getActiveCubeFace=function(){return j},this.getActiveMipmapLevel=function(){return ee},this.getRenderTarget=function(){return M},this.setRenderTargetTextures=function(e,t,n){let r=H.get(e);r.__autoAllocateDepthBuffer=e.resolveDepthBuffer===!1,r.__autoAllocateDepthBuffer===!1&&(r.__useRenderToTexture=!1),H.get(e.texture).__webglTexture=t,H.get(e.depthTexture).__webglTexture=r.__autoAllocateDepthBuffer?void 0:n,r.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(e,t){let n=H.get(e);n.__webglFramebuffer=t,n.__useDefaultFramebuffer=t===void 0},this.setRenderTarget=function(e,t=0,n=0){M=e,j=t,ee=n;let r=null,i=!1,a=!1;if(e){let o=H.get(e);if(o.__useDefaultFramebuffer!==void 0){V.bindFramebuffer(B.FRAMEBUFFER,o.__webglFramebuffer),ne.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest,V.viewport(ne),V.scissor(re),V.setScissorTest(ie),N=-1;return}if(o.__webglFramebuffer===void 0)U.setupRenderTarget(e);else if(o.__hasExternalTextures)U.rebindTextures(e,H.get(e.texture).__webglTexture,H.get(e.depthTexture).__webglTexture);else if(e.depthBuffer){let t=e.depthTexture;if(o.__boundDepthTexture!==t){if(t!==null&&H.has(t)&&(e.width!==t.image.width||e.height!==t.image.height))throw Error(`THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.`);U.setupDepthRenderbuffer(e)}}let s=e.texture;(s.isData3DTexture||s.isDataArrayTexture||s.isCompressedArrayTexture)&&(a=!0);let c=H.get(e).__webglFramebuffer;e.isWebGLCubeRenderTarget?(r=Array.isArray(c[t])?c[t][n]:c[t],i=!0):r=e.samples>0&&U.useMultisampledRTT(e)===!1?H.get(e).__webglMultisampledFramebuffer:Array.isArray(c)?c[n]:c,ne.copy(e.viewport),re.copy(e.scissor),ie=e.scissorTest}else ne.copy(se).multiplyScalar(I).floor(),re.copy(ce).multiplyScalar(I).floor(),ie=le;if(n!==0&&(r=O),V.bindFramebuffer(B.FRAMEBUFFER,r)&&V.drawBuffers(e,r),V.viewport(ne),V.scissor(re),V.setScissorTest(ie),i){let r=H.get(e.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+t,r.__webglTexture,n)}else if(a){let r=t;for(let t=0;t<e.textures.length;t++){let i=H.get(e.textures[t]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+t,i.__webglTexture,n,r)}}else if(e!==null&&n!==0){let t=H.get(e.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,t.__webglTexture,n)}N=-1};function pt(e){let t=H.get(e);return(t.__readFormat!==e.format||t.__readType!==e.type)&&(t.__readFormat=e.format,t.__readType=e.type,t.__formatReadable=xe.textureFormatReadable(e.format),t.__typeReadable=xe.textureTypeReadable(e.type)),t}this.readRenderTargetPixels=function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget)){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);return}let c=H.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){V.bindFramebuffer(B.FRAMEBUFFER,c);try{let o=e.textures[s],c=o.format,l=o.type;e.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+s);let u=pt(o);if(u.__formatReadable===!1){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.`);return}if(u.__typeReadable===!1){K(`WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.`);return}t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i&&B.readPixels(t,n,r,i,Le.convert(c),Le.convert(l),a)}finally{let e=M===null?null:H.get(M).__webglFramebuffer;V.bindFramebuffer(B.FRAMEBUFFER,e)}}},this.readRenderTargetPixelsAsync=async function(e,t,n,r,i,a,o,s=0){if(!(e&&e.isWebGLRenderTarget))throw Error(`THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.`);let c=H.get(e).__webglFramebuffer;if(e.isWebGLCubeRenderTarget&&o!==void 0&&(c=c[o],Array.isArray(c)&&(c=c[0])),c){if(t>=0&&t<=e.width-r&&n>=0&&n<=e.height-i){V.bindFramebuffer(B.FRAMEBUFFER,c);let o=e.textures[s],l=o.format,u=o.type;e.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+s);let d=pt(o);if(d.__formatReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.`);if(d.__typeReadable===!1)throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.`);let f=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,f),B.bufferData(B.PIXEL_PACK_BUFFER,a.byteLength,B.STREAM_READ),B.readPixels(t,n,r,i,Le.convert(l),Le.convert(u),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);let p=M===null?null:H.get(M).__webglFramebuffer;V.bindFramebuffer(B.FRAMEBUFFER,p);let m=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await ei(B,m,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,f),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,a),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer(f),B.deleteSync(m),a}throw Error(`THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.`)}},this.copyFramebufferToTexture=function(e,t=null,n=0){let r=2**-n,i=Math.floor(e.image.width*r),a=Math.floor(e.image.height*r),o=t===null?0:t.x,s=t===null?0:t.y;U.setTexture2D(e,0),B.copyTexSubImage2D(B.TEXTURE_2D,n,0,0,o,s,i,a),V.unbindTexture()},this.copyTextureToTexture=function(e,t,n=null,r=null,i=0,a=0){let o,s,c,l,u,d,f,p,m,h=e.isCompressedTexture?e.mipmaps[a]:e.image;if(n!==null)o=n.max.x-n.min.x,s=n.max.y-n.min.y,c=n.isBox3?n.max.z-n.min.z:1,l=n.min.x,u=n.min.y,d=n.isBox3?n.min.z:0;else{let t=2**-i;o=Math.floor(h.width*t),s=Math.floor(h.height*t),c=e.isDataArrayTexture?h.depth:e.isData3DTexture?Math.floor(h.depth*t):1,l=0,u=0,d=0}r===null?(f=0,p=0,m=0):(f=r.x,p=r.y,m=r.z);let g=Le.convert(t.format),_=Le.convert(t.type),v;t.isData3DTexture?(U.setTexture3D(t,0),v=B.TEXTURE_3D):t.isDataArrayTexture||t.isCompressedArrayTexture?(U.setTexture2DArray(t,0),v=B.TEXTURE_2D_ARRAY):(U.setTexture2D(t,0),v=B.TEXTURE_2D),V.activeTexture(B.TEXTURE0),V.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,t.flipY),V.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,t.premultiplyAlpha),V.pixelStorei(B.UNPACK_ALIGNMENT,t.unpackAlignment);let y=V.getParameter(B.UNPACK_ROW_LENGTH),b=V.getParameter(B.UNPACK_IMAGE_HEIGHT),x=V.getParameter(B.UNPACK_SKIP_PIXELS),S=V.getParameter(B.UNPACK_SKIP_ROWS),C=V.getParameter(B.UNPACK_SKIP_IMAGES);V.pixelStorei(B.UNPACK_ROW_LENGTH,h.width),V.pixelStorei(B.UNPACK_IMAGE_HEIGHT,h.height),V.pixelStorei(B.UNPACK_SKIP_PIXELS,l),V.pixelStorei(B.UNPACK_SKIP_ROWS,u),V.pixelStorei(B.UNPACK_SKIP_IMAGES,d);let w=e.isDataArrayTexture||e.isData3DTexture,T=t.isDataArrayTexture||t.isData3DTexture;if(e.isDepthTexture){let n=H.get(e),r=H.get(t),h=H.get(n.__renderTarget),g=H.get(r.__renderTarget);V.bindFramebuffer(B.READ_FRAMEBUFFER,h.__webglFramebuffer),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,g.__webglFramebuffer);for(let n=0;n<c;n++)w&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(e).__webglTexture,i,d+n),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,H.get(t).__webglTexture,a,m+n)),B.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,B.DEPTH_BUFFER_BIT,B.NEAREST);V.bindFramebuffer(B.READ_FRAMEBUFFER,null),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(i!==0||e.isRenderTargetTexture||H.has(e)){let n=H.get(e),r=H.get(t);V.bindFramebuffer(B.READ_FRAMEBUFFER,k),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,A);for(let e=0;e<c;e++)w?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,n.__webglTexture,i,d+e):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,n.__webglTexture,i),T?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,r.__webglTexture,a,m+e):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,r.__webglTexture,a),i===0?T?B.copyTexSubImage3D(v,a,f,p,m+e,l,u,o,s):B.copyTexSubImage2D(v,a,f,p,l,u,o,s):B.blitFramebuffer(l,u,l+o,u+s,f,p,f+o,p+s,B.COLOR_BUFFER_BIT,B.NEAREST);V.bindFramebuffer(B.READ_FRAMEBUFFER,null),V.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else T?e.isDataTexture||e.isData3DTexture?B.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h.data):t.isCompressedArrayTexture?B.compressedTexSubImage3D(v,a,f,p,m,o,s,c,g,h.data):B.texSubImage3D(v,a,f,p,m,o,s,c,g,_,h):e.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,a,f,p,o,s,g,_,h.data):e.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,a,f,p,h.width,h.height,g,h.data):B.texSubImage2D(B.TEXTURE_2D,a,f,p,o,s,g,_,h);V.pixelStorei(B.UNPACK_ROW_LENGTH,y),V.pixelStorei(B.UNPACK_IMAGE_HEIGHT,b),V.pixelStorei(B.UNPACK_SKIP_PIXELS,x),V.pixelStorei(B.UNPACK_SKIP_ROWS,S),V.pixelStorei(B.UNPACK_SKIP_IMAGES,C),a===0&&t.generateMipmaps===!0&&t.mipmapsAutoUpdate===!0&&B.generateMipmap(v),V.unbindTexture()},this.initRenderTarget=function(e){H.get(e).__webglFramebuffer===void 0&&U.setupRenderTarget(e)},this.initTexture=function(e){e.isCubeTexture?U.setTextureCube(e,0):e.isData3DTexture?U.setTexture3D(e,0):e.isDataArrayTexture||e.isCompressedArrayTexture?U.setTexture2DArray(e,0):U.setTexture2D(e,0),V.unbindTexture()},this.resetState=function(){j=0,ee=0,M=null,V.reset(),Re.reset()},typeof __THREE_DEVTOOLS__<`u`&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent(`observe`,{detail:this}))}get coordinateSystem(){return Gr}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=bi._getDrawingBufferColorSpace(e),t.unpackColorSpace=bi._getUnpackColorSpace()}},vf=class extends va{constructor(){super(),this.name=`RoomEnvironment`,this.position.y=-3.5;let e=new Ps;e.deleteAttribute(`uv`);let t=new qs({side:1}),n=new qs,r=new Nc(16777215,900,28,2);r.position.set(.418,16.199,.3),this.add(r);let i=new rs(e,t);i.position.set(-.757,13.219,.717),i.scale.set(31.713,28.305,28.591),this.add(i);let a=new hs(e,n,6),o=new la;o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),o.updateMatrix(),a.setMatrixAt(0,o.matrix),o.position.set(-5.607,-.754,-.758),o.rotation.set(0,.994,0),o.scale.set(1.97,1.534,3.955),o.updateMatrix(),a.setMatrixAt(1,o.matrix),o.position.set(6.167,.857,7.803),o.rotation.set(0,.561,0),o.scale.set(3.927,6.285,3.687),o.updateMatrix(),a.setMatrixAt(2,o.matrix),o.position.set(-2.017,.018,6.124),o.rotation.set(0,.333,0),o.scale.set(2.002,4.566,2.064),o.updateMatrix(),a.setMatrixAt(3,o.matrix),o.position.set(2.291,-.756,-2.621),o.rotation.set(0,-.286,0),o.scale.set(1.546,1.552,1.496),o.updateMatrix(),a.setMatrixAt(4,o.matrix),o.position.set(-2.193,-.369,-5.547),o.rotation.set(0,.516,0),o.scale.set(3.875,3.487,2.986),o.updateMatrix(),a.setMatrixAt(5,o.matrix),this.add(a);let s=new rs(e,yf(50));s.position.set(-16.116,14.37,8.208),s.scale.set(.1,2.428,2.739),this.add(s);let c=new rs(e,yf(50));c.position.set(-16.109,18.021,-8.207),c.scale.set(.1,2.425,2.751),this.add(c);let l=new rs(e,yf(17));l.position.set(14.904,12.198,-1.832),l.scale.set(.15,4.265,6.331),this.add(l);let u=new rs(e,yf(43));u.position.set(-.462,8.89,14.52),u.scale.set(4.38,5.441,.088),this.add(u);let d=new rs(e,yf(20));d.position.set(3.235,11.486,-12.541),d.scale.set(2.5,2,.1),this.add(d);let f=new rs(e,yf(100));f.position.set(0,20,0),f.scale.set(1,.1,1),this.add(f)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function yf(e){return new Ys({color:0,emissive:16777215,emissiveIntensity:e})}var bf=new Y;function xf(e,t,n,r,i,a){let o=2*Math.PI*i/4,s=Math.max(a-2*i,0),c=Math.PI/4;bf.copy(t),bf[r]=0,bf.normalize();let l=.5*o/(o+s),u=1-bf.angleTo(e)/c;return Math.sign(bf[n])===1?u*l:s/(o+s)+l+l*(1-u)}var Sf=class e extends Ps{constructor(e=1,t=1,n=1,r=2,i=.1){let a=r*2+1;if(i=Math.min(e/2,t/2,n/2,i),super(1,1,1,a,a,a),this.type=`RoundedBoxGeometry`,this.parameters={width:e,height:t,depth:n,segments:r,radius:i},a===1)return;let o=this.toNonIndexed();this.index=null,this.attributes.position=o.attributes.position,this.attributes.normal=o.attributes.normal,this.attributes.uv=o.attributes.uv;let s=new Y,c=new Y,l=new Y(e,t,n).divideScalar(2).subScalar(i),u=this.attributes.position.array,d=this.attributes.normal.array,f=this.attributes.uv.array,p=u.length/6,m=new Y,h=.5/a;for(let r=0,a=0;r<u.length;r+=3,a+=2)switch(s.fromArray(u,r),c.copy(s),c.x-=Math.sign(c.x)*h,c.y-=Math.sign(c.y)*h,c.z-=Math.sign(c.z)*h,c.normalize(),u[r+0]=l.x*Math.sign(s.x)+c.x*i,u[r+1]=l.y*Math.sign(s.y)+c.y*i,u[r+2]=l.z*Math.sign(s.z)+c.z*i,d[r+0]=c.x,d[r+1]=c.y,d[r+2]=c.z,Math.floor(r/p)){case 0:m.set(1,0,0),f[a+0]=xf(m,c,`z`,`y`,i,n),f[a+1]=1-xf(m,c,`y`,`z`,i,t);break;case 1:m.set(-1,0,0),f[a+0]=1-xf(m,c,`z`,`y`,i,n),f[a+1]=1-xf(m,c,`y`,`z`,i,t);break;case 2:m.set(0,1,0),f[a+0]=1-xf(m,c,`x`,`z`,i,e),f[a+1]=xf(m,c,`z`,`x`,i,n);break;case 3:m.set(0,-1,0),f[a+0]=1-xf(m,c,`x`,`z`,i,e),f[a+1]=1-xf(m,c,`z`,`x`,i,n);break;case 4:m.set(0,0,1),f[a+0]=1-xf(m,c,`x`,`y`,i,e),f[a+1]=1-xf(m,c,`y`,`x`,i,t);break;case 5:m.set(0,0,-1),f[a+0]=xf(m,c,`x`,`y`,i,e),f[a+1]=1-xf(m,c,`y`,`x`,i,t)}}static fromJSON(t){return new e(t.width,t.height,t.depth,t.segments,t.radius)}},Cf={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},wf=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},Tf=new Pc(-1,1,1,-1,0,1),Ef=new class extends po{constructor(){super(),this.setAttribute(`position`,new eo([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new eo([0,2,0,0,2,0],2))}},Df=class{constructor(e){this._mesh=new rs(Ef,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,Tf)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},Of=class extends wf{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof Gs?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=Hs.clone(e.uniforms),this.material=new Gs({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new Df(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},kf=class extends wf{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},Af=class extends wf{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},jf=class{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){let n=e.getSize(new J);this._width=n.width,this._height=n.height,t=new Ni(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:Mn}),t.texture.name=`EffectComposer.rt1`}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new Of(Cf),this.copyPass.material.blending=0,this.timer=new Vc}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}kf!==void 0&&(r instanceof kf?n=!0:r instanceof Af&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new J);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},Mf={name:`OutputShader`,uniforms:{tDiffuse:{value:null},toneMappingExposure:{value:1}},vertexShader:`
		precision highp float;

		uniform mat4 modelViewMatrix;
		uniform mat4 projectionMatrix;

		attribute vec3 position;
		attribute vec2 uv;

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		precision highp float;

		uniform sampler2D tDiffuse;

		#include <tonemapping_pars_fragment>
		#include <colorspace_pars_fragment>

		varying vec2 vUv;

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// tone mapping

			#ifdef LINEAR_TONE_MAPPING

				gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

			#elif defined( REINHARD_TONE_MAPPING )

				gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

			#elif defined( CINEON_TONE_MAPPING )

				gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

			#elif defined( ACES_FILMIC_TONE_MAPPING )

				gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

			#elif defined( AGX_TONE_MAPPING )

				gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

			#elif defined( NEUTRAL_TONE_MAPPING )

				gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

			#elif defined( CUSTOM_TONE_MAPPING )

				gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

			#endif

			// color space

			#ifdef SRGB_TRANSFER

				gl_FragColor = sRGBTransferOETF( gl_FragColor );

			#endif

		}`},Nf=class extends wf{constructor(){super(),this.isOutputPass=!0,this.uniforms=Hs.clone(Mf.uniforms),this.material=new Ks({name:Mf.name,uniforms:this.uniforms,vertexShader:Mf.vertexShader,fragmentShader:Mf.fragmentShader}),this._fsQuad=new Df(this.material),this._outputColorSpace=null,this._toneMapping=null}render(e,t,n){this.uniforms.tDiffuse.value=n.texture,this.uniforms.toneMappingExposure.value=e.toneMappingExposure,(this._outputColorSpace!==e.outputColorSpace||this._toneMapping!==e.toneMapping)&&(this._outputColorSpace=e.outputColorSpace,this._toneMapping=e.toneMapping,this.material.defines={},bi.getTransfer(this._outputColorSpace)===`srgb`&&(this.material.defines.SRGB_TRANSFER=``),this._toneMapping===1?this.material.defines.LINEAR_TONE_MAPPING=``:this._toneMapping===2?this.material.defines.REINHARD_TONE_MAPPING=``:this._toneMapping===3?this.material.defines.CINEON_TONE_MAPPING=``:this._toneMapping===4?this.material.defines.ACES_FILMIC_TONE_MAPPING=``:this._toneMapping===6?this.material.defines.AGX_TONE_MAPPING=``:this._toneMapping===7?this.material.defines.NEUTRAL_TONE_MAPPING=``:this._toneMapping===5&&(this.material.defines.CUSTOM_TONE_MAPPING=``),this.material.needsUpdate=!0),this.renderToScreen===!0?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},Pf=class extends wf{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new Z}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},Ff={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new Z(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},If=class e extends wf{constructor(e,t=1,n,r){super(),this.strength=t,this.radius=n,this.threshold=r,this.resolution=e===void 0?new J(256,256):new J(e.x,e.y),this.clearColor=new Z(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);this.renderTargetBright=new Ni(i,a,{type:Mn,depthBuffer:!1}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new Ni(i,a,{type:Mn,depthBuffer:!1});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new Ni(i,a,{type:Mn,depthBuffer:!1});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),i=Math.round(i/2),a=Math.round(a/2)}let o=Ff;this.highPassUniforms=Hs.clone(o.uniforms),this.highPassUniforms.luminosityThreshold.value=r,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new Gs({uniforms:this.highPassUniforms,vertexShader:o.vertexShader,fragmentShader:o.fragmentShader}),this.separableBlurMaterials=[];let s=[6,10,14,18,22];i=Math.round(this.resolution.x/2),a=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(s[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new J(1/i,1/a),i=Math.round(i/2),a=Math.round(a/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=t,this.compositeMaterial.uniforms.bloomRadius.value=.1;let c=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=c,this.bloomTintColors=[new Y(1,1,1),new Y(1,1,1),new Y(1,1,1),new Y(1,1,1),new Y(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=Hs.clone(Cf.uniforms),this.blendMaterial=new Gs({uniforms:this.copyUniforms,vertexShader:Cf.vertexShader,fragmentShader:Cf.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new Z,this._oldClearAlpha=1,this._basic=new Go,this._fsQuad=new Df(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new J(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(t,n,r,i,a){t.getClearColor(this._oldClearColor),this._oldClearAlpha=t.getClearAlpha();let o=t.autoClear;t.autoClear=!1,t.setClearColor(this.clearColor,0),a&&t.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,t.setRenderTarget(null),t.clear(),this._fsQuad.render(t)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,t.setRenderTarget(this.renderTargetBright),t.clear(),this._fsQuad.render(t);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionX,t.setRenderTarget(this.renderTargetsHorizontal[n]),t.clear(),this._fsQuad.render(t),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=e.BlurDirectionY,t.setRenderTarget(this.renderTargetsVertical[n]),t.clear(),this._fsQuad.render(t),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,t.setRenderTarget(this.renderTargetsHorizontal[0]),t.clear(),this._fsQuad.render(t),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&t.state.buffers.stencil.setTest(!0),this.renderToScreen?(t.setRenderTarget(null),this._fsQuad.render(t)):(t.setRenderTarget(r),this._fsQuad.render(t)),t.setClearColor(this._oldClearColor,this._oldClearAlpha),t.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);let r=[],i=[];for(let n=1;n<e;n+=2){let a=t[n],o=n+1<e?t[n+1]:0,s=a+o;r.push((n*a+(n+1)*o)/s),i.push(s)}return new Gs({defines:{KERNEL_PAIRS:r.length},uniforms:{colorTexture:{value:null},invSize:{value:new J(.5,.5)},direction:{value:new J(.5,.5)},centerWeight:{value:t[0]},gaussianOffsets:{value:r},gaussianWeights:{value:i}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float centerWeight;
				uniform float gaussianOffsets[KERNEL_PAIRS];
				uniform float gaussianWeights[KERNEL_PAIRS];

				void main() {

					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * centerWeight;

					for ( int i = 0; i < KERNEL_PAIRS; i ++ ) {

						vec2 uvOffset = direction * invSize * gaussianOffsets[ i ];
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * gaussianWeights[ i ];

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new Gs({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};If.BlurDirectionX=new J(1,0),If.BlurDirectionY=new J(0,1);var Lf=[[[0,4,7],``],[[0,3,7],`m`],[[0,3,6],`dim`],[[0,4,8],`+`],[[0,5,7],`sus4`],[[0,2,7],`sus2`],[[0,4,7,10],`7`],[[0,4,7,11],`maj7`],[[0,3,7,10],`m7`],[[0,7],`5`]];function Rf(e){if(e.length<2)return null;let t=[...new Set(e.map(e=>(e%12+12)%12))],n=(Math.min(...e)%12+12)%12,r=null;for(let e of t){let i=t.map(t=>(t-e+12)%12).sort((e,t)=>e-t),a=Lf.find(([e])=>e.length===i.length&&e.every((e,t)=>e===i[t]));if(a&&(r&&e!==n||(r={root:e,suffix:a[1]}),e===n))break}if(!r)return null;let i=O(r.root)+r.suffix;return r.root===n?i:`${i}/${O(n)}`}function zf(e){let t=new Map;e.notes.forEach((e,n)=>{let r=`${e.hand}|${Math.round(e.startBeat*1e6)}`,i=t.get(r);i?i.push(n):t.set(r,[n])});let n=[];for(let r of t.values()){if(r.length<2)continue;let t=r.map(t=>e.notes[t].pitch),i=e.notes[r[0]];n.push({startBeat:i.startBeat,hand:i.hand,notes:r,lo:Math.min(...t),hi:Math.max(...t),name:Rf(t)})}return n.sort((e,t)=>e.startBeat-t.startBeat||e.hand.localeCompare(t.hand))}function Bf(e,t,n,r){let i=[];for(let a of e.notes)r&&a.hand!==r||a.startBeat+a.durationBeats>t&&a.startBeat<t+n&&i.push(a.pitch);return i}var Vf=5;function Hf(e,t,n){let r={};for(let i of[`L`,`R`]){let a=Bf(e,t,n,i);if(!a.length)continue;let o=Math.min(...a),s=Math.max(...a),c=()=>{let e=0;for(let t=o;t<=s;t++)N(t)||e++;return e};for(let e=!0;c()<Vf;e=!e)if(e)do o--;while(N(o));else do s++;while(N(s));r[i]={lo:o,hi:s}}return r}function Uf(e,t,n){let r=Bf(e,t,n);return r.length?{lo:Math.min(...r),hi:Math.max(...r)}:null}function Wf(e,t){if(t<=e)return null;let n=null;for(let r of[10,25])e<r&&t>=r&&(n=r);let r=Math.floor(t/50)*50;return r>=50&&e<r&&(n=r),n}function Gf(e,t,n){return e===`miss`?{text:w(`Miss`,`Daneben`),tone:`bad`}:n?e===`perfect`?{text:w(`Perfect`,`Perfekt`),tone:`ok`}:{text:t<0?w(`Early`,`Früh`):w(`Late`,`Spät`),tone:`warn`}:{text:w(`Nice`,`Gut`),tone:`ok`}}var Kf=5.6,qf=.9,Jf=.56,Yf=Kf*.62,Xf=.46,Zf=.9,Qf=.3,$f=.05,ep=.065,tp=.5,np=35*Math.PI/180,rp=1.03,ip=.9,ap=700,op=24,sp=12,cp=21,lp=108,up=48,dp=72,fp=30,pp=26,mp=3,hp=1.6,gp=10,_p=4,vp=1.5,yp=.85,bp=2.5,xp=12,Sp=10,Cp=16,wp=.85,Tp=4,Ep={ok:`#7dffb6`,warn:`#ffc46b`,bad:`#a3abcf`,gold:`#ffe27a`},Dp=class{canvas;renderer;composer;bloom;scene=new va;camera=new jc(50,1,.1,2e3);observer;w=0;h=0;tanV=.3;lo=cp;hi=lp;whites=0;xs=[];length=60;beatLen=7.5;labels=!0;keyHints=!1;hintShift=0;labelKey=``;held=new Set;keyboard=new ua;keys=new Map;whiteGeo=new Sf(.925,qf,Kf,3,.09);blackGeo=new Sf(Jf,Zf,Yf,3,.08);bed;keyLight;floor;hitLine;hitHalo;notes=[];noteGeo=new Sf(1,1,1,4,.25);noteGroup=new ua;reflGroup=new ua;sparks=[];sparkPoints;sparkCursor=0;lastSustainSpark=0;rings=[];glows=new Map;glowTexture=Rp();dust;viewW=0;viewCx=0;targetW=0;targetCx=0;chart=null;chords=[];brackets=[];bracketGeo=new Ps(1,1,1);popups=[];zones;lastStreak=0;heat=0;surge=0;timeUniform={value:0};cues=[];marks=[];textures=new Map;last=performance.now();time=0;lostContext=!1;constructor(e){this.canvas=e,e.dataset.gl=`1`,this.renderer=new _f({canvas:e,antialias:!1,powerPreference:`high-performance`}),this.renderer.toneMapping=7,this.renderer.toneMappingExposure=1,this.renderer.shadowMap.enabled=!0,this.renderer.shadowMap.type=1,e.addEventListener(`webglcontextlost`,this.onLost),e.addEventListener(`webglcontextrestored`,this.onRestored);let t=new Ni(1,1,{type:Mn,samples:4});this.composer=new jf(this.renderer,t),this.composer.addPass(new Pf(this.scene,this.camera)),this.bloom=new If(new J(1,1),.7,.45,1.05),this.composer.addPass(this.bloom),this.composer.addPass(new Nf);let n=this.scene;n.background=new Z(`#070a1c`);let r=new Dl(this.renderer);n.environment=r.fromScene(new vf,.04).texture,n.environmentIntensity=.12,r.dispose(),n.add(new yc(`#b9c3ff`,`#2a2440`,.55)),this.keyLight=new Ic(`#fff2e0`,1.55),this.keyLight.castShadow=!0,this.keyLight.shadow.mapSize.set(2048,1024),this.keyLight.shadow.bias=-4e-4,this.keyLight.shadow.normalBias=.02,this.keyLight.shadow.radius=3,n.add(this.keyLight,this.keyLight.target);let i=new Ic(`#dfe4ff`,.45);i.position.set(0,6,20),n.add(i),this.floor=new rs(new Fs(1,1),zp()),this.floor.rotation.x=-Math.PI/2,this.floor.renderOrder=-2,n.add(this.floor),this.bed=new rs(new Ps(1,.4,6),new qs({color:`#040509`,roughness:.6})),n.add(this.bed),this.hitLine=new rs(new Ps(1,.05,.07),new Go({color:new Z(1.5,1.6,2.1)})),n.add(this.hitLine),this.hitHalo=new rs(new Fs(1,1),Bp()),this.hitHalo.renderOrder=5,n.add(this.hitHalo),this.reflGroup.scale.y=-1,n.add(this.keyboard,this.reflGroup,this.noteGroup),this.sparkPoints=this.makeSparks(),this.dust=this.makeDust(),n.add(this.sparkPoints,this.dust);for(let e=0;e<op;e++){let e=new rs(new Is(.82,1,48),new Go({transparent:!0,blending:2,depthWrite:!1,side:2}));e.rotation.x=-Math.PI/2,e.visible=!1,e.renderOrder=6,n.add(e),this.rings.push({mesh:e,age:0,life:.5,alive:!1})}for(let e=0;e<Cp;e++){let e=new Ro(new wo({transparent:!0,depthWrite:!1,depthTest:!1,toneMapped:!1}));e.visible=!1,e.renderOrder=10,n.add(e),this.popups.push({sprite:e,age:0,life:wp,alive:!1,pitch:0,rise:1.4,size:1})}for(let e=0;e<gp;e++){let e=new Ro(new wo({transparent:!0,depthWrite:!1,depthTest:!1,toneMapped:!1}));e.visible=!1,e.renderOrder=8,n.add(e),this.cues.push(e)}for(let e=0;e<_p;e++){let e=new Go({transparent:!0,blending:2,depthWrite:!1,toneMapped:!1}),t=new rs(new Fs(1,1),e);t.rotation.x=-Math.PI/2,t.renderOrder=3;let r=new Ro(new wo({transparent:!0,depthWrite:!1,depthTest:!1,toneMapped:!1}));r.renderOrder=9,t.visible=r.visible=!1,n.add(t,r),this.marks.push({bar:t,mat:e,label:r})}let a=()=>{let e=new rs(new Fs(1,1),Vp());return e.renderOrder=6,e.visible=!1,n.add(e),{strip:e,lo:0,hi:0,level:0}};this.zones={L:a(),R:a()},this.zones.L.strip.material.uniforms.uColor.value.set(Kt.L),this.zones.R.strip.material.uniforms.uColor.value.set(Kt.R),this.observer=new ResizeObserver(()=>this.resize()),this.observer.observe(e),this.buildKeys(),this.resize()}destroy(){this.observer.disconnect(),this.canvas.removeEventListener(`webglcontextlost`,this.onLost),this.canvas.removeEventListener(`webglcontextrestored`,this.onRestored),this.scene.traverse(e=>{let t=e;t.geometry?.dispose();let n=Array.isArray(t.material)?t.material:t.material?[t.material]:[];for(let e of n)e.dispose()});for(let e of this.textures.values())e.dispose();this.glowTexture.dispose(),this.scene.environment?.dispose(),this.composer.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss()}setRange(e){this.chart=e,this.chords=e?zf(e):[],this.viewW=0,this.layout()}setOptions(e){let t=e.keys?.lo??cp,n=e.keys?.hi??lp;(t!==this.lo||n!==this.hi)&&(this.lo=t,this.hi=n,this.buildKeys(),this.layout()),this.labels=e.labels,this.keyHints=e.keyHints,this.hintShift=e.hintShift??0}setHeld(e){this.held=e}flash(e,t,n,r){if(r&&t!==`wrong`){let n=Gf(t,r.offsetMs,r.timed);this.popup(e,n.text,t===`perfect`&&r.timed?`gold`:n.tone)}if(t===`miss`)return;let i=t===`wrong`?Kt.wrong:n?Kt[n]:Kt.neutral;this.burst(e,i,t===`perfect`?26:t===`wrong`?10:14),t!==`wrong`&&this.ring(e,i,t===`perfect`?1.25:.9)}onLost=e=>{e.preventDefault(),this.lostContext=!0};onRestored=()=>{this.lostContext=!1,this.labelKey=``};resize(){let e=this.canvas.clientWidth,t=this.canvas.clientHeight;if(e===0||t===0)return;this.w=e,this.h=t;let n=Math.min(2,window.devicePixelRatio||1);this.renderer.setPixelRatio(n),this.renderer.setSize(e,t,!1),this.composer.setPixelRatio(n),this.composer.setSize(e,t),this.layout()}keyX(e){return this.xs[Math.max(this.lo,Math.min(this.hi,e))]}buildKeys(){for(let e of this.keys.values()){e.mat.dispose();for(let t of e.labels)t.material.dispose()}this.keyboard.clear(),this.keys.clear();for(let e of this.glows.values())e.level=0,e.sprite.visible=!1;this.labelKey=``;let e=0;for(let t=this.lo;t<=this.hi;t++)this.xs[t]=N(t)?e:e+.5,N(t)||e++;this.whites=e,this.viewW=0;for(let e=this.lo;e<=this.hi;e++){let t=N(e),n=new Z(t?`#0d0d12`:`#f4efe4`),r=new Js({color:n.clone(),roughness:t?.32:.42,clearcoat:t?1:.55,clearcoatRoughness:t?.12:.28,emissive:new Z(0,0,0)}),i=new rs(t?this.blackGeo:this.whiteGeo,r);i.castShadow=t,i.receiveShadow=!t;let a=new ua,o=this.keyX(e);t?(a.position.set(o,0,0),i.position.set(0,Xf-Zf/2,Yf/2)):(a.position.set(o,-.002,0),i.position.set(0,-.9/2,Kf/2)),a.add(i),this.keyboard.add(a),this.keys.set(e,{pitch:e,black:t,x:o,pivot:a,mat:r,base:n,press:0,lit:0,hint:0,litColor:new Z,hintColor:new Z,labels:[]})}this.bed.scale.set(e+6,1,1),this.bed.position.set(e/2,-.85,2.9)}layout(){if(this.w===0)return;let e=this.whites,t=e/2,n=0;for(let e=this.lo,t=0;e<=this.hi;e++)if(!N(e)){if(e%12==0){n=t;break}t++}this.floor.material.uniforms.uCIndex.value=n,this.hitLine.scale.set(e+4,1,1),this.hitLine.position.set(t,.03,-.04),this.hitHalo.scale.set(e+4,2.2,1),this.hitHalo.position.set(t,.02,-1),this.hitHalo.rotation.x=-Math.PI/2,this.viewW||this.resetView(),this.aim(),this.labelKey=``}resetView(){let e=(this.chart&&Uf(this.chart,0,6.4))??{lo:up,hi:dp};this.frameRange(e.lo,e.hi),this.viewW=this.targetW,this.viewCx=this.targetCx}frameRange(e,t){let n=this.whites,r=Math.min(fp,Math.max(12,this.w/pp)),i=this.keyX(e)-.5-mp,a=this.keyX(t)+.5+mp;this.targetW=Math.min(n,Math.max(r,a-i));let o=this.targetW/2;this.targetCx=Math.min(n-o,Math.max(o,(i+a)/2))}aim(){let e=this.viewW,t=this.viewCx,n=this.w/this.h,r=tp;this.tanV=r/n;let i=Kf*.5,a=e/2/(rp*r)+2.8*Math.cos(np),o=this.camera;o.position.set(t,a*Math.sin(np),i+a*Math.cos(np)),o.up.set(0,1,0),o.lookAt(t,0,i),o.aspect=n,o.fov=2*Math.atan(this.tanV)*180/Math.PI,o.far=a*12,o.updateProjectionMatrix(),o.updateMatrixWorld();let s=kp.set(t,-.9,5.75).project(o).y,c=kp.set(t,0,0).project(o).y;o.projectionMatrix.elements[9]=Math.max(s+1,c- -.31999999999999995),o.projectionMatrixInverse.copy(o.projectionMatrix).invert();let l=this.keyLight;l.position.set(t-e*.12,14,-7),l.target.position.set(t,0,Kf*.5),l.target.updateMatrixWorld();let u=l.shadow.camera;u.left=-e*.62-2,u.right=e*.62+2,u.top=9,u.bottom=-9,u.near=1,u.far=40,u.updateProjectionMatrix(),jp.setFromCamera(Ap.set(0,1),o);let d=jp.ray.intersectPlane(Mp,kp),f=d&&d.z<0?-d.z:e*4;this.length=Math.min(e*4,Math.max(e*.6,f*1.02)),this.beatLen=this.length/8,this.floor.scale.set(this.whites*6,this.length+2,1),this.floor.position.set(this.whites/2,-.012,-(this.length+2)/2+.5);let p=this.floor.material.uniforms;p.uLength.value=this.length,p.uBeatLen.value=this.beatLen,p.uView.value.set(t,e),this.sparkPoints.material.uniforms.uScale.value=this.h*this.renderer.getPixelRatio()/(2*this.tanV),this.dust.material.uniforms.uScale.value=this.sparkPoints.material.uniforms.uScale.value,this.dust.material.uniforms.uBox.value.set(e,7,this.length),this.dust.position.set(t-e/2,0,0)}follow(e,t){let n=e.chart;if(n){let t=Uf(n,e.beat,6.4);t&&this.frameRange(t.lo,t.hi)}else{let t=up,n=dp;for(let r of e.highlight?.keys()??[])t=Math.min(t,r),n=Math.max(n,r);for(let e of this.held)t=Math.min(t,e),n=Math.max(n,e);this.frameRange(t,n)}let r=1-Math.exp(-t*1.6),i=this.viewW+this.viewCx*1e3;this.viewW+=(this.targetW-this.viewW)*r,this.viewCx+=(this.targetCx-this.viewCx)*r,Math.abs(this.viewW+this.viewCx*1e3-i)>1e-5&&this.aim()}text(e,t,n=`#ffffff`){let r=`${t}|${n}|${e}`,i=this.textures.get(r);if(i)return i;let a=document.createElement(`canvas`),o=t===`chord`||t===`pop`;a.width=o?256:128,a.height=128;let s=a.getContext(`2d`);if(s.textAlign=`center`,s.textBaseline=`middle`,t===`finger`)s.shadowColor=n,s.shadowBlur=14,s.fillStyle=n,s.beginPath(),s.arc(64,64,46,0,Math.PI*2),s.fill(),s.shadowBlur=0,s.lineWidth=6,s.strokeStyle=`rgba(255, 255, 255, 0.92)`,s.stroke(),s.font=`800 66px ${qt}`,s.fillStyle=`rgba(6, 8, 26, 1)`,s.fillText(e,64,69);else if(o){s.font=`${t===`pop`?`italic 900`:`800`} ${t===`pop`?62:70}px ${qt}`;let r=s.measureText(e).width;r>236&&(s.font=s.font.replace(/\d+px/,`${Math.floor(236/r*(t===`pop`?62:70))}px`)),s.lineJoin=`round`,s.lineWidth=10,s.strokeStyle=`rgba(4, 6, 20, 0.85)`,s.strokeText(e,128,66),s.shadowColor=n,s.shadowBlur=16,s.fillStyle=n,s.fillText(e,128,66),s.shadowBlur=0,s.fillText(e,128,66)}else t===`note`?(s.font=`800 84px ${qt}`,s.shadowColor=`rgba(255, 255, 255, 0.8)`,s.shadowBlur=10,s.fillStyle=`rgba(6, 8, 26, 1)`):t===`c`?(s.font=`italic 600 64px ${qt}`,s.fillStyle=`rgba(64, 60, 54, 0.9)`):t===`letter`?(s.font=`500 54px ${qt}`,s.fillStyle=`rgba(64, 60, 54, 0.5)`):(s.font=`700 50px ${qt}`,s.fillStyle=t===`hint`?`rgba(255, 255, 255, 0.62)`:`rgba(64, 60, 54, 0.55)`);!o&&t!==`finger`&&s.fillText(e,64,68);let c=new As(a);return c.colorSpace=Rr,c.anisotropy=4,this.textures.set(r,c),c}syncKeyLabels(){let e=this.w/Math.max(1,this.viewW||this.whites),t=[this.labels,this.keyHints,this.hintShift,an(),e>=30,this.lo,this.hi].join(`|`);if(t!==this.labelKey){this.labelKey=t;for(let t of this.keys.values()){for(let e of t.labels)t.pivot.remove(e),e.material.dispose();t.labels=[];let n=(e,n,r,i)=>{let a=new rs(Op,new Go({map:e,transparent:!0,depthWrite:!1,polygonOffset:!0,polygonOffsetFactor:-2,toneMapped:!1}));a.rotation.x=-Math.PI/2,a.scale.setScalar(n),a.position.set(0,r,i),a.renderOrder=1,t.pivot.add(a),t.labels.push(a)},r=t.pitch,i=this.keyHints&&e>=30?sn(r,this.hintShift):null;t.black?i&&n(this.text(i,`hint`),.46,.464,Yf*.8):(r%12==0?n(this.text(O(r)+String(Math.floor(r/12)-1),`c`),.78,.004,Kf*.86):this.labels&&e>=30&&n(this.text(O(r),`letter`),.62,.004,Kf*.87),i&&n(this.text(i,`hintDark`),.5,.004,Kf*.7))}}}draw(e){if(this.w===0||this.h===0||this.lostContext)return;let t=performance.now(),n=Math.min(.05,(t-this.last)/1e3);this.last=t,this.time+=n,this.timeUniform.value=this.time,(e.chart??null)!==this.chart&&(this.chart=e.chart??null,this.chords=this.chart?zf(this.chart):[]),this.follow(e,n),this.syncKeyLabels();let r=new Map;e.chart?this.updateNotes(e,e.chart,t,r):this.hideNotes(0),this.updateBrackets(e),this.updateKeys(e,n,r),this.updateFloor(e,r),this.updateZones(e,n),this.updateCues(e),this.updateMarks(e),this.updateStreak(e,n),this.updateSparks(n),this.updateRings(n),this.updatePopups(n),this.dust.material.uniforms.uTime.value=this.time,this.composer.render(n)}updateNotes(e,t,n,r){let i=n-this.lastSustainSpark>45,a=0;for(let n=0;n<t.notes.length;n++){let o=t.notes[n],s=o.startBeat-e.beat,c=s+o.durationBeats;if(s>8||c<0||o.pitch<this.lo||o.pitch>this.hi)continue;let l=e.noteState?.[n]??`pending`,u=e.active?.[n]??!0,d=l===`perfect`||l===`good`,f=!!e.cut?.[n],p=s<=0&&!f&&(d||!u||!e.active),m=Math.max(0,s),h=Math.min(8.5,Math.max(m+.06,c)),g=-m*this.beatLen,_=-h*this.beatLen+Math.min(.12,(h-m)*this.beatLen*.2),v=Math.max(.12,g-_),y=N(o.pitch),b=y?.5:.74,x=this.keyX(o.pitch),S=this.slot(a++),C=S.uniforms,w=l===`miss`?Kt.miss:Kt[o.hand],T=l===`miss`?.4:f?.3:u?1:.5,E=l===`miss`?0:+!!p;C.uColor.value.set(w),C.uRim.value.set(Zt(w,.55)),C.uAlpha.value=T,C.uGlow.value=E,C.uFar.value=this.length;let D=y?.42:Qf,k=y?.12:0,A=o.durationBeats>=vp&&v>yp*1.6,j=A?s>0?yp:Math.min(.4,v):v;if(C.uSize.value.set(b,D,j),S.mesh.position.set(x,k+D/2,g-j/2),S.mesh.scale.set(b,D,j),S.refl.position.copy(S.mesh.position),S.refl.scale.copy(S.mesh.scale),S.mesh.visible=S.refl.visible=!0,S.trail.visible=A,A){let e=S.trailUniforms,t=b*.42,n=.14,r=v-j+.1;e.uColor.value.set(w),e.uRim.value.set(Zt(w,.6)),e.uAlpha.value=T*.8,e.uGlow.value=E*.8,e.uFlow.value=E,e.uFar.value=this.length,e.uSize.value.set(t,n,r),S.trail.position.set(x,k+n/2,g-j+.1-r/2),S.trail.scale.set(t,n,r)}let ee=k+D/2,M=o.finger?String(o.finger):this.labels?O(o.pitch):``,te=M&&u&&l===`pending`&&s>-.05&&v>.6;if(S.label.visible=!!te,te){let e=this.text(M,`note`);S.label.material.map!==e&&(S.label.material.map=e,S.label.material.needsUpdate=!0);let t=y?.56:.7;S.label.scale.set(t,t,1),S.label.position.set(x,ee+D/2+.2,g-Math.min(.42,j/2)),S.label.material.opacity=Math.min(1,(this.length*.9+g)/(this.length*.25))}p&&l!==`miss`&&(r.set(o.pitch,Kt[o.hand]),i&&c>.05&&this.burst(o.pitch,Kt[o.hand],1))}i&&(this.lastSustainSpark=n),this.hideNotes(a)}hideNotes(e){for(let t=e;t<this.notes.length;t++){let e=this.notes[t];e.mesh.visible=e.refl.visible=e.label.visible=e.trail.visible=!1}}slot(e){if(this.notes[e])return this.notes[e];let t={uSize:{value:new Y(1,1,1)},uColor:{value:new Z},uRim:{value:new Z},uAlpha:{value:1},uGlow:{value:0},uFar:{value:60},uReflect:{value:0},uFlow:{value:0},uTime:this.timeUniform},n={...t,uSize:{value:new Y(1,1,1)},uColor:{value:new Z},uRim:{value:new Z},uAlpha:{value:1},uGlow:{value:0},uFlow:{value:0},uFar:{value:60}},r=new rs(this.noteGeo,Hp(n));r.renderOrder=1;let i=new rs(this.noteGeo,Hp(t));i.renderOrder=2;let a=new rs(this.noteGeo,Hp({...t,uReflect:{value:1}}));a.renderOrder=-1;let o=new Ro(new wo({transparent:!0,depthWrite:!1,depthTest:!1,toneMapped:!1}));o.renderOrder=3,this.noteGroup.add(r,i,o),this.reflGroup.add(a);let s={mesh:i,refl:a,uniforms:t,trail:r,trailUniforms:n,label:o};return this.notes[e]=s,s}updateKeys(e,t,n){let r=1-Math.exp(-t*28),i=1-Math.exp(-t*14),a=.75+.25*Math.sin(this.time*5),o=new Z;for(let s of this.keys.values()){let c=this.held.has(s.pitch),l=e.keyHands?.get(s.pitch),u=e.highlight?.get(s.pitch);s.press+=(+!!c-s.press)*r,s.pivot.rotation.x=s.press*(s.black?ep:$f),c&&s.litColor.set(l?Kt[l]:Kt.neutral),s.lit+=(+!!c-s.lit)*(c?r:i),u&&s.hintColor.set(u===`hint`?Kt.hint:Kt[u]),s.hint+=(+!!u-s.hint)*i;let d=Math.max(s.lit,s.hint*.55),f=s.lit>=s.hint*.55?s.litColor:s.hintColor;o.copy(f).lerp(Np,s.black?.2:.12),s.mat.color.copy(s.base).lerp(o,d*(s.black,.9)),s.mat.emissive.copy(s.litColor).multiplyScalar(s.lit*(s.black?1.1:.6)),s.mat.emissive.add(o.copy(s.hintColor).multiplyScalar(s.hint*(1-s.lit)*.42*a));let p=n.get(s.pitch)??(c?l?Kt[l]:Kt.neutral:null);this.updateGlow(s,p,t)}}updateGlow(e,t,n){let r=this.glows.get(e.pitch);if(!r&&!t)return;if(!r){let t=new Ro(new wo({map:this.glowTexture,blending:2,depthWrite:!1,transparent:!0,toneMapped:!1}));t.renderOrder=7,this.scene.add(t),r={sprite:t,level:0,color:new Z},this.glows.set(e.pitch,r)}t&&r.color.set(t),r.level+=(+!!t-r.level)*(1-Math.exp(-n*(t?30:9)));let i=.92+.08*Math.sin(this.time*31+e.pitch);r.sprite.visible=r.level>.01,r.sprite.material.color.copy(r.color).multiplyScalar(1.5*r.level*i),r.sprite.position.set(e.x,e.black?.61:.18,-.05),r.sprite.scale.set(e.black?1.8:2.3,1.2,1)}updateFloor(e,t){let n=this.floor.material.uniforms;n.uBeat.value=e.beat,n.uBpb.value=e.chart?.beatsPerBar??0,n.uTime.value=this.time;let r=n.uLanes.value,i=n.uLaneColors.value,a=0,o=new Map(t);for(let t of this.held){let n=e.keyHands?.get(t);o.has(t)||o.set(t,n?Kt[n]:Kt.neutral)}for(let[e,n]of o){if(a>=sp)break;let o=this.keys.get(e);o&&(r[a].set(o.x,o.black?.3:.42,t.has(e)?1:.6,0),i[a].set(n),a++)}n.uLaneCount.value=a;let s=n.uApproach.value,c=n.uApproachColors.value,l=0,u=e.chart?.notes??[];for(let t=0;t<u.length&&l<xp;t++){let n=u[t],r=n.startBeat-e.beat;if(r<=0||r>=bp||(e.noteState?.[t]??`pending`)!==`pending`||!(e.active?.[t]??!0))continue;let i=this.keys.get(n.pitch);if(!i)continue;let a=(1-r/bp)**1.5;s[l].set(i.x,i.black?.3:.44,a,-r*this.beatLen),c[l].set(Kt[n.hand]),l++}n.uApproachCount.value=l}updateBrackets(e){let t=0;for(let n of this.chords){if(t>=Sp)break;let r=n.startBeat-e.beat;if(r>7.6||r<-.04||e.active&&!n.notes.some(t=>e.active[t])||e.noteState&&n.notes.every(t=>e.noteState[t]!==`pending`)||n.lo<this.lo||n.hi>this.hi)continue;let i=this.bracket(t++),a=e=>N(e)?.32:.44,o=this.keyX(n.lo)-a(n.lo)-.1,s=this.keyX(n.hi)+a(n.hi)+.1,c=-Math.max(0,r)*this.beatLen+.14,l=Math.max(0,Math.min(1,(this.length*.95+c)/(this.length*.2)));if(i.mat.color.set(Kt[n.hand]).multiplyScalar(1.7),i.mat.opacity=.9*l,i.bar.position.set((o+s)/2,.05,c),i.bar.scale.set(s-o,.06,.08),i.left.position.set(o,.24,c),i.right.position.set(s,.24,c),i.group.visible=!0,i.label.visible=!!n.name,n.name){let e=this.text(n.name,`chord`,Zt(Kt[n.hand],.35));i.label.material.map!==e&&(i.label.material.map=e,i.label.material.needsUpdate=!0),i.label.material.opacity=l,i.label.position.set(o-.85,.5,c-.1),i.label.scale.set(1.6,.8,1)}}for(let e=t;e<this.brackets.length;e++)this.brackets[e].group.visible=!1}bracket(e){if(this.brackets[e])return this.brackets[e];let t=new Go({transparent:!0,blending:2,depthWrite:!1}),n=new rs(this.bracketGeo,t),r=new rs(this.bracketGeo,t),i=new rs(this.bracketGeo,t);r.scale.set(.07,.42,.07),i.scale.set(.07,.42,.07);let a=new Ro(new wo({transparent:!0,depthWrite:!1,depthTest:!1,toneMapped:!1}));a.renderOrder=9;let o=new ua;o.renderOrder=4,o.add(n,r,i,a),this.scene.add(o);let s={group:o,mat:t,bar:n,left:r,right:i,label:a};return this.brackets[e]=s,s}updateCues(e){let t=0,n=e.chart?.notes??[],r={L:1/0,R:1/0},i=t=>n[t].finger&&(e.noteState?.[t]??`pending`)===`pending`&&(e.active?.[t]??!0)&&n[t].startBeat-e.beat>-.3;for(let e=0;e<n.length;e++)i(e)&&(r[n[e].hand]=Math.min(r[n[e].hand],n[e].startBeat));for(let a=0;a<n.length&&t<gp;a++){let o=n[a],s=o.startBeat-e.beat;if(s>hp||Math.abs(o.startBeat-r[o.hand])>1e-6||!i(a))continue;let c=this.keys.get(o.pitch);if(!c)continue;let l=this.cues[t++],u=this.text(String(o.finger),`finger`,Kt[o.hand]);l.material.map!==u&&(l.material.map=u,l.material.needsUpdate=!0);let d=1-Math.max(0,Math.min(1,s/hp)),f=s<.08?1+.09*Math.sin(this.time*11):1,p=(c.black?.78:.95)*(.6+.4*d)*f;l.scale.set(p,p,1),l.position.set(c.x,(c.black?Xf:0)+.55+.25*d,c.black?.75:1.15),l.material.opacity=Math.min(1,d*2.2),l.visible=!0}for(let e=t;e<gp;e++)this.cues[e].visible=!1}updateMarks(e){let t=0;for(let n of e.chart?e.sections??[]:[]){if(t>=_p)break;let r=n.startBeat-e.beat;if(r>7.6||r<-.6)continue;let i=this.marks[t++],a=-Math.max(0,r)*this.beatLen,o=Math.max(0,Math.min(1,(this.length*.95+a)/(this.length*.2)))*(r<0?1+r/.6:1);i.mat.color.setRGB(.8,.84,1.7).multiplyScalar(o*(r<.15?1.6:1)),i.bar.position.set(this.viewCx,.02,a),i.bar.scale.set(this.viewW+4,.1,1);let s=this.text(`${w(`Part`,`Teil`)} ${n.name}`,`chord`,`#cdd2ff`);i.label.material.map!==s&&(i.label.material.map=s,i.label.material.needsUpdate=!0),i.label.material.opacity=o,i.label.position.set(this.viewCx-this.viewW/2+2.6,.55,a-.1),i.label.scale.set(2.4,1.2,1),i.bar.visible=i.label.visible=!0}for(let e=t;e<_p;e++)this.marks[e].bar.visible=this.marks[e].label.visible=!1}updateZones(e,t){let n=this.chart&&e.chart?Hf(this.chart,e.beat,Tp):{},r=this.floor.material.uniforms,i=1-Math.exp(-t*4),a=1-Math.exp(-t*5);for(let[e,t]of[`L`,`R`].entries()){let o=this.zones[t],s=n[t];if(s&&s.lo>=this.lo&&s.hi<=this.hi){let e=this.keyX(s.lo)-(N(s.lo)?.3:.5),t=this.keyX(s.hi)+(N(s.hi)?.3:.5);o.level<.02?(o.lo=e,o.hi=t):(o.lo+=(e-o.lo)*a,o.hi+=(t-o.hi)*a),o.level+=(1-o.level)*i}else o.level+=(0-o.level)*i;o.strip.visible=o.level>.01,o.strip.position.set((o.lo+o.hi)/2,.036,-.32),o.strip.scale.set(o.hi-o.lo,.6,1),o.strip.rotation.x=-Math.PI/2,o.strip.material.uniforms.uLevel.value=o.level,r.uZones.value[e].set(o.lo,o.hi,o.level,0),r.uZoneColors.value[e].set(Kt[t])}}updateStreak(e,t){let n=e.streak??0,r=Wf(this.lastStreak,n);if(this.lastStreak=n,r){this.surge=1,this.popup(null,w(`${r} in a row!`,`${r} in Folge!`),`gold`);for(let e=0;e<70;e++){let e=this.viewCx+(Math.random()-.5)*this.viewW;this.burstAt(e,.08,-.1,Math.random()<.5?Ep.gold:`#ffffff`,1,.2)}}this.heat+=(Math.min(1,n/40)-this.heat)*(1-Math.exp(-t*3)),this.surge=Math.max(0,this.surge-t*1.3),this.hitLine.material.color.copy(Pp).lerp(Fp,this.heat*.75).multiplyScalar(1+this.heat*.45+this.surge*1.6);let i=this.hitHalo.material.uniforms;i.uColor.value.copy(Ip).lerp(Lp,this.heat*.8),i.uStrength.value=.35*(1+this.heat*1.1+this.surge*2.5)}popup(e,t,n){let r=e===null?null:this.keys.get(e);if(e!==null&&!r)return;let i=this.popups.find(t=>t.alive&&e!==null&&t.pitch===e)??this.popups.find(e=>!e.alive)??this.popups.reduce((e,t)=>e.age>t.age?e:t),a=e===null;i.alive=!0,i.age=0,i.pitch=e??-1,i.life=a?1.7:wp,i.size=a?2.1:1,i.rise=a?.9:1.3;let o=this.text(t,`pop`,Ep[n]);i.sprite.material.map!==o&&(i.sprite.material.map=o,i.sprite.material.needsUpdate=!0),i.sprite.userData.x=r?r.x:this.viewCx,i.sprite.userData.y=a?2.4:r?.black?1.25:1,i.sprite.userData.z=a?-3:-.5,i.sprite.visible=!0}updatePopups(e){for(let t of this.popups){if(!t.alive)continue;t.age+=e;let n=t.age/t.life;if(n>=1){t.alive=!1,t.sprite.visible=!1;continue}let r=1-(1-n)**3,i=n<.1?.55+n/.1*.7:1.25-.25*Math.min(1,(n-.1)/.12),a=t.size*i,{x:o,y:s,z:c}=t.sprite.userData;t.sprite.position.set(o,s+r*t.rise,c),t.sprite.scale.set(1.9*a,.95*a,1),t.sprite.material.opacity=n<.6?1:1-(n-.6)/.4}}makeSparks(){let e=new po;e.setAttribute(`position`,new Za(new Float32Array(ap*3),3).setUsage(Wr)),e.setAttribute(`aColor`,new Za(new Float32Array(ap*3),3).setUsage(Wr)),e.setAttribute(`aSize`,new Za(new Float32Array(ap),1).setUsage(Wr)),e.setAttribute(`aAlpha`,new Za(new Float32Array(ap),1).setUsage(Wr));for(let e=0;e<ap;e++)this.sparks.push({alive:!1,pos:new Y,vel:new Y,age:0,life:1,color:new Z,size:1});let t=new Ds(e,Up(3.2));return t.frustumCulled=!1,t.renderOrder=8,t}makeDust(){let e=new po,t=new Float32Array(480);for(let e=0;e<t.length;e++)t[e]=Math.random();e.setAttribute(`position`,new Za(t,3));let n=new Ds(e,new Gs({uniforms:{uTime:{value:0},uScale:{value:400},uBox:{value:new Y(30,6,60)}},vertexShader:`
        uniform float uTime; uniform float uScale; uniform vec3 uBox;
        varying float vAlpha;
        void main() {
          vec3 s = position;
          // Motes drift slowly towards the player and gently sway.
          float z = -fract(s.z - uTime * 0.012) * uBox.z;
          vec3 p = vec3(s.x * uBox.x * 1.3 - uBox.x * 0.15 + sin(uTime * 0.4 + s.y * 20.0) * 0.4,
                        0.4 + s.y * uBox.y + sin(uTime * 0.6 + s.x * 30.0) * 0.3, z);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (0.05 + 0.07 * fract(s.x * 13.7)) * uScale / -mv.z;
          float t = -z / uBox.z;
          vAlpha = smoothstep(0.0, 0.15, t) * (1.0 - smoothstep(0.7, 1.0, t)) * (0.35 + 0.65 * fract(s.y * 7.3 + uTime * 0.1 * fract(s.z * 5.0)));
        }`,fragmentShader:`
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(vec3(0.55, 0.62, 1.0) * 0.9, a * a * vAlpha * 0.55);
        }`,transparent:!0,depthWrite:!1,blending:2}));return n.frustumCulled=!1,n.renderOrder=4,n}burst(e,t,n){let r=this.keys.get(e);r&&this.burstAt(r.x,r.black?Xf:.05,-.08,t,n,(r.black?.5:.74)*1.2)}burstAt(e,t,n,r,i,a){for(let o=0;o<i;o++){let i=this.sparks[this.sparkCursor];this.sparkCursor=(this.sparkCursor+1)%ap,i.alive=!0,i.age=0,i.life=ip*(.55+Math.random()*.6),i.pos.set(e+(Math.random()-.5)*a,t+Math.random()*.1,n-Math.random()*.15),i.vel.set((Math.random()-.5)*2.2,1.6+Math.random()*3.4,-(.4+Math.random()*2.4)),i.color.set(Math.random()<.25?Zt(r,.6):r),i.size=.06+Math.random()*.1}}updateSparks(e){let t=this.sparkPoints.geometry,n=t.getAttribute(`position`),r=t.getAttribute(`aColor`),i=t.getAttribute(`aSize`),a=t.getAttribute(`aAlpha`);for(let t=0;t<ap;t++){let o=this.sparks[t];if(o.alive&&(o.age+=e,o.age>=o.life&&(o.alive=!1)),!o.alive){a.setX(t,0);continue}let s=Math.exp(-e*2.6);o.vel.multiplyScalar(s),o.vel.y-=e*.6,o.vel.x+=Math.sin(this.time*7+t)*e*.8,o.pos.addScaledVector(o.vel,e);let c=1-o.age/o.life;n.setXYZ(t,o.pos.x,o.pos.y,o.pos.z),r.setXYZ(t,o.color.r,o.color.g,o.color.b),i.setX(t,o.size*(.6+.4*c)),a.setX(t,c*c)}n.needsUpdate=r.needsUpdate=i.needsUpdate=a.needsUpdate=!0}ring(e,t,n){let r=this.keys.get(e);if(!r)return;let i=this.rings.find(e=>!e.alive)??this.rings[0];i.alive=!0,i.age=0,i.life=.45,i.mesh.material.color.set(t).multiplyScalar(2.4*n),i.mesh.position.set(r.x,r.black?.48000000000000004:.02,-.02),i.mesh.visible=!0}updateRings(e){for(let t of this.rings){if(!t.alive)continue;t.age+=e;let n=t.age/t.life;if(n>=1){t.alive=!1,t.mesh.visible=!1;continue}let r=1-(1-n)**3;t.mesh.scale.set(.25+r*1.5,.25+r*1.5,1),t.mesh.material.opacity=(1-n)*(1-n)}}},Op=new Fs(1,1),kp=new Y,Ap=new J,jp=new nl,Mp=new xo(new Y(0,1,0),0),Np=new Z(1,1,1),Pp=new Z(1.5,1.6,2.1),Fp=new Z(2.4,1.95,1.15),Ip=new Z(.5,.58,1),Lp=new Z(1,.72,.32);function Rp(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(64,64,0,64,64,64);return n.addColorStop(0,`rgba(255,255,255,1)`),n.addColorStop(.2,`rgba(255,255,255,0.55)`),n.addColorStop(.5,`rgba(255,255,255,0.12)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),new As(e)}function zp(){return new Gs({uniforms:{uLength:{value:60},uBeatLen:{value:7.5},uBeat:{value:0},uBpb:{value:0},uTime:{value:0},uCIndex:{value:0},uLaneCount:{value:0},uLanes:{value:Array.from({length:sp},()=>new ji)},uLaneColors:{value:Array.from({length:sp},()=>new Z)},uApproachCount:{value:0},uApproach:{value:Array.from({length:xp},()=>new ji)},uApproachColors:{value:Array.from({length:xp},()=>new Z)},uZones:{value:[new ji,new ji]},uZoneColors:{value:[new Z,new Z]},uView:{value:new J(0,30)}},vertexShader:`
      varying vec3 vWorld;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,fragmentShader:`
      uniform float uLength, uBeatLen, uBeat, uBpb, uTime, uCIndex;
      uniform int uLaneCount;
      uniform vec4 uLanes[${sp}];
      uniform vec3 uLaneColors[${sp}];
      uniform int uApproachCount;
      uniform vec4 uApproach[${xp}];
      uniform vec3 uApproachColors[${xp}];
      uniform vec4 uZones[2];
      uniform vec3 uZoneColors[2];
      uniform vec2 uView;
      varying vec3 vWorld;

      // Antialiased line; once thinner than a pixel it dims instead of breaking into dashes.
      float lineAA(float d, float width) {
        float w = fwidth(d);
        float px = max(width, w);
        return (1.0 - smoothstep(px, px + w * 1.5, abs(d))) * (width / px);
      }

      void main() {
        float depth = clamp(-vWorld.z / uLength, 0.0, 1.0);
        // Base: a glow rising from the keyboard into deep navy.
        vec3 near = vec3(0.045, 0.058, 0.16);
        vec3 far = vec3(0.012, 0.016, 0.05);
        vec3 col = mix(near, far, smoothstep(0.0, 0.85, depth));
        col += vec3(0.06, 0.08, 0.26) * exp(-depth * 7.0) * 0.5;

        // Lane lines on every white-key boundary; C and F (the edges of the black-key groups) brighter.
        float idx = floor(vWorld.x + 0.5);
        float m = mod(idx - uCIndex + 70.0, 7.0);
        bool strong = m < 0.5 || abs(m - 3.0) < 0.5;
        float lane = lineAA(vWorld.x - idx, 0.012 + depth * 0.02);
        float laneFade = smoothstep(1.0, 0.25, depth);
        col += vec3(0.42, 0.48, 1.0) * lane * (strong ? 0.1 : 0.016) * laneFade;

        // Bar lines (and faint beat lines) scrolling towards the player.
        if (uBpb > 0.0) {
          float beatAt = uBeat + (-vWorld.z) / uBeatLen;
          float barD = (fract(beatAt / uBpb + 0.5) - 0.5) * uBpb * uBeatLen;
          float bars = lineAA(barD, 0.025) * 0.1 * (1.0 - depth);
          col += vec3(0.45, 0.52, 1.0) * bars * laneFade * step(0.02, -vWorld.z);
        }

        // Light spilling up the lanes being played.
        for (int i = 0; i < ${sp}; i++) {
          if (i >= uLaneCount) break;
          vec4 L = uLanes[i];
          float dx = (vWorld.x - L.x) / L.y;
          float across = exp(-dx * dx * 1.6);
          float along = exp(vWorld.z / (uLength * 0.22)) ;
          float core = exp(-dx * dx * 12.0) * exp(vWorld.z / (uLength * 0.06));
          col += uLaneColors[i] * L.z * (across * along * 0.22 + core * 0.6);
        }

        // Lanes lit ahead of an incoming note: a soft fill between bright rails, from the line up to the note.
        for (int i = 0; i < ${xp}; i++) {
          if (i >= uApproachCount) break;
          vec4 A = uApproach[i];
          float dx = abs(vWorld.x - A.x);
          float inside = 1.0 - smoothstep(A.y - 0.08, A.y + 0.02, dx);
          float along = smoothstep(A.w - 0.3, A.w + 0.2, vWorld.z) * step(vWorld.z, 0.05);
          float rail = lineAA(dx - A.y, 0.022);
          // Brightest right behind the note, so the light seems to lead it in.
          float lead = 0.5 + 0.5 * exp((A.w - vWorld.z) * 0.6);
          col += uApproachColors[i] * A.z * along * (inside * 0.13 * lead + rail * 0.85);
        }

        // Where each hand will be playing: a soft wash of its colour just behind the line.
        for (int i = 0; i < 2; i++) {
          vec4 Z = uZones[i];
          if (Z.z < 0.01) continue;
          float across = smoothstep(Z.x - 0.4, Z.x + 0.3, vWorld.x) * (1.0 - smoothstep(Z.y - 0.3, Z.y + 0.4, vWorld.x));
          float back = exp(vWorld.z / max(1.0, uLength * 0.05));
          col += uZoneColors[i] * Z.z * across * back * 0.32;
        }

        // Sideways vignette so the eye stays on the keys in play.
        float edge = abs(vWorld.x - uView.x) / max(1.0, uView.y * 0.5);
        col *= 1.0 - smoothstep(0.7, 1.5, edge) * 0.55;
        gl_FragColor = vec4(col, 1.0);
      }`,depthWrite:!1})}function Bp(){return new Gs({uniforms:{uColor:{value:new Z(.5,.58,1)},uStrength:{value:.35}},vertexShader:`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
      uniform vec3 uColor;
      uniform float uStrength;
      varying vec2 vUv;
      void main() {
        float a = pow(1.0 - vUv.y, 4.0) * (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 4.0));
        gl_FragColor = vec4(uColor * uStrength, a);
      }`,transparent:!0,depthWrite:!1,blending:2})}function Vp(){return new Gs({uniforms:{uColor:{value:new Z},uLevel:{value:0}},vertexShader:`
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,fragmentShader:`
      uniform vec3 uColor;
      uniform float uLevel;
      varying vec2 vUv;
      void main() {
        float ends = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
        // The plane lies flat; uv.y = 0 is at the line, 1 further up the highway.
        float a = ends * (exp(-vUv.y * 9.0) * 0.9 + 0.1 * (1.0 - vUv.y));
        gl_FragColor = vec4(uColor * 2.6, a * uLevel);
      }`,transparent:!0,depthWrite:!1,blending:2})}function Hp(e){return new Gs({uniforms:e,vertexShader:`
      uniform vec3 uSize;
      uniform float uReflect;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      const float R0 = 0.25;
      float stretch(float p, float size) {
        float r = min(0.11, size * 0.5);
        float inner = 0.5 - R0;
        float s = sign(p);
        float a = abs(p);
        float half_ = size * 0.5;
        // Flat middle scales to fit; the rounded rim keeps radius r.
        float o = a <= inner ? a / inner * (half_ - r) : (half_ - r) + (a - inner) / R0 * r;
        return s * o;
      }
      void main() {
        vec3 p = vec3(stretch(position.x, uSize.x), stretch(position.y, uSize.y), stretch(position.z, uSize.z));
        vLocal = p;
        // The mesh is scaled by uSize; undo that so the stretched shape is used as-is.
        vec4 w = modelMatrix * vec4(p / uSize, 1.0);
        vWorld = w.xyz;
        vNormal = normalize(mat3(modelMatrix) * (normal / uSize));
        vView = cameraPosition - w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,fragmentShader:`
      uniform vec3 uSize;
      uniform vec3 uColor;
      uniform vec3 uRim;
      uniform float uAlpha;
      uniform float uGlow;
      uniform float uFar;
      uniform float uReflect;
      uniform float uFlow;
      uniform float uTime;
      varying vec3 vLocal;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorld;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vView);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 2.5);
        vec3 half_ = uSize * 0.5;
        // 0 at the far end of the note, 1 at the end nearest the player.
        float t = clamp(vLocal.z / uSize.z + 0.5, 0.0, 1.0);
        float top = smoothstep(0.6, 0.95, n.y);
        float edge = min(half_.x - abs(vLocal.x), half_.z - abs(vLocal.z));
        float rim = (1.0 - smoothstep(0.0, 0.07, edge)) * top;
        float sheen = top * smoothstep(0.35, 0.0, abs(vLocal.x / uSize.x + 0.18)) * 0.35;

        vec3 body = uColor * mix(0.42, 1.0, pow(t, 0.8));
        vec3 col = body * (0.55 + 0.45 * top) + uRim * (rim * 1.25 + fres * (1.0 - top) * 0.9 + sheen);
        // Played: the whole slab lights up from within (HDR, so it blooms).
        col = mix(col, (uRim * 1.4 + uColor) * (1.3 + 0.9 * t), uGlow * 0.85);
        col *= 1.0 + uGlow * 1.2;
        col *= 1.25;
        // A held trail: bands of light run down it into the line.
        col += uRim * uFlow * pow(fract(vWorld.z * 0.35 - uTime * 2.2), 6.0) * 1.4;

        float alpha = mix(0.72, 0.95, t) + rim * 0.2 + fres * 0.2;
        // Fade in from the far end of the highway.
        float fade = smoothstep(-uFar, -uFar * 0.72, vWorld.z);
        alpha *= uAlpha * fade;
        if (uReflect > 0.5) {
          // A dim mirror image on the glossy floor, fading with height.
          alpha *= 0.16 * (1.0 - smoothstep(0.0, 0.5, -vWorld.y));
          col *= 0.8;
        }
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }`,transparent:!0,depthWrite:e.uReflect.value<.5})}function Up(e){return new Gs({uniforms:{uScale:{value:400}},vertexShader:`
      attribute vec3 aColor;
      attribute float aSize;
      attribute float aAlpha;
      uniform float uScale;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, aSize * uScale / -mv.z);
        vColor = aColor;
        vAlpha = aAlpha;
      }`,fragmentShader:`
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        if (vAlpha <= 0.0) discard;
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor * ${e.toFixed(2)}, a * a * vAlpha);
      }`,transparent:!0,depthWrite:!1,blending:2})}var Wp=class{impl;constructor(e){let t=Kp()?qp(e):null;if(t)this.impl=t;else{if(e.dataset.gl){let t=e.cloneNode();delete t.dataset.gl,e.replaceWith(t),e=t}this.impl=new hn(e)}}setRange(e){this.impl.setRange(e)}setOptions(e){this.impl.setOptions(e)}setHeld(e){this.impl.setHeld(e)}flash(e,t,n,r){this.impl.flash(e,t,n,r)}draw(e){this.impl.draw(e)}destroy(){this.impl.destroy()}},Gp=null;function Kp(){if(Gp===null)try{let e=document.createElement(`canvas`).getContext(`webgl2`);Gp=!!e,e?.getExtension(`WEBGL_lose_context`)?.loseContext()}catch{Gp=!1}return Gp}function qp(e){try{return new Dp(e)}catch(e){return console.warn(`Pianova: 3D highway unavailable, using 2D`,e),Gp=!1,null}}var Jp=[0,0,1,1,2,3,3,4,4,5,5,6],Yp=30,Xp=26,Zp=1e-6,Qp=e=>(Math.floor(e/12)-1)*7+Jp[(e%12+12)%12],$p=class{canvas;ctx;constructor(e){this.canvas=e;let t=e.getContext(`2d`);if(!t)throw Error(`No 2D canvas`);this.ctx=t}draw(e){let{canvas:t,ctx:n}=this,r=Math.min(2,window.devicePixelRatio||1),i=t.clientWidth,a=t.clientHeight;if(!i||!a)return;(t.width!==Math.round(i*r)||t.height!==Math.round(a*r))&&(t.width=Math.round(i*r),t.height=Math.round(a*r)),n.setTransform(r,0,0,r,0,0),n.clearRect(0,0,i,a);let o=Math.max(5,Math.min(16,a/19)),s=(a-12*o)/2,c=s+4*o,l=s+8*o,u=(e,t)=>t===`R`?c-(Qp(e)-Yp)*o/2:l-(Qp(e)-Xp)*o/2,d=o*4.2,f=Math.max(d+o*3,i*.24),p=Math.max(o*5,Math.min(o*11,(i-f)/9)),m=t=>f+(t-e.beat)*p,h=e.beat-(f-d)/p-1,g=e.beat+(i-f)/p+1,{chart:_}=e;n.strokeStyle=`rgba(214, 220, 255, 0.5)`,n.lineWidth=1;for(let e of[s,l])for(let t=0;t<5;t++)n.beginPath(),n.moveTo(0,Math.round(e+t*o)+.5),n.lineTo(i,Math.round(e+t*o)+.5),n.stroke();let v=_.beatsPerBar;n.font=`600 ${Math.round(o*.95)}px ${qt}`,n.textAlign=`left`,n.textBaseline=`bottom`;for(let e=Math.max(0,Math.floor(h/v));e*v<=Math.min(g,_.lengthBeats+Zp);e++){let t=Math.round(m(e*v))+.5;n.strokeStyle=`rgba(214, 220, 255, 0.55)`,n.beginPath(),n.moveTo(t,s),n.lineTo(t,l+4*o),n.stroke(),n.fillStyle=`rgba(214, 220, 255, 0.55)`,n.fillText(String(e+1),t+3,s-o*.4)}n.fillStyle=`#ffd76a`;for(let t of e.sections??[])t.startBeat<h||t.startBeat>g||n.fillText(t.name,m(t.startBeat)+3,s-o*1.6);let y=new Map;_.notes.forEach((e,t)=>{if(e.startBeat+e.durationBeats<h||e.startBeat>g)return;let n=`${e.hand}@${Math.round(e.startBeat*1e4)}`,r=y.get(n);r?r.push(t):y.set(n,[t])});let b=o*.62,x=o*.44;for(let t of y.values()){let r=_.notes[t[0]],i=r.hand,a=m(r.startBeat),s=t=>{let n=e.noteState?.[t]??`pending`;return e.active&&!e.active[t]?`rgba(170, 178, 215, 0.55)`:n===`miss`?Kt.wrong:n===`pending`?Kt[i]:`#4ade80`};for(let e of t){let t=_.notes[e],r=u(t.pitch,i);n.fillStyle=s(e),n.globalAlpha=.22,n.fillRect(a,r-x*.55,Math.max(0,t.durationBeats*p-b),x*1.1),n.globalAlpha=1}n.strokeStyle=`rgba(214, 220, 255, 0.7)`;for(let e of t){let t=_.notes[e],r=Qp(t.pitch),[s,u,d]=i===`R`?[Yp,38,c]:[18,Xp,l],f=i===`R`?Yp:Xp,p=[];for(let e=s-2;e>=r;e-=2)p.push(e);for(let e=u+2;e<=r;e+=2)p.push(e);for(let e of p){let t=Math.round(d-(e-f)*o/2)+.5;n.beginPath(),n.moveTo(a-b*1.6,t),n.lineTo(a+b*1.6,t),n.stroke()}}let d=t.map(e=>u(_.notes[e].pitch,i)),f=i===`R`?c-2*o:l+2*o,h=(Math.min(...d)+Math.max(...d))/2>=f,g=Math.min(...t.map(e=>_.notes[e].durationBeats));if(g<3.999999){let e=h?a+b*.92:a-b*.92,r=h?Math.max(...d):Math.min(...d),i=h?Math.min(...d)-o*3.3:Math.max(...d)+o*3.3;n.strokeStyle=s(t[0]),n.lineWidth=Math.max(1.2,o*.12),n.beginPath(),n.moveTo(e,r),n.lineTo(e,i);let c=g<=.250001?2:+(g<=.500001);for(let t=0;t<c;t++){let r=i+(h?1:-1)*t*o*.8;n.moveTo(e,r),n.quadraticCurveTo(e+o*1.1,r+(h?1:-1)*o*1.1,e+o*.7,r+(h?1:-1)*o*2.2)}n.stroke(),n.lineWidth=1}for(let r of t){let c=_.notes[r],l=u(c.pitch,i),f=c.durationBeats>=1.999999;if(n.beginPath(),n.ellipse(a,l,b,x,-.35,0,Math.PI*2),f?(n.strokeStyle=s(r),n.lineWidth=Math.max(1.5,o*.2),n.stroke(),n.lineWidth=1):(n.fillStyle=s(r),n.fill()),n.fillStyle=s(r),n.textAlign=`center`,n.textBaseline=`middle`,N(c.pitch)&&(n.font=`700 ${Math.round(o*1.5)}px ${qt}`,n.fillText(`♯`,a-b*2.1,l)),c.finger){n.font=`700 ${Math.round(o*.95)}px ${qt}`;let e=i===`R`?Math.min(...d)-o*(h?4.2:1.3):Math.max(...d)+o*(h?1.3:4.2),s=[...t].sort((e,t)=>_.notes[t].pitch-_.notes[e].pitch).indexOf(r);n.fillText(String(c.finger),a,e+(i===`R`?-s:s)*o*1.05)}e.labels&&(n.font=`600 ${Math.round(o*.7)}px ${qt}`,n.fillStyle=`rgba(12, 14, 34, 0.9)`,f||n.fillText(O(c.pitch).slice(0,1),a,l+.5))}}let S=n.createLinearGradient(d,0,d+o*2,0);S.addColorStop(0,`rgba(10, 13, 34, 0.96)`),S.addColorStop(1,`rgba(10, 13, 34, 0)`),n.fillStyle=`rgba(10, 13, 34, 0.96)`,n.fillRect(0,0,d,a),n.fillStyle=S,n.fillRect(d,0,o*2,a),n.strokeStyle=`rgba(214, 220, 255, 0.5)`;for(let e of[s,l])for(let t=0;t<5;t++)n.beginPath(),n.moveTo(o*.6,Math.round(e+t*o)+.5),n.lineTo(d,Math.round(e+t*o)+.5),n.stroke();n.strokeStyle=`rgba(214, 220, 255, 0.8)`,n.lineWidth=2,n.beginPath(),n.moveTo(o*.6,s),n.lineTo(o*.6,l+4*o),n.stroke(),em(n,o*2.2,c-o,o),tm(n,o*1.9,l+o,o);let C=n.createLinearGradient(f-o,0,f+o,0);C.addColorStop(0,`rgba(255, 255, 255, 0)`),C.addColorStop(.5,`rgba(255, 255, 255, 0.16)`),C.addColorStop(1,`rgba(255, 255, 255, 0)`),n.fillStyle=C,n.fillRect(f-o,s-o*2,o*2,16*o),n.fillStyle=`#ffffff`,n.fillRect(f-1,s-o*2,2,16*o)}destroy(){this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}};function em(e,t,n,r){e.save(),e.strokeStyle=`#eef0ff`,e.fillStyle=`#eef0ff`,e.lineWidth=Math.max(1.6,r*.18),e.lineCap=`round`,e.lineJoin=`round`,e.beginPath(),e.moveTo(t+.1*r,n+.1*r),e.bezierCurveTo(t+.7*r,n-.6*r,t-.5*r,n-.95*r,t-.75*r,n),e.bezierCurveTo(t-1*r,n+1.2*r,t+1.15*r,n+1.25*r,t+1.05*r,n-.05*r),e.bezierCurveTo(t+.95*r,n-1.3*r,t-.65*r,n-2*r,t-.15*r,n-3.3*r),e.bezierCurveTo(t+.35*r,n-4.5*r,t+.95*r,n-5.1*r,t+.5*r,n-5.6*r),e.bezierCurveTo(t+.05*r,n-5.95*r,t-.45*r,n-4.6*r,t-.2*r,n-3.1*r),e.lineTo(t+.3*r,n+2.4*r),e.bezierCurveTo(t+.4*r,n+3.25*r,t-.65*r,n+3.35*r,t-.55*r,n+2.7*r),e.stroke(),e.beginPath(),e.arc(t-.35*r,n+2.65*r,.32*r,0,Math.PI*2),e.fill(),e.restore()}function tm(e,t,n,r){e.save(),e.strokeStyle=`#eef0ff`,e.fillStyle=`#eef0ff`,e.lineWidth=Math.max(1.6,r*.22),e.lineCap=`round`,e.beginPath(),e.arc(t-.55*r,n,.36*r,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(t-.55*r,n),e.bezierCurveTo(t-.55*r,n-1.35*r,t+1.15*r,n-1.35*r,t+1.05*r,n+.25*r),e.bezierCurveTo(t+.95*r,n+1.65*r,t+.05*r,n+2.55*r,t-.85*r,n+3*r),e.stroke();for(let i of[-.5,.5])e.beginPath(),e.arc(t+1.55*r,n+i*r,.17*r,0,Math.PI*2),e.fill();e.restore()}var nm=.25,rm=.95,im=.7,am=1e-9,om=class{chart;secondsPerBeat;beat=0;state=`idle`;noteState;cut;active;mode;rangeStart;rangeEnd;looping;countIn;metronome;latency;events;judged=[];ons=[];offs=[];judge=null;onPos=0;offPos=0;onAt=[];clickAt=[];sounding=new Map;extras;extraPos=0;extraAt=[];nextClick=0;lastNow=0;resumeAt=-1/0;constructor(e,t={}){let{chart:n}=e;this.chart=n,this.mode=e.mode,this.events=t,this.secondsPerBeat=60/(n.bpm*(e.tempoScale??1)),this.countIn=!!e.countIn&&e.mode===`timed`,this.metronome=e.mode===`timed`||!!e.metronome&&e.mode===`demo`,this.latency=(e.latencyMs??0)/1e3;let r=n.notes.reduce((e,t)=>Math.max(e,t.startBeat+t.durationBeats),0);if(e.loop){let t=Math.max(1,Math.ceil(n.lengthBeats/n.beatsPerBar)),r=e=>Math.min(t,Math.max(1,Math.round(e))),i=r(e.loop.fromBar),a=r(e.loop.toBar);this.rangeStart=(Math.min(i,a)-1)*n.beatsPerBar,this.rangeEnd=Math.max(i,a)*n.beatsPerBar,this.looping=!0}else this.rangeStart=0,this.rangeEnd=r+1,this.looping=!1;let i=e=>e>=this.rangeStart-am&&e<this.rangeEnd-am;this.active=n.notes.map(t=>e.mode!==`demo`&&e.hands.includes(t.hand)&&i(t.startBeat)),this.noteState=n.notes.map(()=>`pending`),this.cut=n.notes.map(()=>!1),n.notes.forEach((e,t)=>{this.active[t]?this.judged.push(t):i(e.startBeat)&&(this.ons.push({beat:e.startBeat,pitch:e.pitch,hand:e.hand}),this.offs.push({beat:e.startBeat+e.durationBeats*rm,pitch:e.pitch,hand:e.hand}))}),this.ons.sort((e,t)=>e.beat-t.beat),this.offs.sort((e,t)=>e.beat-t.beat),this.extras=(e.extras??[]).map((e,t)=>({beat:e.beat,index:t})).filter(e=>i(e.beat)).sort((e,t)=>e.beat-t.beat),this.reset(0)}get barRange(){let e=this.chart.beatsPerBar;return{from:Math.floor(this.rangeStart/e)+1,to:Math.max(1,Math.ceil((this.rangeEnd-1)/e))}}start(e){this.lastNow=e,this.reset(0),this.lastNow=e,this.state=`running`}pause(e){this.state===`running`&&(this.update(e),this.state===`running`&&(this.state=`paused`,this.unschedule(e),this.silence(e)))}stop(e){this.state!==`idle`&&this.state!==`finished`&&(this.state=`finished`,this.unschedule(e),this.silence(e))}resume(e){if(this.state===`paused`){if(this.state=`running`,this.mode===`timed`){let t=this.chart.beatsPerBar;this.resumeAt=e+t*this.secondsPerBeat;for(let n=0;n<t;n++)this.events.click?.(n===0,e+n*this.secondsPerBeat);this.lastNow=this.resumeAt}else this.lastNow=e}}resumeCount(e){return this.state===`running`&&e<this.resumeAt?(this.resumeAt-e)/this.secondsPerBeat:0}update(e,t=0){if(this.state!==`running`)return;let n=e-this.lastNow;n<0?n=0:(this.lastNow=e,n>nm&&(n=0));let r=this.beat+n/this.secondsPerBeat,i=1/0;if(this.mode===`wait`&&this.judge){let e=this.judge.pendingGroup();e.length&&(i=this.chart.notes[this.judged[e[0]]].startBeat),r=Math.min(r,i)}this.beat=r;let a=Math.min(i,this.beat+Math.max(0,e+t-this.lastNow)/this.secondsPerBeat),o=t=>Math.max(e,this.lastNow+(t-this.beat)*this.secondsPerBeat);if(this.metronome){let e=this.chart.beatsPerBar;for(;this.nextClick<=a+am&&this.nextClick<this.rangeEnd-am;){let t=o(this.nextClick);this.clickAt.push({beat:this.nextClick,at:t}),this.events.click?.((this.nextClick%e+e)%e===0,t),this.nextClick++}}for(;this.onPos<this.ons.length&&this.ons[this.onPos].beat<=a+am;){let e=this.ons[this.onPos],t=o(e.beat);this.onAt[this.onPos++]=t,this.sounding.set(e.pitch,e.hand),this.events.autoNote?.(e.pitch,!0,e.hand,t)}for(;this.extraPos<this.extras.length&&this.extras[this.extraPos].beat<=a+am;){let e=this.extras[this.extraPos],t=o(e.beat);this.extraAt[this.extraPos++]=t,this.events.extra?.(e.index,t)}for(;this.offPos<this.offs.length&&this.offs[this.offPos].beat<=this.beat+am;){let e=this.offs[this.offPos++];this.sounding.delete(e.pitch),this.events.autoNote?.(e.pitch,!1,e.hand,o(e.beat))}if(this.judge)for(let e of this.judge.advance(this.judgeTime(this.beat)))this.noteState[this.judged[e]]=`miss`,this.events.judged?.(this.judged[e],`miss`,0);if(this.beat>=this.rangeEnd-am){if(this.looping){let e=this.summary();this.reset(this.beat-this.rangeEnd),this.events.looped?.(e)}else this.state=`finished`,this.silence(e),this.events.finished?.()}}press(e,t){if(this.state!==`running`||!this.judge||t<this.resumeAt)return;let n=this.judgeTime(this.beatAt(t));if(this.mode===`timed`&&n<this.rangeStart*this.secondsPerBeat-120/1e3)return;let r=this.judge.press(e,n);if(r.kind===`hit`){let e=this.judged[r.index];this.noteState[e]=r.grade,this.mode===`wait`&&this.chart.notes[e].startBeat>this.beat&&(this.unschedule(this.lastNow),this.beat=this.chart.notes[e].startBeat),this.events.judged?.(e,r.grade,r.offsetMs)}else this.events.wrong?.(e)}release(e,t){if(this.state!==`running`||!this.judge||this.mode!==`timed`)return;let n=this.judge.release(e,this.judgeTime(this.beatAt(t)));n!==null&&(this.cut[this.judged[n]]=!0,this.events.short?.(this.judged[n]))}pendingNotes(){return this.mode!==`wait`||!this.judge?[]:this.judge.pendingGroup().map(e=>this.judged[e])}summary(){return(this.judge??new mt([],`timed`)).summary()}beatAt(e){let t=e-this.lastNow;return(this.mode!==`timed`||Math.abs(t)>nm)&&(t=0),this.beat+t/this.secondsPerBeat}judgeTime(e){return e*this.secondsPerBeat-(this.mode===`timed`?this.latency:0)}unschedule(e){let t=this.onPos;for(;t>0&&this.onAt[t-1]>e+am;)t--;for(let e=t;e<this.onPos;e++)this.sounding.delete(this.ons[e].pitch);for(this.onPos=t;this.clickAt.length&&this.clickAt[this.clickAt.length-1].at>e+am;)this.nextClick=this.clickAt.pop().beat;for(;this.extraPos>0&&this.extraAt[this.extraPos-1]>e+am;)this.extraPos--;this.events.cancel?.(e)}reset(e){this.unschedule(this.lastNow),this.silence(this.lastNow),this.beat=this.countIn?this.rangeStart-this.chart.beatsPerBar:this.rangeStart+Math.max(0,e),this.nextClick=Math.ceil(this.beat-am),this.clickAt=[],this.onPos=0,this.offPos=0,this.onAt=[],this.extraPos=0,this.extraAt=[],this.resumeAt=-1/0;for(let e of this.judged)this.noteState[e]=`pending`,this.cut[e]=!1;let t=e=>this.mode===`timed`&&e>=1.499999999?e*im*this.secondsPerBeat:0;this.judge=this.mode===`demo`?null:new mt(this.judged.map(e=>{let n=this.chart.notes[e];return{pitch:n.pitch,time:n.startBeat*this.secondsPerBeat,hand:n.hand,minHold:t(n.durationBeats)}}),this.mode===`wait`?`pitch`:`timed`)}silence(e){for(let[t,n]of this.sounding)this.events.autoNote?.(t,!1,n,e);this.sounding.clear()}},sm=1.6,cm=.25,lm=`http://www.w3.org/2000/svg`,um=[[1,22,44,-32],[2,41,12,0],[3,59,4,0],[4,77,10,0],[5,94,26,0]],dm=17,fm=74,pm=104,mm=class{el;fingers;hands;constructor(e){this.el=document.createElement(`div`),this.el.className=`hand-guide`,this.el.setAttribute(`aria-hidden`,`true`);let t=t=>{let n=document.createElement(`div`);n.className=`hand`,n.style.setProperty(`--hand`,Kt[t]);let r=document.createElementNS(lm,`svg`);r.setAttribute(`viewBox`,`-10 -2 134 116`);let i=e=>t===`R`?e:114-e,a=[];for(let[e,n,o,s]of um){let c=document.createElementNS(lm,`g`);c.setAttribute(`class`,`f`);let l=i(n),u=t===`R`?s:-s,d=i(n+12),f=document.createElementNS(lm,`rect`);f.setAttribute(`class`,`finger`),f.setAttribute(`x`,String(l-dm/2)),f.setAttribute(`y`,String(o)),f.setAttribute(`width`,String(dm)),f.setAttribute(`height`,String(e===1?pm-o:fm-o)),f.setAttribute(`rx`,String(dm/2)),u&&f.setAttribute(`transform`,`rotate(${u} ${d} ${pm})`);let[p,m]=hm(l,o+9,d,pm,u),h=document.createElementNS(lm,`circle`);h.setAttribute(`class`,`tip`),h.setAttribute(`cx`,String(p)),h.setAttribute(`cy`,String(m)),h.setAttribute(`r`,`9.5`);let g=document.createElementNS(lm,`text`);g.setAttribute(`class`,`num`),g.setAttribute(`x`,String(p)),g.setAttribute(`y`,String(m+.5)),g.textContent=String(e),c.append(f,h,g),a[e-1]={g:c,state:``},r.append(c)}let o=document.createElementNS(lm,`rect`);o.setAttribute(`class`,`palm`),o.setAttribute(`x`,String(t===`R`?30:10)),o.setAttribute(`y`,`60`),o.setAttribute(`width`,`74`),o.setAttribute(`height`,`50`),o.setAttribute(`rx`,`18`),r.prepend(o);let s=document.createElement(`span`);return s.textContent=t===`L`?w(`Left`,`Links`):w(`Right`,`Rechts`),n.append(r,s),n.hidden=!e.includes(t),{wrap:n,fingers:a}},n=t(`L`),r=t(`R`);this.fingers={L:n.fingers,R:r.fingers},this.hands={L:n.wrap,R:r.wrap},this.el.append(n.wrap,r.wrap)}setPlaying(e){for(let t of[`L`,`R`])this.hands[t].classList.toggle(`off`,!e.includes(t))}update(e,t,n,r){let i={L:[``,``,``,``,``],R:[``,``,``,``,``]},a={L:1/0,R:1/0},o=e.notes,s=e=>(n?.[e]??`pending`)===`pending`&&(r?.[e]??!0);for(let e=0;e<o.length;e++){let n=o[e];n.finger&&s(e)&&n.startBeat-t>-.3&&(a[n.hand]=Math.min(a[n.hand],n.startBeat))}for(let e=0;e<o.length;e++){let c=o[e];if(!c.finger)continue;let l=c.startBeat-t,u=c.finger-1,d=n?.[e]??`pending`;l<=0&&l+c.durationBeats>0&&(d===`perfect`||d===`good`||!(r?.[e]??!0)||!r)&&!i[c.hand][u]&&(i[c.hand][u]=`hold`),s(e)&&Math.abs(c.startBeat-a[c.hand])<1e-6&&l<sm&&(i[c.hand][u]=l<cm?`now`:`next`)}for(let e of[`L`,`R`])this.fingers[e].forEach((t,n)=>{let r=i[e][n];r!==t.state&&(t.state=r,t.g.setAttribute(`class`,r?`f ${r}`:`f`))})}};function hm(e,t,n,r,i){let a=i*Math.PI/180,o=e-n,s=t-r;return[n+o*Math.cos(a)-s*Math.sin(a),r+o*Math.sin(a)+s*Math.cos(a)]}var gm=700,_m=1100,vm=[50,60,70,75,80,90,100],ym=.6,bm=.4,xm=class{app;cfg;el;highway;session;raf=0;cleanups=[];keyHands=new Map;events=[];hudDirty=!0;streak=0;finishTimer=0;feedbackTimer=0;pausedByDisconnect=!1;hadDevice;hintShift=0;lastClock=``;mode;hands;tempo;loop=null;chartHands;bars;streakEl=W(`span`,{class:`panel-value`},`0`);accuracyEl=W(`span`,{class:`panel-value good`},`–`);sections;segs=[];panelsEl=W(`div`,{class:`tl-panels`});playheadEl=W(`div`,{class:`tl-head`,"aria-hidden":`true`});pitchSpan={lo:60,hi:72};notesDirty=!0;stripWidth=0;currentSection=-1;handGuide;showLoop=null;trackLoop=W(`div`,{class:`tl-loop`,hidden:!0},W(`span`,{class:`loop-end a`},`A`),W(`span`,{class:`loop-end b`},`B`));clockEl=W(`span`,{class:`clock`},`0:00 / 0:00`);feedbackEl=W(`div`,{class:`feedback`,hidden:!0,role:`status`});countEl=W(`div`,{class:`count-in`,hidden:!0});overlay=W(`div`,{class:`overlay`,hidden:!0});pauseReason=W(`p`,{class:`muted`});pauseButton=W(`button`,{class:`tbtn primary`,title:w(`Pause (Esc)`,`Pause (Esc)`),"aria-label":w(`Pause`,`Pause`),onclick:()=>this.togglePause()},wt(`pause`));sustainEl=W(`span`,{class:`chip`,title:w(`Sustain pedal`,`Haltepedal`)},wt(`pedal`),w(`Sustain`,`Pedal`));statusEl=W(`p`,{class:`play-status`,hidden:!0});bannerEl=W(`div`,{class:`banner-pop`,hidden:!0,role:`status`});bannerTimer=0;practiced=0;bandEvents=[];lastTick=0;stageEl;sheetCanvas=W(`canvas`,{class:`sheet-canvas`});sheet=null;bare;constructor(e,t){this.app=e,this.cfg=t,this.cfg=t={...t,chart:e.prepare(t.chart)};let{chart:n}=t;this.sections=t.sections?ot(t.sections,n):it(n),this.chartHands=[`L`,`R`].filter(e=>n.notes.some(t=>t.hand===e)),this.bars=Math.max(1,Math.ceil(n.lengthBeats/n.beatsPerBar)),this.mode=t.practice?.mode??t.mode,this.hands=t.practice?.hands??t.hands??this.chartHands,this.tempo=t.practice?.tempo??t.tempoScale??1,this.loop=t.practice?.loop??null,this.hadDevice=e.input.status.inputs.length>0,this.handGuide=new mm(this.chartHands);let r=W(`canvas`,{class:`stage-canvas`});this.overlay.append(W(`div`,{class:`card`},W(`h2`,null,w(`Paused`,`Pausiert`)),this.pauseReason,W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:()=>this.setPaused(!1)},w(`Resume`,`Weiter`)),W(`button`,{class:`btn`,onclick:()=>this.restart()},w(`Restart`,`Neu starten`)),t.onExit&&W(`button`,{class:`btn ghost`,onclick:t.onExit},w(`Leave`,`Verlassen`))))),this.el=W(`div`,{class:`play`},W(`div`,{class:`play-head`},W(`h1`,{class:`play-title`},t.title??n.title),W(`p`,{class:`play-sub`},t.label),this.statusEl,this.timeline()),this.stageEl=W(`div`,{class:`stage`},r,W(`div`,{class:`sheet`},this.sheetCanvas),t.scored&&W(`div`,{class:`panel`},W(`span`,{class:`panel-title`},w(`Practice`,`Übung`)),W(`div`,{class:`panel-row`},wt(`target`),W(`span`,null,w(`Accuracy`,`Genauigkeit`)),this.accuracyEl),W(`div`,{class:`panel-row`},wt(`flame`),W(`span`,null,w(`Streak`,`Serie`)),this.streakEl)),this.feedbackEl,this.handGuide.el,this.bannerEl,this.countEl,this.overlay),this.transport()),this.highway=new Wp(r),this.highway.setRange(n),this.bare={...n,notes:[]},t.band&&(this.bandEvents=Gt(n)),this.applyView(),this.syncHints(),this.cleanups.push(e.input.onNote((t,n,r)=>{n?this.session.press(t,e.synth.fromPerf(r)):this.session.release(t,e.synth.fromPerf(r))}),e.input.onSustain(e=>this.sustainEl.classList.toggle(`on`,e)),e.input.onStatus(e=>{this.syncHints(),e.inputs.length===0&&this.session.state===`running`&&this.hadDevice?(this.pausedByDisconnect=!0,this.setPaused(!0,w(`Your keyboard was disconnected. Plug it back in to carry on.`,`Dein Keyboard wurde getrennt. Steck es wieder ein, um weiterzumachen.`))):e.inputs.length>0&&this.pausedByDisconnect&&this.setPaused(!1),this.hadDevice=e.inputs.length>0}));let i=e=>{let t=e.target instanceof HTMLElement&&e.target.closest(`button, input, select, textarea`);(e.code===`Escape`||e.code===`Space`&&!t&&!e.repeat)&&(e.preventDefault(),this.togglePause())},a=()=>{document.hidden&&this.setPaused(!0)};window.addEventListener(`keydown`,i),document.addEventListener(`visibilitychange`,a),this.cleanups.push(()=>window.removeEventListener(`keydown`,i),()=>document.removeEventListener(`visibilitychange`,a)),this.restart(),this.frame()}destroy(){cancelAnimationFrame(this.raf),clearTimeout(this.finishTimer),clearTimeout(this.feedbackTimer),clearTimeout(this.bannerTimer);for(let e of this.cleanups)e();this.flushPractice(),this.highway.destroy(),this.sheet?.destroy(),this.session.stop(this.app.synth.now())}get practice(){return{mode:this.mode,hands:[...this.hands],tempo:this.tempo,loop:this.loop&&{...this.loop}}}restart(){clearTimeout(this.finishTimer);let{synth:e}=this.app;this.session?.stop(e.now()),this.events=[],this.keyHands.clear(),this.overlay.hidden=!0,this.feedbackEl.hidden=!0,this.pausedByDisconnect=!1,this.setPauseIcon(!1);let{chart:t}=this.cfg,n=this.mode===`wait`?[]:this.bandEvents;this.session=new om({chart:t,mode:this.mode,hands:this.hands,tempoScale:this.tempo,loop:this.loop??void 0,countIn:this.mode===`timed`,metronome:this.cfg.metronome,latencyMs:this.app.progress.settings.latencyMs,extras:n},{autoNote:(t,n,r,i)=>{n?e.noteOn(t,this.mode===`demo`?ym:bm,i,this.mode===`demo`?`keys`:`accomp`):e.noteOff(t,i)},extra:(t,r)=>{let i=n[t];e.band(i.sound,r,i.velocity,i.pitches,i.durationBeats*this.session.secondsPerBeat)},click:(t,n)=>e.click(t,n),cancel:t=>e.cancelAfter(t),short:()=>{this.showFeedback(`short`,0),this.hudDirty=!0},judged:(e,n,r)=>{let i=t.notes[e];this.highway.flash(i.pitch,n,i.hand,{offsetMs:r,timed:this.mode===`timed`}),n!==`miss`&&this.keyHands.set(i.pitch,i.hand),this.showFeedback(n,r),this.events.push({id:t.id,pitch:i.pitch,hand:i.hand,grade:n,offsetMs:r,at:Date.now()}),this.hudDirty=!0},wrong:e=>{this.highway.flash(e,`wrong`),this.keyHands.delete(e),this.showFeedback(`wrong`,0),this.hudDirty=!0},looped:e=>{this.events=[],this.hudDirty=!0,this.cfg.onPass?.(e)},finished:()=>{this.finishTimer=window.setTimeout(()=>this.finish(),gm)}}),this.session.start(e.now()),this.session.update(e.now(),e.lead),this.hudDirty=!0,this.trackLoop.hidden=!this.loop,this.handGuide.setPlaying(this.mode===`demo`?[]:this.hands),this.currentSection=-1;for(let e of this.segs)e.el.classList.remove(`great`,`ok`,`weak`,`current`,`past`),e.el.classList.toggle(`looped`,!!this.loop&&e.el.dataset.from===String(this.loop.fromBar)&&e.el.dataset.to===String(this.loop.toBar)),e.score.textContent=``;this.notesDirty=!0}timeline(){let e=this.cfg.chart.notes.map(e=>e.pitch);e.length&&(this.pitchSpan={lo:Math.min(...e),hi:Math.max(...e)});for(let e of this.sections){let t=W(`canvas`,{class:`tl-notes`}),n=W(`span`,{class:`tl-score`}),r=W(`span`,{class:`tl-dots`}),i=e.fromBar===e.toBar?w(`bar ${e.fromBar}`,`Takt ${e.fromBar}`):w(`bars ${e.fromBar}–${e.toBar}`,`Takte ${e.fromBar}–${e.toBar}`),a=`${w(`Part`,`Teil`)} ${e.name}, ${i}`,o=W(this.cfg.tools?`button`:`div`,{class:`tl-panel`,title:this.cfg.tools?`${a} – ${w(`click to loop it`,`klicken für Schleife`)}`:a,"aria-label":a,onclick:this.cfg.tools?()=>this.loopSection(e):void 0},t,W(`span`,{class:`tl-name`},e.name),n),s=W(`div`,{class:`tl-seg`,style:`flex-grow: ${e.toBar-e.fromBar+1}`},o,W(`div`,{class:`tl-base`}),r);s.dataset.from=String(e.fromBar),s.dataset.to=String(e.toBar),this.segs.push({el:s,panel:o,canvas:t,score:n,dots:r}),this.panelsEl.append(s)}return this.showLevels(this.cfg.sectionLevels),this.panelsEl.append(this.trackLoop,this.playheadEl),this.panelsEl.classList.toggle(`single`,this.sections.length===1),W(`div`,{class:`timeline`},this.panelsEl)}showLevels(e){this.segs.forEach((t,n)=>{let r=e?.[n]??0;t.dots.replaceChildren(...Array.from({length:r},()=>W(`i`))),t.dots.title=r?w(`Level ${r}`,`Stufe ${r}`):``})}xAt(e){let t=st(this.sections,e),n=this.sections[t],r=this.segs[t].el,i=Math.max(0,Math.min(1,(e-n.startBeat)/(n.endBeat-n.startBeat)));return r.offsetLeft+i*r.offsetWidth}drawNoteMaps(){let{chart:e}=this.cfg,{noteState:t,active:n}=this.session,r=this.session.mode===`demo`,i=Math.min(2,window.devicePixelRatio||1),a=Math.max(12,this.pitchSpan.hi-this.pitchSpan.lo),o=(this.pitchSpan.hi+this.pitchSpan.lo)/2;this.sections.forEach((s,c)=>{let{canvas:l}=this.segs[c],u=l.clientWidth,d=l.clientHeight;if(!u||!d)return;(l.width!==Math.round(u*i)||l.height!==Math.round(d*i))&&(l.width=Math.round(u*i),l.height=Math.round(d*i));let f=l.getContext(`2d`);if(!f)return;f.setTransform(i,0,0,i,0,0),f.clearRect(0,0,u,d);let p=c===this.currentSection,m=s.endBeat-s.startBeat,h=Math.max(1.6,Math.min(2.6,d/14));for(let i of s.notes){let c=e.notes[i],l=4+(c.startBeat-s.startBeat)/m*(u-8),g=d/2-(c.pitch-o)/a*(d-2*h-6),_=t[i],v=r||n[i];f.fillStyle=v&&_!==`pending`&&!r?_===`miss`?`rgba(255, 77, 109, 0.9)`:p?`rgba(10, 120, 90, 0.95)`:`rgba(74, 222, 128, 0.95)`:p?v?`rgba(12, 14, 34, 0.85)`:`rgba(12, 14, 34, 0.35)`:v?`rgba(238, 240, 255, 0.85)`:`rgba(238, 240, 255, 0.3)`;let y=c.durationBeats/m*(u-8);y>h*4&&(f.globalAlpha=.45,f.fillRect(l,g-h*.35,y-h,h*.7),f.globalAlpha=1),f.beginPath(),f.arc(l,g,h,0,Math.PI*2),f.fill()}})}loopSection(e){let t=this.loop&&this.loop.fromBar===e.fromBar&&this.loop.toBar===e.toBar;this.loop=t?null:{fromBar:e.fromBar,toBar:e.toBar},this.showLoop?.(),this.restart()}scoreSections(){let{session:e}=this,t=e.mode!==`demo`&&this.cfg.scored;this.sections.forEach((n,r)=>{let i=this.segs[r],a=0,o=0;for(let t of n.notes){if(!e.active[t])continue;let n=e.noteState[t];n!==`pending`&&(a++,n!==`miss`&&o++)}let s=t&&a>0&&e.beat>=n.endBeat-1e-6,c=a?o/a:0,l=s?c>=.9?`great`:c>=.7?`ok`:`weak`:``;for(let e of[`great`,`ok`,`weak`])i.el.classList.toggle(e,e===l);i.score.textContent=s?Dt(c):``})}finish(){let e=this.mode===`timed`&&this.tempo===1&&!this.loop&&this.chartHands.every(e=>this.hands.includes(e));this.cfg.onFinish({summary:this.session.summary(),events:this.events,full:e,timed:this.mode===`timed`,practice:this.practice,noteState:[...this.session.noteState],active:[...this.session.active]})}reconfigure(e){e.sectionLevels&&this.showLevels(e.sectionLevels),e.chart&&(this.cfg={...this.cfg,chart:this.app.prepare(e.chart)},this.sections=ot(this.sections,this.cfg.chart),this.highway.setRange(this.cfg.chart),this.bare={...this.cfg.chart,notes:[]},this.cfg.band&&(this.bandEvents=Gt(this.cfg.chart))),e.tempo!==void 0&&(this.tempo=e.tempo),this.restart()}setStatus(e){this.statusEl.hidden=!e,this.statusEl.textContent=e??``}banner(e,t,n=`ok`){this.bannerEl.replaceChildren(W(`strong`,null,e),W(`span`,null,t)),this.bannerEl.className=`banner-pop ${n}`,this.bannerEl.hidden=!1,clearTimeout(this.bannerTimer),this.bannerTimer=window.setTimeout(()=>this.bannerEl.hidden=!0,2200)}mixer(){let{progress:e,synth:t}=this.app,n=[...this.cfg.band?[[`band`,w(`Band`,`Band`)]]:[],[`accomp`,w(`Other notes`,`Mitspielende Noten`)],[`click`,w(`Click`,`Klick`)]],r=W(`div`,{class:`mixer`,hidden:!0,role:`group`,"aria-label":w(`Mixer`,`Mischpult`)},n.map(([n,r])=>{let i=W(`input`,{type:`range`,min:`0`,max:`100`,value:String(Math.round(e.settings.mix[n]*100)),"aria-label":r,oninput:()=>{let r={...e.settings.mix,[n]:Number(i.value)/100};e.setSettings({mix:r}),t.setMix(r)}});return W(`label`,{class:`mixer-row`},W(`span`,null,r),i)})),i=W(`button`,{class:`chip toggle`,"aria-pressed":`false`,"aria-expanded":`false`,onclick:()=>{r.hidden=!r.hidden,i.setAttribute(`aria-pressed`,String(!r.hidden)),i.setAttribute(`aria-expanded`,String(!r.hidden))}},wt(`music`),w(`Mixer`,`Mischpult`));return W(`span`,{class:`mixer-wrap`},i,r)}flushPractice(){this.app.progress.addPractice(this.practiced),this.practiced=0}applyView(){let e=this.app.progress.settings.view;e!==`highway`&&!this.sheet&&(this.sheet=new $p(this.sheetCanvas)),this.stageEl.classList.toggle(`view-sheet`,e===`sheet`),this.stageEl.classList.toggle(`view-both`,e===`both`)}showFeedback(e,t){if(!this.cfg.scored)return;let[n,r]=e===`short`?[w(`Hold it longer`,`Länger halten`),`warn`]:e===`wrong`?[w(`Wrong key`,`Falsche Taste`),`bad`]:e===`miss`?[w(`Missed`,`Verpasst`),`bad`]:this.mode===`timed`?e===`perfect`?[w(`Right on time`,`Genau im Takt`),`ok`]:t<0?[w(`A little early`,`Etwas zu früh`),`warn`]:[w(`A little late`,`Etwas zu spät`),`warn`]:[w(`Correct`,`Richtig`),`ok`];this.feedbackEl.replaceChildren(wt(r===`ok`?`checkCircle`:r===`warn`?`clock`:`cross`),n),this.feedbackEl.className=`feedback ${r}`,this.feedbackEl.hidden=!1,clearTimeout(this.feedbackTimer),this.feedbackTimer=window.setTimeout(()=>this.feedbackEl.hidden=!0,_m)}togglePause(){this.cfg.mode!==`demo`&&this.setPaused(this.session.state===`running`)}setPaused(e,t=``){let n=this.app.synth.now();e&&this.session.state===`running`?(this.session.pause(n),this.pauseReason.textContent=t,this.pauseReason.hidden=!t,this.overlay.hidden=!1,this.setPauseIcon(!0)):!e&&this.session.state===`paused`&&(this.session.resume(n),this.pausedByDisconnect=!1,this.overlay.hidden=!0,this.setPauseIcon(!1))}setPauseIcon(e){this.pauseButton.replaceChildren(wt(e?`play`:`pause`)),this.pauseButton.setAttribute(`aria-label`,e?w(`Resume`,`Weiter`):w(`Pause`,`Pause`))}syncHints(){this.hintShift=this.app.input.octaveShift,this.highway.setOptions({labels:this.app.progress.settings.labels,keyHints:this.app.usingComputerKeys,hintShift:this.hintShift,keys:this.app.keyboard})}frame=()=>{this.raf=requestAnimationFrame(this.frame),this.app.input.octaveShift!==this.hintShift&&this.syncHints();let{session:e}=this,{chart:t}=this.cfg,{synth:n}=this.app,r=n.now();e.update(r,n.lead);let i=performance.now();this.lastTick&&e.state===`running`&&e.mode!==`demo`&&(this.practiced+=Math.min(.25,(i-this.lastTick)/1e3)),this.lastTick=i,this.practiced>=10&&this.flushPractice();let a=new Map;if(e.mode===`wait`)for(let n of e.pendingNotes())t.notes[n].startBeat-e.beat<.5&&a.set(t.notes[n].pitch,t.notes[n].hand);else e.mode===`timed`&&t.notes.forEach((t,n)=>{let r=t.startBeat-e.beat;e.active[n]&&e.noteState[n]===`pending`&&r>-.2&&r<.5&&a.set(t.pitch,t.hand)});let o=new Set(this.app.input.held),s=new Map;e.state===`running`&&t.notes.forEach((t,n)=>{!e.active[n]&&t.startBeat<=e.beat&&e.beat<t.startBeat+t.durationBeats*.95&&(o.add(t.pitch),s.set(t.pitch,t.hand))});for(let e of this.keyHands.keys())this.app.input.held.has(e)||this.keyHands.delete(e);let c=s.size?new Map([...s,...this.keyHands]):this.keyHands;this.highway.setHeld(o);let l=e.mode===`demo`?void 0:e.active;this.hudDirty&&(this.streak=e.summary().streak);let u=this.app.progress.settings.view,d=u===`sheet`;u!==`highway`&&this.sheet?.draw({beat:e.beat,chart:t,noteState:e.noteState,active:l,sections:this.sections.length>1?this.sections:void 0,labels:this.app.progress.settings.labels}),this.highway.draw({beat:e.beat,chart:d?this.bare:t,noteState:d?[]:e.noteState,cut:d?[]:e.cut,active:d?[]:l,highlight:a,keyHands:c,streak:this.streak,sections:this.sections.length>1?this.sections:void 0}),this.handGuide.update(t,e.beat,e.noteState,l);let f=e.resumeCount(r),p=e.beat<0&&e.state===`running`&&e.mode===`timed`||f>0;this.countEl.hidden=!p,p&&(this.countEl.textContent=String(Math.max(1,Math.ceil(f||-e.beat))));let m=this.bars*t.beatsPerBar,h=Math.max(0,Math.min(m,e.beat)),g=st(this.sections,e.beat);g!==this.currentSection&&(this.currentSection=g,this.segs.forEach((e,t)=>{e.el.classList.toggle(`current`,t===g),e.el.classList.toggle(`past`,t<g)}),this.cfg.scored&&this.scoreSections(),this.notesDirty=!0);let _=this.panelsEl.clientWidth;if(_!==this.stripWidth&&(this.stripWidth=_,this.notesDirty=!0),this.notesDirty&&(this.notesDirty=!1,this.drawNoteMaps()),this.playheadEl.style.transform=`translateX(${this.xAt(h).toFixed(1)}px)`,this.loop){let{from:n,to:r}=e.barRange,i=this.xAt((n-1)*t.beatsPerBar),a=this.xAt(r*t.beatsPerBar-.001);this.trackLoop.style.left=`${i}px`,this.trackLoop.style.width=`${Math.max(8,a-i)}px`}let v=`${Sm(h*e.secondsPerBeat)} / ${Sm(m*e.secondsPerBeat)}`;if(v!==this.lastClock&&(this.clockEl.textContent=this.lastClock=v),this.hudDirty&&this.cfg.scored){this.hudDirty=!1,this.scoreSections(),this.notesDirty=!0;let t=e.summary(),n=t.perfect+t.good+t.miss+t.wrong;this.streakEl.textContent=String(t.streak),this.accuracyEl.textContent=n?Dt(t.soFar):`–`}};transport(){let{cfg:e}=this,t=()=>this.restart(),n=[e.mode!==`demo`&&this.pauseButton,W(`button`,{class:`tbtn`,title:w(`Restart`,`Neu starten`),"aria-label":w(`Restart`,`Neu starten`),onclick:t},wt(`restart`)),W(`span`,{class:`divider`}),this.clockEl];if(e.tools){let e=W(`select`,{class:`chip`,"aria-label":w(`Tempo`,`Tempo`),onchange:()=>{this.tempo=Number(e.value)/100,t()}},vm.map(e=>W(`option`,{value:String(e),selected:e===Math.round(this.tempo*100)},`Tempo ${Dt(e/100)}`))),r=(e,t)=>W(`input`,{type:`number`,min:`1`,max:String(this.bars),value:String(e),class:`bar-input`,"aria-label":t,onchange:()=>c()}),i=r(this.loop?.fromBar??1,w(`Loop from bar`,`Schleife ab Takt`)),a=r(this.loop?.toBar??Math.min(this.bars,2),w(`Loop to bar`,`Schleife bis Takt`)),o=W(`span`,{class:`loop-range`,hidden:!this.loop},w(`bars`,`Takte`),i,`–`,a,W(`span`,{class:`muted`},w(`of ${this.bars}`,`von ${this.bars}`))),s=W(`button`,{class:`chip toggle`,"aria-pressed":String(!!this.loop),onclick:()=>{s.setAttribute(`aria-pressed`,String(s.getAttribute(`aria-pressed`)!==`true`)),c()}},wt(`loop`),w(`Loop A–B`,`Schleife A–B`));this.showLoop=()=>{s.setAttribute(`aria-pressed`,String(!!this.loop)),o.hidden=!this.loop,this.loop&&(i.value=String(this.loop.fromBar),a.value=String(this.loop.toBar))};let c=()=>{let e=s.getAttribute(`aria-pressed`)===`true`;o.hidden=!e;let n=e=>Math.max(1,Math.min(this.bars,Math.round(Number(e.value))||1));this.loop=e?{fromBar:n(i),toBar:n(a)}:null,t()},l=[[w(`Both hands`,`Beide Hände`),this.chartHands],[w(`Left hand`,`Linke Hand`),[`L`]],[w(`Right hand`,`Rechte Hand`),[`R`]]],u=W(`select`,{class:`chip`,"aria-label":w(`Hands`,`Hände`),onchange:()=>{this.hands=l[Number(u.value)][1],t()}},l.map(([e,t],n)=>W(`option`,{value:String(n),selected:t.join()===this.hands.join()},e))),d=W(`button`,{class:`chip toggle`,"aria-pressed":String(this.mode===`wait`),title:w(`The music waits until you press the right key`,`Die Musik wartet, bis du die richtige Taste drückst`),onclick:()=>{this.mode=this.mode===`wait`?`timed`:`wait`,d.setAttribute(`aria-pressed`,String(this.mode===`wait`)),t()}},wt(`hourglass`),w(`Wait for me`,`Warte auf mich`));n.push(W(`span`,{class:`divider`}),e,s,o,this.chartHands.length>1&&u,d)}let r=W(`select`,{class:`chip`,"aria-label":w(`View`,`Ansicht`),onchange:()=>{this.app.progress.setSettings({view:r.value}),this.applyView()}},[[`highway`,w(`Highway`,`Notenbahn`)],[`both`,w(`Highway + sheet music`,`Notenbahn + Noten`)],[`sheet`,w(`Sheet music`,`Noten`)]].map(([e,t])=>W(`option`,{value:e,selected:this.app.progress.settings.view===e},t)));return n.push(W(`span`,{class:`spacer`}),this.mixer(),r,e.onSkip&&W(`button`,{class:`chip`,onclick:e.onSkip},w(`Skip`,`Überspringen`)),W(`span`,{class:`divider`}),this.sustainEl),W(`div`,{class:`transport`},n)}};function Sm(e){let t=Math.max(0,Math.round(e));return`${Math.floor(t/60)}:${String(t%60).padStart(2,`0`)}`}function Cm(e){let t=e.summary,n=e.pass===void 0||t.accuracy>=e.pass,r=n?e.stars===3?w(`Outstanding`,`Hervorragend`):e.stars===2?w(`Great playing`,`Toll gespielt`):e.stars===0&&t.accuracy<.6?w(`Keep at it`,`Dranbleiben`):w(`Well done`,`Gut gemacht`):w(`Not quite yet`,`Noch nicht ganz`),i=Object.entries(t.missedPitches).sort((e,t)=>t[1]-e[1]).slice(0,3).map(([e])=>k(Number(e))),a=[];if(!n&&e.pass!==void 0&&a.push(w(`You need ${Dt(e.pass)} to pass. Have another go, it gets easier every time.`,`Zum Bestehen brauchst du ${Dt(e.pass)}. Versuch es nochmal, es wird jedes Mal leichter.`)),e.timed&&t.perfect+t.good>=4){let e=Math.round(Math.abs(t.meanOffsetMs));e<20?a.push(w(`Your timing sat right on the beat.`,`Dein Timing lag genau auf dem Schlag.`)):t.meanOffsetMs>0?a.push(w(`You tend to play a little late (about ${e} ms). Try to press just as the note touches the line.`,`Du spielst meist etwas zu spät (etwa ${e} ms). Drück genau dann, wenn die Note die Linie berührt.`)):a.push(w(`You tend to play a little early (about ${e} ms). Let the note reach the line before you press.`,`Du spielst meist etwas zu früh (etwa ${e} ms). Lass die Note erst die Linie erreichen.`))}t.short>0&&a.push(w(`You let go of ${t.short===1?`one long note`:`${t.short} long notes`} too soon. Keep the key down until the tail of the note has gone.`,`Du hast ${t.short===1?`eine lange Note`:`${t.short} lange Noten`} zu früh losgelassen. Halte die Taste, bis das Ende der Note verschwunden ist.`)),i.length&&a.push(`${w(`Notes to watch`,`Achte auf diese Töne`)}: ${i.join(`, `)}.`),t.wrong>0&&!i.length&&a.push(w(`The only slips were extra key presses. Keep your fingers resting lightly on their keys.`,`Die einzigen Patzer waren zusätzliche Tastendrücke. Lass die Finger leicht auf ihren Tasten ruhen.`));let o=(e,t,n=``)=>W(`div`,{class:`stat ${n}`},W(`span`,{class:`stat-value`},String(t)),W(`span`,{class:`eyebrow`},e));return W(`div`,{class:`card results`},W(`span`,{class:`eyebrow`},e.title),W(`h2`,null,r),Et(e.stars,`huge`),W(`div`,{class:`score`},Dt(t.accuracy)),e.note&&W(`p`,{class:`muted`},e.note),W(`div`,{class:`stats`},e.timed?[o(w(`Perfect`,`Perfekt`),t.perfect,`perfect`),o(w(`Good`,`Gut`),t.good,`good`),o(w(`Missed`,`Verpasst`),t.miss)]:[o(w(`Right notes`,`Richtige Töne`),t.perfect,`good`)],o(w(`Wrong keys`,`Falsche Tasten`),t.wrong,t.wrong?`wrong`:``),o(w(`Best streak`,`Beste Serie`),t.bestStreak)),a.length>0&&W(`ul`,{class:`tips`},a.map(e=>W(`li`,null,e))),W(`div`,{class:`row`},e.actions.map(e=>W(`button`,{class:e.primary?`btn primary`:`btn`,onclick:e.onclick},e.label))))}function wm(e){let t=W(`p`,{class:`error`,role:`alert`,hidden:!0}),n=W(`input`,{type:`file`,accept:`.mid,.midi,audio/midi`,hidden:!0,onchange:async()=>{let r=n.files?.[0];if(n.value=``,r)try{t.hidden=!0;let{midi:n,title:i}=await Vt(r);zt(n).length>1?e.show(Em(e,n,i)):e.show(Dm(e,Bt(n,i)))}catch(e){t.textContent=w(`Could not open "${r.name}"`,`„${r.name}“ ließ sich nicht öffnen`)+`: ${e instanceof Error?e.message:w(`unknown error`,`unbekannter Fehler`)}.`,t.hidden=!1}}});return{el:W(`div`,{class:`screen`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:()=>e.goPath()},wt(`back`),w(`Lessons`,`Lektionen`)),W(`strong`,null,w(`Songs`,`Lieder`))),W(`main`,{class:`path`},W(`p`,{class:`muted`},w(`Every song is a lesson: it starts simple and adds notes, part by part, as you play it well.`,`Jedes Lied ist eine Lektion: Es beginnt einfach und bekommt Teil für Teil mehr Noten, je besser du spielst.`)),W(`div`,{class:`pieces`},Ee.map(t=>{let n=e.progress.pieceResult(t.id),r=e.progress.songMastery(t.id),i={id:t.id,title:T(t.title),composer:T(t.composer),chart:t.chart,pieceId:t.id};return W(`button`,{class:`piece`,onclick:()=>e.show(Nm(e,i,()=>e.goFreePlay()))},W(`strong`,null,T(t.title)),W(`span`,{class:`muted`},T(t.composer)),W(`span`,{class:`piece-score`},Et(n?.stars??0),r===void 0?n?`${w(`Best`,`Bestwert`)} ${Dt(n.best)}`:w(`Not played yet`,`Noch nicht gespielt`):w(`${Dt(r)} mastered`,`${Dt(r)} gemeistert`)))}),W(`button`,{class:`piece import`,onclick:()=>n.click()},W(`strong`,null,w(`Open a MIDI file`,`MIDI-Datei öffnen`)),W(`span`,{class:`muted`},w(`Learn any .mid file from your computer. Its levels are remembered by its name.`,`Lerne jede .mid-Datei von deinem Computer. Ihre Stufen werden unter ihrem Namen gespeichert.`)))),n,t))}}var Tm=()=>({R:w(`Right hand`,`Rechte Hand`),L:w(`Left hand`,`Linke Hand`),split:w(`Both hands (split at middle C)`,`Beide Hände (geteilt am mittleren C)`),off:w(`Leave out`,`Weglassen`)});function Em(e,t,n){let r=zt(t),i=Object.fromEntries(r.map(e=>[e.index,e.role])),a=W(`p`,{class:`error`,role:`alert`,hidden:!0}),o=r.map(e=>{let t=W(`select`,{"aria-label":`${w(`Part for`,`Stimme für`)} ${e.name}`,onchange:()=>i[e.index]=t.value},Object.entries(Tm()).map(([t,n])=>W(`option`,{value:t,selected:t===e.role},n)));return W(`li`,{class:`track-row`},W(`div`,null,W(`strong`,null,e.name),W(`span`,{class:`muted`},`${e.instrument} · ${e.notes} ${w(`notes`,`Noten`)}`)),t)});return{el:W(`div`,{class:`screen`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:()=>e.goFreePlay()},wt(`back`),w(`Songs`,`Lieder`)),W(`strong`,null,n)),W(`main`,{class:`path narrow`},W(`p`,{class:`muted`},w(`This file has several parts. Choose what each hand plays. Pianova has made a first guess; drums are always left out.`,`Diese Datei hat mehrere Stimmen. Wähle, was jede Hand spielt. Pianova hat einen ersten Vorschlag gemacht; Schlagzeug bleibt immer weg.`)),W(`ol`,{class:`track-list`},o),a,W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:()=>{try{e.show(Dm(e,Bt(t,n,i)))}catch(e){a.textContent=e instanceof Error&&/no notes/i.test(e.message)?w(`Choose at least one track to play.`,`Wähle mindestens eine Spur zum Spielen.`):String(e),a.hidden=!1}}},w(`Play`,`Spielen`)))))}}function Dm(e,t){return Nm(e,{id:`import:${t.title}`,title:t.title,composer:w(`Imported file`,`Importierte Datei`),chart:t,pieceId:null},()=>e.goFreePlay())}function Om(e,t,n){let r=n.saveAs,i=W(`div`,{class:`lesson-body`}),a=Ht(e),o=null,s=t=>{o?.destroy?.(),e.synth.allOff(),o=t,i.replaceChildren(t.el)},c=r=>s(new xm(e,{chart:t,title:n.title,hands:n.hands,band:n.band,practice:r,mode:`timed`,tools:!0,scored:!0,label:n.label,onExit:n.back,onFinish:l})),l=i=>{let a=ht(i.summary.accuracy),o=r!==null&&i.full;o&&e.progress.recordPiece(r,i.summary.accuracy,a),e.progress.addStats(i.events),s({el:W(`div`,{class:`centered`},Cm({title:n.title??t.title,summary:i.summary,stars:a,timed:i.timed,note:o?void 0:r===null?n.unsaved:w(`Practice run. Play both hands at full tempo, without Wait or Loop, to save a score.`,`Übungsdurchgang. Spiel beide Hände im vollen Tempo, ohne Warten oder Schleife, um ein Ergebnis zu speichern.`),actions:[{label:w(`Play again`,`Nochmal spielen`),primary:!0,onclick:()=>c(i.practice)},{label:n.another,onclick:n.back}]}))})},u=W(`div`,{class:`screen lesson`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:n.back},wt(`back`),n.backLabel),W(`span`,{class:`spacer`}),a.el),i);return e.input.allowOctaveShift(!0),c(),{el:u,destroy(){o?.destroy?.(),a.destroy?.(),e.input.allowOctaveShift(!1)}}}var km=.85;function Am(e){return(e.perfect+e.good)/Math.max(1,e.total+e.wrong)}var jm=class{app;info;arrangementId;chart;sections;names;hands;tiers;progressId;progress;constructor(e,t,n=`full`){this.app=e,this.info=t,this.arrangementId=n;let r=Ge(e.prepare(t.chart),n);this.chart=Ke(r.chart),this.sections=it(this.chart),this.names=this.sections.map(e=>e.name),this.tiers=r.tiers,this.hands=r.hands,this.progressId=n===`full`?t.id:`${t.id}@${n}`;let i=ut(e.progress.skill).songLevel;this.progress=e.progress.song(this.progressId,this.sections.length)??{levels:this.sections.map(()=>i),shares:this.sections.map(()=>0),mastery:0}}arranged(){return Me(this.chart,this.sections,this.progress.levels,this.tiers).chart}get mastery(){return Pe(this.sections,this.progress.shares)}get parts(){return[...new Set(this.names)]}first(e){return this.names.indexOf(e)}level(e){return this.progress.levels[this.first(e)]}setLevel(e,t){this.names.forEach((n,r)=>{n===e&&(this.progress.levels[r]=t)})}credit(e,t){this.names.forEach((n,r)=>{if(n!==e)return;let i=Fe(this.sections[r],this.progress.levels[r],t,this.tiers);this.progress.shares[r]=Math.max(this.progress.shares[r],i)})}save(){this.progress.mastery=this.mastery,this.app.progress.saveSong(this.progressId,this.progress)}},Mm=new Map;function Nm(e,t,n){let r=Mm.get(t.id)??`full`;t.pieceId&&e.progress.setLastSong(t.pieceId);let i=new jm(e,t,r),a=e.progress.song(i.progressId,i.sections.length)?.mastery??0,o=()=>e.show(Nm(e,t,n)),s=t=>e.show(new Im(e,i,t,o)),c=W(`div`,{class:`arr-tabs`,role:`radiogroup`,"aria-label":w(`Arrangement`,`Arrangement`)},Re.map(n=>{let i=e.progress.songMastery(n.id===`full`?t.id:`${t.id}@${n.id}`);return W(`button`,{class:n.id===r?`arr-tab on`:`arr-tab`,role:`radio`,"aria-checked":String(n.id===r),title:T(n.blurb),onclick:()=>{Mm.set(t.id,n.id),o()}},W(`strong`,null,T(n.name)),W(`span`,{class:`muted`},i===void 0?`–`:Dt(i)))})),l=i.sections.map(e=>W(`li`,{class:`part-row`},W(`strong`,{class:`part-name`},`${w(`Part`,`Teil`)} ${e.name}`),W(`span`,{class:`muted`},e.fromBar===e.toBar?`${w(`Bar`,`Takt`)} ${e.fromBar}`:`${w(`Bars`,`Takte`)} ${e.fromBar}–${e.toBar}`),Pm(i.progress.levels[i.sections.indexOf(e)]))),u=Ht(e);return{el:W(`div`,{class:`screen`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:n},wt(`back`),w(`Songs`,`Lieder`)),W(`strong`,null,t.title),W(`span`,{class:`spacer`}),u.el),W(`main`,{class:`centered`},W(`div`,{class:`card song-card`},W(`span`,{class:`eyebrow`},t.composer),W(`h2`,null,t.title),c,W(`p`,{class:`muted arr-blurb`},T(Re.find(e=>e.id===r).blurb)),W(`div`,{class:`mastery`},W(`span`,{class:`mastery-value`},Dt(Math.max(a,i.mastery))),W(`span`,{class:`eyebrow`},w(`Mastered`,`Gemeistert`)),W(`div`,{class:`mastery-bar`},W(`div`,{style:`width: ${Math.max(a,i.mastery)*100}%`}))),W(`p`,{class:`muted`},w(`Each part starts simple and gains notes as you play it well, up to the full arrangement at level 5.`,`Jeder Teil beginnt einfach und bekommt mehr Noten, wenn du ihn gut spielst – bis zum vollen Satz auf Stufe 5.`)),W(`ol`,{class:`parts`},l),W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:()=>s(`listen`)},i.mastery>0?w(`Continue the lesson`,`Lektion fortsetzen`):w(`Start the lesson`,`Lektion starten`)),W(`button`,{class:`btn`,onclick:()=>s(`learn`)},w(`Learn the parts`,`Teile lernen`)),W(`button`,{class:`btn`,onclick:()=>s(`perform`)},w(`Perform`,`Vorspielen`)),W(`button`,{class:`btn ghost`,title:w(`The full song with every practice tool: tempo, loop, one hand at a time`,`Das ganze Lied mit allen Übungswerkzeugen: Tempo, Schleife, eine Hand allein`),onclick:()=>e.show(Om(e,i.chart,{title:t.title,hands:i.hands,band:!0,saveAs:t.pieceId,label:`${w(`Free play`,`Frei spielen`)} • ${t.composer}`,unsaved:t.pieceId===null?w(`Scores for imported files are not saved.`,`Ergebnisse importierter Dateien werden nicht gespeichert.`):void 0,backLabel:t.title,back:o,another:w(`Back to the song`,`Zurück zum Lied`)}))},w(`Play freely`,`Frei spielen`)))))),destroy:()=>u.destroy?.()}}function Pm(e){return W(`span`,{class:`pips`,title:w(`Level ${e} of 5`,`Stufe ${e} von 5`),"aria-label":w(`Level ${e} of 5`,`Stufe ${e} von 5`)},Array.from({length:5},(t,n)=>W(`span`,{class:n<e?`pip on`:`pip`})))}var Fm=()=>[[`listen`,w(`Listen`,`Anhören`)],[`learn`,w(`Learn the parts`,`Teile lernen`)],[`perform`,w(`Perform`,`Vorspielen`)]],Im=class{app;song;home;el;body=W(`div`,{class:`lesson-body`});dots=W(`ol`,{class:`steps`});current=null;pill;timer=0;constructor(e,t,n,r){this.app=e,this.song=t,this.home=r,this.pill=Ht(e),this.el=W(`div`,{class:`screen lesson`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:r},wt(`back`),t.info.title),W(`div`,{class:`lesson-title`},W(`span`,{class:`eyebrow`},w(`Song lesson`,`Liedlektion`)),W(`strong`,null,t.info.title)),W(`span`,{class:`spacer`}),this.dots,this.pill.el),this.body),n===`listen`?this.listen():n===`learn`?this.learnFromStart():this.perform()}destroy(){clearTimeout(this.timer),this.current?.destroy?.(),this.pill.destroy?.()}mount(e,t){clearTimeout(this.timer),this.current?.destroy?.(),this.app.synth.allOff(),this.current=e,this.body.replaceChildren(e.el);let n=Fm(),r=n.findIndex(([e])=>e===t);this.dots.replaceChildren(...n.map(([,e],t)=>W(`li`,{class:t===r?`current`:t<r?`done`:``,"aria-current":t===r?`step`:void 0},e)))}card(e,t,n){this.body.append(W(`div`,{class:`overlay`},W(`div`,{class:`card`},W(`h2`,null,e),W(`p`,null,t),W(`div`,{class:`row`},n.map(e=>W(`button`,{class:e.primary?`btn primary`:`btn`,onclick:e.onclick},e.label))))))}listen(){let{song:e}=this;this.mount(new xm(this.app,{chart:e.chart,sections:e.sections,sectionLevels:[...e.progress.levels],band:!0,title:e.info.title,mode:`demo`,tools:!1,metronome:!0,scored:!1,label:w(`Listen • the full song`,`Anhören • das ganze Lied`),onSkip:()=>this.learnFromStart(),onExit:this.home,onFinish:()=>this.card(w(`Now learn it`,`Jetzt lernst du es`),w(`You will learn the song one part at a time, starting simple. Every clean pass speeds it up or adds notes.`,`Du lernst das Lied Teil für Teil, einfach beginnend. Jeder saubere Durchgang macht es schneller oder bringt mehr Noten.`),[{label:w(`Start learning`,`Lernen starten`),primary:!0,onclick:()=>this.learnFromStart()},{label:w(`Listen again`,`Nochmal anhören`),onclick:()=>this.listen()}])}),`listen`)}learn(e){let{song:t}=this,n=t.parts;if(e>=n.length)return this.perform();let r=n[e],i=t.sections[t.first(r)],a=bt(t.level(r)),o=()=>`${w(`Part`,`Teil`)} ${r} ${w(`of`,`von`)} ${n.join(` `)} · ${w(`Level`,`Stufe`)} ${a.level}/5 · ${w(`speed`,`Tempo`)} ${Dt(a.tempo)}`,s=()=>e>0?this.join(e):this.learn(e+1),c=new xm(this.app,{chart:t.arranged(),sections:t.sections,sectionLevels:[...t.progress.levels],band:!0,title:t.info.title,mode:`timed`,hands:t.hands,practice:{mode:`timed`,hands:t.hands,tempo:a.tempo,loop:{fromBar:i.fromBar,toBar:i.toBar}},tools:!1,scored:!0,label:`${w(`Learn`,`Lernen`)} • ${w(`Part`,`Teil`)} ${r}`,onSkip:s,onExit:this.home,onFinish:()=>void 0,onPass:e=>{let n=Am(e);t.credit(r,n);let i=xt(a,n);a=i.state,t.setLevel(r,a.level),t.save(),this.react(c,i.event,a,r,n),c.setStatus(o()),i.event===`learned`&&(this.timer=window.setTimeout(s,1800))}});c.setStatus(o()),this.mount(c,`learn`)}learnFromStart(){let e=this.song.parts.findIndex(e=>this.song.level(e)<5);this.learn(Math.max(0,e))}react(e,t,n,r,i){let a=`${w(`speed`,`Tempo`)} ${Dt(n.tempo)}`;switch(t){case`faster`:e.banner(w(`Clean!`,`Sauber!`),`${w(`Faster`,`Schneller`)}: ${a}`,`ok`),e.reconfigure({tempo:n.tempo});break;case`level-up`:e.banner(`${w(`Level`,`Stufe`)} ${n.level}`,n.level===5?w(`The full arrangement: every note`,`Der volle Satz: jede Note`):w(`More notes coming in`,`Mehr Noten kommen dazu`),`gold`),e.reconfigure({chart:this.song.arranged(),tempo:n.tempo,sectionLevels:[...this.song.progress.levels]});break;case`learned`:e.banner(w(`Part ${r} learned`,`Teil ${r} gelernt`),`${w(`Full speed, every note`,`Volles Tempo, jede Note`)}: ${Dt(i)}`,`gold`);break;case`slower`:e.banner(w(`Easing off`,`Etwas ruhiger`),`${w(`Slower until it settles`,`Langsamer, bis es sitzt`)}: ${a}`,`warn`),e.reconfigure({tempo:n.tempo});break;case`level-down`:e.banner(w(`Back to level ${n.level}`,`Zurück auf Stufe ${n.level}`),w(`Fewer notes for now; they come back as it gets cleaner`,`Vorerst weniger Noten; sie kommen zurück, wenn es sauberer wird`),`warn`),e.reconfigure({chart:this.song.arranged(),tempo:n.tempo,sectionLevels:[...this.song.progress.levels]})}}join(e){let{song:t}=this,n=t.parts,r=t.sections[t.first(n[e-1])],i=t.sections[t.first(n[e])],a=Math.min(r.fromBar,i.fromBar),o=Math.max(r.toBar,i.toBar),s=new xm(this.app,{chart:t.arranged(),sections:t.sections,sectionLevels:[...t.progress.levels],band:!0,title:t.info.title,mode:`timed`,hands:t.hands,practice:{mode:`timed`,hands:t.hands,tempo:1,loop:{fromBar:a,toBar:o}},tools:!1,scored:!0,label:`${w(`Join`,`Verbinden`)} • ${w(`Parts ${n[e-1]} and ${n[e]}`,`Teile ${n[e-1]} und ${n[e]}`)}`,onSkip:()=>this.learn(e+1),onExit:this.home,onFinish:()=>void 0,onPass:t=>{Am(t)<km||(s.banner(w(`Joined up`,`Verbunden`),w(`Parts ${n[e-1]} and ${n[e]} in one go`,`Teile ${n[e-1]} und ${n[e]} in einem Zug`),`gold`),this.timer=window.setTimeout(()=>this.learn(e+1),1800))}});s.setStatus(w(`Bars ${a}–${o} at full speed, until one clean pass`,`Takte ${a}–${o} im vollen Tempo, bis ein Durchgang sauber ist`)),this.mount(s,`learn`)}perform(){let{song:e}=this,t=[...e.progress.levels],n=t.every(e=>e>=5),r=e.arranged(),i=new xm(this.app,{chart:r,sections:e.sections,sectionLevels:[...e.progress.levels],band:!0,title:e.info.title,mode:`timed`,hands:e.hands,tools:!1,scored:!0,label:n?w(`Perform • the full arrangement`,`Vorspielen • der volle Satz`):w(`Perform • each part at its level`,`Vorspielen • jeder Teil auf seiner Stufe`),onExit:this.home,onFinish:e=>this.finish(e,r,t,n)});i.setStatus(e.parts.map(t=>`${t} ${e.level(t)}/5`).join(` · `)),this.mount(i,`perform`)}finish(e,t,n,r){let{song:i}=this,a=i.mastery,o=ot(i.sections,t).map(t=>{let n=t.notes.filter(t=>e.active[t]&&e.noteState[t]!==`pending`);return n.length?n.filter(t=>e.noteState[t]!==`miss`).length/n.length:null});o.forEach((e,t)=>{e!==null&&(i.progress.shares[t]=Math.max(i.progress.shares[t],Fe(i.sections[t],n[t],e,i.tiers)))}),i.progress.levels=St(i.names,n,o),i.save(),this.app.progress.addStats(e.events.map(e=>({...e,id:i.info.id})));let s=e.summary.accuracy,c=r?ht(s):0;r&&i.info.pieceId&&i.arrangementId===`full`&&this.app.progress.recordPiece(i.info.pieceId,s,c);let l=i.parts.map(e=>{let t=i.first(e),r=n[t],a=i.progress.levels[t];return a>r?w(`Part ${e} up to level ${a}`,`Teil ${e} auf Stufe ${a}`):a<r?w(`Part ${e} back to level ${a}`,`Teil ${e} zurück auf Stufe ${a}`):null}).filter(Boolean),u=Math.round((i.mastery-a)*100),d=[`${w(`Mastery`,`Beherrschung`)} ${Dt(i.mastery)}${u>0?` (+${u})`:``}.`,l.length?`${l.join(`, `)}.`:w(`Levels stay as they are.`,`Die Stufen bleiben, wie sie sind.`),r?``:w(`Stars come with the full arrangement, every part at level 5.`,`Sterne gibt es mit dem vollen Satz, jeder Teil auf Stufe 5.`)].filter(Boolean).join(` `);this.mount({el:W(`div`,{class:`centered`},Cm({title:i.info.title,summary:e.summary,stars:c,timed:!0,note:d,actions:[{label:w(`Perform again`,`Nochmal vorspielen`),primary:!0,onclick:()=>this.perform()},{label:w(`Learn the parts`,`Teile lernen`),onclick:()=>this.learnFromStart()},{label:w(`Back to the song`,`Zurück zum Lied`),onclick:this.home}]}))},`perform`)}};function Lm(e,t,n){if(e.notes.every(e=>e.pitch>=t&&e.pitch<=n))return e;let r={L:0,R:0};for(let i of[`L`,`R`]){let a=e.notes.filter(e=>e.hand===i).map(e=>e.pitch),o=1/0;for(let e of[0,-12,12,-24,24,-36,36]){let s=a.filter(r=>r+e<t||r+e>n).length;s<o&&(o=s,r[i]=e)}}let i=new Set,a=[];for(let o of e.notes){let e=o.pitch+r[o.hand];for(;e<t;)e+=12;for(;e>n;)e-=12;let s=`${o.hand}|${e}|${o.startBeat}`;i.has(s)||(i.add(s),a.push({...o,pitch:e}))}return a.sort((e,t)=>e.startBeat-t.startBeat||e.pitch-t.pitch),{...e,notes:a}}var Rm=class{emit;onSustain;onStatus;status={supported:`requestMIDIAccess`in navigator,inputs:[],activeId:null};access=null;wantedId=null;down=new Map;constructor(e,t,n){this.emit=e,this.onSustain=t,this.onStatus=n}async init(e){if(this.wantedId=e,!this.status.supported)this.onStatus(this.status);else try{this.access=await navigator.requestMIDIAccess(),this.access.onstatechange=()=>this.refresh(),this.refresh()}catch(e){this.status={...this.status,error:e instanceof Error?e.message:`MIDI access was refused`},this.onStatus(this.status)}}select(e){this.wantedId=e,this.refresh()}refresh(){if(!this.access)return;let e=[...this.access.inputs.values()],t=e.filter(e=>e.state===`connected`&&!/midi through/i.test(e.name??``)),n=t.some(e=>e.id===this.wantedId)?this.wantedId:null;for(let r of e)t.includes(r)&&(n===null||n===r.id)?(this.down.has(r.id)||this.down.set(r.id,{keys:new Set,pedal:!1}),r.onmidimessage=e=>this.onMessage(r.id,e)):(r.onmidimessage=null,this.release(r.id));this.status={...this.status,inputs:t.map(e=>({id:e.id,name:e.name??`MIDI device`})),activeId:n,error:void 0},this.onStatus(this.status)}release(e){let t=this.down.get(e);if(t){this.down.delete(e);for(let e of t.keys)this.emit(e,!1,performance.now(),0);t.pedal&&this.onSustain(!1)}}onMessage(e,t){let n=t.data,r=this.down.get(e);if(!n||n.length<3||!r)return;let i=n[0]&240;i===144&&n[2]>0?(r.keys.add(n[1]),this.emit(n[1],!0,t.timeStamp,n[2]/127)):i===128||i===144?(r.keys.delete(n[1]),this.emit(n[1],!1,t.timeStamp,0)):i===176&&n[1]===64&&(r.pedal=n[2]>=64,this.onSustain(r.pedal))}},zm=class{held=new Set;status={supported:!0,inputs:[],activeId:null};noteListeners=new Set;statusListeners=new Set;sustainListeners=new Set;midi;keyboard;constructor(){let e=e=>(t,n,r,i)=>{if(n!==this.held.has(t)){n?this.held.add(t):this.held.delete(t);for(let a of[...this.noteListeners])a(t,n,r,i,e)}};this.keyboard=new cn(e(`keys`)),this.midi=new Rm(e(`midi`),e=>this.sustainListeners.forEach(t=>t(e)),e=>{this.status=e;for(let t of[...this.statusListeners])t(e)}),this.status=this.midi.status}init(e){return this.midi.init(e)}selectInput(e){this.midi.select(e)}get octaveShift(){return this.keyboard.octaveShift}allowOctaveShift(e){this.keyboard.shiftEnabled=e,e||(this.keyboard.octaveShift=0)}onNote(e){return this.noteListeners.add(e),()=>this.noteListeners.delete(e)}onStatus(e){return this.statusListeners.add(e),()=>this.statusListeners.delete(e)}onSustain(e){return this.sustainListeners.add(e),()=>this.sustainListeners.delete(e)}},Bm=[{id:`np32`,name:`Yamaha Piaggero NP-32 / NP-35 (76 keys)`,lo:28,hi:103,speakers:!0,match:/np-?3[25]/i},{id:`np12`,name:`Yamaha Piaggero NP-12 / NP-15 (61 keys)`,lo:36,hi:96,speakers:!0,match:/np-?1[25]/i},{id:`88`,name:`88 keys`,lo:21,hi:108,speakers:!1},{id:`76`,name:`76 keys (E to G)`,lo:28,hi:103,speakers:!1},{id:`61`,name:`61 keys (C to C)`,lo:36,hi:96,speakers:!1},{id:`49`,name:`49 keys (C to C)`,lo:36,hi:84,speakers:!1}],Vm=Bm.find(e=>e.id===`88`);function Hm(e){for(let t of e){let e=Bm.find(e=>e.match?.test(t));if(e)return e}return null}function Um(e,t){return e===`auto`?Hm(t)??Vm:Bm.find(t=>t.id===e)??Vm}var Wm=`pianova.v1`,Gm=`pianova.backup`,Km=2,qm={latencyMs:0,volume:.8,labels:!0,midiInputId:null,keyboard:`auto`,soundKeys:`auto`,language:`auto`,view:`highway`,dailyGoalMin:10,mix:{accomp:.8,band:.7,click:.8}},Jm=()=>({version:Km,lessons:{},pieces:{},settings:{...qm},stats:[],songs:{},skill:null,practice:{},lastSong:null});function Ym(e){let t=e=>String(e).padStart(2,`0`);return`${e.getFullYear()}-${t(e.getMonth()+1)}-${t(e.getDate())}`}var Xm=(e,t)=>new Date(e.getFullYear(),e.getMonth(),e.getDate()-t),Zm=e=>typeof e==`object`&&!!e&&!Array.isArray(e),Qm=class{kv;lessonIds;lessonUnits;blob;constructor(e,t,n=[]){this.kv=e,this.lessonIds=t,this.lessonUnits=n,this.blob=this.load()}get settings(){return{...this.blob.settings}}setSettings(e){this.blob.settings={...this.blob.settings,...e},this.save()}isUnlocked(e){let t=this.lessonIds.indexOf(e);return t<=0?t===0:(this.lessonUnits[t]??1/0)<=ut(this.blob.skill).openUnit||(this.blob.lessons[this.lessonIds[t-1]]?.stars??0)>=1}lessonResult(e){return this.blob.lessons[e]}recordLesson(e,t,n){this.record(this.blob.lessons,e,t,n)}pieceResult(e){return this.blob.pieces[e]}recordPiece(e,t,n){this.record(this.blob.pieces,e,t,n)}get skill(){return this.blob.skill}setSkill(e){this.blob.skill=e,this.save()}song(e,t){let n=this.blob.songs[e];return n&&n.levels.length===t&&n.shares.length===t?{...n,levels:[...n.levels],shares:[...n.shares]}:void 0}songMastery(e){return this.blob.songs[e]?.mastery}saveSong(e,t){let n=this.blob.songs[e];this.blob.songs[e]={...t,mastery:Math.max(t.mastery,n?.levels.length===t.levels.length?n.mastery:0)},this.save()}addStats(e){this.blob.stats=this.blob.stats.concat(e).slice(-5e3),this.save()}stats(){return this.blob.stats}addPractice(e,t=new Date){if(!(e>0))return;let n=Ym(t);this.blob.practice[n]=(this.blob.practice[n]??0)+e;let r=Ym(Xm(t,400));for(let e of Object.keys(this.blob.practice))e<r&&delete this.blob.practice[e];this.save()}practiceOn(e=new Date){return this.blob.practice[Ym(e)]??0}streak(e=new Date){let t=this.blob.settings.dailyGoalMin*60,n=n=>(this.blob.practice[Ym(Xm(e,n))]??0)>=t,r=+!n(0),i=0;for(;n(r);)i++,r++;return i}get lastSong(){return this.blob.lastSong}setLastSong(e){this.blob.lastSong=e,this.save()}record(e,t,n,r){let i=e[t];e[t]={stars:Math.max(i?.stars??0,r),best:Math.max(i?.best??0,n)},this.save()}load(){let e=null;try{e=this.kv?.getItem(`pianova.v1`)??null}catch{return Jm()}if(e===null)return Jm();try{let t=JSON.parse(e);if(!Zm(t)||t.version!==Km&&t.version!==1)throw Error(`unknown save format`);let n=Jm();return Zm(t.lessons)&&(n.lessons=t.lessons),Zm(t.pieces)&&(n.pieces=t.pieces),Zm(t.settings)&&(n.settings={...qm,...t.settings}),Array.isArray(t.stats)&&(n.stats=t.stats),Zm(t.songs)&&(n.songs=t.songs),typeof t.skill==`number`&&(n.skill=t.skill),Zm(t.practice)&&(n.practice=t.practice),typeof t.lastSong==`string`&&(n.lastSong=t.lastSong),t.version===1&&(n.settings.latencyMs=qm.latencyMs),n}catch{try{this.kv?.setItem(Gm,e)}catch{}return Jm()}}save(){try{this.kv?.setItem(Wm,JSON.stringify(this.blob))}catch{}}},$m=4,eh=.15,th=4,nh=48,rh=72,ih=72,ah=.25;function oh(e){let t=new Map;for(let n of e.slice(-1500)){if(n.pitch<nh||n.pitch>rh)continue;let e=t.get(n.pitch)??{attempts:0,score:0,hands:{L:0,R:0}};e.attempts++,e.score+=n.grade===`miss`?1:n.grade===`good`?ah:0,e.hands[n.hand]++,t.set(n.pitch,e)}return[...t].map(([e,t])=>({pitch:e,hand:t.hands.L>t.hands.R?`L`:`R`,attempts:t.attempts,weakness:t.score/t.attempts})).filter(e=>e.attempts>=$m&&e.weakness>=eh).sort((e,t)=>t.weakness-e.weakness||e.pitch-t.pitch).slice(0,th)}function sh(e,t){let n=e+t;if(!N(e))for(;N(n);)n+=t;return n<nh||n>rh?sh(e,-t):n}function ch(e){if(!e.length)return null;let t={L:[],R:[]};for(let n of e){let[e,r,i]=[sh(n.pitch,-1),sh(n.pitch,1),n.pitch].map(M);t[n.hand].push(`${e} ${i} ${r} ${i} | ${i} ${e} ${i}:2 |`),t[n.hand===`L`?`R`:`L`].push(`-:4 | -:4 |`)}let n=e=>t[e].some(e=>!e.startsWith(`-`))?t[e].join(` `):void 0;return P(`practice`,`Weak spots`,ih,{R:n(`R`),L:n(`L`)})}var lh=e=>({explain:w(`Learn`,`Lernen`),demo:w(`Watch`,`Ansehen`),drill:w(`Practise`,`Üben`),perform:w(`Perform`,`Vorspielen`)})[e],uh=.75,dh=class{app;lesson;el;body=W(`div`,{class:`lesson-body`});dots=W(`ol`,{class:`steps`});stepView=null;pill;index=0;constructor(e,t){this.app=e,this.lesson=t;let n=U.find(e=>e.n===t.unit);this.pill=Ht(e),this.el=W(`div`,{class:`screen lesson`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:()=>e.goPath()},wt(`back`),w(`Lessons`,`Lektionen`)),W(`div`,{class:`lesson-title`},W(`span`,{class:`eyebrow`},`${w(`Unit`,`Einheit`)} ${n.n} · ${T(n.title)}`),W(`strong`,null,T(t.title))),W(`span`,{class:`spacer`}),this.dots,this.pill.el),this.body),this.go(0)}destroy(){this.stepView?.destroy?.(),this.pill.destroy?.()}mount(e){this.stepView?.destroy?.(),this.app.synth.allOff(),this.stepView=e,this.body.replaceChildren(e.el)}go(e,t=!1,n){this.index=e;let r=this.lesson.steps[e],i=(this.app.progress.lessonResult(this.lesson.id)?.stars??0)>0;this.dots.classList.toggle(`jump`,i),this.dots.replaceChildren(...this.lesson.steps.map((t,n)=>{let r=n===e?`current`:n<e?`done`:``,a=lh(t.type);return W(`li`,{class:r,"aria-current":n===e?`step`:void 0},i&&n!==e?W(`button`,{class:`step-jump`,title:`${w(`Go to`,`Gehe zu`)}: ${T(t.title)}`,onclick:()=>this.go(n)},a):a)}));let a=()=>this.go(e+1),o=this.lesson.steps.some(e=>e.type===`perform`&&e.judging===`timed`);if(r.type===`explain`){this.mount(fh(this.app,r,a));return}let s=e=>new xm(this.app,{chart:r.chart,title:T(this.lesson.title),mode:r.type===`demo`?`demo`:r.type===`drill`||r.judging===`pitch`?`wait`:`timed`,hands:r.type===`demo`?void 0:r.hands,tempoScale:t?uh:1,practice:r.type===`drill`?n:void 0,tools:r.type===`drill`,metronome:o,scored:r.type===`perform`,label:`${w(`Lesson`,`Lektion`)} ${String(Ce.indexOf(this.lesson)+1).padStart(2,`0`)} • ${lh(r.type)}${t?w(`, slower`,`, langsamer`):``}`,onSkip:r.type===`perform`?void 0:a,onExit:()=>this.app.goPath(),...e});r.type===`demo`?this.mount(s({onFinish:()=>this.between(w(`Your turn`,`Du bist dran`),w(`Next you will play it yourself. The music waits for you, so take all the time you need.`,`Jetzt spielst du selbst. Die Musik wartet auf dich, nimm dir also alle Zeit, die du brauchst.`),[{label:w(`I am ready`,`Ich bin bereit`),primary:!0,onclick:a},{label:w(`Watch again`,`Nochmal ansehen`),onclick:()=>this.go(e)}])})):r.type===`drill`?this.mount(s({onFinish:t=>this.between(w(`That is the idea`,`So geht das`),w(`Run it again as often as you like. When it feels comfortable, play it for a score.`,`Wiederhole es, so oft du magst. Wenn es sich gut anfühlt, spiel es für eine Wertung.`),[{label:w(`Play for a score`,`Für Wertung spielen`),primary:!0,onclick:a},{label:w(`Practise again`,`Nochmal üben`),onclick:()=>this.go(e,!1,t.practice)}])})):this.mount(s({onFinish:e=>this.finishPerform(r,e,t)}))}between(e,t,n){this.body.append(W(`div`,{class:`overlay`},W(`div`,{class:`card`},W(`h2`,null,e),W(`p`,null,t),W(`div`,{class:`row`},n.map(e=>W(`button`,{class:e.primary?`btn primary`:`btn`,onclick:e.onclick},e.label))))))}finishPerform(e,t,n){let r=e.pass??.8,{accuracy:i}=t.summary,a=n?Math.min(1,ht(i,r)):ht(i,r),o=this.index===this.lesson.steps.length-1;o&&this.app.progress.recordLesson(this.lesson.id,i,a),this.app.progress.addStats(t.events.map(e=>({...e,id:this.lesson.id})));let s=Ce[Ce.indexOf(this.lesson)+1],c=a>0,l={label:c?w(`Play again`,`Nochmal spielen`):w(`Try again`,`Nochmal versuchen`),primary:!c,onclick:()=>this.go(this.index,n)},u=n?{label:w(`Full speed`,`Volles Tempo`),onclick:()=>this.go(this.index)}:{label:w(`Slow it down`,`Langsamer`),onclick:()=>this.go(this.index,!0)},d=o?s?{label:w(`Next lesson`,`Nächste Lektion`),primary:!0,onclick:()=>this.app.goLesson(s)}:{label:w(`Finish the course`,`Kurs abschließen`),primary:!0,onclick:()=>this.app.goPath()}:{label:w(`Continue`,`Weiter`),primary:!0,onclick:()=>this.go(this.index+1)};this.mount({el:W(`div`,{class:`centered`},Cm({title:T(this.lesson.title),summary:t.summary,stars:a,timed:e.judging===`timed`,pass:r,note:n&&c?w(`Passed at a slower tempo, which earns one star. Play it at full speed for more.`,`Im langsameren Tempo bestanden, das gibt einen Stern. Spiel im vollen Tempo für mehr.`):void 0,actions:[...c?[d]:[],l,...e.judging===`timed`&&(n||a<2)?[u]:[],{label:w(`Back to lessons`,`Zurück zu den Lektionen`),onclick:()=>this.app.goPath()}]}))})}};function fh(e,t,n){let r=W(`canvas`,{class:`stage-canvas`}),i=t.pressToContinue?ee(t.pressToContinue):null,a=i===null,o=W(`button`,{class:`btn primary`,disabled:!a,onclick:n},w(`Continue`,`Weiter`)),s=W(`p`,{class:`prompt`,hidden:a},w(`Find the glowing key and press it.`,`Finde die leuchtende Taste und drück sie.`)),c=W(`div`,{class:`explain`},W(`div`,{class:`stage`},r),W(`div`,{class:`card explain-card`},W(`h2`,null,T(t.title)),T(t.text).split(`

`).map(e=>W(`p`,null,e)),s,W(`div`,{class:`row`},o))),l=new Wp(r);l.setRange(null);let u=new Map((t.highlight??[]).map(e=>[ee(e),`hint`])),d=()=>l.setOptions({labels:e.progress.settings.labels,keyHints:e.usingComputerKeys,hintShift:e.input.octaveShift,keys:e.keyboard});d();let f=0,p=()=>{f=requestAnimationFrame(p),l.setHeld(e.input.held),l.draw({beat:0,highlight:u})};p();let m=e.input.onStatus(d),h=e.input.onNote((e,t)=>{t&&!a&&e===i&&(a=!0,l.flash(e,`perfect`),o.disabled=!1,s.textContent=w(`That is the one.`,`Genau die.`),o.focus())}),g=e=>{let t=!document.activeElement||document.activeElement===document.body;e.code===`Enter`&&a&&t&&n()};return window.addEventListener(`keydown`,g),{el:c,destroy(){cancelAnimationFrame(f),m(),h(),window.removeEventListener(`keydown`,g),l.destroy()}}}var ph=1200,mh=`button, a[href], select, input, [tabindex]:not([tabindex="-1"])`;function hh(e){let t=[];for(let n=e.lo;t.length<4&&n<=e.hi;n++)N(n)||t.push(n);let[n,r,i,a]=t;return{back:n,prev:r,choose:i,next:a}}var gh=class{root;input;keyboard;legend=W(`div`,{class:`nav-legend`,hidden:!0,"aria-hidden":`true`});lastCapture=0;cleanups=[];constructor(e,t,n){this.root=e,this.input=t,this.keyboard=n,document.body.append(this.legend);let r=!1,i=new MutationObserver(()=>{r||(r=!0,requestAnimationFrame(()=>{r=!1,this.refresh()}))});i.observe(e,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[`hidden`]}),this.cleanups.push(()=>i.disconnect());let a=e=>this.onKey(e),o=()=>document.documentElement.classList.remove(`kbd-nav`);window.addEventListener(`keydown`,a),window.addEventListener(`pointerdown`,o,!0),this.cleanups.push(()=>window.removeEventListener(`keydown`,a),()=>window.removeEventListener(`pointerdown`,o,!0),t.onNote((e,t,n,r,i)=>this.onNote(e,t,i)),t.onStatus(()=>this.refresh()))}destroy(){for(let e of this.cleanups)e();this.legend.remove()}refresh(){let e=this.input.status.inputs.length>0,t=this.captured();if(this.legend.hidden=!e||t,e){let e=hh(this.keyboard());this.legend.replaceChildren(W(`span`,{class:`nav-legend-title`},w(`Piano`,`Klavier`)),...[[e.back,w(`back`,`zurück`)],[e.prev,`◀`],[e.choose,w(`choose`,`wählen`)],[e.next,`▶`]].map(([e,t])=>W(`span`,{class:`nav-key`},W(`kbd`,null,k(e)),t)))}let n=document.activeElement;n instanceof HTMLElement&&n!==document.body&&(n.closest(`[hidden]`)||!this.root.contains(n))&&n.blur(),!t&&!this.root.contains(document.activeElement)&&this.primary(!0)?.focus({preventScroll:!0})}captured(){return this.root.querySelector(`.play`)?!this.layer()?.closest(`.overlay`):!1}layer(){return[...this.root.querySelectorAll(`.overlay`)].filter(e=>!e.hidden&&e.offsetParent!==null).at(-1)??this.root}controls(){let e=this.layer();return e?[...e.querySelectorAll(mh)].filter(e=>{if(e.disabled||e.hidden||e.closest(`[hidden]`)||e instanceof HTMLInputElement&&e.type===`file`)return!1;let t=e.getBoundingClientRect();return t.width>0&&t.height>0}):[]}primary(e=!1){let t=this.controls(),n=t.find(e=>e.matches(`.btn.primary`));return n||e?n:t.find(e=>!e.closest(`.topbar`))??t[0]}focus(e){e&&(document.documentElement.classList.add(`kbd-nav`),e.focus({preventScroll:!0}),e.scrollIntoView({block:`nearest`,inline:`nearest`}))}back(){this.layer()?.closest(`.overlay`)||this.root.querySelector(`.topbar > button.btn.ghost:first-child`)?.click()}onKey(e){if(e.defaultPrevented||e.altKey||e.ctrlKey||e.metaKey)return;e.key===`Tab`&&document.documentElement.classList.add(`kbd-nav`);let t={ArrowUp:`up`,ArrowDown:`down`,ArrowLeft:`left`,ArrowRight:`right`}[e.key];if(!t&&e.key!==`Escape`||this.captured())return;if(e.key===`Escape`){if(this.root.querySelector(`.play`))return;e.preventDefault(),this.back();return}let n=document.activeElement;if(!t||n instanceof HTMLSelectElement||n instanceof HTMLInputElement&&n.type!==`checkbox`)return;e.preventDefault();let r=this.controls(),i=n instanceof HTMLElement&&r.includes(n)?n:null;this.focus(i?_h(i,r,t)??i:this.primary())}onNote(e,t,n){if(n!==`midi`)return;let r=performance.now();if(this.captured()){this.lastCapture=r;return}if(!t||r-this.lastCapture<ph)return;let i=hh(this.keyboard());if(e===i.back){this.back();return}if(e!==i.prev&&e!==i.next&&e!==i.choose)return;let a=this.controls(),o=document.activeElement,s=o instanceof HTMLElement?a.indexOf(o):-1;if(s<0)return this.focus(this.primary());if(e===i.choose){document.documentElement.classList.add(`kbd-nav`),o instanceof HTMLInputElement&&o.type===`checkbox`?o.click():o instanceof HTMLSelectElement?(o.selectedIndex=(o.selectedIndex+1)%o.options.length,o.dispatchEvent(new Event(`change`,{bubbles:!0}))):o.click();return}let c=e===i.next?1:-1;this.focus(a[(s+c+a.length)%a.length])}};function _h(e,t,n){let r=e.getBoundingClientRect(),i=r.left+r.width/2,a=r.top+r.height/2,o,s=1/0;for(let c of t){if(c===e)continue;let t=c.getBoundingClientRect(),l=t.left+t.width/2,u=t.top+t.height/2,d=n===`right`?t.left-r.right:n===`left`?r.left-t.right:n===`down`?t.top-r.bottom:r.top-t.bottom;if(d<-4)continue;let f=Math.abs(n===`left`||n===`right`?u-a:l-i),p=n===`left`||n===`right`?Math.min(r.bottom,t.bottom)-Math.max(r.top,t.top):Math.min(r.right,t.right)-Math.max(r.left,t.left),m=Math.max(0,d)+(p>0?0:f*2)+f*.1;m<s&&(s=m,o=c)}return o}function vh(e){let t=Ce.find(t=>e.progress.isUnlocked(t.id)&&!(e.progress.lessonResult(t.id)?.stars??0)),n=oh(e.progress.stats()),r=Ce.reduce((t,n)=>t+(e.progress.lessonResult(n.id)?.stars??0),0),i=W(`span`,{class:`pill`}),a=W(`div`,{class:`banner`,hidden:!0}),o=e=>{let t=e.inputs.length===1?e.inputs[0].name:w(`${e.inputs.length} MIDI devices`,`${e.inputs.length} MIDI-Geräte`);i.textContent=e.inputs.length?t:w(`Computer keys`,`Computertasten`),i.className=e.inputs.length?`pill ok`:`pill`;let n=e.supported?e.error?w(`MIDI access was blocked, so your keyboard cannot be heard. Allow MIDI for this page in the address bar, then reload. Your computer keys still work.`,`Der MIDI-Zugriff wurde blockiert, daher ist dein Keyboard nicht zu hören. Erlaube MIDI für diese Seite in der Adressleiste und lade neu. Deine Computertasten funktionieren trotzdem.`):``:w(`This browser cannot talk to MIDI keyboards. Open Pianova in Chrome or Chromium to use one. Your computer keys still work.`,`Dieser Browser kann nicht mit MIDI-Keyboards sprechen. Öffne Pianova in Chrome oder Chromium, um eines zu nutzen. Deine Computertasten funktionieren trotzdem.`);a.textContent=n,a.hidden=!n};o(e.input.status);let s=e.input.onStatus(o),c=U.map(n=>{let r=Ce.filter(e=>e.unit===n.n),i=r.filter(t=>(e.progress.lessonResult(t.id)?.stars??0)>0).length;return W(`section`,{class:`unit`},W(`div`,{class:`unit-head`},W(`span`,{class:`eyebrow`},`${w(`Unit`,`Einheit`)} ${n.n}`),W(`h2`,null,T(n.title)),W(`p`,{class:`muted`},T(n.blurb)),W(`span`,{class:`unit-count`},w(`${i} of ${r.length}`,`${i} von ${r.length}`))),W(`ol`,{class:`nodes`},r.map((n,r)=>{let i=e.progress.lessonResult(n.id),a=e.progress.isUnlocked(n.id),o=(i?.stars??0)>0;return W(`li`,null,W(`button`,{class:`node ${a?o?`passed`:n===t?`next`:`open`:`locked`}`,disabled:!a,title:a?T(n.summary):w(`Pass the lesson before this one to unlock it`,`Bestehe die Lektion davor, um diese freizuschalten`),onclick:()=>e.goLesson(n)},W(`span`,{class:`node-dot`},a?o?wt(`check`):String(r+1):wt(`lock`)),W(`span`,{class:`node-title`},T(n.title)),a?Et(i?.stars??0):W(`span`,{class:`stars`})))})))});return{el:W(`div`,{class:`screen`},W(`header`,{class:`topbar`},W(`span`,{class:`wordmark`},wt(`nova`),`Pianova`),W(`span`,{class:`spacer`}),i,W(`button`,{class:`btn ghost`,onclick:()=>e.goFreePlay()},wt(`music`),w(`Songs`,`Lieder`)),W(`button`,{class:`btn ghost`,onclick:()=>e.goSettings()},wt(`gear`),w(`Settings`,`Einstellungen`))),W(`main`,{class:`path`},a,W(`section`,{class:`hero`},W(`div`,null,W(`span`,{class:`eyebrow`},t?r?w(`Up next`,`Als Nächstes`):w(`Start here`,`Hier beginnen`):w(`Course complete`,`Kurs abgeschlossen`)),W(`h1`,null,t?T(t.title):w(`You finished every lesson`,`Du hast alle Lektionen geschafft`)),W(`p`,{class:`muted`},t?T(t.summary):w(`Go back for more stars, or learn songs in Songs.`,`Hol dir mehr Sterne oder lerne Lieder unter „Lieder“.`))),W(`div`,{class:`hero-side`},W(`span`,{class:`star-total`},W(`span`,{class:`star lit`},`★`),`${r} / ${Ce.length*3}`),t?W(`button`,{class:`btn primary large`,onclick:()=>e.goLesson(t)},r?w(`Continue`,`Weiter`):w(`Begin`,`Loslegen`)):n.length?W(`button`,{class:`btn primary large`,onclick:()=>e.goPractice()},w(`Practise`,`Üben`)):W(`button`,{class:`btn primary large`,onclick:()=>e.goFreePlay()},w(`Songs`,`Lieder`)))),yh(e),n.length>0&&W(`section`,{class:`practice-card`},W(`div`,null,W(`span`,{class:`eyebrow`},w(`Weak spots`,`Schwachstellen`)),W(`strong`,null,`${w(`Notes that slip most`,`Diese Töne wackeln am meisten`)}: ${n.map(e=>k(e.pitch)).join(`, `)}`),W(`p`,{class:`muted`},w(`A two-minute exercise built from your recent playing. It changes as you improve.`,`Eine Zwei-Minuten-Übung aus deinem letzten Spiel. Sie ändert sich, wenn du besser wirst.`))),W(`button`,{class:`btn`,onclick:()=>e.goPractice()},wt(`target`),w(`Practise`,`Üben`))),c)),destroy:s}}function yh(e){let t=e.progress.settings.dailyGoalMin,n=Math.floor(e.progress.practiceOn()/60),r=n>=t,i=e.progress.streak(),a=Math.min(1,n/t),o=W(`span`,{class:`ring`});o.innerHTML=`<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">
    <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(150,165,255,0.16)" stroke-width="7"/>
    <circle cx="32" cy="32" r="26" fill="none" stroke="${r?`#4ade80`:`#ffd76a`}" stroke-width="7" stroke-linecap="round"
      stroke-dasharray="${(2*Math.PI*26*a).toFixed(1)} 999" transform="rotate(-90 32 32)"/></svg>`,o.append(W(`span`,{class:`ring-text`},r?wt(`check`):String(n)));let s=new Date,c=Array.from({length:7},(n,r)=>{let i=new Date(s.getFullYear(),s.getMonth(),s.getDate()-6+r),a=e.progress.practiceOn(i);return W(`span`,{class:`day ${a>=t*60?`met`:a>0?`some`:``}${r===6?` today`:``}`,title:`${i.toLocaleDateString(S(),{weekday:`long`})}: ${Math.floor(a/60)} min`},W(`i`),i.toLocaleDateString(S(),{weekday:`narrow`}))}),l=e.progress.lastSong,u=l?Ee.find(e=>e.id===l):void 0;return W(`section`,{class:`today-card`},o,W(`div`,{class:`today-text`},W(`span`,{class:`eyebrow`},w(`Today`,`Heute`)),W(`strong`,null,r?w(`Daily goal reached`,`Tagesziel erreicht`):w(`${n} of ${t} minutes`,`${n} von ${t} Minuten`)),W(`span`,{class:i?`streak on`:`streak`},wt(`flame`),i===1?w(`1 day in a row`,`1 Tag in Folge`):w(`${i} days in a row`,`${i} Tage in Folge`))),W(`div`,{class:`week`},c),W(`div`,{class:`today-actions`},W(`button`,{class:`btn`,onclick:()=>e.goWarmup()},wt(`flame`),w(`Warm up`,`Aufwärmen`)),u&&W(`button`,{class:`btn`,onclick:()=>e.goSong(u.id)},wt(`music`),T(u.title))))}var bh=12,xh=4,Sh=.5;function Ch(e){let{progress:t,input:n,synth:r}=e,i=t.settings,a=W(`select`,{onchange:()=>{let e=a.value||null;t.setSettings({midiInputId:e}),n.selectInput(e)}}),o=W(`p`,{class:`muted`}),s=e=>{a.replaceChildren(W(`option`,{value:``},w(`All connected keyboards`,`Alle angeschlossenen Keyboards`)),...e.inputs.map(e=>W(`option`,{value:e.id},e.name))),a.value=e.activeId??``,o.textContent=e.supported?e.error?w(`MIDI access is blocked for this page. Allow it in the address bar and reload.`,`MIDI ist für diese Seite blockiert. Erlaube es in der Adressleiste und lade neu.`):e.inputs.length?w(`${e.inputs.length} keyboard${e.inputs.length>1?`s`:``} connected.`,`${e.inputs.length} Keyboard${e.inputs.length>1?`s`:``} verbunden.`):w(`No MIDI keyboard found. Plug one in and it will appear here.`,`Kein MIDI-Keyboard gefunden. Steck eines an, dann erscheint es hier.`):w(`This browser has no MIDI support. Use Chrome or Chromium to connect a keyboard.`,`Dieser Browser unterstützt kein MIDI. Nutze Chrome oder Chromium, um ein Keyboard anzuschließen.`)};s(n.status);let c=n.onStatus(s),l=W(`output`,null,`${i.latencyMs} ms`),u=W(`input`,{type:`range`,min:`-50`,max:`300`,step:`5`,value:String(i.latencyMs),"aria-label":w(`Timing offset`,`Timing-Ausgleich`),oninput:()=>{l.textContent=`${u.value} ms`,t.setSettings({latencyMs:Number(u.value)})}}),d=W(`p`,{class:`muted`},w(`If you are judged late even when you feel on the beat, calibrate: you will hear clicks, then tap any key along with them.`,`Wenn du als zu spät gewertet wirst, obwohl du dich im Takt fühlst, kalibriere: Du hörst Klicks und tippst dazu auf eine beliebige Taste.`)),f=()=>{},p=W(`button`,{class:`btn`,onclick:()=>{p.disabled=!0;let e=r.now()+r.lead+.3,i=Array.from({length:bh},(t,n)=>e+n*Sh);i.forEach((e,t)=>r.click(t%4==0,e));let a=[],o=n.onNote((e,t,n)=>t&&a.push(r.fromPerf(n)));d.textContent=w(`Listen to four clicks, then tap any key on each of the next eight.`,`Hör vier Klicks zu und tippe dann bei jedem der nächsten acht auf eine Taste.`);let s=window.setTimeout(()=>{f();let n=a.map(t=>{let n=Math.round((t-e)/Sh);return n>=xh&&n<bh?t-i[n]:NaN}).filter(e=>Math.abs(e)<Sh/2).sort((e,t)=>e-t);if(n.length<4){d.textContent=w(`Not enough taps to measure. Try again and tap along with the last eight clicks.`,`Zu wenige Anschläge zum Messen. Versuch es nochmal und tippe bei den letzten acht Klicks mit.`);return}let r=n[Math.floor(n.length/2)],o=Math.max(-50,Math.min(300,Math.round(r*1e3/5)*5));t.setSettings({latencyMs:o}),u.value=String(o),l.textContent=`${o} ms`,d.textContent=w(`Measured from ${n.length} taps and set to ${o} ms.`,`Aus ${n.length} Anschlägen gemessen und auf ${o} ms gesetzt.`)},6600);f=()=>{clearTimeout(s),o(),p.disabled=!1,f=()=>{}}}},w(`Calibrate`,`Kalibrieren`)),m=W(`input`,{type:`range`,min:`0`,max:`100`,value:String(Math.round(i.volume*100)),"aria-label":w(`Volume`,`Lautstärke`),oninput:()=>{let e=Number(m.value)/100;r.setVolume(e),t.setSettings({volume:e})},onchange:()=>{r.noteOn(60,.7),setTimeout(()=>r.noteOff(60),400)}}),h=W(`input`,{type:`checkbox`,checked:i.labels,onchange:()=>t.setSettings({labels:h.checked})}),g=W(`p`,{class:`muted`}),_=()=>{let r=Hm(n.status.inputs.map(e=>e.name)),i=e.keyboard;g.textContent=(t.settings.keyboard===`auto`?r?`${w(`Recognised`,`Erkannt`)}: ${r.name}. `:w(`Not recognised from its USB name, so a full 88-key piano is shown. Choose yours above if it has fewer keys. `,`Am USB-Namen nicht erkannt, daher wird ein volles Klavier mit 88 Tasten gezeigt. Wähle oben dein Modell, falls es weniger Tasten hat. `):``)+w(`Showing ${i.hi-i.lo+1} keys; music outside them is moved by octaves to fit.`,`${i.hi-i.lo+1} Tasten werden gezeigt; Musik außerhalb wird oktavweise verschoben.`)},v=W(`select`,{"aria-label":w(`Your keyboard`,`Dein Keyboard`),onchange:()=>{t.setSettings({keyboard:v.value}),_()}},W(`option`,{value:`auto`,selected:i.keyboard===`auto`},w(`Recognise it automatically`,`Automatisch erkennen`)),Bm.map(e=>W(`option`,{value:e.id,selected:i.keyboard===e.id},e.name)));_();let b=n.onStatus(_),S=W(`select`,{"aria-label":w(`Sound of your keys`,`Klang deiner Tasten`),onchange:()=>t.setSettings({soundKeys:S.value})},W(`option`,{value:`auto`,selected:i.soundKeys===`auto`},w(`Automatic: not when the keyboard has its own speakers`,`Automatisch: nicht, wenn das Keyboard eigene Lautsprecher hat`)),W(`option`,{value:`on`,selected:i.soundKeys===`on`},w(`Always play my keys through Pianova`,`Meine Tasten immer über Pianova spielen`)),W(`option`,{value:`off`,selected:i.soundKeys===`off`},w(`Never: my keyboard makes its own sound`,`Nie: Mein Keyboard klingt selbst`))),T=W(`select`,{"aria-label":`Language / Sprache`,onchange:()=>{let n=T.value;t.setSettings({language:n}),x(C(n)),e.goSettings()}},W(`option`,{value:`auto`,selected:i.language===`auto`},w(`Same as the browser`,`Wie im Browser`)),y.map(e=>W(`option`,{value:e.id,selected:i.language===e.id},e.name))),E=W(`select`,{"aria-label":w(`Daily goal`,`Tagesziel`),onchange:()=>t.setSettings({dailyGoalMin:Number(E.value)})},[5,10,15,20,30,45].map(e=>W(`option`,{value:String(e),selected:i.dailyGoalMin===e},w(`${e} minutes a day`,`${e} Minuten am Tag`)))),D=(e,...t)=>W(`section`,{class:`setting`},W(`h2`,null,e),W(`div`,{class:`setting-body`},t));return{el:W(`div`,{class:`screen`},W(`header`,{class:`topbar`},W(`button`,{class:`btn ghost`,onclick:()=>e.goPath()},wt(`back`),w(`Lessons`,`Lektionen`)),W(`strong`,null,w(`Settings`,`Einstellungen`))),W(`main`,{class:`path narrow`},D(w(`Language`,`Sprache`),T),D(w(`MIDI keyboard`,`MIDI-Keyboard`),a,o),D(w(`Your keyboard`,`Dein Keyboard`),v,g),D(w(`Sound of your keys`,`Klang deiner Tasten`),S,W(`p`,{class:`muted`},w(`A digital piano such as a Piaggero plays its own sound, so Pianova stays quiet for your keys and plays only the music around you.`,`Ein Digitalpiano wie das Piaggero klingt selbst, deshalb bleibt Pianova bei deinen Tasten still und spielt nur die Musik um dich herum.`))),D(w(`Skill check`,`Einstufung`),W(`div`,{class:`row`},W(`button`,{class:`btn`,onclick:()=>e.goSkillCheck()},w(`Take the skill check again`,`Einstufung wiederholen`))),W(`p`,{class:`muted`},w(`Opens the lessons that fit what you can already play, and sets where songs start.`,`Öffnet die Lektionen, die zu deinem Können passen, und legt fest, wo Lieder beginnen.`))),D(w(`Daily goal`,`Tagesziel`),E,W(`p`,{class:`muted`},w(`Playing time that keeps your streak going. Listening does not count; playing along does.`,`Spielzeit, die deine Serie am Leben hält. Zuhören zählt nicht, Mitspielen schon.`))),D(w(`Timing offset`,`Timing-Ausgleich`),W(`div`,{class:`row`},u,l,p),d),D(w(`Volume`,`Lautstärke`),m),D(w(`Display`,`Anzeige`),W(`label`,{class:`check`},h,w(`Show note names on the keys and notes`,`Notennamen auf Tasten und Noten zeigen`))),D(w(`Computer keys`,`Computertasten`),W(`p`,{class:`muted`},w(`Without a MIDI keyboard, the bottom letter rows play the lower octave (Z is C) and the top rows play the upper octave (Q is middle C). The [ and ] keys shift by an octave. Some computer keyboards cannot register certain three-key chords at once; a MIDI keyboard has no such limit.`,`Ohne MIDI-Keyboard spielen die unteren Buchstabenreihen die tiefere Oktave (Y bzw. Z ist C) und die oberen Reihen die höhere (Q ist das mittlere C). Die Tasten [ und ] verschieben um eine Oktave. Manche Computertastaturen erkennen bestimmte Dreiklänge nicht gleichzeitig; ein MIDI-Keyboard hat diese Grenze nicht.`))))),destroy(){c(),b(),f()}}}function wh(e,t){let n=W(`div`,{class:`lesson-body`}),r=Ht(e),i=null,a=0,o=t=>{i?.destroy?.(),e.synth.allOff(),i=t,n.replaceChildren(t.el)},s=(...e)=>o({el:W(`div`,{class:`centered`},W(`div`,{class:`card skill-card`},e))}),c=n=>{e.progress.setSkill(n);let r=ut(n),i=U.find(e=>e.n===r.openUnit);s(W(`span`,{class:`eyebrow`},w(`Skill check`,`Einstufung`)),W(`h2`,null,T(r.label)),W(`ul`,{class:`tips`},W(`li`,null,n===0?w(`Lessons start at the very beginning, Unit 1.`,`Die Lektionen beginnen ganz am Anfang, bei Einheit 1.`):w(`Lessons are open up to Unit ${i.n}, ${T(i.title)}. Earlier ones stay open to revisit.`,`Die Lektionen sind bis Einheit ${i.n}, ${T(i.title)}, offen. Frühere bleiben zum Wiederholen offen.`)),W(`li`,null,w(`Songs start at level ${r.songLevel} of 5 and fill in as you play them well.`,`Lieder beginnen auf Stufe ${r.songLevel} von 5 und füllen sich, wenn du sie gut spielst.`))),W(`p`,{class:`muted`},w(`You can take the check again any time from Settings.`,`Du kannst die Einstufung jederzeit in den Einstellungen wiederholen.`)),W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:t},w(`Continue`,`Weiter`))))},l=e=>{let t=ct[e];s(W(`span`,{class:`eyebrow`},`${w(w(`Skill check`,`Einstufung`),`Einstufung`)} · ${w(`${e+1} of ${ct.length}`,`${e+1} von ${ct.length}`)}`),W(`h2`,null,T(t.title)),W(`p`,null,T(t.text)),W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:()=>u(e)},w(`Play`,`Spielen`)),W(`button`,{class:`btn ghost`,onclick:()=>c(a)},w(`Stop here`,`Hier aufhören`))))},u=t=>{let n=ct[t];o(new xm(e,{chart:n.chart,mode:n.mode,hands:n.hands,tools:!1,scored:!0,metronome:n.mode===`timed`,title:T(n.title),label:`${w(w(`Skill check`,`Einstufung`),`Einstufung`)} • ${w(`${t+1} of ${ct.length}`,`${t+1} von ${ct.length}`)}`,onExit:()=>c(a),onFinish:e=>{let r=Am(e.summary);r<.75?s(W(`span`,{class:`eyebrow`},T(n.title)),W(`h2`,null,w(`${Dt(r)}: that's where we'll start`,`${Dt(r)}: hier fangen wir an`)),W(`p`,null,w(`No problem at all. The lessons will pick it up from here.`,`Überhaupt kein Problem. Die Lektionen machen genau hier weiter.`)),W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:()=>c(a)},w(`See where you start`,`Zeig mir, wo ich anfange`)),W(`button`,{class:`btn`,onclick:()=>u(t)},w(`Try that one again`,`Das nochmal versuchen`)))):(a=t+1,a===ct.length?c(a):l(t+1))}}))};return s(W(`span`,{class:`eyebrow`},w(`Welcome`,`Willkommen`)),W(`h2`,null,w(`Quick skill check`,`Kurze Einstufung`)),W(`p`,null,w(`Four short pieces, each a little harder, to find where you should start. It stops as soon as one feels too hard, so it never takes long.`,`Vier kurze Stücke, jedes etwas schwerer, um herauszufinden, wo du anfangen solltest. Sobald eines zu schwer ist, hört es auf – es dauert also nie lange.`)),W(`div`,{class:`row`},W(`button`,{class:`btn primary`,onclick:()=>l(0)},w(`Start the check`,`Einstufung starten`)),W(`button`,{class:`btn`,onclick:()=>c(0)},w(`I'm new to piano`,`Ich bin neu am Klavier`)))),{el:W(`div`,{class:`screen lesson`},W(`header`,{class:`topbar`},W(`span`,{class:`wordmark`},wt(`nova`),`Pianova`),W(`span`,{class:`spacer`}),r.el),n),destroy(){i?.destroy?.(),r.destroy?.()}}}var Th=class{root;synth;input=new zm;progress=new Qm(Eh(),Ce.map(e=>e.id),Ce.map(e=>e.unit));current=null;nav;constructor(e){this.root=e,x(C(this.progress.settings.language)),this.nav=new gh(e,this.input,()=>this.keyboard),this.show(this.welcome())}show(e){this.current?.destroy?.(),this.synth?.allOff(),this.root.replaceChildren(e.el),this.current=e,this.nav?.refresh()}goPath(){this.show(vh(this))}goLesson(e){this.show(new dh(this,e))}goFreePlay(){this.show(wm(this))}goPractice(){let e=oh(this.progress.stats()),t=ch(e);t&&this.show(Om(this,t,{saveAs:null,title:w(`Weak spots`,`Schwachstellen`),label:`${w(`Practice`,`Übung`)} • ${e.map(e=>k(e.pitch)).join(`, `)}`,unsaved:w(`Practice scores are not saved, but every note you play updates your weak spots.`,`Übungsergebnisse werden nicht gespeichert, aber jede gespielte Note aktualisiert deine Schwachstellen.`),backLabel:w(`Lessons`,`Lektionen`),back:()=>this.goPath(),another:w(`Back to lessons`,`Zurück zu den Lektionen`)}))}goWarmup(){let{chart:e,key:t}=ke(Ae());this.show(Om(this,e,{saveAs:null,title:w(`Warm-up in ${t} major`,`Aufwärmen in ${t}-Dur`),label:w(`Scale, then chords: I – IV – V – I`,`Tonleiter, dann Akkorde: I – IV – V – I`),unsaved:w(`Warm-ups are not scored, but every minute counts towards your daily goal.`,`Aufwärmen wird nicht bewertet, aber jede Minute zählt für dein Tagesziel.`),backLabel:w(`Lessons`,`Lektionen`),back:()=>this.goPath(),another:w(`Back to lessons`,`Zurück zu den Lektionen`)}))}goSong(e){let t=Ee.find(t=>t.id===e);t&&this.show(Nm(this,{id:t.id,title:T(t.title),composer:T(t.composer),chart:t.chart,pieceId:t.id},()=>this.goPath()))}goSkillCheck(){this.show(wh(this,()=>this.goPath()))}goSettings(){this.show(Ch(this))}get keyboard(){return Um(this.progress.settings.keyboard,this.input.status.inputs.map(e=>e.name))}get soundsKeys(){let{soundKeys:e}=this.progress.settings;return e===`auto`?this.usingComputerKeys||!this.keyboard.speakers:e===`on`}prepare(e){let{lo:t,hi:n}=this.keyboard;return Ke(Lm(e,t,n))}get usingComputerKeys(){return this.input.status.inputs.length===0}welcome(){let e=!1;return{el:W(`div`,{class:`welcome`},W(`div`,{class:`welcome-mark`},wt(`nova`)),W(`h1`,{class:`wordmark big`},`Pianova`),W(`p`,{class:`lede`},w(`Learn piano from your very first note.`,`Klavier lernen, vom allerersten Ton an.`)),W(`button`,{class:`btn primary large`,onclick:async()=>{e||(e=!0,this.synth=new v,this.synth.setVolume(this.progress.settings.volume),this.synth.setMix(this.progress.settings.mix),this.input.onNote((e,t,n,r)=>{(!t||this.soundsKeys)&&(t?this.synth.noteOn(e,r):this.synth.noteOff(e))}),this.input.onSustain(e=>this.synth.setSustain(e)),await this.synth.resume(),this.input.init(this.progress.settings.midiInputId),on(),this.progress.skill===null?this.goSkillCheck():this.goPath())},autofocus:!0},w(`Start`,`Los geht’s`)),W(`p`,{class:`muted`},w(`Plug in a MIDI keyboard, or play along on your computer keys.`,`Schließ ein MIDI-Keyboard an oder spiel auf deinen Computertasten mit.`)))}}};function Eh(){try{let e=window.localStorage;return e.getItem(`pianova.probe`),e}catch{return null}}new Th(document.getElementById(`app`));export{d as i,o as n,c as r,s as t};