import { useSyncExternalStore } from 'react'
import { mergeEvents, project, validEvent, type StudyEvent } from './core'
let owner='guest'
const listeners=new Set<()=>void>()
export function readEvents(id:string):StudyEvent[] {
  const raw=localStorage.getItem(`nihongo-v2:${id}`)
  if(!raw) return []
  const parsed=JSON.parse(raw)
  if(!Array.isArray(parsed) || !parsed.every(validEvent)) throw new Error('Не удалось прочитать сохранение. Сначала экспортируйте резервную копию.')
  return parsed
}
let snapshot=project(readEvents(owner))
export function currentOwner(){return owner}
export function getState(){return snapshot}
export function switchOwner(id:string){ const next=project(readEvents(id));owner=id;snapshot=next;listeners.forEach(fn=>fn()) }
export function persistEvents(events:StudyEvent[]){
  const merged=mergeEvents(readEvents(owner),snapshot.events,events)
  // Persist before publishing state: a quota error must never look like a successful save.
  localStorage.setItem(`nihongo-v2:${owner}`,JSON.stringify(merged))
  snapshot=project(merged);listeners.forEach(fn=>fn())
  window.dispatchEvent(new Event('nihongo-change'))
}
export function commit(type:StudyEvent['type'],payload:unknown,id=crypto.randomUUID()) {persistEvents([{id,at:new Date().toISOString(),type,payload}])}
export function commitMany(items:{type:StudyEvent['type'];payload:unknown}[]){const at=new Date().toISOString();persistEvents(items.map(i=>({...i,at,id:crypto.randomUUID()})))}
export function useStudy(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn)},()=>snapshot)}
window.addEventListener('storage',e=>{if(e.key===`nihongo-v2:${owner}`){snapshot=project(readEvents(owner));listeners.forEach(fn=>fn())}})
export function importLegacy(){
  if(localStorage.getItem('nihongo-migrated'))return
  try { const old=JSON.parse(localStorage.getItem('nihongo-state')||'{}');const events:StudyEvent[]=[]
    for(const word of old.customWords||[]) {const e:StudyEvent={id:`legacy-${word.id}`,at:new Date().toISOString(),type:'word',payload:word};if(validEvent(e))events.push(e)}
    if(Number.isInteger(old.dailyGoal))events.push({id:'legacy-goal',at:new Date().toISOString(),type:'goal',payload:{value:old.dailyGoal}})
    if(events.length)persistEvents(events.filter(validEvent)); localStorage.setItem('nihongo-migrated','1')
  } catch { /* Original data stays untouched. */ }
}
