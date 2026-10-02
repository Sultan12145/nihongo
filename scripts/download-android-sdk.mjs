import {mkdir,readFile,writeFile,access,stat} from 'node:fs/promises'
import {createWriteStream} from 'node:fs'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import path from 'node:path'
const tools=JSON.parse(await readFile('work/toolchains/paths.json','utf8'))
const xml=await readFile('work/android-repository.xml','utf8')
const packages=[...xml.matchAll(/<remotePackage\b[^>]*path="([^"]+)"[\s\S]*?<\/remotePackage>/g)].map(m=>({id:m[1],xml:m[0]}))
const selected=[packages.find(p=>p.id==='platforms;android-36'&&p.xml.includes('platform-36_r02.zip')),packages.find(p=>p.id==='build-tools;36.0.0'),packages.find(p=>p.id==='build-tools;35.0.0'),packages.find(p=>p.id==='platform-tools')]
const downloads=path.resolve('work/downloads');await mkdir(downloads,{recursive:true})
await mkdir(path.join(tools.sdk,'licenses'),{recursive:true})
// Acceptance is explicitly authorized by the user in this task. Hash only the official license text.
for(const match of xml.matchAll(/<license\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/license>/g)){
 const text=match[2].replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&apos;',"'").trim()
 await writeFile(path.join(tools.sdk,'licenses',match[1]),createHash('sha1').update(text).digest('hex')+'\n')
}
await Promise.all(selected.map(async pkg=>{
 if(!pkg)throw Error('SDK package metadata missing')
 const archives=[...pkg.xml.matchAll(/<archive\b[^>]*>[\s\S]*?<\/archive>/g)].map(m=>m[0])
 const archive=archives.find(a=>a.includes('<host-os>windows</host-os>'))||archives.find(a=>!a.includes('<host-os>'))
 const name=archive?.match(/<url>([^<]+)<\/url>/)?.[1]
 if(!name)throw Error('Windows SDK package missing: '+pkg.id)
 const file=path.join(downloads,name),size=Number(archive.match(/<size>(\d+)<\/size>/)?.[1])
 if((await stat(file).catch(()=>null))?.size!==size){const r=await fetch('https://dl.google.com/android/repository/'+name,{signal:AbortSignal.timeout(600000)});if(!r.ok)throw Error(name+': '+r.status);await pipeline(Readable.fromWeb(r.body),createWriteStream(file))}
 const expected=archive.match(/<checksum(?:\s+type="sha1")?>([^<]+)<\/checksum>/)?.[1]
 if(expected){const digest=createHash('sha1').update(await readFile(file)).digest('hex');if(digest!==expected)throw Error('SDK checksum mismatch: '+name)}
 const temp=path.join(downloads,'extracted-'+pkg.id.replaceAll(';','-'));await mkdir(temp,{recursive:true})
 const result=spawnSync('tar.exe',['-xf',file,'-C',temp],{stdio:'inherit'});if(result.status!==0)throw Error('SDK extraction failed')
 const {readdir,cp}=await import('node:fs/promises');const folders=await readdir(temp)
 const target=path.join(tools.sdk,...pkg.id.split(';'));await mkdir(target,{recursive:true})
 await cp(path.join(temp,folders[0]),target,{recursive:true})
 console.log('SDK ready:',pkg.id)
}))
