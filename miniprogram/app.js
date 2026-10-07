function showStartupError(error) {
 const message=String(error&&error.message||error||'未知启动错误');
 console.error('[课表启动错误]',message);
 wx.showModal({title:'课表加载失败',content:message.slice(0,900),showCancel:false});
}
App({
 onError(error){if(this.reportedError)return;this.reportedError=true;setTimeout(()=>showStartupError(error),300);},
 onUnhandledRejection(event){this.onError(event.reason);}
});
