import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const skillRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const tokens=JSON.parse(await fs.readFile(path.join(skillRoot,'assets/tokens.json'),'utf8'));
export const layouts=['cover','section','columns','comparison','process','roadmap','layers','architecture','metrics','quote','image'];
export const narrativeModes=['report','talk','training','product'];
const slideKeys=['layout','title','subtitle','label','message','items','image','imageAlt','takeaway','notes','sources','demonstration'];
function only(obj,keys,where){if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error(`${where}: expected an object`);for(const k of Object.keys(obj))if(!keys.includes(k))throw Error(`${where}: unsupported field ${k}`);}
function string(v,where,required=false){if(v===undefined&&!required)return;if(typeof v!=='string'||(required&&!v.trim()))throw Error(`${where}: expected ${required?'non-empty ':''}text`);if(v.length>12000)throw Error(`${where}: text too long`);}
export function validateBrief(b){
 only(b,['title','author','mode','font','brand','slides'],'brief');string(b.title,'title',true);string(b.author,'author');string(b.font,'font');
 if(b.font!==undefined&&!/^[\p{L}\p{N} _.-]{1,100}$/u.test(b.font))throw Error('font: use a plain installed font-family name');
 if(b.mode!==undefined&&![...narrativeModes,'executive'].includes(b.mode))throw Error('mode: choose report, talk, training or product');
 if(b.brand){only(b.brand,['name','tagline','logo'],'brand');for(const k of Object.keys(b.brand))string(b.brand[k],`brand.${k}`);}
 if(!Array.isArray(b.slides)||b.slides.length<1||b.slides.length>100)throw Error('slides: expected 1–100 slides');
 b.slides.forEach((s,i)=>{
  const at=`slide ${i+1}`;only(s,slideKeys,at);if(!layouts.includes(s.layout))throw Error(`${at}: unsupported layout ${s.layout}`);
  for(const k of ['title','subtitle','label','message','image','imageAlt','takeaway','notes'])string(s[k],`${at}.${k}`,k==='title');
  if(s.demonstration!==undefined&&typeof s.demonstration!=='boolean')throw Error(`${at}.demonstration: expected boolean`);
  if(s.sources!==undefined&&(!Array.isArray(s.sources)||s.sources.some(x=>typeof x!=='string')))throw Error(`${at}.sources: expected a text array`);
  const ranges={columns:[2,4],comparison:[2,2],process:[3,6],roadmap:[3,5],layers:[2,4],architecture:[3,5],metrics:[2,4]};
  if(ranges[s.layout]){const [lo,hi]=ranges[s.layout];if(!Array.isArray(s.items)||s.items.length<lo||s.items.length>hi)throw Error(`${at}: ${s.layout} needs ${lo}–${hi} items`);}
  const visibleKeys={columns:['title','body','details'],comparison:['title','body','details'],process:['title','body'],roadmap:['title','date','details'],layers:['title','body'],architecture:['title','components'],metrics:['title','value','body','source']};
  if(s.items!==undefined){if(!visibleKeys[s.layout])throw Error(`${at}: ${s.layout} does not render items`);if(!Array.isArray(s.items))throw Error(`${at}.items: expected an array`);s.items.forEach((it,j)=>{only(it,visibleKeys[s.layout],`${at}.items[${j}]`);for(const k of ['title','body','date','value','source'])string(it[k],`${at}.items[${j}].${k}`,k==='title');for(const k of ['details','components'])if(it[k]!==undefined&&(!Array.isArray(it[k])||it[k].some(x=>typeof x!=='string')||it[k].length>6))throw Error(`${at}.items[${j}].${k}: expected up to 6 text entries`);if(s.layout==='architecture'&&(!Array.isArray(it.components)||it.components.length<2||it.components.length>4))throw Error(`${at}.items[${j}]: architecture needs 2–4 components`);if(s.layout==='metrics'){string(it.value,`${at}.items[${j}].value`,true);if(!s.demonstration)string(it.source,`${at}.items[${j}].source`,true);}});}
  if(s.message!==undefined&&!['cover','section','quote'].includes(s.layout))throw Error(`${at}: message is not supported by ${s.layout}`);
  if(s.image!==undefined&&!['cover','section','quote','image'].includes(s.layout))throw Error(`${at}: image is not supported by ${s.layout}`);
  if(s.layout==='image')string(s.image,`${at}.image`,true);
  if(s.layout==='quote')string(s.message,`${at}.message`,true);
 });return b;
}
export async function resolveAsset(value,briefDir){
 if(typeof value!=='string'||/^(?:https?:|data:|javascript:)/i.test(value))throw Error('Images must use a local path or @assets/name');
 const p=value.startsWith('@assets/')?path.resolve(skillRoot,'assets',value.slice(8)):path.resolve(briefDir,value);
 if(value.startsWith('@assets/')&&!p.startsWith(path.join(skillRoot,'assets')+path.sep))throw Error('Asset path escapes assets folder');
 if(!['.png','.jpg','.jpeg'].includes(path.extname(p).toLowerCase()))throw Error(`Unsupported image type: ${path.extname(p)}. Use PNG or JPEG.`);
 const data=await fs.readFile(p);return {path:p,data,mime:/\.png$/i.test(p)?'image/png':'image/jpeg'};
}
export async function readBrief(filename){const b=validateBrief(JSON.parse(await fs.readFile(filename,'utf8')));return {brief:b,briefDir:path.dirname(path.resolve(filename))};}

