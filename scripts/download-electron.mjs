import {createRequire} from 'node:module'
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises'
import {createWriteStream,createReadStream} from 'node:fs'
import {Readable,Transform} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
const require=createRequire(import.meta.url),version=require('electron/package.json').version
const file=`electron-v${version}-win32-x64.zip`,dir=path.resolve('work/downloads'),target=path.join(dir,file)
await mkdir(dir,{recursive:true})
const cached=await stat(target).catch(()=>null)
if(!cached||cached.size<100_000_000){
const r=await fetch(`https://github.com/electron/electron/releases/download/v${version}/${file}`,{signal:AbortSignal.timeout(600000)})
if(!r.ok)throw Error('Electron download '+r.status)
console.log('Downloading Electron',r.headers.get('content-length'),'bytes')
let total=0,reported=0
await pipeline(Readable.fromWeb(r.body),new Transform({transform(chunk,_,callback){total+=chunk.length;if(total-reported>20_000_000){reported=total;console.log(Math.round(total/1e6),'MB')}callback(null,chunk)}}),createWriteStream(target))
}
const checksum=require('electron/checksums.json')[file]
const hash=createHash('sha256');for await(const chunk of createReadStream(target))hash.update(chunk)
if(hash.digest('hex')!==checksum)throw Error('Electron checksum mismatch')
const electronDir=path.resolve('node_modules/electron/dist')
await mkdir(electronDir,{recursive:true})
const result=spawnSync('tar.exe',['-xf',target,'-C',electronDir],{stdio:'inherit'})
if(result.status!==0)throw Error('Electron extraction failed')
await writeFile(path.resolve('node_modules/electron/path.txt'),'electron.exe')
console.log('Electron verified and ready')
