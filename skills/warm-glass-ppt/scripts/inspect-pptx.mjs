import fs from 'node:fs/promises';
import {readPptx} from '../lib/pptx-assets.mjs';
const args=process.argv.slice(2);if(args.includes('--help')||!args.length){console.log('Usage: node scripts/inspect-pptx.mjs input.pptx [--out report.json]');process.exit(args.length?0:1);}
try{const input=args.shift();let out;if(args.length){if(args.shift()!=='--out'||!(out=args.shift())||args.length)throw Error('Use --out report.json');}const {report}=await readPptx(input);if(out){await fs.writeFile(out,JSON.stringify(report,null,2),{flag:'wx'});console.log(out);}else console.log(JSON.stringify(report,null,2));}catch(e){console.error(e.message);process.exitCode=1;}
