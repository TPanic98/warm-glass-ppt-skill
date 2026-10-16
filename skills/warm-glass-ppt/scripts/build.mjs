import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {readBrief,makeScene} from '../lib/model.mjs';
import {renderPptx,renderHtml} from '../lib/render.mjs';

export async function build(input,output,{force=false}={}){
 const detected=JSON.parse(await fs.readFile(input,'utf8'));
 if(detected.schema==='warm-glass-ui/v2'){const {buildUi}=await import('./build-ui.mjs');return buildUi(input,output,{force});}
 const {brief,briefDir}=await readBrief(input);const scene=makeScene(brief);const out=path.resolve(output);
 const names=['deck.pptx','preview.html','scene.json','validation.json'];
 for(const n of names){try{await fs.access(path.join(out,n));if(!force)throw Error(`Output already exists: ${path.join(out,n)}. Choose another directory or use --force.`);}catch(e){if(e.code!=='ENOENT')throw e;}}
 // Resolve and render all inputs before materializing any deliverable.
 const [pptx,html]=await Promise.all([renderPptx(scene,briefDir),renderHtml(scene,briefDir)]);
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'deck.pptx'),pptx);await fs.writeFile(path.join(out,'preview.html'),html);
 await fs.writeFile(path.join(out,'scene.json'),JSON.stringify(scene,null,2));
 const report={slideCount:scene.slides.length,canvas:[scene.width,scene.height],font:scene.font,estimatedTextFit:'pass',canvasBounds:'pass',actualPptxRendering:'not checked by this script',htmlIsDesignPreview:true,editability:'Native text, shapes and gradients; supplied artwork remains image objects.'};
 await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2));return {out,...report};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);if(args.includes('--help')||!args.length){console.log('Usage: node scripts/build.mjs brief.json --out output-directory [--force]');process.exit(args.length?0:1);}
 const input=args.shift();let output,force=false;while(args.length){const k=args.shift();if(k==='--out')output=args.shift();else if(k==='--force')force=true;else throw Error(`Unknown argument ${k}`);}
 try{if(!output)throw Error('--out is required');console.log(JSON.stringify(await build(input,output,{force}),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
