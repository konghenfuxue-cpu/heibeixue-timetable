const config=require('../config/cloud');
function ready(){if(!config.env)throw Error('请先按部署说明配置云开发环境');if(!wx.cloud)throw Error('当前微信不支持云开发，请更新微信');wx.cloud.init({env:config.env,traceUser:false});}
async function identity(){ready();const r=(await wx.cloud.callFunction({name:'recognizeTimetable',data:{action:'identity'}})).result;if(!r||!r.ok)throw Error(r&&r.error||'无法连接识别服务');return r;}
async function recognize(file,mode,page){
 ready();if(file.size>7*1024*1024)throw Error('文件超过7MB，请压缩或拆分');
 const owner=await identity(),ext=/\.pdf$/i.test(file.name||file.path)?'pdf':/\.png$/i.test(file.name||file.path)?'png':'jpg';
 let id;try{const uploaded=await wx.cloud.uploadFile({cloudPath:owner.uploadPrefix+Date.now()+'-'+Math.random().toString(36).slice(2)+'.'+ext,filePath:file.path});id=uploaded.fileID;
 const reply=(await wx.cloud.callFunction({name:'recognizeTimetable',data:{fileID:id,mode,page}})).result;
 if(!reply||!reply.ok)throw Error(reply&&reply.error||'未收到识别结果');return reply;
 }finally{if(id)try{await wx.cloud.deleteFile({fileList:[id]});}catch(e){console.warn('课表临时文件清理失败，请检查云存储生命周期设置');}}
}
module.exports={recognize,identity};
