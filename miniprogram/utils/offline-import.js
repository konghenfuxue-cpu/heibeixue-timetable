const catalog=require('./catalog');
const FORMAT='heibeixue.recognition',TERM='2026-2027-1';
function decode(text){
 if(typeof text!=='string'||text.length>300000)throw Error('识别文件超过大小限制');
 let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''));}catch(e){throw Error('无法读取离线识别JSON');}
 if(!data||data.format!==FORMAT||data.version!==1||data.term!==TERM)throw Error('请选择本学期的离线识别文件，不是课表备份');
 return catalog.normalize({courses:data.courses,pending:[]});
}
module.exports={decode,FORMAT,TERM};
