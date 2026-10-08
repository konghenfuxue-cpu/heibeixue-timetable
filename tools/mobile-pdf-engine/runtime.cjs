if(!Uint8Array.prototype.toHex)Object.defineProperty(Uint8Array.prototype,'toHex',{value:function(){return Array.from(this,x=>x.toString(16).padStart(2,'0')).join('');}});
const {ReadableStream}=require('web-streams-polyfill');
const {AbortController,AbortSignal}=require('abort-controller/dist/abort-controller.js');
if(!Promise.try)Promise.try=function(fn,...args){return new Promise(resolve=>resolve(fn(...args)));};
if(!Math.sumPrecise)Math.sumPrecise=require('core-js-pure/actual/math/sum-precise');
if(!Map.prototype.getOrInsert)Object.defineProperty(Map.prototype,'getOrInsert',{value:function(key,value){if(!this.has(key))this.set(key,value);return this.get(key);},configurable:true});
if(!Map.prototype.getOrInsertComputed)Object.defineProperty(Map.prototype,'getOrInsertComputed',{value:function(key,fn){if(typeof fn!=='function')throw TypeError('Expected a callback');if(this.has(key))return this.get(key);const value=fn(key);this.set(key,value);return value;},configurable:true});
if(!Promise.withResolvers)Promise.withResolvers=function(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
for(const cls of [Array,String,Uint8Array])if(!cls.prototype.at)Object.defineProperty(cls.prototype,'at',{value:function(i){i=Number(i)||0;return this[i<0?this.length+i:i];},configurable:true});
class TextDecoder{
 constructor(encoding='utf-8'){this.encoding=encoding.toLowerCase();if(!['utf-8','utf8','utf-16le','utf-16be','windows-1252','iso-8859-1'].includes(this.encoding))throw Error('Unsupported PDF text encoding');}
 decode(input){const b=input?new Uint8Array(input.buffer||input,input.byteOffset||0,input.byteLength):new Uint8Array();let out='';if(this.encoding.startsWith('utf-16')){for(let i=0;i+1<b.length;i+=2)out+=String.fromCharCode(this.encoding==='utf-16be'?b[i]*256+b[i+1]:b[i]+b[i+1]*256);return out.replace(/^\uFEFF/,'');}if(!this.encoding.startsWith('utf'))return Array.from(b,x=>String.fromCharCode(x)).join('');for(let i=0;i<b.length;){let c=b[i++];if(c<128){out+=String.fromCharCode(c);continue;}const n=c>=240?3:c>=224?2:1;let v=c&(n===3?7:n===2?15:31);for(let k=0;k<n;k++){const next=b[i++];if(next===undefined||(next&192)!==128){v=65533;break;}v=v*64+(next&63);}out+=v>65535?String.fromCodePoint(v):String.fromCharCode(v);}return out.replace(/^\uFEFF/,'');}
}
class TextEncoder{encode(str){const b=[];for(const ch of String(str)){const c=ch.codePointAt(0);if(c<128)b.push(c);else if(c<2048)b.push(192|(c>>6),128|(c&63));else if(c<65536)b.push(224|(c>>12),128|((c>>6)&63),128|(c&63));else b.push(240|(c>>18),128|((c>>12)&63),128|((c>>6)&63),128|(c&63));}return new Uint8Array(b);}}
function structuredClone(value){if(value===null||typeof value!=='object')return value;if(value instanceof ArrayBuffer)return value.slice(0);if(ArrayBuffer.isView(value))return new value.constructor(value);if(Array.isArray(value))return value.map(structuredClone);if(value instanceof Map)return new Map(Array.from(value,([k,v])=>[k,structuredClone(v)]));const out={};for(const k of Object.keys(value))out[k]=structuredClone(value[k]);return out;}
const fetch=()=>Promise.reject(Error('Local PDF parser cannot access network'));
module.exports={AbortController,AbortSignal,ReadableStream,TextDecoder,TextEncoder,structuredClone,fetch};



