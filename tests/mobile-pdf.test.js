const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../miniprogram');
const input=fs.readFileSync(path.join(__dirname,'fixtures/text-timetable.pdf'));
let writes=0,network=0;
const context=vm.createContext({console,setTimeout,clearTimeout,wx:{getFileSystemManager:()=>({readFile:r=>r.success({data:vm.runInContext('new Uint8Array(bytes).buffer',context)})}),cloud:new Proxy({}, {get(){network++;throw Error('Cloud must not be used');}}),request:()=>{network++;throw Error('Network must not be used');},setStorageSync:()=>{writes++;}}});
context.wx.base64ToArrayBuffer=s=>{context.mapBytes=Array.from(Buffer.from(s,'base64'));return vm.runInContext('new Uint8Array(mapBytes).buffer',context);};
vm.runInContext('Promise.try=undefined; Promise.withResolvers=undefined; Math.sumPrecise=undefined; Map.prototype.getOrInsert=undefined; Map.prototype.getOrInsertComputed=undefined; Uint8Array.prototype.toHex=undefined; Array.prototype.at=undefined; String.prototype.at=undefined; Uint8Array.prototype.at=undefined;',context);
context.bytes=Array.from(input);
const modules=new Map();
function load(file){file=path.resolve(file);if(!file.startsWith(root+path.sep))throw Error('External dependency blocked');if(modules.has(file))return modules.get(file).exports;const module={exports:{}};modules.set(file,module);const fn=vm.runInContext('(function(require,module,exports){'+fs.readFileSync(file,'utf8')+'\n})',context,{filename:file});fn(name=>{assert(name.startsWith('.'),'No Node dependencies');return load(path.resolve(path.dirname(file),name.endsWith('.js')?name:name+'.js'));},module,module.exports);return module.exports;}
(async()=>{
 const local=load(root+'/utils/local-pdf.js');
 const result=await local.recognize({path:'local.pdf',size:input.length});
 assert.equal(result.method,'local-pdf');assert.equal(result.courses.length,2);
 assert.equal(result.courses[0].name,'示例数学');assert.equal(result.courses[0].weekday,1);
 assert.equal(result.courses[1].weekday,2);assert.equal(result.courses[1].parity,'even');
 assert.equal(writes,0);assert.equal(network,0);
 await assert.rejects(()=>local.recognize({path:'large.pdf',size:8*1024*1024}),/7MB/);
 context.bytes=[1,2,3];await assert.rejects(()=>local.recognize({path:'invalid.pdf',size:3}),/PDF/);
 context.bytes=Array.from(Buffer.from('%PDF-1.7\ninvalid\n%%EOF'));await assert.rejects(()=>local.recognize({path:'broken.pdf',size:context.bytes.length}),/PDF/);
 context.bytes=Array.from(fs.readFileSync(path.join(__dirname,'fixtures/encrypted-timetable.pdf')));await assert.rejects(()=>local.recognize({path:'encrypted.pdf',size:context.bytes.length}),/加密/);
 context.bytes=Array.from(input);assert.equal((await local.recognize({path:'again.pdf',size:input.length})).courses.length,2);
 assert.equal(writes,0);assert.equal(network,0);
 assert.equal(fs.readFileSync(root+'/utils/timetable-parser.js','utf8'),fs.readFileSync(path.resolve(root,'../cloudfunctions/recognizeTimetable/parser.js'),'utf8'));
 console.log('手机本地PDF通过：无DOM、Node、Worker、fetch或wx.cloud环境读取中文跨页课表；不联网、不写入，拒绝超大和无效文件');
})().catch(e=>{console.error(e.message);process.exitCode=1;});


