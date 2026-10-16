import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
import {filesAt,audit} from './audit-public.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');await audit();
const version=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')).version;
const out=path.join(root,'releases');await fs.mkdir(out,{recursive:true});
const all=await filesAt(root);const products=[];
for(const [name,select,prefix]of [
 [`warm-glass-ppt-v${version}.zip`,p=>p.startsWith(path.join(root,'skills/warm-glass-ppt')+path.sep),'skill'],
 [`warm-glass-ppt-skill-repository-v${version}.zip`,()=>true,'repository']]){
 const zip=new JSZip();for(const p of all.filter(select)){const rel=prefix==='skill'?path.relative(path.join(root,'skills'),p):path.join('warm-glass-ppt-skill',path.relative(root,p));zip.file(rel.split(path.sep).join('/'),await fs.readFile(p));}
 if(prefix==='skill')zip.file('warm-glass-ppt/LICENSE',await fs.readFile(path.join(root,'LICENSE')));
 const buf=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});const dest=path.join(out,name);await fs.writeFile(dest,buf);products.push({name,bytes:buf.length,sha256:createHash('sha256').update(buf).digest('hex')});
}
await fs.writeFile(path.join(out,'SHA256SUMS.txt'),products.map(p=>`${p.sha256}  ${p.name}`).join('\n')+'\n');
console.log(JSON.stringify(products,null,2));
