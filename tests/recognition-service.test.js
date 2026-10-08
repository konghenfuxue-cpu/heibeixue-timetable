const assert=require('node:assert/strict');
const {createHandler}=require('../cloudfunctions/recognizeTimetable/service');
(async()=>{
 let downloaded=0,deleted=0,ocrCalls=0,pdfCalls=0,buffer=Buffer.from('%PDF-1.7 fake');
 const cloud={getWXContext:()=>({OPENID:'test-user'}),downloadFile:async()=>{downloaded++;return {fileContent:buffer};},deleteFile:async()=>{deleted++;}};
 const handler=createHandler(cloud,async()=>{pdfCalls++;return {Pages:[]};},async()=>{ocrCalls++;return {TableDetections:[],PdfPageSize:3};},['test-user']);
 const own='cloud://test-env/timetable-import/test-user/f.pdf';
 assert.equal((await handler({action:'identity'})).uploadPrefix,'timetable-import/test-user/');
 assert(!(await handler({fileID:'cloud://test-env/timetable-import/another/f.pdf',mode:'ocr'})).ok);assert.equal(downloaded,0);assert.equal(deleted,0);
 const deny=createHandler(cloud,()=>{},()=>{},[]);assert(!(await deny({fileID:own})).ok);assert.equal(downloaded,0);
 const direct=await handler({fileID:own,mode:'text'});assert(direct.ok);assert.equal(pdfCalls,1);assert.equal(ocrCalls,0);assert.equal(deleted,1);
 const ocr=await handler({fileID:own,mode:'ocr',page:2});assert.equal(ocr.pageCount,3);assert.equal(ocrCalls,1);
 assert(!(await handler({fileID:own,mode:'ocr',page:99})).ok);assert.equal(ocrCalls,1);
 buffer=Buffer.alloc(8*1024*1024);assert(!(await handler({fileID:own,mode:'text'})).ok);
 assert.equal(deleted,4);
 console.log('云识别授权、文件归属、大小与页码限制、文字路径不调用OCR、临时文件清理通过');
})().catch(e=>{console.error(e);process.exitCode=1;});
