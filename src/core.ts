import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import type { VocabularyCard } from './types'

export type Category = 'word' | 'grammar' | 'kanji'
export type StudyEvent = { id: string; at: string; type: 'review' | 'word' | 'book' | 'bookmark' | 'goal' | 'session'; payload: any }
export type Review = { key: string; grade: Grade; source: string; lesson: number }
export type Book = { id:string; title:string; description:string; text:string }
export type Exercise = { id:string; key:string; category:Category; lesson:number; prompt:string; sentence:string; answers:string[]; explanation:string }
export type Session = { id:string; mode:string; day:string; exercises:Exercise[]; answers:{exerciseId:string; answer:string; correct:boolean}[] }
export type State = { events:StudyEvent[]; cards:Record<string,Card>; first:Record<string,string>; words:VocabularyCard[]; books:Book[]; bookmarks:Record<string,number>; sessions:Record<string,Session>; goal:number; reviews:(Review & {at:string})[] }
export const scheduler = fsrs({ request_retention:0.9, enable_fuzz:false, learning_steps:['1m','10m'], relearning_steps:['10m'] })
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` }
export function previousDay(date = new Date()) { const d=new Date(date); d.setDate(d.getDate()-1); return dayKey(d) }
export function mergeEvents(...groups:StudyEvent[][]) { return [...new Map(groups.flat().map(e=>[e.id,e])).values()].sort((a,b)=>a.at.localeCompare(b.at)||a.id.localeCompare(b.id)) }
export function validEvent(e:any):e is StudyEvent {
  if(!e || typeof e.id!=='string' || !Number.isFinite(Date.parse(e.at)) || !e.payload) return false
  const p=e.payload
  if(e.type==='review') return typeof p.key==='string' && [1,2,3,4].includes(p.grade) && Number.isInteger(p.lesson)
  if(e.type==='word') return typeof p.id==='string' && typeof p.written==='string' && typeof p.reading==='string' && Array.isArray(p.meanings) && p.meanings.every((m:unknown)=>typeof m==='string') && Array.isArray(p.examples)
  if(e.type==='book') return typeof p.id==='string' && typeof p.title==='string' && typeof p.text==='string'
  if(e.type==='bookmark') return typeof p.id==='string' && Number.isFinite(p.position) && p.position>=0
  if(e.type==='goal') return Number.isInteger(p.value) && p.value>=0 && p.value<=500
  if(e.type==='session') return typeof p.id==='string' && typeof p.mode==='string' && typeof p.day==='string' && Array.isArray(p.exercises) && p.exercises.every((q:any)=>q&&typeof q.id==='string'&&typeof q.key==='string'&&['word','grammar','kanji'].includes(q.category)&&typeof q.prompt==='string'&&typeof q.sentence==='string'&&typeof q.explanation==='string'&&Array.isArray(q.answers)&&q.answers.every((a:unknown)=>typeof a==='string')) && Array.isArray(p.answers) && p.answers.every((a:any)=>a&&typeof a.exerciseId==='string'&&typeof a.answer==='string'&&typeof a.correct==='boolean')
  return false
}
export function project(events:StudyEvent[]):State {
  const state:State={events:mergeEvents(events.filter(validEvent)),cards:{},first:{},words:[],books:[],bookmarks:{},sessions:{},goal:20,reviews:[]}
  const words = new Map<string,VocabularyCard>(), books = new Map<string,Book>()
  for(const e of state.events) {
    const p=e.payload
    if(e.type==='review') {
      const at=new Date(e.at), card=state.cards[p.key] || createEmptyCard(at)
      state.cards[p.key]=scheduler.next(card,at,p.grade).card
      state.first[p.key]??=e.at
      state.reviews.push({...p,at:e.at})
    } else if(e.type==='word') words.set(p.id,p)
    else if(e.type==='book') books.set(p.id,p)
    else if(e.type==='bookmark') state.bookmarks[p.id]=p.position
    else if(e.type==='goal') state.goal=p.value
    else if(e.type==='session') {
      const prev=state.sessions[p.id]
      if(!prev)state.sessions[p.id]=p
      else {
        const answers=new Map([...prev.answers,...p.answers].map(a=>[a.exerciseId,a]))
        // The initial plan stays fixed if two devices began the same daily test offline.
        state.sessions[p.id]={...prev,answers:prev.exercises.flatMap(q=>answers.has(q.id)?[answers.get(q.id)!]:[])}
      }
    }
  }
  state.words=[...words.values()]; state.books=[...books.values()]; return state
}
export function normalizeAnswer(text:string) { return text.normalize('NFKC').trim().replace(/[\s。！!？?]+/g,'').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)) }
export function isCorrect(answer:string, accepted:string[]) { const n=normalizeAnswer(answer); return n.length>0 && accepted.some(a=>normalizeAnswer(a)===n) }
export function dueKeys(state:State,prefix:string,now=new Date()) { return Object.entries(state.cards).filter(([k,c])=>k.startsWith(prefix) && c.due<=now).sort((a,b)=>+a[1].due-+b[1].due).map(([k])=>k) }
export function intervalLabel(card:Card, now=new Date()) { const minutes=Math.max(1,Math.round((+card.due-+now)/60000)); return minutes<60?`${minutes} мин.`:minutes<1440?`${Math.round(minutes/60)} ч.`:`${Math.round(minutes/1440)} дн.` }
export function streak(state:State, now=new Date()) {
  const days=new Set(state.reviews.map(r=>dayKey(new Date(r.at)))); const d=new Date(now); if(!days.has(dayKey(d))) d.setDate(d.getDate()-1)
  let n=0; while(days.has(dayKey(d))) {n++;d.setDate(d.getDate()-1)} return n
}
export function dailyQuestions(pool:Exercise[],state:State,now=new Date(),limit=12,random=Math.random) {
  const yesterday=previousDay(now)
  const recentLessons=new Set(state.reviews.filter(r=>dayKey(new Date(r.at))===yesterday).map(r=>r.lesson))
  const eligible=pool.filter(q=>state.cards[q.key])
  const scored=eligible.map(q=>({q,score:(recentLessons.has(q.lesson)?100:0)+(state.cards[q.key].lapses>0?50:0)+(state.cards[q.key].due<=now?25:0)+random()*20})).sort((a,b)=>b.score-a.score)
  const chosen:Exercise[]=[],seen=new Set<string>()
  // Give each available subject a place, then fill by yesterday/weak/due priority.
  for(const category of ['word','grammar','kanji']) { const candidate=scored.find(s=>s.q.category===category); if(candidate && chosen.length<limit) {chosen.push(candidate.q);seen.add(candidate.q.key)} }
  for(const {q} of scored) if(chosen.length<limit && !seen.has(q.key)) {chosen.push(q);seen.add(q.key)}
  for(let i=chosen.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]]}
  return chosen
}
