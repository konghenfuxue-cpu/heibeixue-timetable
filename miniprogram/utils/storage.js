const backup=require('./backup');
function record(data){return JSON.parse(backup.encode(data));}
function read(){const current=wx.getStorageSync('scheduleData');if(current)return backup.decode(JSON.stringify(current));const old={overrides:wx.getStorageSync('overrides')||{},changes:wx.getStorageSync('courseChanges')||{}};const clean=backup.normalize(old);wx.setStorageSync('scheduleData',record(clean));return clean;}
function save(data){wx.setStorageSync('scheduleData',record(data));}
function importBackup(text){const next=backup.decode(text),previous=record(read());wx.setStorageSync('backupBeforeImport',previous);save(next);return next;}
function undoImport(){const previous=wx.getStorageSync('backupBeforeImport');if(!previous)throw Error('没有可撤销的导入');const data=backup.decode(JSON.stringify(previous));save(data);wx.removeStorageSync('backupBeforeImport');return data;}
function viewDate(date){wx.setStorageSync('scheduleViewDate',date);wx.switchTab({url:'/pages/today/index'});}
function edit(course){wx.setStorageSync('courseEditDraft',{source:course.origin,courseId:course.id});wx.switchTab({url:'/pages/settings/index'});}
module.exports={read,save,importBackup,undoImport,viewDate,edit};
