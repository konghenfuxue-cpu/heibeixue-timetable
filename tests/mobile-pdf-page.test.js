const assert=require('node:assert/strict');
let page,mode='valid',writes=0,calls=0;
const values={};
global.Page=p=>page=p;
global.wx={chooseMessageFile:r=>{if(mode!=='cancel')r.success({tempFiles:[{name:'sample.pdf',path:'sample.pdf',size:100}]});},getStorageSync:k=>values[k],setStorageSync:()=>writes++,showLoading:()=>{},hideLoading:()=>{},showModal:()=>{},showToast:()=>{}};
const local=require('../miniprogram/utils/local-pdf');
local.recognize=async()=>{calls++;if(mode==='failure')throw Error('无法读取PDF');return {courses:[{name:'示例课程',weekday:1,start:1,end:2,first:1,last:17,parity:'all'}],warnings:[]};};
require('../miniprogram/pages/import/index');
const p=Object.assign({},page,{data:JSON.parse(JSON.stringify(page.data)),setData(r){Object.assign(this.data,r);}});
const settle=()=>new Promise(r=>setTimeout(r,60));
(async()=>{
 p.selectPdf();assert(p.data.busy);p.selectPdf();await settle();assert.equal(calls,1);assert.equal(p.data.courses.length,1);assert(!p.data.busy);assert(!p.data.confirmed);assert.equal(writes,0);assert.equal(p.data.method,'手机本地提取 · 不上传');
 mode='cancel';p.selectPdf();await settle();assert.equal(calls,1);assert.equal(p.data.courses.length,1);
 mode='failure';p.selectPdf();await settle();assert.equal(calls,2);assert.equal(p.data.courses.length,0);assert(p.data.needOcr);assert(!p.data.busy);assert.equal(writes,0);
 console.log('手机PDF页面通过：本地读取、重复点击、取消与失败均不上传或替换当前课表');
})().catch(e=>{console.error(e);process.exitCode=1;});
