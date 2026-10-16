import fs from 'node:fs/promises';
import path from 'node:path';
import PptxGenJS from 'pptxgenjs';
import JSZip from 'jszip';
import {resolveAsset,tokens} from './model.mjs';
import {dimensions} from './pptx-assets.mjs';

export const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const hex=v=>String(v||'#FFFFFF').replace('#','');
function gradXml(g){return `<a:gradFill rotWithShape="1"><a:gsLst>${g.stops.map(([p,c,alpha])=>`<a:gs pos="${Math.round(p*1000)}"><a:srgbClr val="${hex(c)}">${alpha===undefined?'':`<a:alpha val="${Math.round(alpha*100000)}"/>`}</a:srgbClr></a:gs>`).join('')}</a:gsLst><a:lin ang="${Math.round(g.angle*60000)}" scaled="1"/></a:gradFill>`;}
export async function renderPptx(scene,briefDir){
 const pptx=new PptxGenJS();pptx.defineLayout({name:'WARM_GLASS',width:13.333333,height:7.5});pptx.layout='WARM_GLASS';pptx.author=scene.author;pptx.subject='Generated with Warm Glass PPT';pptx.title=scene.title;pptx.company='';pptx.lang='zh-CN';pptx.theme={headFontFace:scene.font,bodyFontFace:scene.font,lang:'zh-CN'};
 const gradients=new Map();
 for(const [i,s]of scene.slides.entries()){
  const slide=pptx.addSlide();slide.background={color:hex(s.background)};slide.addNotes(s.notes||s.title);
  for(const e of s.elements){
   const p={x:e.x/120,y:e.y/120,w:e.w/120,h:e.h/120,shapeName:e.id};
   if(e.kind==='text')slide.addText(e.text,{...p,fontFace:e.font,fontSize:e.size*.6,color:hex(e.color),bold:e.bold,align:e.align,valign:'top',margin:0,breakLine:false,wrap:false,fit:'none',lineSpacingMultiple:1.1,paraSpaceAfter:0,lang:'zh-CN'});
   else if(e.kind==='image'){const a=await resolveAsset(e.src,briefDir);slide.addImage({...imageContain(a.data,p),path:a.path,altText:e.alt});}
   else if(e.kind==='line')slide.addShape(pptx.ShapeType.line,{...p,line:{color:hex(e.color),width:e.width*.6}});
   else if(e.kind==='arrow')slide.addShape(pptx.ShapeType.rightArrow,{...p,fill:{color:hex(e.fill)},line:{transparency:100}});
   else if(e.kind==='shape'){
    const gradient=typeof e.fill==='object'?e.fill:undefined;if(gradient)gradients.set(e.id,gradient);
    const material=tokens.material;
    slide.addShape(e.radius?pptx.ShapeType.roundRect:pptx.ShapeType.rect,{...p,rectRadius:(e.radius||0)/120,fill:{color:hex(gradient?gradient.stops[0][1]:e.fill)},line:e.stroke==='none'?{transparency:100}:{color:hex(e.stroke),width:.6,transparency:e.stroke==='#FFFFFF'?(1-material.borderOpacity)*100:0},...(e.shadow?{shadow:{type:'outer',color:hex(material.shadowColor),opacity:material.shadowOpacity,blur:material.shadowBlur*.6,offset:material.shadowOffset*.6,angle:90}}:{})});
   }
  }
 }
 const raw=await pptx.write({outputType:'nodebuffer',compression:true});const zip=await JSZip.loadAsync(raw);
 // Native OOXML gradients preserve editability; no shape is rasterized for a gradient.
 for(let i=1;i<=scene.slides.length;i++){
  const key=`ppt/slides/slide${i}.xml`;let xml=await zip.file(key).async('string');
  let ordinal=0;
  xml=xml.replace(/<p:(sp|pic)>.*?<\/p:\1>/gs,(block)=>{
   const element=scene.slides[i-1].elements[ordinal++];if(!element)throw Error('Unexpected native object count during PPTX export');
   block=block.replace(/(<p:cNvPr\b[^>]*\bname=")[^"]*"/,`$1${element.id}"`);
   const g=gradients.get(element.id);if(!g)return block;
   return block.replace(/<p:spPr>(.*?)<\/p:spPr>/s,(all,inner)=>`<p:spPr>${inner.replace(/<a:solidFill>.*?<\/a:solidFill>/s,gradXml(g))}</p:spPr>`);
  });
  if(ordinal!==scene.slides[i-1].elements.length)throw Error('PPTX export lost native objects');
  zip.file(key,xml);
 }
 // PptxGenJS 4.0.1 can declare per-slide master overrides while writing one
 // shared master. Retain only content-type declarations for emitted parts.
 const contentTypes=await zip.file('[Content_Types].xml').async('string');
 zip.file('[Content_Types].xml',contentTypes.replace(/<Override\b[^>]*\/>/g,entry=>{
  const part=entry.match(/\bPartName="([^"]+)"/)?.[1]?.replace(/^\//,'');
  return part&&!zip.file(part)?'':entry;
 }));
 return zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
function imageContain(bytes,p){const d=dimensions(bytes);if(!d.width||!d.height)throw Error('Cannot read image dimensions');const scale=Math.min(p.w/d.width,p.h/d.height),w=d.width*scale,h=d.height*scale;return {x:p.x+(p.w-w)/2,y:p.y+(p.h-h)/2,w,h};}
function cssColor(color,alpha){if(alpha===undefined)return color;const n=parseInt(hex(color),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${alpha})`;}
function fillCss(fill){if(typeof fill==='string')return fill;return `linear-gradient(${fill.angle+90}deg,${fill.stops.map(([p,c,alpha])=>`${cssColor(c,alpha)} ${p}%`).join(',')})`;}
export async function renderHtml(scene,briefDir){
 const slides=[];for(const [i,s]of scene.slides.entries()){
  const body=[];for(const e of s.elements){const style=`left:${e.x}px;top:${e.y}px;width:${e.w}px;height:${e.h}px;`;
   if(e.kind==='text')body.push(`<div class="el text" data-id="${e.id}" style="${style}font:${e.bold?'700':'400'} ${e.size}px/${1.24} '${esc(e.font)}','Noto Sans CJK SC','PingFang SC','Heiti TC',sans-serif;color:${e.color};text-align:${e.align}">${esc(e.text)}</div>`);
   else if(e.kind==='image'){const a=await resolveAsset(e.src,briefDir);body.push(`<img class="el" alt="${esc(e.alt)}" style="${style}object-fit:contain" src="data:${a.mime};base64,${a.data.toString('base64')}">`);}
   else if(e.kind==='line')body.push(`<div class="el" style="${style}border-top:${e.width}px solid ${e.color}"></div>`);
   else if(e.kind==='arrow')body.push(`<div class="el arrow" style="${style}background:${e.fill}"></div>`);
   else {const m=tokens.material;body.push(`<div class="el" style="${style}background:${fillCss(e.fill)};border-radius:${e.radius}px;border:${e.stroke==='none'?0:1}px solid ${e.stroke==='none'?'transparent':cssColor(e.stroke,e.stroke==='#FFFFFF'?m.borderOpacity:undefined)};${e.shadow?`backdrop-filter:blur(${m.backdropBlur}px);box-shadow:0 ${m.shadowOffset}px ${m.shadowBlur}px ${cssColor(m.shadowColor,m.shadowOpacity)},0 ${m.contactOffset}px ${m.contactBlur}px ${cssColor(m.shadowColor,m.contactOpacity)},inset 0 1px 1px rgba(255,255,255,${m.insetOpacity});`:''}"></div>`);}
  }
  slides.push(`<section class="page" id="slide-${i+1}" aria-label="${esc(s.title)}"><div class="slide" style="background:${s.background}">${body.join('')}</div></section>`);
 }
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(scene.title)}</title><style>*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#e3dfdc;font-family:sans-serif}nav{position:sticky;top:0;z-index:9;background:#fff;padding:12px 24px;display:flex;gap:16px;align-items:center;color:#333;font-size:14px}nav a{color:#B92A16}.page{position:relative;width:min(calc(100vw - 48px),1600px);aspect-ratio:16/9;margin:24px auto;overflow:hidden;box-shadow:0 4px 22px #0002}.slide{position:absolute;width:1600px;height:900px;transform-origin:top left}.el{position:absolute;overflow:hidden}.text{white-space:pre}.arrow{clip-path:polygon(0 24%,80% 24%,80% 0,100% 50%,80% 100%,80% 76%,0 76%)}.page:fullscreen{width:100vw;height:100vh;margin:0;box-shadow:none;background:#F5F2F1}@media print{@page{size:16in 9in;margin:0}nav{display:none}body{background:white}.page{width:16in;height:9in;margin:0;break-after:page;box-shadow:none}.slide{transform:scale(.96)!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><nav><b>${esc(scene.title)}</b><span>${scene.slides.length} 页 · HTML 设计预览，实际 PPTX 需单独检查</span><a href="#slide-1">回到首页</a><span>← / → 翻页 · F 全屏</span></nav>${slides.join('')}<script>(()=>{const pages=[...document.querySelectorAll('.page')];function size(){for(const p of pages)p.firstElementChild.style.transform='scale('+Math.min(p.clientWidth/1600,p.clientHeight/900)+')'}addEventListener('resize',size);document.addEventListener('fullscreenchange',size);addEventListener('keydown',e=>{if(e.target.matches('input,textarea'))return;const i=pages.reduce((best,p,j)=>Math.abs(p.getBoundingClientRect().top)<Math.abs(pages[best].getBoundingClientRect().top)?j:best,0);if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();pages[Math.max(0,Math.min(pages.length-1,i+(e.key==='ArrowRight'?1:-1)))].scrollIntoView()}if(e.key.toLowerCase()==='f'&&pages[i].requestFullscreen)pages[i].requestFullscreen()});size()})();</script></body></html>`;
}
