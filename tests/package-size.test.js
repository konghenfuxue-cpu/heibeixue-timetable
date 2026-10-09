const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function size(root){return fs.readdirSync(root,{withFileTypes:true}).reduce((total,f)=>total+(f.isDirectory()?size(path.join(root,f.name)):fs.statSync(path.join(root,f.name)).size),0);}
// Leave room for WeChat compiler helpers and template output under its 2MB limit.
const bytes=size(path.resolve(__dirname,'../miniprogram'));
assert(bytes<1600*1024,'Mini-program sources exceed the 1600KiB budget: '+bytes);
console.log('Mini-program source size budget passed:',bytes,'bytes (compiled upload still needs IDE verification)');
