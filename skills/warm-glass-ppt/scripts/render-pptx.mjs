import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {digest,inspectBuild} from '../lib/review.mjs';

function run(executable,args,env=process.env){
 return new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{stdio:['ignore','pipe','pipe'],env}),chunks=[];let length=0;
  const collect=data=>{length+=data.length;if(length<1024*1024)chunks.push(data);};child.stdout.on('data',collect);child.stderr.on('data',collect);
  const timer=setTimeout(()=>{child.kill();reject(Error('Renderer exceeded 120 seconds'));},120000);
  child.on('error',error=>{clearTimeout(timer);reject(error);});
  child.on('close',code=>{clearTimeout(timer);const output=Buffer.concat(chunks).toString('utf8');if(code===0)resolve(output.trim());else reject(Error(`Renderer exited ${code}: ${output.slice(-1500)}`));});
 });
}
async function executable(explicit,candidates,versionArgs,env){
 for(const name of explicit?[explicit]:candidates)try{return {name,version:(await run(name,versionArgs,env)).split('\n')[0]};}catch(error){if(explicit)throw error;}
 throw Error('Actual-PPTX rendering dependency unavailable. Install LibreOffice and Poppler, supply explicit executable paths, or use a host renderer and the documented render manifest. No visual check has passed.');
}
export function assessFontMatch(requested,family){
 const exact=family.split(',').some(name=>name.trim().toLocaleLowerCase()===requested.trim().toLocaleLowerCase());
 return {status:exact?'matched':'substituted',requested,matchedFamily:family,scope:'Fontconfig preflight only; inspect actual glyphs and exported pages.'};
}
export async function renderPptx(deckDir,out,{soffice,pdftoppm,fontconfig,allowFontSubstitution=false}={}){
 const state=await inspectBuild(deckDir);if(state.issues.length)throw Error(state.issues.join('; '));
 if(fontconfig)await fs.access(fontconfig);
 const env={...process.env,...(fontconfig?{FONTCONFIG_FILE:path.resolve(fontconfig)}:{})};
 const office=await executable(soffice,['soffice','/Applications/LibreOffice.app/Contents/MacOS/soffice'],['--version'],env);
 const poppler=await executable(pdftoppm,['pdftoppm'],['-v'],env);
 let fontCheck={status:'not-checked',requested:state.report.font,scope:'No usable fc-match preflight; inspect font substitution and actual glyphs manually.'};
 try{fontCheck=assessFontMatch(state.report.font,await run('fc-match',['-f','%{family}',state.report.font],env));}catch{}
 if(fontCheck.status==='substituted'&&!allowFontSubstitution)throw Error(`Requested font ${state.report.font} resolves to ${fontCheck.matchedFamily}. Select an installed font in the brief and rebuild, or explicitly allow substitution after assessing its impact.`);
 const output=path.resolve(out);await fs.mkdir(path.dirname(output),{recursive:true});await fs.mkdir(output);
 const scratch=await fs.mkdtemp(path.join(os.tmpdir(),'warm-glass-render-'));
 try{
  // A separate profile prevents interference with a user's open Office session.
  const profile=pathToFileURL(path.join(scratch,'profile')).href;
  await run(office.name,[`-env:UserInstallation=${profile}`,'--headless','--convert-to','pdf','--outdir',output,path.resolve(deckDir,'deck.pptx')],env);
  await fs.access(path.join(output,'deck.pdf'));
  await run(poppler.name,['-png','-scale-to','1920',path.join(output,'deck.pdf'),path.join(output,'slide')],env);
  const files=(await fs.readdir(output)).filter(x=>/^slide-\d+\.png$/.test(x)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));
  if(files.length!==state.report.slideCount)throw Error('Actual render page count differs from PPTX');
  const current=await inspectBuild(deckDir);if(current.issues.length||current.basis.pptxSha256!==state.basis.pptxSha256)throw Error('Build changed while rendering; review these outputs only after regeneration');
  const manifest={schema:'warm-glass-render/v1',pptxSha256:state.basis.pptxSha256,renderer:{name:'LibreOffice + Poppler',version:office.version+'; '+poppler.version,method:'Actual PPTX opened headlessly, exported to PDF, then rasterized to PNG.',fontCheck,fontConfiguration:fontconfig?'Explicit process-local fontconfig file':env.FONTCONFIG_FILE?'Caller-provided FONTCONFIG_FILE':'Renderer defaults',limitations:['Not WPS or PowerPoint UI interaction.','Fonts are not embedded or verified; inspect the actual rendered text.']},pages:await Promise.all(files.map(async(file,i)=>({slide:i+1,path:file,sha256:digest(await fs.readFile(path.join(output,file)))})))};
  await fs.writeFile(path.join(output,'render.json'),JSON.stringify(manifest,null,2),{flag:'wx'});return {out:output,manifest:path.join(output,'render.json'),slideCount:files.length,status:'rendered-not-reviewed'};
 }finally{await fs.rm(scratch,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);
 if(args.includes('--help'))console.log('Usage: node scripts/render-pptx.mjs deck-directory --out new-render-directory [--soffice executable] [--pdftoppm executable] [--fontconfig fonts.conf] [--allow-font-substitution]');
 else try{const deck=args.shift();let out,soffice,pdftoppm,fontconfig,allowFontSubstitution=false;while(args.length){const flag=args.shift();if(flag==='--allow-font-substitution'){allowFontSubstitution=true;continue;}const value=args.shift();if(!value)throw Error('Missing value for '+flag);if(flag==='--out')out=value;else if(flag==='--soffice')soffice=value;else if(flag==='--pdftoppm')pdftoppm=value;else if(flag==='--fontconfig')fontconfig=value;else throw Error('Unknown argument '+flag);}if(!deck||!out)throw Error('Deck directory and --out are required');console.log(JSON.stringify(await renderPptx(deck,out,{soffice,pdftoppm,fontconfig,allowFontSubstitution}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
