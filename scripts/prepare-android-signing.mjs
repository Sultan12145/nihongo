import {mkdir,access,writeFile,readFile} from 'node:fs/promises'
import {randomBytes} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
const dir=path.resolve('private'),properties=path.join(dir,'android-signing.properties')
await mkdir(dir,{recursive:true})
try{await access(properties);console.log('Persistent signing key already configured');process.exit(0)}catch{}
const tools=JSON.parse(await readFile('work/toolchains/paths.json','utf8'))
const password=randomBytes(32).toString('hex'),keystore=path.join(dir,'nihongo-alpha.keystore')
try{await access(keystore);throw Error('Existing keystore needs its original properties; refusing to replace it')}catch(error){if(error.code!=='ENOENT')throw error}
const env={...process.env,NIHONGO_KEY_PASSWORD:password}
const result=spawnSync(path.join(tools.java,'bin','keytool.exe'),['-genkeypair','-keystore',keystore,'-alias','nihongo-alpha','-keyalg','RSA','-keysize','3072','-validity','10000','-storepass:env','NIHONGO_KEY_PASSWORD','-keypass:env','NIHONGO_KEY_PASSWORD','-dname','CN=Nihongo Alpha, OU=Personal Study, O=Nihongo, C=JP'],{env,stdio:'inherit'})
if(result.status!==0)throw Error('Could not generate signing key')
await writeFile(properties,`storeFile=${keystore.replaceAll('\\','/')}
storePassword=${password}
keyAlias=nihongo-alpha
keyPassword=${password}
`)
await writeFile('android/local.properties',`sdk.dir=${tools.sdk.replaceAll('\\','/')}`)
console.log('Persistent APK signing configured. Keep the private folder for all future updates.')
