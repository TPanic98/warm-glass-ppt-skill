import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function filesAt(dir=root){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['.git','node_modules','dist','releases'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isSymbolicLink())throw Error(`Symlink in public package: ${path.relative(root,p)}`);if(e.isDirectory())out.push(...await filesAt(p));else out.push(p);}return out;}
export async function audit(){
 const files=await filesAt();const failures=[];let totalBytes=0;
 for(const p of files){const rel=path.relative(root,p);const stat=await fs.stat(p);totalBytes+=stat.size;
  if(/(?:^|\/)(?:\.env(?:\..*)?|\.DS_Store|private|local-assets|extracted)(?:\/|$)/.test(rel))failures.push(`Private/runtime path: ${rel}`);
  if(/BEA_AI_|首席演讲_宏观叙事版|full_visual_deck|reference\.pptx/i.test(path.basename(p)))failures.push(`Original source artifact: ${rel}`);
  if(stat.size>20*1024*1024)failures.push(`File over 20 MiB: ${rel}`);
  if(/\.(?:md|json|mjs|yaml|yml|html|txt)$/i.test(p)){
   const text=await fs.readFile(p,'utf8');
   if(/(?:\/Users\/[A-Za-z0-9._-]+\/|C:\\\\Users\\\\[^\\]+\\)/.test(text))failures.push(`Personal local path: ${rel}`);
   if(/(?:gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(text))failures.push(`Credential-like material: ${rel}`);
  }
 }
 if(failures.length)throw Error(failures.join('\n'));return {files:files.length,totalBytes,status:'pass',scope:'Public repository files, excluding generated outputs and dependencies'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){try{console.log(JSON.stringify(await audit(),null,2));}catch(e){console.error(e.message);process.exitCode=1;}}
