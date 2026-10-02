import { useEffect, useRef, useState } from 'react'
import { createEmptyCard, type Grade } from 'ts-fsrs'
import { allWords, exercises } from './exercises'
import { kanji } from './data'
import { commit, commitMany, getState, useStudy } from './store'
import { dailyQuestions, dayKey, dueKeys, intervalLabel, isCorrect, scheduler, type Exercise, type Session } from './core'
import { Japanese } from './Japanese'

export function Cards({category,mode,onClose}:{category:'word'|'kanji';mode:'learn'|'due';onClose:()=>void}){
  const state=useStudy(),[reverse,setReverse]=useState(false),[revealed,setRevealed]=useState(false),[index,setIndex]=useState(0),[error,setError]=useState('')
  const [queue]=useState(()=>{const s=getState();const items=category==='word'?allWords(s.words):kanji;return items.filter(i=>mode==='learn'?!s.cards[`${category}:${i.id}`]:dueKeys(s,`${category}:`).includes(`${category}:${i.id}`)).map(i=>i.id)})
  const key=`${category}:${queue[index]}`,word=allWords(state.words).find(w=>w.id===queue[index]),character=kanji.find(k=>k.id===queue[index]),rated=useRef(false)
  const current=state.cards[key]||createEmptyCard(),preview=scheduler.repeat(current,new Date())
  function rate(grade:Grade){if(rated.current)return;rated.current=true;try{commit('review',{key,grade,source:'cards',lesson:(category==='word'?word:character)?.lesson||1});setIndex(i=>i+1);setRevealed(false);setError('')}catch(e){setError(String(e))}finally{rated.current=false}}
  return <><button className="text-back" onClick={onClose}>← Назад</button><div className="page-heading"><span>{mode==='learn'?'НОВЫЙ МАТЕРИАЛ':'SRS · ПОВТОРЕНИЕ'}</span><h1>{category==='word'?'Карточки слов':'Карточки кандзи'}</h1><p>{Math.min(index,queue.length)} / {queue.length} ответов</p></div>
    {index>=queue.length?<div className="theory-card"><h2>{queue.length?'Сессия завершена':'Сейчас карточек нет'}</h2><p>Повторения появляются по расписанию. Новые карточки доступны через «Изучить».</p><button className="primary-button" onClick={onClose}>Готово</button></div>:<>
    {category==='word'&&<label className="toggle-label"><input type="checkbox" checked={reverse} onChange={e=>{setReverse(e.target.checked);setRevealed(false)}}/> Русский → японский</label>}
    <div className="flashcard"><div className="card-back">{!revealed?<div className="card-front"><div className="word-jp">{category==='word'?(reverse?word?.meanings.join('; '):word?.written):character?.character}</div><button className="primary-button" onClick={()=>setRevealed(true)}>Показать ответ</button></div>:category==='word'&&word?<><h2><ruby>{word.written}<rt>{word.reading}</rt></ruby></h2><h3>{word.meanings.join('; ')}</h3><p>{word.note}</p><div className="examples">{word.examples.map((ex,i)=><div key={i}><Japanese text={ex.japanese}/><p>{ex.translation}</p></div>)}</div></>:character?<><h2>{character.character} — {character.meanings.join(', ')}</h2><p>Он: {character.onyomi.join('・')}</p><p>Кун: {character.kunyomi.join('・')||'—'}</p>{character.examples.map(ex=><p key={ex.word}><ruby>{ex.word}<rt>{ex.reading}</rt></ruby> — {ex.translation}</p>)}</>:null}</div></div>
    {revealed&&<div className="rating-row">{([1,2,3,4] as Grade[]).map((grade,i)=><button key={grade} onClick={()=>rate(grade)} className={['again','hard','good','easy'][i]}><b>{['Не помню','Сложно','Хорошо','Легко'][i]}</b><span>{intervalLabel(preview[grade].card)}</span></button>)}</div>}<p role="alert">{error}</p></>}
  </>
}

