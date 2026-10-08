const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function createRuntime(bytes){
 const root=path.resolve(__dirname,'../../miniprogram');let writes=0,network=0;
 const context=vm.createContext({console,setTimeout,clearTimeout,wx:{getFileSystemManager:()=>({readFile:r=>r.success({data:vm.runInContext('new Uint8Array(bytes).buffer',context)})}),cloud:new Proxy({}, {get(){network++;throw Error('Cloud must not be used');}}),request:()=>{network++;throw Error('Network must not be used');},setStorageSync:()=>{writes++;}}});
 vm.runInContext('Promise.try=undefined; Promise.withResolvers=undefined; Math.sumPrecise=undefined; Map.prototype.getOrInsert=undefined; Map.prototype.getOrInsertComputed=undefined; Uint8Array.prototype.toHex=undefined; Array.prototype.at=undefined; String.prototype.at=undefined; Uint8Array.prototype.at=undefined;',context);
 context.wx.base64ToArrayBuffer=s=>{context.mapBytes=Array.from(Buffer.from(s,'base64'));return vm.runInContext('new Uint8Array(mapBytes).buffer',context);};
 context.bytes=Array.from(bytes);const modules=new Map();
 function load(file){file=path.resolve(file);if(!file.startsWith(root+path.sep))throw Error('External dependency blocked');if(modules.has(file))return modules.get(file).exports;const module={exports:{}};modules.set(file,module);const fn=vm.runInContext('(function(require,module,exports){'+fs.readFileSync(file,'utf8')+'\n})',context,{filename:file});fn(name=>{assert(name.startsWith('.'),'No Node dependencies');return load(path.resolve(path.dirname(file),name.endsWith('.js')?name:name+'.js'));},module,module.exports);return module.exports;}
 return {load:relative=>load(path.join(root,relative)),context,stats:()=>({writes,network})};
};
