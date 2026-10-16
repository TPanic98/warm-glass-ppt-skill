import JSZip from 'jszip';
export const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function rgb(fill){if(typeof fill==='string'){const [color,opacity]=fill.split('/');return {color:color.replace('#',''),opacity:opacity===undefined?1:Number(opacity)/100};}if(fill?.type==='rgb')return {color:fill.value.replace('#',''),opacity:fill.transform?.opacity??1};return {color:'FFFFFF',opacity:1};}
export function gradientXml(g){return `<a:gradFill rotWithShape="1"><a:gsLst>${g.stops.map(s=>{const c=rgb(s.color);return `<a:gs pos="${s.offset}"><a:srgbClr val="${c.color}"><a:alpha val="${Math.round(c.opacity*100000)}"/></a:srgbClr></a:gs>`;}).join('')}</a:gsLst><a:lin ang="${Math.round(g.angleDeg*60000)}" scaled="1"/></a:gradFill>`;}
export async function groupNative(buffer,pages){
 const z=await JSZip.loadAsync(buffer);
 for(const [i,page]of pages.entries()){
  const key=`ppt/slides/slide${i+1}.xml`;let value=await z.file(key).async('string');const tree=value.match(/<p:spTree>([\s\S]*?)<\/p:spTree>/);if(!tree)throw Error('Missing shape tree');
  const blocks=[...tree[1].matchAll(/<p:(sp|cxnSp|graphicFrame|pic)\b[^>]*>[\s\S]*?<\/p:\1>/g)].map(m=>({xml:m[0],name:m[0].match(/<p:cNvPr\b[^>]*\bname="([^"]*)"/)?.[1]}));
  let id=Math.max(1,...[...value.matchAll(/<p:cNvPr\b[^>]*\bid="(\d+)"/g)].map(m=>Number(m[1])))+1;
  for(const item of page.instances){const owned=blocks.filter(b=>item.names.includes(b.name)&&b.xml.startsWith('<p:sp>'));if(!owned.length)continue;const {x,y,w,h}=item.box,n=v=>Math.round(v*9525),token=`__UI_GROUP_${i}_${id}__`;
   const group=`<p:grpSp><p:nvGrpSpPr><p:cNvPr id="${id++}" name="${xml(item.id)}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:off x="${n(x)}" y="${n(y)}"/><a:ext cx="${n(w)}" cy="${n(h)}"/><a:chOff x="${n(x)}" y="${n(y)}"/><a:chExt cx="${n(w)}" cy="${n(h)}"/></a:xfrm></p:grpSpPr>${owned.map(b=>b.xml.replace(/ noGrp="1"/g,'')).join('')}</p:grpSp>`;
   let first=true;for(const b of owned){value=value.replace(b.xml,first?token:'');first=false;}value=value.replace(token,group);
  }z.file(key,value);
 }
 return z.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
}
