import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import vm from 'node:vm'

for(const base of ['https://example.github.io/','https://example.github.io/nihongo/']){
 test('offline cache stays inside '+base,async()=>{
  const handlers={},requests=[]
  const worker=base+'sw.js'
  const cache={addAll:async files=>{requests.push(...files.map(f=>new URL(f,worker).href))}}
  const scope={URL,Response,self:{location:new URL(worker),registration:{scope:base},addEventListener:(type,fn)=>{handlers[type]=fn}},caches:{open:async()=>cache}}
  vm.runInNewContext(await readFile('dist/sw.js','utf8'),scope)
  let pending;handlers.install({waitUntil:p=>{pending=p}});await pending
  assert.ok(requests.length>20)
  assert.ok(requests.every(url=>url.startsWith(base)))
  assert.ok(requests.includes(base+'data/dictionary-manifest.json'))
  assert.ok(requests.includes(base+'index.html'))
  const manifest=JSON.parse(await readFile('dist/manifest.webmanifest','utf8'))
  assert.equal(new URL(manifest.start_url,base+'manifest.webmanifest').href,base+'#/home')
  let intercepted=false
  handlers.fetch({request:{method:'GET',url:'https://another.example/file'},respondWith:()=>{intercepted=true}})
  assert.equal(intercepted,false)
 })
}
