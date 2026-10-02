import {createReadStream} from 'node:fs'
import {readFile,stat,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const {version}=JSON.parse(await readFile('package.json','utf8'))
const name=`Nihongo-Setup-${version}.exe`,filename='outputs/windows/'+name
const hash=createHash('sha512');for await(const chunk of createReadStream(filename))hash.update(chunk)
const digest=hash.digest('base64'),size=(await stat(filename)).size
await writeFile('outputs/windows/latest.yml',`version: ${version}
files:
  - url: ${name}
    sha512: ${digest}
    size: ${size}
path: ${name}
sha512: ${digest}
releaseDate: '${new Date().toISOString()}'
`)
console.log('Windows update feed prepared')
