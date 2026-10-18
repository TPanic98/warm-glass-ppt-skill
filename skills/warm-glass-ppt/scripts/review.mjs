import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {initReview,verifyReview} from '../lib/review.mjs';

export async function reviewCli(args){
 const action=args.shift(),deck=args.shift();let renders,receipt;
 while(args.length){const flag=args.shift(),value=args.shift();if(!value)throw Error('Missing value for '+flag);if(flag==='--render-manifest')renders=value;else if(flag==='--receipt')receipt=value;else throw Error('Unknown argument '+flag);}
 if(!deck||!['init','verify'].includes(action))throw Error('Use init or verify with a deck output directory');
 receipt=receipt??path.join(deck,'review.json');
 if(action==='init'){if(!renders)throw Error('--render-manifest is required');await initReview(deck,renders,receipt);return {status:'pending',receipt:path.resolve(receipt),instruction:'Inspect every actual PPTX render, then record content/design/page judgments and warning decisions. No check has been auto-approved.'};}
 return verifyReview(deck,receipt);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);
 if(args.includes('--help'))console.log('Usage: node scripts/review.mjs init|verify deck-directory [--render-manifest renders/render.json] [--receipt review.json]');
 else try{const result=await reviewCli(args);console.log(JSON.stringify(result,null,2));if(result.ready===false)process.exitCode=2;}catch(e){console.error(e.message);process.exitCode=1;}
}
