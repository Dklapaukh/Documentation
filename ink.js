/* Paper-style numeric ink. All recognition happens in this browser using a small
 * locally bundled MNIST digit model. No pen data is sent to a recognition service.
 * Predictions are drafts: the visible number can be corrected; Save confirms it.
 */
let inkModelPromise=null;
function decodeInkModel(buffer){
 const view=new DataView(buffer);if(String.fromCharCode(...new Uint8Array(buffer,0,4))!=='PND1')throw Error('Invalid digit model');
 const inputs=view.getUint32(4,true),hidden=view.getUint32(8,true),outputs=view.getUint32(12,true);
 if(inputs!==784||hidden!==64||outputs!==10||buffer.byteLength!==16+4*(inputs*hidden+hidden+hidden*outputs+outputs))throw Error('Unexpected digit model');
 const f=new Float32Array(buffer,16);let i=0;return {inputs,hidden,outputs,w1:f.subarray(i,i+=inputs*hidden),b1:f.subarray(i,i+=hidden),w2:f.subarray(i,i+=hidden*outputs),b2:f.subarray(i,i+outputs)};
}
function loadInkModel(){if(!inkModelPromise)inkModelPromise=fetch('ink-model.bin').then(r=>{if(!r.ok)throw Error('Model unavailable');return r.arrayBuffer();}).then(decodeInkModel).catch(e=>{inkModelPromise=null;throw e;});return inkModelPromise;}
function classifyInkDigit(pixels,model){
 const hidden=new Float32Array(model.hidden),logits=new Float32Array(10);
 for(let j=0;j<model.hidden;j++){let sum=model.b1[j];for(let i=0;i<784;i++)sum+=pixels[i]*model.w1[i*model.hidden+j];hidden[j]=Math.max(0,sum);}
 for(let j=0;j<10;j++){let sum=model.b2[j];for(let i=0;i<model.hidden;i++)sum+=hidden[i]*model.w2[i*10+j];logits[j]=sum;}
 const max=Math.max(...logits),probs=Array.from(logits,x=>Math.exp(x-max)),total=probs.reduce((a,b)=>a+b,0),digit=probs.indexOf(Math.max(...probs));return {digit,confidence:probs[digit]/total};
}
// Connected ink components preserve decimal dots even below another digit.
// Horizontally overlapping strokes are joined; touching adjacent digits are not guessed apart; the reading remains editable below ink.
function segmentInkMask(mask,width,height){
 const seen=new Uint8Array(mask.length),stack=new Int32Array(mask.length),components=[];
 for(let seed=0;seed<mask.length;seed++){
  if(!mask[seed]||seen[seed])continue;let n=1;stack[0]=seed;seen[seed]=1;let x0=width,x1=0,y0=height,y1=0;
  while(n){const i=stack[--n],x=i%width,y=Math.floor(i/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;const j=yy*width+xx;if(mask[j]&&!seen[j]){seen[j]=1;stack[n++]=j;}}
  }
  components.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});
 }
 const largest=Math.max(0,...components.map(c=>c.h)),bottom=Math.max(0,...components.map(c=>c.y+c.h)),dots=[],digits=[];
 for(const c of components){if(c.h<largest*.22&&c.w<largest*.3&&c.y>bottom-largest*.4)dots.push(c);else digits.push(c);}
 digits.sort((a,b)=>a.x-b.x);const groups=[];
 for(const c of digits){const prev=groups.at(-1);if(prev&&c.x<=prev.x+prev.w+1){const right=Math.max(prev.x+prev.w,c.x+c.w),low=Math.max(prev.y+prev.h,c.y+c.h);prev.y=Math.min(prev.y,c.y);prev.w=right-prev.x;prev.h=low-prev.y;}else groups.push({...c});}
 return [...groups,...dots].sort((a,b)=>a.x-b.x);
}
function inkTile(key,label,unit=''){
 return `<div class="ink-pad" data-ink-pad="${key}"><canvas data-ink="${key}" aria-label="Handwrite ${label}" tabindex="0"></canvas><span class="ink-placeholder">Write ${label}</span></div><div class="ink-reading"><label>Read as <input type="text" inputmode="${CARE_CONFIG.vitals[key]?.step===.1?'decimal':'numeric'}" data-vital="${key}" aria-label="${label}" value="${esc(vitalDraft.values[key]??'')}" placeholder="—"></label><span>${unit}</span><button class="quiet" data-ink-undo="${key}" aria-label="Undo ${label} stroke">↶</button><button class="quiet" data-ink-clear="${key}" aria-label="Clear ${label}">×</button></div><small data-ink-status="${key}"></small>`;
}
function prepareInkDraft(){vitalDraft.ink??={};vitalDraft.inkAspect??={};vitalDraft.inkSource??={};vitalDraft.inkRevision??={};vitalDraft.inkPending??={};}
function paintInk(canvas,key){
 const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1;if(!rect.width||!rect.height)return;
 canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);
 const logicalWidth=(vitalDraft.inkAspect[key]||rect.width/rect.height)*1000,scale=Math.min(canvas.width/logicalWidth,canvas.height/1000),ox=(canvas.width-logicalWidth*scale)/2,oy=(canvas.height-1000*scale)/2;
 canvas.inkTransform={logicalWidth,scale,ox,oy,ratio};
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#172126';ctx.fillStyle='#172126';ctx.lineWidth=27*scale;ctx.lineCap='round';ctx.lineJoin='round';
 for(const stroke of vitalDraft.ink[key]||[]){if(!stroke.length)continue;ctx.beginPath();ctx.moveTo(ox+stroke[0][0]*logicalWidth*scale,oy+stroke[0][1]*1000*scale);for(const p of stroke.slice(1))ctx.lineTo(ox+p[0]*logicalWidth*scale,oy+p[1]*1000*scale);if(stroke.length===1){ctx.arc(ox+stroke[0][0]*logicalWidth*scale,oy+stroke[0][1]*1000*scale,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}else ctx.stroke();}
 const pad=canvas.closest('.ink-pad');pad.classList.toggle('has-ink',!!vitalDraft.ink[key]?.length);
}
function initInkFields(){
 prepareInkDraft();loadInkModel().catch(()=>{});
 document.querySelectorAll('canvas[data-ink]').forEach(canvas=>{
  const key=canvas.dataset.ink;paintInk(canvas,key);let drawing=false;
  const point=e=>{const r=canvas.getBoundingClientRect(),t=canvas.inkTransform;return [Math.max(0,Math.min(1,((e.clientX-r.left)*t.ratio-t.ox)/(t.logicalWidth*t.scale))),Math.max(0,Math.min(1,((e.clientY-r.top)*t.ratio-t.oy)/(1000*t.scale)))];};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();drawing=true;canvas.setPointerCapture(e.pointerId);vitalDraft.inkAspect[key]??=canvas.clientWidth/canvas.clientHeight;vitalDraft.ink[key]??=[];vitalDraft.ink[key].push([point(e)]);vitalDraft.inkRevision[key]=(vitalDraft.inkRevision[key]||0)+1;vitalDraft.inkSource[key]='ink';vitalDraft.inkPending[key]=true;vitalDraft.values[key]='';if(key==='gcs')vitalDraft.gcs={};paintInk(canvas,key);updateNewsDisplay();});
  canvas.addEventListener('pointermove',e=>{if(!drawing)return;e.preventDefault();const batch=e.getCoalescedEvents?.();for(const event of batch?.length?batch:[e])vitalDraft.ink[key].at(-1).push(point(event));paintInk(canvas,key);});
  const end=()=>{if(!drawing)return;drawing=false;scheduleInkReading(key,canvas);};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  if(vitalDraft.ink[key]?.length&&vitalDraft.inkSource[key]==='ink'&&!String(vitalDraft.values[key]??'').trim())scheduleInkReading(key,canvas);
 });
}
function inkStatus(key,message){const out=document.querySelector('[data-ink-status="'+key+'"]');if(out)out.textContent=message;}
function scheduleInkReading(key,canvas){
 const draft=vitalDraft,revision=draft.inkRevision[key]||0;draft.inkPending[key]=true;inkStatus(key,'Reading…');
 setTimeout(async()=>{
  if(vitalDraft!==draft||revision!==(draft.inkRevision[key]||0)||careView!=='vitals'||!$('careModal').open)return;
  try{
   const model=await loadInkModel();if(vitalDraft!==draft||revision!==(draft.inkRevision[key]||0)||careView!=='vitals')return;
   const {width,height}=canvas,rgba=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,width,height).data,mask=new Uint8Array(width*height);
   for(let i=0;i<mask.length;i++)mask[i]=rgba[i*4]<160?1:0;
   const groups=segmentInkMask(mask,width,height),largest=Math.max(0,...groups.map(g=>g.h)),bottom=Math.max(0,...groups.map(g=>g.y+g.h));let text='',confidence=1;
   for(const g of groups){
    if(g.h<largest*.22&&g.w<largest*.3&&g.y>bottom-largest*.4){text+='.';continue;}
    const digit=document.createElement('canvas');digit.width=digit.height=28;const ctx=digit.getContext('2d',{willReadFrequently:true});ctx.fillStyle='black';ctx.fillRect(0,0,28,28);const scale=20/Math.max(g.w,g.h);ctx.filter='invert(1)';ctx.drawImage(canvas,g.x,g.y,g.w,g.h,(28-g.w*scale)/2,(28-g.h*scale)/2,g.w*scale,g.h*scale);ctx.filter='none';
    // Match MNIST's centre of mass rather than the bounding-box centre.
    let image=ctx.getImageData(0,0,28,28),mass=0,mx=0,my=0;for(let i=0;i<784;i++){const q=image.data[i*4]/255;mass+=q;mx+=(i%28)*q;my+=Math.floor(i/28)*q;}if(mass){const shifted=document.createElement('canvas');shifted.width=shifted.height=28;const sc=shifted.getContext('2d');sc.fillStyle='black';sc.fillRect(0,0,28,28);sc.drawImage(digit,Math.round(13.5-mx/mass),Math.round(13.5-my/mass));image=sc.getImageData(0,0,28,28);}
    const result=classifyInkDigit(Float32Array.from({length:784},(_,i)=>image.data[i*4]/255),model);text+=result.digit;confidence=Math.min(confidence,result.confidence);
   }
   if(vitalDraft!==draft||revision!==(draft.inkRevision[key]||0))return;
   draft.inkPending[key]=false;const value=numericVital(text,key);
   if(Number.isFinite(value)&&confidence>=.35){draft.values[key]=String(value);const input=document.querySelector('[data-vital="'+key+'"]');if(input)input.value=value;inkStatus(key,confidence<.8?'Check reading · tap number to correct':'Review reading before saving');}
   else {draft.values[key]='';inkStatus(key,'Check ink · enter or correct the reading below');}
   updateNewsDisplay();
  }catch{draft.inkPending[key]=false;inkStatus(key,'Recognition unavailable · enter the reading below');}
 },450);
}
function alterInk(key,undo=false){
 prepareInkDraft();if(undo)vitalDraft.ink[key]?.pop();else vitalDraft.ink[key]=[];vitalDraft.inkRevision[key]=(vitalDraft.inkRevision[key]||0)+1;vitalDraft.values[key]='';vitalDraft.inkPending[key]=false;if(key==='gcs')vitalDraft.gcs={};const canvas=document.querySelector('[data-ink="'+key+'"]');if(canvas){paintInk(canvas,key);if(vitalDraft.ink[key]?.length)scheduleInkReading(key,canvas);else inkStatus(key,'');}const input=document.querySelector('[data-vital="'+key+'"]');if(input)input.value='';updateNewsDisplay();
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.inkClear)alterInk(b.dataset.inkClear);if(b.dataset.inkUndo)alterInk(b.dataset.inkUndo,true);});
