import {readdir,readFile,writeFile,unlink,copyFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
const root=path.resolve('dist')
await copyFile('THIRD_PARTY.md',path.join(root,'THIRD_PARTY.md'))
let notices=await readFile('THIRD_PARTY.md','utf8')
for(const name of ['react','react-dom','jszip','ts-fsrs','lucide-react','@capacitor/core','@capacitor/app','@capacitor/filesystem','@capacitor/share']){
 for(const file of ['LICENSE','LICENSE.md','LICENSE.txt']){
  const notice=await readFile(path.join('node_modules',name,file),'utf8').catch(()=>null)
  if(notice){notices+=`\n\n## ${name}\n\n${notice}`;break}
 }
}
await writeFile(path.join(root,'licenses.txt'),notices)
const dictionaryPath=path.join(root,'data','dictionary.json')
const dictionary=JSON.parse(await readFile(dictionaryPath,'utf8'))
const parts=[]
for(let start=0;start<dictionary.length;start+=20000){const name=`dictionary-${parts.length}.json`;await writeFile(path.join(root,'data',name),JSON.stringify(dictionary.slice(start,start+20000)));parts.push(name)}
await writeFile(path.join(root,'data','dictionary-manifest.json'),JSON.stringify({entries:dictionary.length,parts}))
await unlink(dictionaryPath)
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});const nested=await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]));return nested.flat()}
const files=(await walk(root)).filter(f=>!f.endsWith('sw.js'))
const digest=createHash('sha256')
for(const file of files)digest.update(await readFile(file))
const name='nihongo-'+digest.digest('hex').slice(0,16),urls=files.map(f=>'./'+path.relative(root,f).replaceAll('\\','/'))
await writeFile(path.join(root,'sw.js'),`const CACHE=${JSON.stringify(name)}+'-'+self.location.pathname;const FILES=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting()});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nihongo-')&&k.endsWith('-'+self.location.pathname)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(url.pathname);if(cached)return cached;try{return await fetch(event.request)}catch(error){if(event.request.mode==='navigate')return (await cache.match(new URL('./index.html',self.location.href).href))||Response.error();throw error}}))});
`)
console.log('Offline web bundle:',name,files.length,'files')
