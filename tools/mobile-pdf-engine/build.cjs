const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=__dirname,temp=path.join(root,'generated'),vendor=path.resolve(root,'../../miniprogram/vendor');
fs.mkdirSync(temp,{recursive:true});fs.mkdirSync(vendor,{recursive:true});
fs.copyFileSync(path.join(root,'runtime.cjs'),path.join(temp,'runtime.cjs'));
fs.copyFileSync(path.join(root,'text-api.mjs'),path.join(temp,'text-api.mjs'));
const source=path.join(root,'node_modules/pdfjs-dist/build');
for(const file of ['pdf.worker.mjs']){
 let src=fs.readFileSync(path.join(source,file),'utf8');
 if(!/const isNodeJS = [^\n]+;/.test(src))throw Error('PDF.js source changed; review adapter');
 src=src.replace(/const isNodeJS = [^\n]+;/,'const isNodeJS = false;');
 src="import {AbortController,AbortSignal,ReadableStream,TextDecoder,TextEncoder,structuredClone,fetch} from './runtime.cjs';\n"+src;
 if(!src.includes('class MessageHandler')||!src.includes('class WorkerMessageHandler'))throw Error('PDF.js core protocol changed; review text API');
 src+='\nexport {MessageHandler};\n';
 fs.writeFileSync(path.join(temp,file),src);
}
fs.writeFileSync(path.join(temp,'entry.mjs'),"export {getDocument} from './text-api.mjs';\n");
esbuild.buildSync({entryPoints:[path.join(temp,'entry.mjs')],bundle:true,platform:'browser',format:'cjs',target:'es2017',minify:true,outfile:path.join(vendor,'pdf-engine.js'),external:['node:*','fs','http','https','url','canvas'],legalComments:'eof',logLevel:'error'});
const maps={};for(const name of ['Adobe-GB1-UCS2','UniGB-UCS2-H'])maps[name+'.bcmap']=fs.readFileSync(path.join(root,'node_modules/pdfjs-dist/cmaps',name+'.bcmap')).toString('base64');
fs.writeFileSync(path.join(vendor,'pdf-cmaps.js'),'module.exports='+JSON.stringify(maps)+';\n');
console.log('Built local text-only PDF adapter:',fs.statSync(path.join(vendor,'pdf-engine.js')).size,'bytes');
