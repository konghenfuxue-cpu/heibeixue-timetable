const {stamp}=require('./schedule');
const catalog=require('./catalog');
const builtin=require('../data/courses');
const FORMAT='heibeixue.timetable',VERSION=2,TERM='2026-2027-1',MAX_LENGTH=300000;
function object(value){return value&&typeof value==='object'&&!Array.isArray(value);}
function inTerm(date){stamp(date);if(date<'2026-09-14'||date>'2027-01-08')throw Error('课程日期不在本学期内');}
function normalize(data){
 if(!object(data)||!object(data.overrides)||!object(data.changes))throw Error('备份数据结构不正确');
 const timetable=data.timetable?catalog.normalize(data.timetable):null;
 const {courses}=timetable||builtin;
 const overrides={},changes={};
 if(Object.keys(data.overrides).length>3000||Object.keys(data.changes).length>3000)throw Error('备份记录过多');
 Object.keys(data.overrides).forEach(date=>{stamp(date);const r=data.overrides[date];if(!object(r))throw Error('整天调整格式错误');if(r.type==='off'){if(r.note!==undefined&&(typeof r.note!=='string'||r.note.length>60))throw Error('停课备注格式错误');overrides[date]={type:'off',note:r.note||'临时停课'};}else if(r.type==='makeup'){inTerm(r.source);overrides[date]={type:'makeup',source:r.source};}else throw Error('整天调整类型错误');});
 Object.keys(data.changes).forEach(key=>{const r=data.changes[key];if(!object(r))throw Error('单门调整格式错误');inTerm(r.source);if(!courses.some(c=>c.id===r.courseId)||key!==r.source+'|'+r.courseId)throw Error('单门调整的课程编号或日期不正确');const rule={source:r.source,courseId:r.courseId,type:r.type};if(r.type==='move'){inTerm(r.target);if(!Number.isInteger(r.start)||!Number.isInteger(r.end)||r.start<1||r.end>11||r.end<r.start)throw Error('单门调整节次不正确');if(r.room!==undefined&&(typeof r.room!=='string'||r.room.length>60))throw Error('教室名称格式错误');Object.assign(rule,{target:r.target,start:r.start,end:r.end,room:r.room||''});}else if(r.type!=='cancel')throw Error('单门调整类型错误');changes[key]=rule;});
 return Object.assign({overrides,changes},timetable?{timetable}:{});
}
function encode(data){const clean=normalize(data);return JSON.stringify(Object.assign({format:FORMAT,version:VERSION,term:TERM,createdAt:new Date().toISOString()},clean),null,2);}
function decode(text){if(typeof text!=='string'||text.length>MAX_LENGTH)throw Error('备份内容为空或超过大小限制');let data;try{data=JSON.parse(text.replace(/^\uFEFF/,''));}catch(e){throw Error('无法读取JSON备份，请检查文件或文本');}if(!object(data)||data.format!==FORMAT)throw Error('不是黑背雪课表备份');if(data.version!==1&&data.version!==VERSION)throw Error('备份版本不受支持，请使用对应版本的小程序');if(data.term!==TERM)throw Error('备份学期与当前课表不一致');if(data.version===1&&data.timetable)throw Error('旧备份格式不能包含自定义课表');return normalize(data);}
module.exports={encode,decode,normalize,VERSION,TERM,FORMAT,MAX_LENGTH};
