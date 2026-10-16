import fs from 'node:fs/promises';
import path from 'node:path';
import {readPptx} from '../lib/pptx-assets.mjs';

const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const args=process.argv.slice(2);if(args.includes('--help')||!args.length){console.log('Usage: node scripts/extract-assets.mjs input.pptx --out folder [--regions crops.json] [--crops-only]');process.exit(args.length?0:1);}
try{
 const input=args.shift();let out,regions,cropsOnly=false;
 while(args.length){const k=args.shift();if(k==='--out')out=args.shift();else if(k==='--regions')regions=args.shift();else if(k==='--crops-only')cropsOnly=true;else throw Error(`Unknown argument ${k}`);}
 if(!out)throw Error('--out is required');if(cropsOnly&&!regions)throw Error('--crops-only needs --regions');
 try{await fs.access(out);throw Error('Output directory already exists; choose another directory.');}catch(e){if(e.code!=='ENOENT')throw e;}
 const {report,media}=await readPptx(input);const assets=[];const writes=[];
 if(!cropsOnly)for(const [target,m]of media){const filename=path.posix.basename(target);writes.push([filename,m.bytes]);assets.push({file:filename,kind:'embedded-original',source:report.filename,target,width:m.width,height:m.height,hasAlpha:null,editable:'image object; not reconstructed vector or text',slides:report.slides.filter(s=>s.pictures.some(p=>p.target===target)).map(s=>s.slide)});}
 if(regions){
  const list=JSON.parse(await fs.readFile(regions,'utf8'));if(!Array.isArray(list)||list.length>200)throw Error('Expected up to 200 region objects');
  let sharp;try{sharp=(await import('sharp')).default;}catch{throw Error('Cropping needs optional dependency sharp. Install it in this skill directory.');}
  const used=new Set();for(const r of list){if(!/^[a-z0-9][a-z0-9-]{0,70}$/.test(r.name)||used.has(r.name))throw Error('Region names must be unique lowercase filename-safe strings');used.add(r.name);const slide=report.slides[r.slide-1],picture=slide?.pictures[(r.imageIndex||1)-1];if(!picture)throw Error(`Unknown region slide/image for ${r.name}`);const m=media.get(picture.target);const meta=await sharp(m.bytes).metadata();const [left,top,width,height]=r.rect||[];if(![left,top,width,height].every(Number.isInteger)||left<0||top<0||width<1||height<1||left+width>meta.width||top+height>meta.height)throw Error(`Invalid crop bounds for ${r.name}`);const bytes=await sharp(m.bytes).extract({left,top,width,height}).png().toBuffer();const filename=r.name+'.png';writes.push([filename,bytes]);assets.push({file:filename,kind:'raster-crop',source:report.filename,slide:r.slide,imageIndex:r.imageIndex||1,target:picture.target,rect:r.rect,width,height,hasAlpha:meta.hasAlpha===true,background:'Retained from original; no automatic removal.',editable:'bitmap only',purpose:r.purpose||''});}
 }
 await fs.mkdir(out,{recursive:true});for(const [n,b]of writes)await fs.writeFile(path.join(out,n),b);
 const manifest={...report,assets};await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));
 const cards=assets.map(a=>`<article>${/\.(png|jpe?g|webp|gif)$/i.test(a.file)?`<img src="${encodeURIComponent(a.file)}" alt="${esc(a.file)}">`:'<p>非位图资源，下载后在合适的编辑器中检查。</p>'}<h2><a href="${encodeURIComponent(a.file)}">${esc(a.file)}</a></h2><p>${a.width||'?'} × ${a.height||'?'} · ${esc(a.kind)} · ${esc(a.editable)}</p><p>${esc(a.purpose||'')}</p></article>`).join('');
 await fs.writeFile(path.join(out,'index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Extracted assets</title><style>body{font-family:sans-serif;background:#f5f2f1;color:#333;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}article{background:white;border-radius:16px;padding:20px;overflow:hidden}img{width:100%;height:240px;object-fit:contain;background:repeating-conic-gradient(#eee 0% 25%,white 0% 50%) 0/20px 20px}h2{font-size:18px}p{font-size:14px}a{color:#b92a16}</style><h1>参考 PPT 素材库</h1><p>${esc(report.filename)} · 裁切素材保留原背景与像素；不代表矢量或可编辑文字。</p><main>${cards}</main></html>`);
 console.log(JSON.stringify({out:path.resolve(out),slides:report.slideCount,imageOnlySlides:report.slides.filter(s=>s.imageOnly).length,assets:assets.length},null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
