import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const skillRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const recipeFiles=['package.json','package-lock.json','assets/tokens.json','assets/components.json','lib/model.mjs','lib/ui-components.mjs','lib/ui-scene.mjs','lib/ui-render.mjs','lib/ui-ooxml.mjs','lib/composition.mjs','lib/content-audit.mjs','lib/review.mjs','scripts/build-ui.mjs'];
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJson=async file=>JSON.parse(await fs.readFile(file,'utf8'));
const nonempty=value=>typeof value==='string'&&value.trim().length>0;

export async function buildProvenance(input,out,assets){
 const images=[];for(const [src,data]of assets){images.push({...(src.startsWith('data:')?{}:{path:path.relative(out,path.resolve(path.dirname(input),src))}),sha256:digest(Buffer.from(data.split(',')[1],'base64'))});}
 return {input:path.relative(out,path.resolve(input)),images,generator:await Promise.all(recipeFiles.map(async file=>({path:file,sha256:digest(await fs.readFile(path.join(skillRoot,file)))})))};
}

export async function inspectBuild(deckDir){
 const dir=path.resolve(deckDir),validationBytes=await fs.readFile(path.join(dir,'validation.json')),report=JSON.parse(validationBytes),issues=[];
 if(!report.provenance||!report.sha256?.scene)throw Error('This build has no current provenance manifest; regenerate it with the current builder');
 if(!Array.isArray(report.provenance.generator)||report.provenance.generator.length!==recipeFiles.length||report.provenance.generator.some((file,i)=>file.path!==recipeFiles[i]))throw Error('Generation-recipe manifest is incomplete or invalid');
 const compare=async(file,expected,label)=>{try{if(digest(await fs.readFile(file))!==expected)issues.push(label+' changed');}catch(e){if(e.code!=='ENOENT')throw e;issues.push(label+' is missing');}};
 await compare(path.join(dir,'deck.pptx'),report.sha256.pptx,'PPTX');
 await compare(path.join(dir,'scene.json'),report.sha256.scene,'Scene');
 await compare(path.resolve(dir,report.provenance.input),report.sha256.input,'Input brief');
 for(const [i,asset]of report.provenance.images.entries())if(asset.path)await compare(path.resolve(dir,asset.path),asset.sha256,`Image asset ${i+1}`);
 for(const file of report.provenance.generator)await compare(path.resolve(skillRoot,file.path),file.sha256,'Generator '+file.path);
 return {report,issues,basis:{validationSha256:digest(validationBytes),pptxSha256:report.sha256.pptx,inputSha256:report.sha256.input,sceneSha256:report.sha256.scene}};
}

export async function inspectRenderManifest(file,report){
 const bytes=await fs.readFile(file),manifest=JSON.parse(bytes),issues=[];
 if(manifest.schema!=='warm-glass-render/v1'||!nonempty(manifest.renderer?.name)||!nonempty(manifest.renderer?.method))throw Error('Expected a named actual-PPTX renderer and its method');
 if(manifest.pptxSha256!==report.sha256.pptx)issues.push('Renders belong to a different PPTX');
 if(!Array.isArray(manifest.pages)||manifest.pages.length!==report.slideCount)issues.push('Render page count differs from PPTX');
 const seen=new Set();
 for(const page of manifest.pages??[]){
  if(!Number.isInteger(page.slide)||page.slide<1||page.slide>report.slideCount||seen.has(page.slide)){issues.push('Invalid or duplicate rendered slide');continue;}seen.add(page.slide);
  if(!nonempty(page.path)||!nonempty(page.sha256)){issues.push('Rendered page needs a path and hash');continue;}
  try{
   const png=await fs.readFile(path.resolve(path.dirname(file),page.path));
   if(png.length<24||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||!png.readUInt32BE(16)||!png.readUInt32BE(20))issues.push(`Rendered page ${page.slide} is not a PNG`);
   if(digest(png)!==page.sha256)issues.push(`Rendered page ${page.slide} changed`);
  }catch(e){if(e.code!=='ENOENT')throw e;issues.push(`Rendered page ${page.slide} is missing`);}
 }
 return {manifest,issues,sha256:digest(bytes)};
}

