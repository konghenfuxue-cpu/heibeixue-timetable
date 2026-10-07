const {daySchedule,today,shift,stamp,weekDates,nextCourse}=require('../../utils/schedule');
const {pending}=require('../../data/courses');
const storage=require('../../utils/storage');
Page({
 data:{pending,detailCourses:[],showPending:false},
 onShow(){let date=this.data.date||today();try{const requested=wx.getStorageSync('scheduleViewDate');if(requested){stamp(requested);date=requested;wx.removeStorageSync('scheduleViewDate');}}catch(e){wx.showToast({title:'日期无效，已返回课表',icon:'none'});}this.load(date);clearInterval(this.timer);this.timer=setInterval(()=>this.refresh(),30000);},
 onHide(){clearInterval(this.timer);},onUnload(){clearInterval(this.timer);},
 refresh(){this.load(this.data.isToday?today():this.data.date);},
 load(date){try{
  const {overrides,changes}=storage.read();const s=daySchedule(date,overrides,changes);
  const now=new Date(Date.now()+8*3600000).toISOString().slice(11,16),isToday=date===today();
  s.courses.forEach(c=>{const [a,b]=c.time.split('—');c.status=isToday?(now<a?'待上课':now<b?'上课中':'已结束'):'';});
  const focus=nextCourse(date,isToday?now:'00:00',overrides,changes);
  const title=focus.state==='current'?'正在上课':focus.state==='next'?(isToday?'下一节课':'当日首节课'):focus.state==='done'?'今天的课程已结束':'今天没有课程';
  const tomorrow=daySchedule(shift(date,1),overrides,changes);
  this.setData(Object.assign(s,{isToday,focus,focusTitle:!isToday&&focus.state==='empty'?'当日没有课程':title,focusCourse:focus.courses[0]||null,dayName:'星期'+'日一二三四五六'[new Date(stamp(date)).getUTCDay()],dates:weekDates(date).map(d=>Object.assign(d,{selected:d.date===date})),tomorrowDate:tomorrow.date,tomorrowCount:tomorrow.courses.length,tomorrowName:tomorrow.courses.length?tomorrow.courses[0].name:'无课程',tomorrowNotice:tomorrow.notice}));
 }catch(e){wx.showToast({title:e.message,icon:'none'});}},
 selectDate(e){this.load(e.currentTarget.dataset.date);},prev(){this.load(shift(this.data.date,-1));},next(){this.load(shift(this.data.date,1));},reset(){this.load(today());},pick(e){this.load(e.detail.value);},
 showDetail(e){const c=this.data.courses.find(c=>c.uid===e.currentTarget.dataset.uid);if(c)this.setData({detailCourses:[c]});},
 focusDetail(){this.setData({detailCourses:this.data.focus.courses});},closeDetail(){this.setData({detailCourses:[]});},stop(){},
 editCourse(e){const c=this.data.detailCourses.find(c=>c.uid===e.currentTarget.dataset.uid);if(c){try{storage.edit(c);this.closeDetail();}catch(err){wx.showToast({title:'无法打开调整设置',icon:'none'});}}},
 pendingToggle(){this.setData({showPending:!this.data.showPending});},tomorrow(){this.load(this.data.tomorrowDate);}
});
