import {mkdir} from 'node:fs/promises'
import {createWriteStream} from 'node:fs'
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import {spawnSync} from 'node:child_process'
import path from 'node:path'
const release=await fetch('https://api.github.com/repos/git-for-windows/git/releases/latest').then(r=>r.json())
const asset=release.assets.find(a=>/^PortableGit-.*-64-bit\.7z\.exe$/.test(a.name))
if(!asset)throw Error('Official Git for Windows portable package not found')
await mkdir('work/downloads',{recursive:true});await mkdir('work/toolchains/git',{recursive:true})
const target=path.resolve('work/downloads',asset.name),r=await fetch(asset.browser_download_url)
if(!r.ok)throw Error('Git download failed')
console.log('Downloading official portable Git',asset.name,asset.size)
await pipeline(Readable.fromWeb(r.body),createWriteStream(target))
const result=spawnSync(target,['-y','-o'+path.resolve('work/toolchains/git')],{stdio:'inherit',windowsHide:true})
if(result.status!==0)throw Error('Portable Git extraction failed')
console.log('Portable build shell ready')
