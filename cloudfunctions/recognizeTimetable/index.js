const cloud=require('wx-server-sdk');
const {createHandler}=require('./service');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
async function extractPdf(buffer){
 const {default:PDFParser}=await import('pdf2json');
 return new Promise((resolve,reject)=>{const parser=new PDFParser();parser.on('pdfParser_dataReady',resolve);parser.on('pdfParser_dataError',()=>reject(Error('PDF文字提取失败，请尝试OCR识别')));parser.parseBuffer(buffer);});
}
async function ocr(params){
 if(!process.env.OCR_SECRET_ID||!process.env.OCR_SECRET_KEY)throw Error('OCR未配置');
 const {ocr:{v20181119:{Client}}}=require('tencentcloud-sdk-nodejs-ocr');
 const client=new Client({credential:{secretId:process.env.OCR_SECRET_ID,secretKey:process.env.OCR_SECRET_KEY},region:'ap-shanghai',profile:{httpProfile:{endpoint:'ocr.tencentcloudapi.com'}}});
 if(params.PdfPageNumber===undefined)delete params.PdfPageNumber;
 return client.RecognizeTableAccurateOCR(params);
}
exports.main=createHandler(cloud,extractPdf,ocr,(process.env.ALLOWED_OPENIDS||'').split(',').map(s=>s.trim()).filter(Boolean));
