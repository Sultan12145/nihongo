import {mkdir,writeFile,access} from 'node:fs/promises'
import {createWriteStream} from 'node:fs'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {spawnSync} from 'node:child_process'
const root=new URL('../work/toolchains/',import.meta.url),downloads=new URL('../work/downloads/',import.meta.url)
await mkdir(root,{recursive:true});await mkdir(downloads,{recursive:true})
async function download(url,file){try{await access(file);console.log('Cached',file.pathname);return}catch{}const r=await fetch(url);if(!r.ok)throw Error(`${r.status}: ${url}`);await pipeline(Readable.fromWeb(r.body),createWriteStream(file));console.log('Downloaded',file.pathname)}
const list=await fetch('https://api.adoptium.net/v3/assets/latest/21/hotspot?architecture=x64&image_type=jdk&os=windows').then(r=>r.json())
const jdk=list[0].binary.package
await download(jdk.link,new URL('jdk21.zip',downloads))
const xml=await fetch('https://dl.google.com/android/repository/repository2-1.xml').then(r=>r.text())
const block=xml.match(/<remotePackage path="cmdline-tools;latest"[\s\S]*?<\/remotePackage>/)?.[0]
const sdkurl=block?.match(/<url>(commandlinetools-win[^<]+)<\/url>/)?.[1]
if(!sdkurl)throw Error('Official Android command line tools not found')
await download('https://dl.google.com/android/repository/'+sdkurl,new URL('android-tools.zip',downloads))
function expand(file,dest){const result=spawnSync('tar.exe',['-xf',file,'-C',dest],{stdio:'inherit'});if(result.status!==0)throw Error('Could not expand toolchain')}
const {fileURLToPath}=await import('node:url')
const jdkdir=new URL('java/',root),sdkdir=new URL('android-sdk/cmdline-tools/latest/',root)
await mkdir(jdkdir,{recursive:true});await mkdir(sdkdir,{recursive:true})
await mkdir(new URL('android-sdk/cmdline-tools/unpacked/',root),{recursive:true})
expand(fileURLToPath(new URL('jdk21.zip',downloads)),fileURLToPath(jdkdir))
expand(fileURLToPath(new URL('android-tools.zip',downloads)),fileURLToPath(new URL('android-sdk/cmdline-tools/unpacked/',root)))
const {cp,readdir}=await import('node:fs/promises')
await cp(new URL('android-sdk/cmdline-tools/unpacked/cmdline-tools/',root),sdkdir,{recursive:true})
const jdkname=(await readdir(jdkdir))[0]
await writeFile(new URL('paths.json',root),JSON.stringify({java:fileURLToPath(new URL('java/'+jdkname+'/',root)),sdk:fileURLToPath(new URL('android-sdk/',root))},null,2))
console.log('Android toolchains prepared. Licensing and SDK installation are separate steps.')
