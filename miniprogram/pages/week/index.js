const {daySchedule,today,shift,weekDates,slots,gridGroups}=require('../../utils/schedule');
const storage=require('../../utils/storage');
Page({data:{detailCourses:[]},onShow(){this.load(this.data.anchor||today());},
 load(date){try{const {overrides,changes}=storage.read(),dates=weekDates(date),anchor=dates[0].date;
  this.setData({anchor,week:daySchedule(anchor,overrides).week,weekEnd:dates[6].date,days:dates.map(d=>{const s=daySchedule(d.date,overrides,changes);return Object.assign(s,d,{groups:gridGroups(s.courses)});}),periods:slots(anchor).map((time,i)=>({number:i+1,time:time[0]}))});
 }catch(e){wx.showToast({title:e.message,icon:'none'});}},
 prev(){this.load(shift(this.data.anchor,-7));},next(){this.load(shift(this.data.anchor,7));},reset(){this.load(today());},pick(e){this.load(e.detail.value);},
 detail(e){const d=this.data.days.find(d=>d.date===e.currentTarget.dataset.date),g=d&&d.groups.find(g=>g.id===e.currentTarget.dataset.group);if(g)this.setData({detailCourses:g.courses});},closeDetail(){this.setData({detailCourses:[]});},stop(){},
 editCourse(e){const c=this.data.detailCourses.find(c=>c.uid===e.currentTarget.dataset.uid);if(c){try{storage.edit(c);this.closeDetail();}catch(err){wx.showToast({title:'无法打开调整设置',icon:'none'});}}}
});
