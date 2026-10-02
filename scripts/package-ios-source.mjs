import JSZip from 'jszip'
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises'
import path from 'node:path'
const zip=new JSZip()
async function add(dir,target){for(const entry of await readdir(dir,{withFileTypes:true})){if(['.DS_Store','build','xcuserdata','.swiftpm'].includes(entry.name))continue;const source=path.join(dir,entry.name),name=target+'/'+entry.name;if(entry.isDirectory())await add(source,name);else if(entry.isFile()){let data=await readFile(source);if(name.endsWith('/CapApp-SPM/Package.swift')){data=Buffer.from(data.toString().replace(/path: "[^"]*\/node_modules\/@capacitor\/([^\"]+)"/g,(_,plugin)=>`path: "../../../native-plugins/${plugin}"`))}zip.file(name,data)}}}
await add('ios','ios')
for(const plugin of ['app','filesystem','share']){
 const root=path.join('node_modules','@capacitor',plugin)
 await add(path.join(root,'ios'),'native-plugins/'+plugin+'/ios')
 zip.file('native-plugins/'+plugin+'/Package.swift',await readFile(path.join(root,'Package.swift')))
 const license=await readFile(path.join(root,'LICENSE')).catch(()=>null)
 if(license)zip.file('native-plugins/'+plugin+'/LICENSE',license)
}
zip.file('THIRD_PARTY.md',await readFile('THIRD_PARTY.md'))
zip.file('README-iPhone.md',`# 日本語 · iPhone native source · 0.2.0\n\nThis archive is an Xcode project, not an IPA.\n\nOn a Mac with Xcode 26+: open ios/App/App.xcodeproj, wait for Swift Package Manager to resolve the Capacitor dependencies, select the App target, set your Apple development team under Signing & Capabilities, and choose a connected iPhone to build and run.\n\nThe app identifier is app.nihongo.study; version 0.2.0, build 200. The web application and offline dictionary are already bundled. No Node.js installation is needed to open this prepared native project. Local Swift plugin sources are included under native-plugins. To distribute through TestFlight, archive and sign using your Apple Developer account.\n\nLater native builds must keep the bundle identifier and development team and use an increasing build number.\n`)
await mkdir('outputs',{recursive:true})
await writeFile('outputs/Nihongo-iOS-source-0.2.0.zip',await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}}))
const manifest=await zip.file('ios/App/CapApp-SPM/Package.swift').async('text')
if(manifest.includes('node_modules'))throw Error('Native project still references node_modules')
console.log('Prepared standalone iPhone native source archive')
