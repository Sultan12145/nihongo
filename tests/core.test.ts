import test from 'node:test'
import assert from 'node:assert/strict'
import { project, mergeEvents, dueKeys, isCorrect, dailyQuestions, dayKey, previousDay, validEvent, type StudyEvent, type Exercise } from '../src/core.ts'
import { checkStrokes, resample } from '../src/strokes.ts'
const now=new Date('2026-09-14T12:00:00Z')
const review=(id:string,key:string,grade:number,at=now.toISOString()):StudyEvent=>({id,type:'review',at,payload:{key,grade,lesson:1,source:'test'}})
test('FSRS persists due dates after JSON round trip and repeats Again sooner than Easy',()=>{
  const state=project([review('a','word:a',1),review('b','word:b',4)])
  assert.ok(state.cards['word:a'].due<state.cards['word:b'].due)
  const restored=project(JSON.parse(JSON.stringify(state.events)))
  assert.equal(+restored.cards['word:a'].due,+state.cards['word:a'].due)
  assert.deepEqual(dueKeys(restored,'word:',now),[])
  assert.ok(dueKeys(restored,'word:',new Date(+now+2*60000)).includes('word:a'))
})
test('duplicate events are replayed once and offline event merge is order independent',()=>{
  const a=review('a','word:a',3),b=review('b','grammar:g1',1)
  assert.deepEqual(mergeEvents([a],[b,a]),mergeEvents([b,a],[a]))
  const state=project(mergeEvents([a],[a,b]));assert.equal(state.reviews.length,2);assert.equal(state.cards['word:a'].reps,1)
})
test('normalization accepts kana, kanji, full width and katakana but rejects wrong/blank responses',()=>{
  for(const answer of ['産地','さんち',' サンチ　','ｻﾝﾁ'])assert.equal(isCorrect(answer,['産地','さんち']),true)
  assert.equal(isCorrect('産業',['産地','さんち']),false);assert.equal(isCorrect('　',['']),false)
})
test('daily test contains learned subjects, never unseen material, and no duplicate concept',()=>{
  const state=project([review('a','word:a',3),review('b','grammar:b',1),review('c','kanji:c',3)])
  const pool:Exercise[]=[['word','a'],['grammar','b'],['kanji','c'],['word','unseen'],['word','a']].map(([category,k],i)=>({id:String(i),key:`${category}:${k}`,category:category as Exercise['category'],lesson:1,prompt:'',sentence:'',answers:['a'],explanation:''}))
  const questions=dailyQuestions(pool,state,now,12,()=>.5)
  assert.equal(questions.length,3);assert.equal(new Set(questions.map(q=>q.category)).size,3);assert.ok(!questions.some(q=>q.key.includes('unseen')))
})
test('yesterday uses calendar days and first-day learner gets empty daily queue',()=>{
  const d=new Date(2026,0,1,0,1);assert.equal(previousDay(d),'2025-12-31');assert.equal(dayKey(d),'2026-01-01');assert.deepEqual(dailyQuestions([],project([]),d),[])
})
test('rejected storage events cannot inject invalid ratings',()=>{
  assert.equal(validEvent(review('a','word:a',8)),false);assert.equal(validEvent({...review('a','word:a',3),at:'broken'}),false)
})
const horizontal=[{x:15,y:20},{x:85,y:20}],vertical=[{x:50,y:30},{x:50,y:90}]
test('writing accepts reference, rejects reverse direction, swapped order and wrong count',()=>{
  const ref=[horizontal,vertical]
  assert.equal(checkStrokes(ref,ref).ok,true)
  assert.equal(checkStrokes([[...horizontal].reverse(),vertical],ref).ok,false)
  assert.equal(checkStrokes([vertical,horizontal],ref).ok,false)
  assert.equal(checkStrokes([horizontal],ref).ok,false)
  assert.equal(checkStrokes([[{x:50,y:50}],vertical],ref).ok,false)
})
test('resampling ignores pointer sampling speed',()=>{
  assert.deepEqual(resample([{x:0,y:0},{x:1,y:0},{x:10,y:0}],3),[{x:0,y:0},{x:5,y:0},{x:10,y:0}])
})

test('daily session merges answers from two devices while preserving its first question plan',()=>{
  const exercises:Exercise[]=['a','b'].map(id=>({id,key:`word:${id}`,category:'word',lesson:1,prompt:'',sentence:id,answers:[id],explanation:''}))
  const base={id:'daily-test',mode:'daily',day:'2026-09-14',exercises,answers:[]}
  const events:StudyEvent[]=[
    {id:'s1',at:'2026-09-14T01:00:00Z',type:'session',payload:base},
    {id:'s2',at:'2026-09-14T01:01:00Z',type:'session',payload:{...base,answers:[{exerciseId:'b',answer:'b',correct:true}]}},
    {id:'s3',at:'2026-09-14T01:02:00Z',type:'session',payload:{...base,exercises:[...exercises].reverse(),answers:[{exerciseId:'a',answer:'a',correct:true}]}}
  ]
  const session=project(events).sessions['daily-test']
  assert.deepEqual(session.exercises.map(q=>q.id),['a','b'])
  assert.deepEqual(session.answers.map(a=>a.exerciseId),['a','b'])
  assert.deepEqual(project([...events].reverse()).sessions['daily-test'],session)
})
