import {readdir,readFile,writeFile} from 'node:fs/promises'
import path from 'node:path'
import JSZip from 'jszip'
const zip=new JSZip()
const dirs=['src','public','desktop','tests','scripts','supabase','android','ios']
const rootFiles=['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','vite.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json','index.html','capacitor.config.ts','electron-builder.yml','.gitignore','.env.example','THIRD_PARTY.md','GITHUB-PUBLISH.md']
async function collect(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(['build','.gradle','node_modules','.git','public'].includes(entry.name)&&dir.startsWith('ios'))continue
  if(['build','.gradle','node_modules','.git'].includes(entry.name)||entry.name==='local.properties')continue
  const file=path.posix.join(dir,entry.name)
  if(file==='android/app/src/main/assets/public')continue
  if(entry.isDirectory())await collect(file)
  else if(entry.isFile())zip.file(file,await readFile(file))
 }
}
for(const dir of dirs)await collect(dir)
for(const file of rootFiles)zip.file(file,await readFile(file))
zip.file('README.md',await readFile('GITHUB-PUBLISH.md'))
for(const file of Object.keys(zip.files)){
 if(/(^|\/)(private|work|outputs)(\/|$)|\.(pdf|jks|keystore)$|(^|\/)\.env$/.test(file))throw Error('Forbidden publication file: '+file)
}
const output='outputs/Nihongo-GitHub-source.zip'
await writeFile(output,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}))
console.log('Prepared safe source archive:',output,Object.keys(zip.files).length,'entries')
