import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'skills/warm-glass-ppt');const args=process.argv.slice(2);let dest,noDeps=false;
while(args.length){const k=args.shift();if(k==='--dest')dest=args.shift();else if(k==='--no-deps')noDeps=true;else if(k==='--help'){console.log('Usage: node scripts/install-skill.mjs [--dest /agent/skills/warm-glass-ppt] [--no-deps]');process.exit(0);}else throw Error(`Unknown argument ${k}`);}
dest=path.resolve(dest||path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'skills/warm-glass-ppt'));
if(path.basename(dest)!=='warm-glass-ppt')throw Error('Destination folder must be named warm-glass-ppt');
if(dest===source||dest.startsWith(source+path.sep))throw Error('Choose an installation destination outside the source skill');
try{await fs.access(dest);throw Error(`Skill already exists: ${dest}. Preserve it or choose another destination.`);}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.mkdir(path.dirname(dest),{recursive:true});const staging=await fs.mkdtemp(path.join(path.dirname(dest),'.warm-glass-install-'));
try{
 await fs.cp(source,staging,{recursive:true,filter:p=>!p.split(path.sep).some(v=>['node_modules','dist','.DS_Store'].includes(v))});
 if(!noDeps){const cmd=process.platform==='win32'?'npm.cmd':'npm';const r=spawnSync(cmd,['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:staging,stdio:'inherit'});if(r.error||r.status!==0)throw Error('Dependency installation failed; no skill was installed.');}
 await fs.rename(staging,dest);console.log(`Installed: ${dest}${noDeps?' (dependencies not installed)':''}`);
}catch(e){await fs.rm(staging,{recursive:true,force:true});throw e;}
