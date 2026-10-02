import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile,stat} from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'

test('bundled offline dictionary resolves Japanese words through all shipped chunks',async()=>{
  const root=path.resolve('dist'),manifest=JSON.parse(await readFile(path.join(root,'data/dictionary-manifest.json'),'utf8'))
  assert.ok(manifest.entries>250000)
  for(const part of manifest.parts){assert.match(part,/^dictionary-\d+\.json$/);assert.ok((await stat(path.join(root,'data',part))).size<25*1024*1024)}
  let resolve
  const response=new Promise(r=>{resolve=r})
  const scope={Map,Set,Error,Promise,self:{postMessage:resolve},fetch:async url=>({ok:true,json:async()=>JSON.parse(await readFile(path.join(root,url.replace(/^\//,'')),'utf8'))})}
  vm.runInNewContext(await readFile(path.join(root,'dictionary-worker.js'),'utf8'),scope)
  await scope.self.onmessage({data:{id:1,word:'産地'}})
  const result=await response
  assert.equal(result.id,1);assert.equal(result.error,undefined)
  assert.ok(result.results.some(r=>r.reading==='さんち'&&r.lang==='rus'&&r.meanings.join(' ').includes('производства')))
})
