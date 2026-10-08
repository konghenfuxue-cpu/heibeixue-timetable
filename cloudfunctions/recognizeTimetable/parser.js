const DAYS={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7,'天':7};
function day(text){const m=String(text).match(/(?:星期|周)([一二三四五六日天])/);return m?DAYS[m[1]]:0;}
function ranges(text){
 const spans=[];for(const part of text.split(/[,，、]/)){const m=part.match(/^(\d+)(?:[-—~至](\d+))?$/);if(m)spans.push([Number(m[1]),Number(m[2]||m[1])]);}return spans;
}
function parseColumn(text,weekday){
 text=String(text).replace(/\r/g,'').replace(/[–－]/g,'-');
 // Course blocks commonly use '(1-2节)1-17周(单)' after the name.
 const re=/[（(]\s*(\d+)\s*(?:[-—~至]\s*(\d+))?\s*节\s*[)）]\s*([\d\s,，、\-—~至]+)\s*周\s*(?:[（(]([单双])[)）])?/g;
 const hits=[];let m;while((m=re.exec(text)))hits.push({m,pos:m.index,end:re.lastIndex});
 for(let i=0;i<hits.length;i++){
  const base=i?hits[i-1].end:0,raw=text.slice(base,hits[i].pos);
  const prefix=raw.replace(/^[\s\S]*学分\s*[:：]\s*[\d.]+\s*/,'');
  const lines=prefix.trim().split('\n'),names=[];
  for(let j=lines.length-1;j>=0;j--){const line=lines[j].trim();if(!line)continue;if(/\/|^(?:场地|教室|教师|校区|学分|学号|教学班|教学班组成|课程学时组成|考核方式|选课备注|周学时|总学时|讲课|实验)\s*[:：]|^(?:星期|周)[一二三四五六日天]$/.test(line))break;names.unshift(line);}
  const title=names.join('').replace(/[★☆*]/g,'').replace(/\s+/g,'').slice(0,100);
  hits[i].name=title;hits[i].nameStart=names.length?base+raw.lastIndexOf(names[0]):hits[i].pos;
 }
 const out=[];
 for(let i=0;i<hits.length;i++){
  const hit=hits[i],m=hit.m,name=hit.name;
  if(!name||/教师[:：]|学号[:：]/.test(name))continue;
  const details=text.slice(hit.end,i+1<hits.length?hits[i+1].nameStart:text.length);
  const field=(label)=>{const r=details.match(new RegExp('(?:'+label+')'+'\\s*[:：]\\s*([^/\\n]+(?:\\n(?![^/\\n]+[:：])[^/\\n]+)*)'));return r?r[1].replace(/\s+/g,'').replace(/[★☆][\s\S]*$/,''):'';};
  const spans=ranges(m[3].replace(/\s+/g,''));
  for(const [first,last]of spans)out.push({name,weekday:weekday||day(details),start:Number(m[1]),end:Number(m[2]||m[1]),first,last,parity:m[4]==='单'?'odd':m[4]==='双'?'even':'all',room:field('场地|教室'),teacher:field('教师'),campus:field('校区')});
 }
 return out;
}
function result(courses,warnings){const seen=new Set();courses=courses.filter(c=>{const k=JSON.stringify(c);if(seen.has(k))return false;seen.add(k);return true;});return {courses:courses.map((c,i)=>Object.assign({id:'import'+i},c)),pending:[],warnings:warnings||[]};}
function fromTables(tables){
 const courses=[],warnings=[];
 for(const table of tables){const cells=table.Cells||[],columns={};for(const c of cells){const d=day(c.Text);if(d&&String(c.Text).trim().length<12)columns[c.ColTl]=d;}
  for(const c of cells)courses.push(...parseColumn(c.Text,columns[c.ColTl]||0));
 }
 if(courses.some(c=>!c.weekday))warnings.push('部分课程无法确定星期，请逐条补全。');
 if(!courses.length)warnings.push('未识别出支持的课程格式；可换清晰图片或手动填写。');
 return result(courses,warnings);
}
function fromPdf(data){
 const pages=data.Pages||[];let headers=[];
 let headerPage;
 for(const page of pages){const h=(page.Texts||[]).map(t=>({x:t.x,y:t.y,text:(t.R||[]).map(r=>decodeURIComponent(r.T)).join('')})).filter(t=>/^(?:星期|周)[一二三四五六日天]$/.test(t.text.trim())).sort((a,b)=>a.x-b.x);if(h.length===7){headers=h;headerPage=page;break;}}
 if(headers.length!==7)return result([],['未找到完整的周一至周日表头；可改用表格 OCR，或上传完整截图。']);
 const gap=(headers[6].x-headers[0].x)/6,cols=Array.from({length:7},()=>[]);
 for(const page of pages){const per=Array.from({length:7},()=>[]);for(const t of page.Texts||[]){if(page===headerPage&&t.y<=Math.max(...headers.map(h=>h.y))+0.15)continue;const x=t.x;const index=Math.floor((x-(headers[0].x-gap*0.65))/gap);if(index<0||index>6)continue;per[index].push({x,y:t.y,text:(t.R||[]).map(r=>decodeURIComponent(r.T)).join('')});}
  per.forEach((items,index)=>{items.sort((a,b)=>a.y-b.y||a.x-b.x);const lines=[];for(const t of items){const last=lines[lines.length-1];if(last&&Math.abs(last.y-t.y)<0.15)last.text+=t.text;else lines.push({y:t.y,text:t.text});}cols[index].push(lines.map(l=>l.text).join('\n'));});}
 const courses=cols.flatMap((texts,i)=>parseColumn(texts.join('\n'),day(headers[i].text)));
 return result(courses,['已按 PDF 表头定位星期，请对照原文件核对长课程名、跨页课程和单双周。未排课程需另行补充。']);
}
module.exports={parseColumn,fromTables,fromPdf};

