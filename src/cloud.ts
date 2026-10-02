import { createClient, type Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { currentOwner, getState, persistEvents, switchOwner } from './store'
import { validEvent, type StudyEvent } from './core'
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_ANON_KEY
export const cloud=url&&key?createClient(url,key):null
export type CloudState={session:Session|null;status:string;recovering:boolean;ready:boolean}
let info:CloudState={session:null,status:cloud?'Проверяем вход…':'Сохранение на этом устройстве',recovering:false,ready:!cloud}
const listeners=new Set<()=>void>()
function update(p:Partial<CloudState>){info={...info,...p};listeners.forEach(fn=>fn())}
let running=false,again=false,timer:ReturnType<typeof setTimeout>|undefined,started=false
async function sync(){
  if(!cloud||!info.session||!info.ready)return
  if(running){again=true;return}running=true
  const user=info.session.user.id,local=getState().events
  if(user!==currentOwner()){running=false;return}
  try{
    if(!navigator.onLine){update({status:'Нет сети · ответы сохранены на устройстве'});return}
    update({status:'Синхронизация…'})
    // Immutable events prevent one device from overwriting another device's history.
    for(let i=0;i<local.length;i+=200){const {error}=await cloud.from('study_events').upsert(local.slice(i,i+200).map(e=>({user_id:user,id:e.id,event:e})),{onConflict:'user_id,id',ignoreDuplicates:true});if(error)throw error}
    const remote:StudyEvent[]=[]
    for(let from=0;;from+=500){const {data,error}=await cloud.from('study_events').select('event').eq('user_id',user).order('id').range(from,from+499);if(error)throw error;for(const row of data||[])if(validEvent(row.event))remote.push(row.event);if((data?.length||0)<500)break}
    if(currentOwner()!==user)return
    const known=new Set(getState().events.map(e=>e.id)),fresh=remote.filter(e=>!known.has(e.id));if(fresh.length)persistEvents(fresh)
    update({status:`Синхронизировано ${new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}`})
  }catch(e){if(currentOwner()===user)update({status:`Не синхронизировано: ${(e as Error).message}. Локальные ответы сохранены.`})}finally{running=false;if(again){again=false;schedule()}}
}
function schedule(){clearTimeout(timer);timer=setTimeout(()=>void sync(),1200)}
export function startCloud(){if(started||!cloud)return;started=true
  cloud.auth.onAuthStateChange((event,session)=>{
    try{const owner=session?.user.id||'guest';if(owner!==currentOwner())switchOwner(owner);update({session,ready:true,recovering:event==='PASSWORD_RECOVERY'||(info.recovering&&!!session),status:session?'Подключение…':'Сохранение на этом устройстве'});if(session)schedule()}catch(e){update({ready:false,status:String(e)})}
  })
  window.addEventListener('nihongo-change',schedule);window.addEventListener('online',schedule);window.addEventListener('focus',schedule)
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule();else void sync()})
  setInterval(()=>void sync(),15*60*1000)
}
export function useCloud(){const [value,setValue]=useState(info);useEffect(()=>{const fn=()=>setValue({...info});listeners.add(fn);return()=>{listeners.delete(fn)}},[]);return value}
export function finishRecovery(){update({recovering:false})}
export const syncNow=sync
