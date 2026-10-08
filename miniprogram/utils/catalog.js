const builtin=require('../data/courses');
function normalize(table){
 if(!table||!Array.isArray(table.courses)||!table.courses.length||table.courses.length>200)throw Error('课程数量应为1—200条');
 const courses=table.courses.map((c,i)=>{
  const name=String(c.name||'').trim();if(!name||name.length>100)throw Error('第'+(i+1)+'条课程名称无效');
  const n={};for(const key of ['weekday','start','end','first','last']){n[key]=Number(c[key]);if(!Number.isInteger(n[key]))throw Error('请核对 '+name+' 的星期、节次和教学周');}
  if(n.weekday<1||n.weekday>7||n.start<1||n.end>11||n.end<n.start||n.first<1||n.last>30||n.last<n.first)throw Error('请核对 '+name+' 的星期、节次和教学周范围');
  if(!['all','odd','even'].includes(c.parity))throw Error('请核对 '+name+' 的单双周');
  const id=c.id===undefined?'import'+i:String(c.id);if(!/^[a-zA-Z0-9_-]{1,64}$/.test(id))throw Error('课程编号无效');
  const out=Object.assign({id,name,parity:c.parity},n);for(const key of ['room','teacher','campus']){out[key]=String(c[key]||'').trim();if(out[key].length>100)throw Error('课程备注过长');}return out;
 });
 if(new Set(courses.map(c=>c.id)).size!==courses.length)throw Error('课程编号重复');
 const pending=(table.pending||[]).map(p=>({name:String(p.name||'').slice(0,100),detail:String(p.detail||'').slice(0,300)}));
 if(pending.length>100)throw Error('待安排课程过多');
 return {courses,pending};
}
function get(){if(typeof wx!=='undefined'&&wx.getStorageSync){const record=wx.getStorageSync('scheduleData');if(record&&record.timetable)return normalize(record.timetable);}return builtin;}
module.exports={normalize,get};
