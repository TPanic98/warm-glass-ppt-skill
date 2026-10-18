import fs from 'node:fs/promises';
import path from 'node:path';
import {Painter,theme,gradient,measure,draw} from './ui-components.mjs';
import {ScenePresentation,sceneFromPages,validateUiBrief} from './ui-scene.mjs';
import {auditContent} from './content-audit.mjs';

const own=(value,keys,where)=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${where}: expected object`);
 for(const key of Object.keys(value))if(!keys.includes(key))throw Error(`${where}: unsupported field ${key}`);
};
const text=(value,where)=>{if(typeof value!=='string'||!value.trim())throw Error(`${where}: expected non-empty text`);};
const common=['id','type','x','y','w','h','role'];
const fields={text:['text','size','bold','color','align','wrap','textFill'],shape:['geometry','fill','stroke','strokeWidth','radius','shadow'],line:['x2','y2','color','width','dash','arrowEnd'],connector:['from','to','fromSide','toSide','color','width','dash','kind','arrowEnd'],image:['src','alt']};
const sides=['left','right','top','bottom'];
function paint(value='none'){
 if(value.startsWith?.('@')){const key=value.slice(1);if(theme.gradients[key])return gradient(key);if(theme.colors[key])return theme.colors[key];throw Error('Unknown visual token '+value);}
 if(value==='none'||/^#[0-9a-f]{6}(?:\/(?:100|[0-9]{1,2}(?:\.[0-9]+)?))?$/i.test(value))return value;
 throw Error('Expected a color, none, or @visual-token');
}
function frame(e,where){
 for(const key of ['x','y','w','h'])if(!Number.isFinite(e[key])||e[key]<0||(['w','h'].includes(key)&&e[key]===0))throw Error(`${where}: invalid ${key}`);
 if(e.x+e.w>theme.canvas.width+.1||e.y+e.h>theme.canvas.height+.1)throw Error(where+': outside canvas');
}
export function validateComposition(b){
 own(b,['schema','title','mode','font','brand','slides','context','sources'],'brief');
 if(b.schema!=='warm-glass-compose/v1')throw Error('schema must be warm-glass-compose/v1');
 text(b.title,'title');
 if(!['report','talk','training','product'].includes(b.mode))throw Error('Choose one of the four communication purposes');
 if(b.font!==undefined&&(typeof b.font!=='string'||!/^[\p{L}\p{N} _.-]{1,100}$/u.test(b.font)))throw Error('font: plain font-family name required');
 if(b.brand){own(b.brand,['src','alt','x','y','w','h'],'brand');text(b.brand.src,'brand.src');text(b.brand.alt,'brand.alt');frame(b.brand,'brand');}
 if(!Array.isArray(b.slides)||!b.slides.length||b.slides.length>100)throw Error('slides: expected 1–100');
 for(const [i,s]of b.slides.entries()){
  const where=`slide ${i+1}`;own(s,['title','role','plan','notes','background','brand','elements','components'],where);text(s.title,where+'.title');
  if(!['cover','body','transition','closing'].includes(s.role))throw Error(where+': invalid page role');
  own(s.plan,['job','mainPoint','relationship','composition','evidence','claims','relations','reviewQuestions'],where+'.plan');
  for(const key of ['job','mainPoint','relationship','composition'])text(s.plan[key],where+'.plan.'+key);
  if(s.plan.evidence!==undefined)text(s.plan.evidence,where+'.plan.evidence');
  if(s.brand!==undefined&&typeof s.brand!=='boolean')throw Error(where+'.brand: expected boolean');
  if(s.notes!==undefined&&typeof s.notes!=='string')throw Error(where+'.notes: expected text');
  if(s.background!==undefined)paint(s.background);
  if(!Array.isArray(s.elements)||!s.elements.length||s.elements.length>300)throw Error(where+': expected 1–300 free composition elements');
  const ids=new Set();
  for(const e of s.elements){
   text(e.id,where+'.element.id');if(!/^[A-Za-z][\w-]{0,79}$/.test(e.id)||ids.has(e.id))throw Error(where+': invalid or duplicate element id');ids.add(e.id);
   if(!fields[e.type])throw Error('Unsupported element type '+e.type);own(e,[...common,...fields[e.type]],where+'.'+e.id);
   if(e.type==='connector'){
    text(e.from,'connector.from');text(e.to,'connector.to');
    for(const key of ['fromSide','toSide'])if(e[key]!==undefined&&!sides.includes(e[key]))throw Error('Invalid connector side');
    if(e.kind!==undefined&&!['straight','elbow'].includes(e.kind))throw Error('Invalid connector kind');
   }else if(e.type==='line'){
    for(const key of ['x','y','x2','y2'])if(!Number.isFinite(e[key])||e[key]<0||e[key]>(key.startsWith('x')?theme.canvas.width:theme.canvas.height))throw Error('Invalid line point');
   }else frame(e,where+'.'+e.id);
   if(e.type==='text'){
    text(e.text,where+'.'+e.id+'.text');if(!Number.isFinite(e.size)||e.size<12||e.size>160)throw Error('Text size must be 12–160 px');
    if(e.align!==undefined&&!['left','center','right'].includes(e.align))throw Error('Invalid text alignment');
    for(const key of ['bold','wrap'])if(e[key]!==undefined&&typeof e[key]!=='boolean')throw Error(key+': expected boolean');
   }
   if(e.type==='shape'&&!['rect','roundRect','ellipse'].includes(e.geometry||'rect'))throw Error('Invalid native geometry');
   if(e.type==='image'){text(e.src,'image.src');text(e.alt,'image.alt');}
   for(const key of ['color','fill','stroke','textFill'])if(e[key]!==undefined)paint(e[key]);
   for(const key of ['width','strokeWidth','radius'])if(e[key]!==undefined&&(!Number.isFinite(e[key])||e[key]<0))throw Error('Invalid '+key);
   for(const key of ['dash','arrowEnd','shadow'])if(e[key]!==undefined&&typeof e[key]!=='boolean')throw Error(key+': expected boolean');
  }
  for(const e of s.elements.filter(e=>e.type==='connector'))for(const id of [e.from,e.to])if(!s.elements.some(x=>x.id===id&&x.type==='shape'))throw Error('Connector endpoint must name a native shape: '+id);
  if(s.components!==undefined&&!Array.isArray(s.components))throw Error('components: expected array');
  if(s.components?.length)validateUiBrief({schema:'warm-glass-ui/v2',title:b.title,mode:b.mode,slides:[{title:s.title,components:s.components}]});
 }
 auditContent(b);return b;
}

export async function resolveCompositionAssets(brief,baseDir){
 validateComposition(brief);const assets=new Map();
 const images=[...(brief.brand?[brief.brand]:[]),...brief.slides.flatMap(s=>s.elements.filter(e=>e.type==='image'))];
 for(const item of images){
  if(assets.has(item.src))continue;
  let bytes,mime;
  const embedded=item.src.match(/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=\s]+)$/);
  if(embedded){mime=embedded[1];bytes=Buffer.from(embedded[2],'base64');}
  else{
   if(/^[a-z][a-z0-9+.-]*:/i.test(item.src)&&!(/^[A-Za-z]:[\\/]/.test(item.src)))throw Error('Images must be local PNG/JPEG assets, not remote URLs');
   const file=path.resolve(baseDir,item.src),ext=path.extname(file).toLowerCase();
   if(!['.png','.jpg','.jpeg'].includes(ext))throw Error('Use an original PNG/JPEG brand or artwork asset');
   bytes=await fs.readFile(file);mime=ext==='.png'?'image/png':'image/jpeg';
  }
  if(bytes.length>20*1024*1024)throw Error('Image exceeds 20 MiB');
  const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=bytes[0]===255&&bytes[1]===216;
  if((mime==='image/png'&&!png)||(mime==='image/jpeg'&&!jpeg))throw Error('Image bytes do not match their format');
  assets.set(item.src,`data:${mime};base64,${bytes.toString('base64')}`);
 }
 return assets;
}

export function makeCompositionScene(brief,{assets=new Map()}={}){
 validateComposition(brief);const p=new ScenePresentation(),pages=[];
 for(const spec of brief.slides){
  const slide=p.slides.add(),a=new Painter(p,slide),anchors=new Map();slide.background.fill=paint(spec.background||'@canvas');
  const addImage=(e,id)=>{const data=assets.get(e.src);if(!data)throw Error('Resolve local image assets before composition');slide.objects.push({kind:'image',id,name:id,data,alt:e.alt,position:{left:e.x,top:e.y,width:e.w,height:e.h}});};
  if(brief.brand&&spec.brand!==false)addImage(brief.brand,'brand-header');
  for(const e of spec.elements.filter(e=>e.type!=='connector')){
   let o;
   if(e.type==='image'){addImage(e,'asset-'+e.id);continue;}
   if(e.type==='text'){
    if(e.wrap===false&&e.text.split('\n').some(line=>measure(line,e.size,e.bold)>e.w+2))throw Error('Unwrapped text exceeds width: '+e.id);
    o=a.text(e.id,e.text,e.x,e.y,e.w,e.h,e.size,{bold:e.bold,color:paint(e.color||'@body'),align:e.align,wrapText:e.wrap!==false,...(e.textFill?{fill:paint(e.textFill)}:{})});
   }else if(e.type==='line'){
    o=a.line(e.id,e.x,e.y,e.x2,e.y2,paint(e.color||'@border'),e.width??1,{dash:e.dash});o.arrowEnd=e.arrowEnd===true;
   }else{
    const fill=paint(e.fill||'none'),stroke=paint(e.stroke||'none'),line={style:'solid',fill:stroke,width:e.strokeWidth??(stroke==='none'?0:1)};
    if(e.geometry==='ellipse')o=a.ellipse(e.id,e.x,e.y,e.w,e.h,fill,stroke,line.width);
    else o=a.shape(e.id,e.x,e.y,e.w,e.h,fill,e.geometry==='roundRect'?(e.radius??24):0,stroke,{line,...(e.shadow?{shadow:theme.material.shadow}:{})});
   }
   o.semanticRole=e.role||e.type;anchors.set(e.id,o);
  }
  for(const e of spec.elements.filter(e=>e.type==='connector')){
   const o=a.connect(anchors.get(e.from),anchors.get(e.to),{color:paint(e.color||'@vermillion'),fromSide:e.fromSide,toSide:e.toSide,kind:e.kind,dash:e.dash});
   o.line.width=e.width??2.5;o.arrowEnd=e.arrowEnd!==false;o.name='relation-'+e.id;
  }
  for(const c of spec.components||[])draw(a,c.code,c.props);
  const claimNotes=(spec.plan.claims??[]).map(claim=>{
   const sources=claim.sourceRefs.map(id=>brief.sources.find(s=>s.id===id)).map(s=>`${s.id}: ${s.title}${s.locator?' ('+s.locator+')':''}`).join('; ');
   return `${claim.status}: ${claim.text}${sources?' — '+sources:''}`;
  });
  slide.speakerNotes.text=[spec.notes||'',spec.plan.evidence?`Evidence: ${spec.plan.evidence}`:'',...claimNotes].filter(Boolean).join('\n');
  pages.push({painter:a,slide,title:spec.title,kind:spec.role,purpose:brief.mode});
 }
 const scene=sceneFromPages(brief,pages);scene.schema='warm-glass-composition-scene/v1';
 scene.slides.forEach((s,i)=>{s.plan=structuredClone(brief.slides[i].plan);});
 return scene;
}

export function compositionWarnings(scene){
 const warnings=[];let previous='',run=0;
 for(const [i,s]of scene.slides.entries()){
  const titles=s.objects.filter(o=>['title','headline'].includes(o.semanticRole)&&o.text).map(o=>o.text.value.trim());
  if(new Set(titles).size<titles.length)warnings.push({slide:i+1,code:'duplicate-title',message:'A main title appears more than once. Review the intended hierarchy.'});
  const signature=JSON.stringify(s.objects.filter(o=>o.position&&o.kind!=='image').map(o=>[o.geometry,o.position]));
  run=signature===previous?run+1:1;previous=signature;
  if(run===3)warnings.push({slide:i+1,code:'repeated-composition',message:'Three adjacent pages share the same geometry. Confirm that the content relationship justifies it.'});
 }
 return warnings;
}