export function Practice({mode,filter,onClose}:{mode:'daily'|'demo'|'practice'|'grammar-due';filter?:string;onClose:()=>void}){
  const state=useStudy(),[answer,setAnswer]=useState(''),[feedback,setFeedback]=useState(''),[failure,setFailure]=useState<Exercise|null>(null),busy=useRef(false),[error,setError]=useState('')
  const [initial]=useState<Session>(()=>{
    const s=getState(),id=mode==='daily'?`daily-${dayKey()}`:crypto.randomUUID()
    if(s.sessions[id])return s.sessions[id]
    let pool=exercises(s.words)
    if(mode==='daily')pool=dailyQuestions(pool,s)
    else if(mode==='grammar-due')pool=pool.filter(q=>q.category==='grammar'&&dueKeys(s,'grammar:').includes(q.key))
    else if(filter)pool=pool.filter(q=>q.key===filter||q.category===filter)
    if(mode==='demo')for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
    return{id,mode,day:dayKey(),exercises:pool,answers:[]}
  })
  const session=state.sessions[initial.id]||initial,index=session.answers.length,q=session.exercises.find(q=>!session.answers.some(a=>a.exerciseId===q.id)),done=!q
  useEffect(()=>{if(initial.exercises.length&&!getState().sessions[initial.id])commit('session',initial)},[initial])
  function submit(e:React.FormEvent){e.preventDefault();if(!q||!answer.trim()||busy.current||failure)return;busy.current=true
    try{const correct=isCorrect(answer,q.answers),next={...session,answers:[...session.answers,{exerciseId:q.id,answer,correct}]}
      commitMany([...(mode!=='demo'?[{type:'review' as const,payload:{key:q.key,grade:correct?3:1,source:mode,lesson:q.lesson}}]:[]),{type:'session',payload:next}]);setFeedback(correct?'Верно!':'');setAnswer('');if(!correct)setFailure(q)
    }catch(e){setError(String(e))}finally{busy.current=false}
  }
  return <><button className="text-back" onClick={onClose}>← Завершить позже</button><div className="page-heading"><span>{mode==='demo'?'ПРОБНАЯ КОНТРОЛЬНАЯ · БЕЗ ВЛИЯНИЯ НА SRS':mode==='daily'?'ЕЖЕДНЕВНАЯ КОНТРОЛЬНАЯ':'ПРАКТИКА С ВВОДОМ'}</span><h1>{mode==='daily'||mode==='demo'?'Смешанный тест':'Упражнения'}</h1><p>{index} / {session.exercises.length} · {mode==='daily'?'Изученное вчера, трудные темы и повторения.':'Слова, грамматика и кандзи проверяются по подготовленным ответам.'}</p></div>
    {failure?<section className="theory-card"><h2>Разберём ошибку</h2><p>{failure.sentence}</p><p>Ответ: <b>{failure.answers.join(' / ')}</b></p><p>{failure.explanation}</p><p>{mode==='demo'?'Пробный ответ не меняет интервалы.':'Тема добавлена в ближайшие повторения.'}</p><button className="primary-button" onClick={()=>{setFailure(null);setFeedback('')}}>Продолжить</button></section>:done?<section className="theory-card"><h2>{session.exercises.length?'Контрольная завершена':'Нет изученного материала для теста'}</h2>{session.exercises.length?<><h3>{session.answers.filter(a=>a.correct).length} из {session.exercises.length} верно</h3>{session.answers.map((a,i)=><div className="grammar-example" key={i}><b>{a.correct?'✓':'✕'} {session.exercises[i].sentence}</b><p>Ваш ответ: {a.answer}</p>{!a.correct&&<p>{session.exercises[i].explanation}</p>}</div>)}</>:<p>Сначала изучите несколько слов, кандзи или правил. Для проверки интерфейса есть пробная контрольная.</p>}<button className="primary-button" onClick={onClose}>На главный экран</button></section>:<form className="theory-card exercise-form" onSubmit={submit}><span>{({word:'Лексика',grammar:'Грамматика',kanji:'Кандзи'})[q.category]} · Урок {q.lesson}</span><h2 className="exercise-sentence">{q.sentence}</h2><p>{q.prompt}</p><label>Ваш ответ<input key={q.id} autoFocus value={answer} onChange={e=>setAnswer(e.target.value)} onKeyDown={e=>{if(e.nativeEvent.isComposing&&e.key==='Enter')e.preventDefault()}} autoComplete="off" required/></label><button className="primary-button" type="submit">Проверить</button><p role="status">{feedback}</p></form>}<p role="alert">{error}</p>
  </>
}
