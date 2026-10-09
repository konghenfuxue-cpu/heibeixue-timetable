// Minimal text-only facade over the pinned PDF.js core message protocol.
// No display, canvas, editor, DOM, worker script loading or network transport.
import {WorkerMessageHandler,MessageHandler} from './pdf.worker.mjs';
import {structuredClone} from './runtime.cjs';
let nextId=0;
class LocalPort{
 constructor(){this.listeners=new Set();this.closed=false;}
 postMessage(data){if(this.closed)return;const copy=structuredClone(data);Promise.resolve().then(()=>{if(!this.closed)for(const fn of Array.from(this.listeners))fn({data:copy});});}
 addEventListener(type,fn,options){if(type!=='message')throw Error('Unexpected local PDF event');this.listeners.add(fn);if(options&&options.signal)options.signal.addEventListener('abort',()=>this.listeners.delete(fn),{once:true});}
 removeEventListener(type,fn){this.listeners.delete(fn);}
 close(){this.closed=true;this.listeners.clear();}
}
function viewport(info,scale){
 const [x0,y0,x1,y1]=info.view,s=scale*(info.userUnit||1),rotation=((info.rotate%360)+360)%360;
 if(rotation===0)return {transform:[s,0,0,-s,-x0*s,y1*s]};
 if(rotation===90)return {transform:[0,s,s,0,-y0*s,-x0*s]};
 if(rotation===180)return {transform:[-s,0,0,s,x1*s,-y0*s]};
 if(rotation===270)return {transform:[0,-s,-s,0,y1*s,x1*s]};
 throw Error('Unsupported PDF page rotation');
}
export function getDocument(options){
 const port=new LocalPort(),rootMain=new MessageHandler('main','worker',port),rootWorker=new MessageHandler('worker','main',port);
 WorkerMessageHandler.setup(rootWorker,port);rootMain.send('configure',{verbosity:0});
 const docId='local'+nextId++,ready=Promise.withResolvers();let handler,destroyed=false;
 const start=rootMain.sendWithPromise('GetDocRequest',{docId,apiVersion:'6.4.299',data:options.data,password:null,disableAutoFetch:true,rangeChunkSize:65536,docBaseUrl:null,enableXfa:false,evaluatorOptions:{maxImageSize:-1,disableFontFace:true,ignoreErrors:false,isEvalSupported:false,isOffscreenCanvasSupported:false,isImageDecoderSupported:false,useSystemFonts:false,useWasm:false,useWorkerFetch:false,cMapPacked:true,hasGPU:false}}).then(workerId=>{
  handler=new MessageHandler(docId,workerId,port);
  const resources=new options.BinaryDataFactory();
  handler.on('FetchBinaryData',data=>resources.fetch(data));
  handler.on('GetDoc',data=>ready.resolve(data.pdfInfo));
  handler.on('DocException',data=>{const e=Error(data.message||'PDF解析失败');e.name=data.name||'Error';ready.reject(e);});
  handler.on('PasswordRequest',data=>{const e=Error('加密PDF暂不支持');e.name='PasswordException';throw e;});
  for(const event of ['DataLoaded','DocProgress','commonobj','obj','UnsupportedFeature'])handler.on(event,()=>{});
  handler.send('Ready',null);
 });
 const promise=start.then(()=>ready.promise).then(info=>({
  numPages:info.numPages,
  async getPage(number){
   if(destroyed)throw Error('PDF已关闭');
   const pageIndex=number-1,pageInfo=await handler.sendWithPromise('GetPage',{pageIndex});
   return {getViewport:({scale})=>viewport(pageInfo,scale),cleanup(){},async getTextContent(){
    const reader=handler.sendWithStream('GetTextContent',{pageId:pageIndex,pageIndex,includeMarkedContent:false,disableNormalization:false},{highWaterMark:100,size:data=>data.items.length}).getReader();const items=[];
    try{while(true){const result=await reader.read();if(result.done)break;items.push(...result.value.items);if(items.length>20000)throw Error('PDF内容过多，请先拆分');}}
    finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
    return {items};
   }};
  }
 }));
 return {promise,async destroy(){if(destroyed)return;destroyed=true;try{await start;if(handler)await handler.sendWithPromise('Terminate',null);}finally{if(handler)handler.destroy();rootMain.destroy();rootWorker.destroy();port.close();}}};
}