// A conservative language-aware estimate. Real application rendering remains a separate check.
function unit(ch){if(/\s/u.test(ch))return .32;if(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\u3000-\u303f\uff00-\uffef]/u.test(ch))return 1;if(/[A-ZMW@#%]/u.test(ch))return .69;return .56;}
export function textWidth(text,size){return [...text].reduce((n,c)=>n+unit(c)*size,0);}
export function wrapText(text,width,size){
 const out=[];for(const paragraph of String(text).split('\n')){
  let line='';const words=paragraph.match(/[A-Za-z0-9_+./:@%-]+|\s+|[^\s]/gu)||[''];
  for(const word of words){if(textWidth(word,size)>width+.5)throw Error(`Unbreakable text exceeds box width: ${word}`);if(line&&textWidth(line+word,size)>width){out.push(line.trimEnd());line=word.trimStart();}else line+=word;}
  out.push(line.trimEnd());
 }return out.join('\n');
}
export function makeScene(brief){
 validateBrief(brief);const c=tokens.colors;const scenes=[];const font=brief.font||tokens.type.font;
 for(const [index,s]of brief.slides.entries()){
  const elements=[];let serial=0;
  const add=(kind,props)=>{const e={kind,id:`s${index+1}-${kind}-${++serial}`,...props};elements.push(e);return e;};
  const shape=(x,y,w,h,fill=c.white,radius=20,stroke=c.border,extra={})=>add('shape',{x,y,w,h,fill,radius,stroke,...extra});
  const text=(value,x,y,w,h,size=25,color=c.body,bold=false,align='left')=>{const result=wrapText(value,w,size);const lines=result.split('\n').length;if(lines*size*1.24>h+1)throw Error(`Slide ${index+1} (${s.layout}): text does not fit its ${h}px box: ${value}`);return add('text',{text:result,x,y,w,h,size,color,bold,align,font});};
  const line=(x,y,w,color=c.border,width=1)=>add('line',{x,y,w,h:0,color,width});
  const arrow=(x,y,w,color=c.vermillion)=>add('arrow',{x,y,w,h:10,fill:color});
  const image=(src,x,y,w,h)=>add('image',{src,x,y,w,h,alt:s.imageAlt||s.title});
  const glass=tokens.gradients.glass;
  if(brief.brand?.logo)image(brief.brand.logo,64,31,240,50);
  else text(brief.brand?.name||'WARM GLASS',64,35,800,39,23,c.accentText,true);
  if(brief.brand?.tagline)text(brief.brand.tagline,64,78,1250,28,17,c.muted);
  if(!['cover','section','quote'].includes(s.layout)){
   text(s.label||'',64,112,1450,28,18,c.accentText,true);
   text(s.title,64,151,1472,123,50,c.title,true);
   if(s.subtitle)text(s.subtitle,64,271,1472,40,23,c.muted);
  }
  const takeaway=()=>{if(s.takeaway){shape(64,790,1472,68,glass,18,'#FFFFFF',{shadow:true});shape(64,790,6,68,tokens.gradients.accent,3,'none');text(s.takeaway,89,808,1420,37,23,c.title,true);}};
  if(['cover','section','quote'].includes(s.layout)){
   if(s.layout==='section')text(s.label||'SECTION',64,208,780,48,30,c.accentText,true);
   else if(s.label)text(s.label,64,192,840,37,23,c.accentText,true);
   const hasImage=Boolean(s.image),w=hasImage?900:1400;
   text(s.title,64,s.layout==='section'?282:252,w,207,s.layout==='cover'?70:64,c.title,true);
   if(s.subtitle)text(s.subtitle,64,482,w,104,28,c.muted);
   if(s.message)text(s.message,64,s.layout==='quote'&&!s.subtitle?500:606,w,140,29,c.accentText,true);
   if(s.image)image(s.image,997,238,547,461);
   takeaway();
  }else if(['columns','comparison'].includes(s.layout)){
   const count=s.items.length,g=28,w=(1472-g*(count-1))/count;
   s.items.forEach((it,i)=>{const x=64+i*(w+g);shape(x,338,w,398,glass,22,'#FFFFFF',{shadow:true});text(String(i+1).padStart(2,'0'),x+27,362,w-54,45,29,c.accentText,true);text(it.title,x+27,418,w-54,78,29,c.title,true);line(x+27,510,w-54,'#E7D9D0');let y=536;const details=it.details||[it.body||''];for(const detail of details){const label=wrapText(detail,w-54,23),hh=label.split('\n').length*29+4;text(label,x+27,y,w-54,hh,23);y+=hh+14;}if(y>721)throw Error(`Slide ${index+1}: ${it.title} has too many details`);});takeaway();
  }else if(s.layout==='process'){
   const step=1472/s.items.length;
   s.items.forEach((it,i)=>{const cx=64+step*(i+.5);if(i<s.items.length-1)arrow(cx+43,438,step-86);shape(cx-39,404,78,78,c.pin,39,'#FFFFFF',{shadow:true});text(String(i+1),cx-30,418,60,49,31,c.white,true,'center');text(it.title,cx-step/2+10,511,step-20,80,29,c.title,true,'center');if(it.body)text(it.body,cx-step/2+15,611,step-30,102,23,c.muted,false,'center');});takeaway();
  }else if(s.layout==='roadmap'){
   const g=22,w=(1472-g*(s.items.length-1))/s.items.length;
   s.items.forEach((it,i)=>{const x=64+i*(w+g);if(i<s.items.length-1)arrow(x+w,431,g);shape(x,350,w,394,glass,20,'#FFFFFF',{shadow:true});shape(x,350,w,57,tokens.gradients.accent,18,'none');text(it.date||String(i+1),x+17,363,w-34,38,24,c.white,true,'center');text(it.title,x+22,430,w-44,88,28,c.title,true);let y=537;for(const detail of it.details||[]){const label=wrapText(detail,w-44,22),hh=label.split('\n').length*28+2;text(label,x+22,y,w-44,hh,22);y+=hh+13;}if(y>721)throw Error(`Slide ${index+1}: roadmap detail overflow`);});takeaway();
  }else if(s.layout==='layers'){
   const n=s.items.length;const dy=384/n;
   s.items.forEach((it,i)=>{const x=64+i*66,w=1472-i*132,y=342+i*dy;shape(x,y,w,dy-12,i===n-1?tokens.gradients.focus:glass,20,'#FFFFFF',{shadow:true});text(it.title,x+30,y+15,470,dy-40,28,i===n-1?c.title:c.title,true);text(it.body||'',x+520,y+15,w-550,dy-40,23,c.body);});takeaway();
  }else if(s.layout==='architecture'){
   const n=s.items.length,dy=410/n;
   s.items.forEach((it,i)=>{const y=332+i*dy;shape(64,y,1472,dy-12,glass,16,'#FFFFFF',{shadow:true});shape(64,y,232,dy-12,i===n-1?tokens.gradients.accent:c.white,16,'none');text(it.title,84,y+18,190,dy-44,25,i===n-1?c.white:c.accentText,true);const cs=it.components||[],g=18,w=(1198-g*(cs.length-1))/Math.max(1,cs.length);cs.forEach((label,j)=>{const x=316+j*(w+g);shape(x,y+14,w,dy-40,c.white,10,'#E6DDD6');text(label,x+12,y+23,w-24,dy-55,22,c.body,true,'center');});});takeaway();
  }else if(s.layout==='metrics'){
   const g=28,w=(1472-g*(s.items.length-1))/s.items.length;
   s.items.forEach((it,i)=>{const x=64+i*(w+g);shape(x,347,w,392,glass,22,'#FFFFFF',{shadow:true});text(it.value,x+25,380,w-50,110,62,c.accentText,true);text(it.title,x+25,510,w-50,75,28,c.title,true);if(it.body)text(it.body,x+25,600,w-50,74,22,c.muted);text(s.demonstration?'演示数据 / 非实际业务成果':it.source,x+25,693,w-50,31,16,c.muted);});takeaway();
  }else if(s.layout==='image'){
   image(s.image,64,335,1472,415);takeaway();
  }
  for(const e of elements){if(![e.x,e.y,e.w,e.h].every(Number.isFinite)||e.w<=0||e.h<0||e.x<0||e.y<0||e.x+e.w>1600.5||e.y+e.h>900.5)throw Error(`Slide ${index+1}: invalid or off-canvas element ${e.id}`);}
  scenes.push({title:s.title,layout:s.layout,background:c.canvas,notes:[s.notes||'',s.demonstration?'All numerical values on this slide are demonstration data.':'',...(s.sources||[]).map(x=>'Source: '+x)].filter(Boolean).join('\n'),elements});
 }
 return {title:brief.title,author:brief.author||'',mode:brief.mode==='executive'?'talk':brief.mode,font,width:1600,height:900,slides:scenes};
}
