import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import JSZip from 'jszip';
import {filesAt,audit} from './audit-public.mjs';
import {isSkillFile,MAX_SKILL_BYTES,MAX_SKILL_ZIP_BYTES} from './skill-files.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function packageRelease(output=path.join(root,'releases')){
 await audit();
 const version=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8')).version;
 const out=path.resolve(output);await fs.mkdir(out,{recursive:true});
 const skill=path.join(root,'skills/warm-glass-ppt'),zip=new JSZip();let sourceBytes=0;
 for(const p of await filesAt(skill)){
  const relative=path.relative(skill,p);if(!isSkillFile(relative))continue;
  const bytes=await fs.readFile(p);sourceBytes+=bytes.length;
  zip.file('warm-glass-ppt/'+relative.split(path.sep).join('/'),bytes);
 }
 zip.file('warm-glass-ppt/LICENSE',await fs.readFile(path.join(root,'LICENSE')));
 const buf=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
 if(sourceBytes>MAX_SKILL_BYTES||buf.length>MAX_SKILL_ZIP_BYTES)throw Error('Skill exceeds its lean-package budget; review added resources before raising the limit');
 const name=`warm-glass-ppt-v${version}.zip`,product={name,bytes:buf.length,sha256:createHash('sha256').update(buf).digest('hex')};
 await fs.writeFile(path.join(out,name),buf);
 await fs.writeFile(path.join(out,'SHA256SUMS.txt'),`${product.sha256}  ${name}\n`);
 return [product];
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await packageRelease(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
