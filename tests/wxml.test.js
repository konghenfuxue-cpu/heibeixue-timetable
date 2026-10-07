const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
function check(dir){for(const file of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,file.name);if(file.isDirectory())check(p);else if(p.endsWith('.wxml')){const text=fs.readFileSync(p,'utf8');for(const match of text.matchAll(/{{([\s\S]*?)}}/g)){const expression=match[1];assert(!/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/i.test(expression),`${p}: WXML表达式不应使用HTML实体：${expression}`);assert.doesNotThrow(()=>new Function('return ('+expression+');'),`${p}: 无效表达式 ${expression}`);}}}}
check(path.join(__dirname,'../miniprogram'));
console.log('WXML所有模板表达式检查通过（此检查不替代微信编译器）');
