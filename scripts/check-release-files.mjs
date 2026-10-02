import {createReadStream} from 'node:fs'
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import JSZip from 'jszip'
const files=['outputs/android/Nihongo-0.2.0.apk','outputs/windows/Nihongo-Setup-0.2.0.exe','outputs/Nihongo-iOS-source-0.2.0.zip']
const checksums=[]
for(const file of files){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);checksums.push({file,size:(await stat(file)).size,sha256:hash.digest('hex')})}
const apk=await JSZip.loadAsync(await readFile(files[0]))
for(const required of ['classes.dex','AndroidManifest.xml','assets/public/index.html','assets/public/dictionary-worker.js','assets/public/data/dictionary-manifest.json','assets/public/licenses.txt','assets/public/THIRD_PARTY.md'])if(!apk.file(required))throw Error('APK missing '+required)
const manifest=JSON.parse(await apk.file('assets/public/data/dictionary-manifest.json').async('text'))
for(const part of manifest.parts)if(!apk.file('assets/public/data/'+part))throw Error('APK missing dictionary chunk')
if(Object.keys(apk.files).some(f=>f.startsWith('private/')||f.includes('android-signing.properties')))throw Error('Private signing data is present in APK')
const ios=await JSZip.loadAsync(await readFile(files[2]))
const swift=await ios.file('ios/App/CapApp-SPM/Package.swift').async('text')
if(swift.includes('node_modules'))throw Error('iOS source contains unresolved Node references')
for(const plugin of ['app','filesystem','share'])if(!ios.file('native-plugins/'+plugin+'/Package.swift'))throw Error('iOS plugin missing')
if(!ios.file('ios/App/App/public/data/dictionary-manifest.json'))throw Error('iOS dictionary missing')
await mkdir('outputs',{recursive:true})
await writeFile('outputs/SHA256SUMS.txt',checksums.map(x=>`${x.sha256}  ${x.file.replace(/^outputs\//,'')}`).join('\n')+'\n')
await writeFile('outputs/release-manifest.json',JSON.stringify({version:'0.2.0',android:{applicationId:'app.nihongo.study',versionCode:200,signerSha256:'c2c4e7df058730d953ae61364712600192917f309e0d049f5474a71a865d7372'},website:'https://sultan12145.github.io/nihongo/',files:checksums},null,2))
console.log('Release integrity checked: APK assets, iOS dependencies, SHA256 checksums')
