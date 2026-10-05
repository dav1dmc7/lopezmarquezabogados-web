#!/usr/bin/env node
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root=process.cwd();
const dist=join(root,'dist');
const warnings=[];
const errors=[];
const files=[];

function walk(dir){
  for(const entry of readdirSync(dir,{withFileTypes:true})){
    const abs=join(dir,entry.name);
    if(entry.isDirectory()) walk(abs); else files.push(abs);
  }
}
walk(dist);

let total=0, js=0, css=0, images=0, largest=[];
for(const file of files){
  const size=statSync(file).size;
  total+=size;
  const rel=relative(dist,file);
  largest.push([size,rel]);
  if(/\.m?js$/i.test(file)) js+=size;
  else if(/\.css$/i.test(file)) css+=size;
  else if(/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(file)) images+=size;
}
largest.sort((a,b)=>b[0]-a[0]);
console.log('=== LOCAL PERFORMANCE BUDGET ===');
console.log(`dist files: ${files.length}`);
console.log(`total bytes: ${total}`);
console.log(`JS bytes: ${js}`);
console.log(`CSS bytes: ${css}`);
console.log(`image bytes: ${images}`);
console.log('largest files:');
for(const [size,rel] of largest.slice(0,15)) console.log(`${String(size).padStart(9)} ${rel}`);

if(js>600_000) warnings.push(`JS payload > 600 KB: ${js} bytes`);
if(css>300_000) warnings.push(`CSS payload > 300 KB: ${css} bytes`);
for(const [size,rel] of largest.slice(0,10)) if(size>1_500_000 && /\.(jpe?g|png|webp|avif|gif)$/i.test(rel)) warnings.push(`large image asset > 1.5 MB: ${rel} (${size} bytes)`);

// HTML smoke: every HTML route should reference a stylesheet and contain a viewport meta.
for(const file of files.filter(x=>x.endsWith('.html'))){
  const html=readFileSync(file,'utf8');
  if(!/<meta[^>]+name=["']viewport["']/i.test(html)) warnings.push(`${relative(dist,file)}: viewport meta missing`);
  if(!/<link[^>]+rel=["'][^"']*stylesheet[^"']*/i.test(html)) warnings.push(`${relative(dist,file)}: stylesheet link not detected`);
}
console.log(`\nLocal performance warnings: ${warnings.length}`);
for(const w of warnings) console.warn('WARN',w);
if(errors.length) process.exit(1);