export async function initReview(deckDir,renderManifest,outfile){
 const state=await inspectBuild(deckDir);if(state.issues.length)throw Error(state.issues.join('; '));
 const render=await inspectRenderManifest(path.resolve(renderManifest),state.report);if(render.issues.length)throw Error(render.issues.join('; '));
 const receipt={schema:'warm-glass-review/v1',basis:state.basis,renderManifest:{path:path.relative(path.dirname(path.resolve(outfile)),path.resolve(renderManifest)),sha256:render.sha256},content:{status:'pending',notes:'',questions:state.report.contentAudit?.pages.flatMap(p=>p.reviewQuestions.map(question=>({slide:p.slide,question})))??[]},design:{status:'pending',notes:''},pages:Array.from({length:state.report.slideCount},(_,i)=>({slide:i+1,status:'pending',notes:''})),warnings:(state.report.compositionWarnings??[]).map(w=>({warning:w,decision:'pending',reason:''})),targetApplication:{status:'not-tested',application:'',notes:'No target-application interaction test has been recorded.'}};
 await fs.writeFile(outfile,JSON.stringify(receipt,null,2),{flag:'wx'});return receipt;
}

export async function verifyReview(deckDir,receiptFile){
 const state=await inspectBuild(deckDir),receiptBytes=await fs.readFile(receiptFile),receipt=JSON.parse(receiptBytes),issues=[...state.issues];
 if(receipt.schema!=='warm-glass-review/v1')throw Error('Unsupported review receipt');
 if(Object.entries(state.basis).some(([key,value])=>receipt.basis?.[key]!==value))issues.push('Review belongs to a different build');
 if(!nonempty(receipt.renderManifest?.path))throw Error('Missing render-manifest path');
 const render=await inspectRenderManifest(path.resolve(path.dirname(path.resolve(receiptFile)),receipt.renderManifest.path),state.report);
 issues.push(...render.issues);if(render.sha256!==receipt.renderManifest.sha256)issues.push('Render manifest changed after review');
 const stale=issues.length>0;
 for(const key of ['content','design'])if(receipt[key]?.status!=='pass'||!nonempty(receipt[key]?.notes))issues.push(`${key} review needs an explicit judgment and notes`);
 const pages=receipt.pages??[],seen=new Set();
 for(const page of pages){if(!Number.isInteger(page.slide)||page.slide<1||page.slide>state.report.slideCount||seen.has(page.slide))issues.push('Invalid or duplicate page review');seen.add(page.slide);if(page.status!=='pass'||!nonempty(page.notes))issues.push(`Page ${page.slide} needs review`);}
 if(pages.length!==state.report.slideCount||seen.size!==state.report.slideCount)issues.push('Every final page needs review');
 const warnings=state.report.compositionWarnings??[];
 if(!Array.isArray(receipt.warnings)||receipt.warnings.length!==warnings.length)issues.push('Warning review does not match this build');
 else for(const [i,w]of warnings.entries()){const r=receipt.warnings[i];if(JSON.stringify(r?.warning)!==JSON.stringify(w)||r.decision!=='accepted'||!nonempty(r.reason))issues.push('Composition warning needs a reasoned decision');}
 if(!['not-tested','passed','failed'].includes(receipt.targetApplication?.status))issues.push('Target-application test status is missing');
 if(receipt.targetApplication?.status==='failed')issues.push('Target-application test reported a failure');
 if(receipt.targetApplication?.status==='passed'&&(!nonempty(receipt.targetApplication.application)||!nonempty(receipt.targetApplication.notes)))issues.push('Target-application test needs a named application and observations');
 return {status:stale?'stale':issues.length?'needs-review':'review-record-complete',ready:issues.length===0,issues,basis:state.basis,renderer:render.manifest.renderer,targetApplication:receipt.targetApplication,claimBoundary:'Hashes verify freshness, not reviewer honesty or pixel-perfect compatibility. Content and design decisions are recorded human/agent judgments.'};
}
