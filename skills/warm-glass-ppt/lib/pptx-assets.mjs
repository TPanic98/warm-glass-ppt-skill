import fs from 'node:fs/promises';
import path from 'node:path';
import JSZip from 'jszip';

const decode=s=>String(s||'').replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
const attrs=(s='')=>Object.fromEntries([...s.matchAll(/([\w:.-]+)\s*=\s*["']([^"']*)["']/g)].map(x=>[x[1],decode(x[2])]));
const tags=(xml,tag)=>[...xml.matchAll(new RegExp(`<${tag}\\b[^>]*(?:\\/>|>[\\s\\S]*?<\\/${tag}>)`,'g'))].map(x=>x[0]);
function count(xml,re){return [...xml.matchAll(re)].length;}
export function dimensions(b){
 if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {width:b.readUInt32BE(16),height:b.readUInt32BE(20),format:'png'};
 if(b[0]===255&&b[1]===216){let p=2;while(p+4<b.length){if(b[p]!==255){p++;continue;}const m=b[p+1];p+=2;if(m===216||m===217)continue;const n=b.readUInt16BE(p);if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(m)&&p+7<b.length)return {width:b.readUInt16BE(p+5),height:b.readUInt16BE(p+3),format:'jpeg'};if(n<2)break;p+=n;}}
 return {width:null,height:null,format:'other'};
}
export async function readPptx(filename){
 const buffer=await fs.readFile(filename);if(buffer.length>250*1024*1024)throw Error('Input exceeds 250 MiB');const zip=await JSZip.loadAsync(buffer);
 const names=Object.keys(zip.files);if(names.length>15000)throw Error('Too many ZIP entries');
 const presentation=await zip.file('ppt/presentation.xml')?.async('string');if(!presentation)throw Error('Not a PowerPoint presentation');
 const size=attrs(presentation.match(/<p:sldSz\b[^>]*\/?\>/)?.[0]||'');
 const slides=[];const media=new Map();let readBytes=0;
 const slideNames=names.filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>+a.match(/(\d+)\.xml/)[1]-+b.match(/(\d+)\.xml/)[1]);
 for(const [index,name]of slideNames.entries()){
  const xml=await zip.file(name).async('string');const relname=path.posix.join(path.posix.dirname(name),'_rels',path.posix.basename(name)+'.rels');const relxml=await zip.file(relname)?.async('string')||'';
  const rels=new Map(tags(relxml,'Relationship').map(s=>{const a=attrs(s);return [a.Id,a];}));const pictures=[];
  for(const pic of tags(xml,'p:pic')){
   const a=attrs(pic.match(/<a:blip\b[^>]*>/)?.[0]);const rel=rels.get(a['r:embed']);if(!rel||rel.TargetMode==='External')continue;
   const target=path.posix.normalize(path.posix.join('ppt/slides',rel.Target));if(!target.startsWith('ppt/media/'))continue;
   if(!media.has(target)){const f=zip.file(target);if(!f)throw Error(`Missing embedded image ${target}`);const b=await f.async('nodebuffer');readBytes+=b.length;if(readBytes>500*1024*1024)throw Error('Embedded image data exceeds 500 MiB');media.set(target,{bytes:b,...dimensions(b)});}
   const info=media.get(target);const off=attrs(pic.match(/<a:off\b[^>]*>/)?.[0]);const ext=attrs(pic.match(/<a:ext\b[^>]*>/)?.[0]);const crop=attrs(pic.match(/<a:srcRect\b[^>]*>/)?.[0]);
   pictures.push({imageIndex:pictures.length+1,target,width:info.width,height:info.height,format:info.format,placementEmu:{x:Number(off.x||0),y:Number(off.y||0),w:Number(ext.cx||0),h:Number(ext.cy||0)},crop});
  }
  const nativeShapes=count(xml,/<p:sp\b/g),textRuns=count(xml,/<a:t\b/g),tables=count(xml,/<a:tbl\b/g),charts=count(xml,/<c:chart\b/g);
  slides.push({slide:index+1,nativeShapes,textRuns,tables,charts,imageOnly:pictures.length>0&&nativeShapes===0&&textRuns===0&&tables===0&&charts===0,pictures});
 }
 return {report:{filename:path.basename(filename),slideCount:slides.length,sizeEmu:{width:Number(size.cx),height:Number(size.cy)},inspectionScope:'Direct slide objects; inherited masters and layouts are not expanded.',slides},media};
}
