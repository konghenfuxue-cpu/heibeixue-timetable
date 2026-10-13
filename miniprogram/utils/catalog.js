const builtin=require('../data/courses');
const updates=require('../data/course-updates');
function normalize(table){
 if(!table||!Array.isArray(table.courses)||!table.courses.length||table.courses.length>200)throw Error('课程数量应为1—200条');
 const courses=table.courses.map((c,i)=>{
  const name=String(c.name||'').trim();if(!name||name.length>100)throw Error('第'+(i+1)+'条课程名称无效');
  const n={};for(const key of ['weekday','start','end','first','last']){n[key]=Number(c[key]);if(!Number.isInteger(n[key]))throw Error('请核对 '+name+' 的星期、节次和教学周');}
  if(n.weekday<1||n.weekday>7||n.start<1||n.end>11||n.end<n.start||n.first<1||n.last>30||n.last<n.first)throw Error('请核对 '+name+' 的星期、节次和教学周范围');
  if(!['all','odd','even'].includes(c.parity))throw Error('请核对 '+name+' 的单双周');
  const id=c.id===undefined?'import'+i:String(c.id);if(!/^[a-zA-Z0-9_-]{1,64}$/.test(id))throw Error('课程编号无效');
  const out=Object.assign({id,name,parity:c.parity},n);for(const key of ['room','teacher','campus']){out[key]=String(c[key]||'').trim();if(out[key].length>100)throw Error('课程备注过长');}if(c.date!==undefined){const date=c.date;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)throw Error('指定课程日期无效');out.date=date;}
  if(c.timeStart!==undefined||c.timeEnd!==undefined){if(typeof c.timeStart!=='string'||typeof c.timeEnd!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.timeStart)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(c.timeEnd)||c.timeEnd<=c.timeStart)throw Error('准确上课时间无效');out.timeStart=c.timeStart;out.timeEnd=c.timeEnd;}
  for(const key of ['periodLabel','detail'])if(c[key]!==undefined){if(typeof c[key]!=='string'||c[key].length>300)throw Error('课程说明无效');out[key]=c[key];}return out;
 });
 if(new Set(courses.map(c=>c.id)).size!==courses.length)throw Error('课程编号重复');
 const pending=(table.pending||[]).map(p=>({name:String(p.name||'').slice(0,100),detail:String(p.detail||'').slice(0,300)}));
 if(pending.length>100)throw Error('待安排课程过多');
 return {courses,pending};
}
function applyUpdates(table){
 if(!updates.courses.length)return table;
 const ids=new Set(updates.courses.map(c=>c.id));
 const courses=table.courses.filter(c=>!ids.has(c.id)&&!updates.replace.some(rule=>Object.keys(rule).every(key=>c[key]===rule[key])));
 return normalize({courses:courses.concat(updates.courses),pending:table.pending||[]});
}
function get(){if(typeof wx!=='undefined'&&wx.getStorageSync){const record=wx.getStorageSync('scheduleData');if(record&&record.timetable)return applyUpdates(normalize(record.timetable));}return applyUpdates(builtin);}
module.exports={normalize,get};
