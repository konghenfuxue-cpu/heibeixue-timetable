const {courses}=require('../data/courses');
const DAY=86400000;
const START='2026-09-14';
const END='2027-01-08';
function stamp(s){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('日期格式错误');
 const [y,m,d]=s.split('-').map(Number), n=Date.UTC(y,m-1,d);
 if(new Date(n).toISOString().slice(0,10)!==s)throw Error('日期不存在');
 return n;
}
function shift(date,n){return new Date(stamp(date)+n*DAY).toISOString().slice(0,10);}
function today(){return new Date(Date.now()+8*3600000).toISOString().slice(0,10);}
function slots(date){
 stamp(date); const month=Number(date.slice(5,7)); const summer=month>=5&&month<=9;
 const fixed=[['08:00','08:45'],['08:50','09:35'],['09:55','10:40'],['10:45','11:30']];
 return fixed.concat(summer?[['14:00','14:45'],['14:50','15:35'],['15:55','16:40'],['16:45','17:30'],['19:00','19:45'],['19:50','20:35'],['20:40','21:25']]:[['13:30','14:15'],['14:20','15:05'],['15:25','16:10'],['16:15','17:00'],['18:30','19:15'],['19:20','20:05'],['20:10','20:55']]);
}
function daySchedule(date,overrides={},changes={}){
 stamp(date); let source=date, notice='',off=false;
 if(date==='2026-09-20'){source='2026-09-21';notice='补第2周星期一课程';}
 if(date==='2026-10-10'){source='2026-10-05';notice='补第4周星期一课程';}
 if(date>='2026-09-25'&&date<='2026-09-27'){off=true;notice='中秋放假';}
 if(date>='2026-10-01'&&date<='2026-10-07'){off=true;notice='国庆放假';}
 if(date==='2027-01-01'){off=true;notice='元旦';}
 if(date==='2026-10-23'||date==='2026-10-24')notice='秋季运动会，请确认停课安排';
 const o=overrides[date];
 if(o){if(o.type==='off'){off=true;notice=o.note||'临时停课';}else if(o.type==='makeup'){stamp(o.source);source=o.source;off=false;notice='手动调课：按 '+source+' 的课程';}else throw Error('调课类型错误');}
 const week=Math.floor((stamp(source)-stamp(START))/DAY/7)+1;
 const weekday=new Date(stamp(source)).getUTCDay()||7;
 const inTerm=date>=START&&date<=END;
 if(!inTerm){off=true;notice=date<START?'学期尚未开始':date>='2027-01-11'&&date<='2027-01-20'?'期末考试（请查看考试通知）':'本学期课程已结束';}
 const time=slots(date);
 let list=off?[]:courses.filter(c=>c.weekday===weekday&&week>=c.first&&week<=c.last&&(c.parity==='all'||(week%2===1?'odd':'even')===c.parity)).map(c=>Object.assign({},c,{weeks:c.first+'—'+c.last+'周'+(c.parity==='odd'?' · 单周':c.parity==='even'?' · 双周':''),origin:date}));
 list=list.filter(c=>!changes[date+'|'+c.id]);
 if(inTerm&&!(o&&o.type==='off'))Object.keys(changes).forEach(key=>{
  const change=changes[key];
  if(change.type!=='move'||change.target!==date)return;
  // 单门调整按原始课程日查找，不递归应用其他单门调整。
  const original=daySchedule(change.source,overrides).courses.find(c=>c.id===change.courseId);
  if(!original)return;
  if(!Number.isInteger(change.start)||!Number.isInteger(change.end)||change.start<1||change.end>11||change.end<change.start)return;
  list.push(Object.assign({},original,{start:change.start,end:change.end,room:change.room||original.room,origin:change.source,adjusted:true}));
 });
 list=list.map(c=>Object.assign({},c,{uid:c.origin+'|'+c.id,color:colorFor(c.name),time:time[c.start-1][0]+'—'+time[c.end-1][1],period:'第'+c.start+'—'+c.end+'节'}));
 list.forEach(c=>{c.conflict=list.some(other=>other.uid!==c.uid&&other.start<=c.end&&other.end>=c.start);});
 if(off&&list.length)notice+=' · 有手动安排的课程';
 list.sort((a,b)=>a.start-b.start);
 return {date,week,weekday,notice,courses:list,inTerm,season:Number(date.slice(5,7))>=5&&Number(date.slice(5,7))<=9?'夏季作息':'冬季作息'};
}
function colorFor(name){const palette=['#263e50','#6e6287','#806249','#526d60','#87596b','#516f96','#7c6746'];let hash=0;for(let i=0;i<name.length;i++)hash=(hash+name.charCodeAt(i)*(i+1))%palette.length;return palette[hash];}
function weekDates(date){const offset=(new Date(stamp(date)).getUTCDay()+6)%7;return Array.from({length:7},(_,i)=>{const d=shift(date,i-offset);return {date:d,day:d.slice(8),label:'一二三四五六日'[i],isToday:d===today()};});}
function validateChange(change,overrides={}){
 stamp(change.source);
 if(!daySchedule(change.source,overrides).courses.some(c=>c.id===change.courseId))throw Error('原日期没有这门课程，请重新选择');
 if(change.type==='cancel')return;
 if(change.type!=='move')throw Error('课程调整类型错误');
 stamp(change.target);
 if(change.target<START||change.target>END)throw Error('目标日期应在本学期上课日期内');
 if(!Number.isInteger(change.start)||!Number.isInteger(change.end)||change.start<1||change.end>11||change.end<change.start)throw Error('节次范围应为1—11，结束不能早于开始');
 if(change.room&&change.room.length>60)throw Error('教室名称过长');
}
function nextCourse(date,clock,overrides={},changes={}){
 const s=daySchedule(date,overrides,changes);
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(clock))throw Error('时间格式错误');
 const minutes=t=>Number(t.slice(0,2))*60+Number(t.slice(3));const now=minutes(clock);
 const current=s.courses.filter(c=>{const [a,b]=c.time.split('—');return now>=minutes(a)&&now<minutes(b);});
 if(current.length)return {state:'current',courses:current,minutes:Math.min(...current.map(c=>minutes(c.time.split('—')[1])-now))};
 const upcoming=s.courses.filter(c=>minutes(c.time.split('—')[0])>now);
 if(upcoming.length){const time=upcoming[0].time.split('—')[0];return {state:'next',courses:upcoming.filter(c=>c.time.split('—')[0]===time),minutes:minutes(time)-now};}
 return {state:s.courses.length?'done':'empty',courses:[],minutes:0};
}
function gridGroups(list){const groups=[];list.slice().sort((a,b)=>a.start-b.start).forEach(c=>{const last=groups[groups.length-1];if(last&&c.start<=last.end){last.courses.push(c);last.end=Math.max(last.end,c.end);}else groups.push({start:c.start,end:c.end,courses:[c]});});return groups.map((g,i)=>Object.assign(g,{id:'g'+i,count:g.courses.length,name:g.courses.length>1?g.courses.length+'门课程重叠':g.courses[0].name,room:g.courses.length>1?'点开核实安排':g.courses[0].room,color:g.courses.length>1?'#9b514e':g.courses[0].color,top:(g.start-1)*100,height:(g.end-g.start+1)*100-6}));}
module.exports={daySchedule,slots,shift,today,stamp,colorFor,weekDates,validateChange,nextCourse,gridGroups};
