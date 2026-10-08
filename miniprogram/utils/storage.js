const backup=require('./backup');
function record(data){return JSON.parse(backup.encode(data));}
function read(){const current=wx.getStorageSync('scheduleData');if(current)return backup.decode(JSON.stringify(current));const old={overrides:wx.getStorageSync('overrides')||{},changes:wx.getStorageSync('courseChanges')||{}};const clean=backup.normalize(old);wx.setStorageSync('scheduleData',record(clean));return clean;}
function save(data){const current=wx.getStorageSync('scheduleData');if(current&&current.timetable&&!Object.prototype.hasOwnProperty.call(data,'timetable'))data=Object.assign({},data,{timetable:current.timetable});wx.setStorageSync('scheduleData',record(data));}
function importBackup(text){const next=backup.decode(text),previous=record(read());wx.setStorageSync('backupBeforeImport',previous);wx.setStorageSync('scheduleData',record(next));return next;}
function undoImport(){const previous=wx.getStorageSync('backupBeforeImport');if(!previous)throw Error('没有可撤销的导入');const data=backup.decode(JSON.stringify(previous));wx.setStorageSync('scheduleData',record(data));wx.removeStorageSync('backupBeforeImport');return data;}
function importTimetable(table){const timetable=require('./catalog').normalize(table);return importBackup(backup.encode({overrides:{},changes:{},timetable}));}
function viewDate(date){wx.setStorageSync('scheduleViewDate',date);wx.switchTab({url:'/pages/today/index'});}
function edit(course){wx.setStorageSync('courseEditDraft',{source:course.origin,courseId:course.id});wx.switchTab({url:'/pages/settings/index'});}
module.exports={read,save,importBackup,importTimetable,undoImport,viewDate,edit};
