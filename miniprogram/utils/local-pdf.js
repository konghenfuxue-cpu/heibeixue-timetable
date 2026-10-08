const parser=require('./timetable-parser');
const MAX_BYTES=7*1024*1024,MAX_PAGES=10;
function read(file){return new Promise((resolve,reject)=>wx.getFileSystemManager().readFile({filePath:file.path,success:r=>resolve(r.data),fail:()=>reject(Error('无法读取PDF，请重新从微信聊天选择文件'))}));}
async function recognize(file){
 if(!file||file.size>MAX_BYTES)throw Error('文件超过7MB，请压缩或拆分');
 const bytes=new Uint8Array(await read(file));
 if(bytes.length>MAX_BYTES)throw Error('文件超过7MB，请压缩或拆分');
 if(bytes.length<5||String.fromCharCode(...bytes.subarray(0,5))!=='%PDF-')throw Error('文件不是有效PDF');
 // Lazy load only when the user imports a PDF. Nothing is uploaded.
 const engine=require('../vendor/pdf-engine');
 const missing=new Set();
 class LocalResources{async fetch({kind,filename}){
  const maps=require('../vendor/pdf-cmaps');
  if(kind!=='cMapUrl'||!maps[filename]){if(kind==='cMapUrl')missing.add(filename);throw Error('当前本地解析暂不支持此PDF字体资源');}
  return new Uint8Array(wx.base64ToArrayBuffer(maps[filename]));
 }}
 const task=engine.getDocument({data:bytes,BinaryDataFactory:LocalResources,useWorkerFetch:false,isEvalSupported:false,useSystemFonts:false,disableFontFace:true,isOffscreenCanvasSupported:false,useWasm:false,disableAutoFetch:true,verbosity:0});
 try{
  const doc=await task.promise;if(doc.numPages>MAX_PAGES)throw Error('PDF最多支持10页，请先拆分');
  const Pages=[];
  for(let i=1;i<=doc.numPages;i++){
   const page=await doc.getPage(i),text=await page.getTextContent(),v=page.getViewport({scale:1}).transform;
   if(missing.size)throw Error('此PDF需要尚未支持的字体资源，请手动录入或选择可选云识别');
   if(text.items.length>20000)throw Error('PDF内容过多，请先拆分');
   const Texts=text.items.filter(t=>t.str.trim()&&t.transform).map(t=>{const x=t.transform[4],y=t.transform[5];return {x:(v[0]*x+v[2]*y+v[4])/16,y:(v[1]*x+v[3]*y+v[5])/16,R:[{T:encodeURIComponent(t.str)}]};});
   Pages.push({Texts});page.cleanup();
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  return Object.assign({ok:true,method:'local-pdf',pageCount:1},parser.fromPdf({Pages}));
 }catch(e){if(e.name==='PasswordException')throw Error('加密PDF暂不支持，请选择未加密课表');throw Error(/PDF|字体|拆分|手动/.test(e.message||'')?e.message:'无法在本机解析此PDF，请手动录入或选择可选云识别');}
 finally{await task.destroy();}
}
module.exports={recognize};


