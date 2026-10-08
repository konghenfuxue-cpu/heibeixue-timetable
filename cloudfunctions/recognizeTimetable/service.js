const parser=require('./parser');
const MAX_BYTES=7*1024*1024;
function createHandler(cloud,extractPdf,ocr,allowed){return async function(event){
 const {OPENID}=cloud.getWXContext();if(!OPENID)return {ok:false,error:'请从手机小程序调用识别服务'};
 if(event.action==='identity')return {ok:true,uploadPrefix:'timetable-import/'+OPENID+'/',openid:OPENID};
 if(!allowed.includes(OPENID))return {ok:false,error:'识别服务尚未授权当前微信，请按部署说明配置使用者'};
 const id=String(event.fileID||'');
 if(!id.startsWith('cloud://')||!id.includes('/timetable-import/'+OPENID+'/'))return {ok:false,error:'只允许识别本人本次上传的课表'};
 try{
  const {fileContent}=await cloud.downloadFile({fileID:id});
  if(!Buffer.isBuffer(fileContent)||fileContent.length>MAX_BYTES)throw Error('文件超过7MB限制');
  const isPdf=fileContent.subarray(0,5).toString()==='%PDF-';
  const isImage=(fileContent[0]===255&&fileContent[1]===216)||(fileContent[0]===137&&fileContent.subarray(1,4).toString()==='PNG');
  if(!isPdf&&!isImage)throw Error('请上传PDF、JPG或PNG文件');
  if(isPdf&&event.mode!=='ocr'){
   const pdf=await extractPdf(fileContent);if((pdf.Pages||[]).length>10)throw Error('PDF最多支持10页，请先拆分文件');
   return Object.assign({ok:true,method:'pdf-text'},parser.fromPdf(pdf));
  }
  if(event.mode!=='ocr')throw Error('图片需选择OCR识别');
  const page=Number(event.page||1);if(!Number.isInteger(page)||page<1||page>20)throw Error('PDF页码应为1—20');
  const data=await ocr({ImageBase64:fileContent.toString('base64'),PdfPageNumber:isPdf?page:undefined,UseNewModel:false});
  return Object.assign({ok:true,method:'table-ocr',pageCount:data.PdfPageSize||1},parser.fromTables(data.TableDetections||[]));
 }catch(e){return {ok:false,error:e.userMessage||(/文件|PDF|页码|上传|图片/.test(e.message||'')?e.message:'识别服务暂不可用，请检查云函数配置、OCR权限与额度')};}
 finally{try{await cloud.deleteFile({fileList:[id]});}catch(e){console.warn('Temporary import file cleanup failed; check storage lifecycle policy.');}}
};}
module.exports={createHandler,MAX_BYTES};
