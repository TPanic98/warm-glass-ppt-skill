import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import JSZip from 'jszip';
import {filesAt} from '../scripts/audit-public.mjs';
import {isSkillFile,isSkillPath,MAX_SKILL_BYTES,MAX_SKILL_ZIP_BYTES} from '../scripts/skill-files.mjs';
import {packageRelease} from '../scripts/package-release.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'skills/warm-glass-ppt');

test('distribution admits runtime sources and JSON cases, not generated artifacts, artwork or caches',()=>{
 for(const file of ['SKILL.md','LICENSE','package-lock.json','assets/tokens.json','lib/composition.mjs','scripts/review.mjs','agents/openai.yaml','references/review.md','examples/compose/report.json','examples/ui/components.json'])assert.equal(isSkillFile(file),true,file);
 for(const file of ['assets/photo.png','assets/component-library.pptx','examples/ui/report.pptx','docs/report.md','examples/legacy/showcase.json','dist/scene.json','node_modules/jszip/package.json','.env','../secret.json'])assert.equal(isSkillFile(file),false,file);
 assert.equal(isSkillPath('examples/compose'),true);assert.equal(isSkillPath('node_modules'),false);assert.equal(isSkillPath('examples/legacy'),false);
});

test('standalone ZIP is bounded, source-only and retains every runtime module and four-purpose case',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-slim-zip-'));
 const products=await packageRelease(tmp);assert.equal(products.length,1);const [product]=products;assert.ok(product.bytes<MAX_SKILL_ZIP_BYTES);
 assert.equal(await fs.readFile(path.join(tmp,'SHA256SUMS.txt'),'utf8'),`${product.sha256}  ${product.name}\n`);
 const zip=await JSZip.loadAsync(await fs.readFile(path.join(tmp,product.name))),files=Object.values(zip.files).filter(f=>!f.dir);
 let bytes=0;for(const file of files){assert.ok(file.name.startsWith('warm-glass-ppt/'));assert.equal(isSkillFile(file.name.slice('warm-glass-ppt/'.length)),true,file.name);bytes+=(await file.async('nodebuffer')).length;}
 assert.ok(bytes<MAX_SKILL_BYTES);
 const expected=(await filesAt(source)).map(file=>path.relative(source,file).split(path.sep).join('/')).filter(isSkillFile).sort();
 assert.deepEqual(files.map(f=>f.name.slice('warm-glass-ppt/'.length)).sort(),expected);
 for(const mode of ['report','talk','training','product'])assert.equal(JSON.parse(await zip.file(`warm-glass-ppt/examples/compose/${mode}.json`).async('string')).mode,mode);
});

test('local installation uses the same file policy, keeps local imports intact and refuses overwrite',async()=>{
 const tmp=await fs.mkdtemp(path.join(os.tmpdir(),'warm-slim-install-')),dest=path.join(tmp,'warm-glass-ppt');
 const install=()=>spawnSync(process.execPath,[path.join(root,'scripts/install-skill.mjs'),'--dest',dest,'--no-deps'],{encoding:'utf8'});
 const first=install();assert.equal(first.status,0,first.stderr);
 const installed=await filesAt(dest),actual=installed.map(file=>path.relative(dest,file).split(path.sep).join('/')).sort();
 const expected=(await filesAt(source)).map(file=>path.relative(source,file).split(path.sep).join('/')).filter(isSkillFile).sort();assert.deepEqual(actual,expected);
 for(const file of installed.filter(file=>file.endsWith('.mjs'))){const code=await fs.readFile(file,'utf8');for(const m of code.matchAll(/(?:from\s+|import\s*(?:\(\s*)?)["'](\.{1,2}\/[^"']+)["']/g))await fs.access(path.resolve(path.dirname(file),m[1]));}
 const before=await fs.readFile(path.join(dest,'SKILL.md'),'utf8'),second=install();assert.notEqual(second.status,0);assert.match(second.stderr,/already exists/);assert.equal(await fs.readFile(path.join(dest,'SKILL.md'),'utf8'),before);
});
