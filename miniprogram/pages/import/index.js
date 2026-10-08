const recognition=require('../../utils/recognition');
const localPdf=require('../../utils/local-pdf');
const offline=require('../../utils/offline-import');
const catalog=require('../../utils/catalog');
const storage=require('../../utils/storage');
Page({
 data:{busy:false,courses:[],warnings:[],fileName:'',method:'',page:1,pageCount:1,days:['未确定','周一','周二','周三','周四','周五','周六','周日'],parities:['每周','单周','双周'],needOcr:false,confirmed:false},
 selectPdf(){if(this.data.busy)return;wx.chooseMessageFile({count:1,type:'file',extension:['pdf'],success:r=>{const file=r.tempFiles&&r.tempFiles[0];if(!file)return;if(!/\.pdf$/i.test(file.name||'')){wx.showToast({title:'请选择文字版PDF课表',icon:'none'});return;}this.file=file;this.setData({fileName:file.name,courses:[],warnings:[],confirmed:false,needOcr:false,page:1,pageCount:1});this.extractLocal();},fail:e=>{if(!/cancel/i.test(e.errMsg||''))wx.showToast({title:'请选择微信聊天中的PDF',icon:'none'});}});},
 async extractLocal(){
  if(this.data.busy)return;this.setData({busy:true,method:'手机本地提取 · 不上传'});wx.showLoading({title:'本地提取PDF',mask:true});
  try{await new Promise(resolve=>setTimeout(resolve,30));const r=await localPdf.recognize(this.file);this.setData({courses:r.courses.map(c=>Object.assign({},c,{parityIndex:['all','odd','even'].indexOf(c.parity)})),warnings:r.warnings,pageCount:1,needOcr:!r.courses.length,confirmed:false});if(!r.courses.length)wx.showModal({title:'未找到支持的文字课表',content:'可能是扫描件或版式不支持。可手动录入，或自行部署后选择云识别；不会自动上传或启用OCR。',showCancel:false});}
  catch(e){this.setData({needOcr:true});wx.showModal({title:'本地提取未完成',content:e.message||'请重新选择文字版PDF或手动录入',showCancel:false});}
  finally{wx.hideLoading();this.setData({busy:false});}
 },
 selectOffline(){if(this.data.busy)return;wx.chooseMessageFile({count:1,type:'file',extension:['json'],success:r=>{const file=r.tempFiles&&r.tempFiles[0];if(!file)return;if(file.size>300000){wx.showToast({title:'JSON文件过大',icon:'none'});return;}wx.getFileSystemManager().readFile({filePath:file.path,encoding:'utf8',success:res=>{try{const table=offline.decode(res.data);this.file=null;this.setData({courses:table.courses.map(c=>Object.assign({},c,{parityIndex:['all','odd','even'].indexOf(c.parity)})),warnings:['请对照PDF核对课程名、教师、教室、节次与教学周。离线文件只包含候选课程，确认保存前不会替换课表。'],fileName:file.name,method:'电脑离线提取 · 无需云开发',page:1,pageCount:1,needOcr:false,confirmed:false});}catch(e){wx.showModal({title:'无法导入离线结果',content:e.message,showCancel:false});}},fail:()=>wx.showToast({title:'无法读取JSON文件',icon:'none'})});},fail:e=>{if(!/cancel/i.test(e.errMsg||''))wx.showToast({title:'请选择离线识别JSON',icon:'none'});}});},
 selectFile(){if(this.data.busy)return;wx.chooseMessageFile({count:1,type:'all',success:r=>{const file=r.tempFiles&&r.tempFiles[0];if(!file)return;if(!/\.(pdf|jpe?g|png)$/i.test(file.name||'')){wx.showToast({title:'请选择PDF、JPG或PNG',icon:'none'});return;}this.file=file;this.setData({fileName:file.name,page:1,pageCount:1,courses:[],warnings:[],confirmed:false,needOcr:false});this.run(/\.pdf$/i.test(file.name)?'text':'ocr',false);},fail:e=>{if(!/cancel/i.test(e.errMsg||''))wx.showToast({title:'请选择微信聊天中的课表文件',icon:'none'});}});},
 selectImage(){if(this.data.busy)return;wx.chooseMedia({count:1,mediaType:['image'],sourceType:['album','camera'],success:r=>{const f=r.tempFiles[0];this.file={path:f.tempFilePath,size:f.size,name:/\.png$/i.test(f.tempFilePath)?'课表图片.png':'课表图片.jpg'};this.setData({fileName:this.file.name,page:1,pageCount:1,courses:[],warnings:[],confirmed:false,needOcr:false});this.run('ocr',false);},fail:e=>{if(!/cancel/i.test(e.errMsg||''))wx.showToast({title:'无法选择图片',icon:'none'});}});},
 async execute(mode,append){
  if(this.data.busy)return;this.setData({busy:true});wx.showLoading({title:mode==='text'?'提取PDF文字':'识别课表',mask:true});
  try{const r=await recognition.recognize(this.file,mode,Number(this.data.page));const rows=(r.courses||[]).map(c=>Object.assign({},c,{parityIndex:['all','odd','even'].indexOf(c.parity)}));
   this.setData({courses:append?this.data.courses.concat(rows):rows,warnings:r.warnings||[],method:r.method==='pdf-text'?'PDF文字提取':'表格OCR',pageCount:r.pageCount||1,needOcr:mode==='text'&&!rows.length,confirmed:false});
   if(!rows.length)wx.showToast({title:'未找到课程，请换图或尝试OCR',icon:'none'});
  }catch(e){this.setData({needOcr:mode==='text'});wx.showModal({title:'识别未完成',content:e.message||'请检查识别服务部署',showCancel:false});}
  finally{wx.hideLoading();this.setData({busy:false});}
 },
 run(mode,append){if(!this.file){wx.showToast({title:'请先选择文件',icon:'none'});return;}if(mode==='ocr')wx.showModal({title:'使用OCR识别？',content:'将上传课表至你配置的云环境并调用腾讯云表格识别，可能按页计费。每次只识别当前页；处理后尝试删除临时文件。识别结果须核对后才能保存。',confirmText:'开始识别',success:r=>{if(r.confirm)this.execute(mode,append);}});else wx.showModal({title:'提取PDF课表文字？',content:'文件将上传至你配置的云环境提取文字，不调用付费OCR；云函数和存储可能计费。处理后尝试删除临时文件。',confirmText:'提取文字',success:r=>{if(r.confirm)this.execute(mode,append);}});},
 ocr(){this.run('ocr',false);},appendPage(){this.run('ocr',true);},pageInput(e){this.setData({page:e.detail.value});},
 edit(e){const {index,field}=e.currentTarget.dataset;const rows=this.data.courses.map(c=>Object.assign({},c));if(!rows[index])return;rows[index][field]=e.detail.value;this.setData({courses:rows,confirmed:false});},
 parity(e){const index=e.currentTarget.dataset.index,rows=this.data.courses.map(c=>Object.assign({},c));rows[index].parityIndex=Number(e.detail.value);rows[index].parity=['all','odd','even'][rows[index].parityIndex];this.setData({courses:rows,confirmed:false});},
 remove(e){this.setData({courses:this.data.courses.filter((_,i)=>i!==Number(e.currentTarget.dataset.index)),confirmed:false});},
 add(){this.setData({courses:this.data.courses.concat({name:'',weekday:0,start:1,end:2,first:1,last:17,parity:'all',parityIndex:0,room:'',teacher:'',campus:''}),confirmed:false});},
 confirm(e){this.setData({confirmed:e.detail.value.length>0});},
 save(){if(this.data.busy)return;if(!this.data.confirmed){wx.showToast({title:'请先逐条核对并勾选确认',icon:'none'});return;}try{const table=catalog.normalize({courses:this.data.courses.map((c,i)=>Object.assign({},c,{id:'import'+i})),pending:[]});
  wx.showModal({title:'替换当前课表？',content:'导入 '+table.courses.length+' 条排课。当前课程和调课记录会先保留一份撤销快照，再替换课程并清空调课记录。学期与校历保持当前设置；未安排课程需补充。建议先导出当前备份。',confirmText:'保存课表',success:r=>{if(r.confirm)try{storage.importTimetable(table);this.setData({courses:[],confirmed:false});wx.showToast({title:'课表已导入'});wx.switchTab({url:'/pages/today/index'});}catch(e){wx.showModal({title:'保存失败',content:'原课表未替换，请重试。',showCancel:false});}}});
 }catch(e){wx.showModal({title:'请核对课程',content:e.message,showCancel:false});}},
 connect(){recognition.identity().then(r=>wx.showModal({title:'云函数连接成功',content:'在云函数环境变量 ALLOWED_OPENIDS 中授权当前使用者：\n'+r.openid,showCancel:false})).catch(e=>wx.showModal({title:'需配置识别服务',content:e.message,showCancel:false}));}
});
