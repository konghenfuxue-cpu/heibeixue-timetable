// Offline tool: no upload or OCR. Review candidates on the phone before saving.
const fs=require('node:fs');
const path=require('node:path');
const parser=require('../../cloudfunctions/recognizeTimetable/parser');
const catalog=require('../../miniprogram/utils/catalog');
const {FORMAT,TERM}=require('../../miniprogram/utils/offline-import');
async function convert(input,output){
 const stat=fs.statSync(input);if(!stat.isFile()||stat.size>7*1024*1024)throw Error('请选择不超过7MB的PDF');
 const buffer=fs.readFileSync(input);if(buffer.subarray(0,5).toString()!=='%PDF-')throw Error('文件不是PDF');
 const PDFParser=require('pdf2json');
 const pdf=await new Promise((resolve,reject)=>{const p=new PDFParser();p.on('pdfParser_dataError',e=>reject(Error('PDF解析失败：'+String(e.parserError||e))));p.on('pdfParser_dataReady',resolve);p.parseBuffer(buffer);});
 if(!pdf.Pages||pdf.Pages.length>10)throw Error('PDF最多支持10页');
 const result=parser.fromPdf(pdf);if(!result.courses.length)throw Error('未找到支持的文字课表；扫描件可选择云OCR，或手动录入');
 const table=catalog.normalize(result);
 const data=JSON.stringify({format:FORMAT,version:1,term:TERM,courses:table.courses},null,2);
 if(data.length>300000)throw Error('识别结果超过导入限制');
 // Never overwrite an existing document or previously generated file.
 fs.writeFileSync(output,data,{encoding:'utf8',flag:'wx'});
 return {count:table.courses.length,warnings:result.warnings};
}
if(require.main===module){const [input,requested]=process.argv.slice(2);if(!input){console.error('用法：node tools/pdf-to-json/index.cjs "课表.pdf" ["新的输出.json"]');process.exitCode=1;}else{const output=requested||path.join(path.dirname(input),path.basename(input,path.extname(input))+'.recognition.json');convert(input,output).then(r=>{console.log('已离线提取 '+r.count+' 条排课。将JSON发送至微信，在自动识别页面导入并核对后保存。');for(const w of r.warnings)console.log(w);}).catch(e=>{console.error(e.message);process.exitCode=1;});}}
module.exports={convert};
