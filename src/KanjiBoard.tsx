import { useEffect, useRef, useState } from 'react'
import { kanji } from './data'
import { checkStrokes, type Stroke } from './strokes'
import { commit } from './store'
export default function KanjiBoard(){
  const [selected,setSelected]=useState(0),[guide,setGuide]=useState(true),[hint,setHint]=useState(false),[animation,setAnimation]=useState(0),[hintUsed,setHintUsed]=useState(false)
  const [paths,setPaths]=useState<Record<string,string[]>>({}),[drawn,setDrawn]=useState<Stroke[]>([]),[message,setMessage]=useState(''),[evaluated,setEvaluated]=useState(false),[error,setError]=useState('')
  const canvas=useRef<HTMLCanvasElement>(null),active=useRef<Stroke|null>(null),pathRefs=useRef<(SVGPathElement|null)[]>([]),sessionId=useRef(crypto.randomUUID())
  const card=kanji[selected],template=paths[card.character]||[]
  useEffect(()=>{fetch('./data/strokes.json').then(r=>{if(!r.ok)throw Error('Не удалось загрузить образцы');return r.json()}).then(setPaths).catch(e=>setError(e.message))},[])
  useEffect(()=>{const ctx=canvas.current?.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,520,520);ctx.strokeStyle='#183f32';ctx.lineWidth=8;ctx.lineCap='round';ctx.lineJoin='round';for(const stroke of drawn){ctx.beginPath();stroke.forEach((p,i)=>i?ctx.lineTo(p.x*520/109,p.y*520/109):ctx.moveTo(p.x*520/109,p.y*520/109));ctx.stroke()}},[drawn])
  useEffect(()=>{if(!hint)return;const timer=setTimeout(()=>setHint(false),Math.max(3000,template.length*700));return()=>clearTimeout(timer)},[hint,animation,template.length])
  function reset(){setDrawn([]);setMessage('');setEvaluated(false);setHint(false);setHintUsed(false);active.current=null;sessionId.current=crypto.randomUUID()}
  function coords(e:React.PointerEvent<HTMLCanvasElement>){const b=e.currentTarget.getBoundingClientRect();return{x:(e.clientX-b.left)*109/b.width,y:(e.clientY-b.top)*109/b.height}}
  function start(e:React.PointerEvent<HTMLCanvasElement>){if(evaluated||active.current||e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);const next=[coords(e)];active.current=next;setDrawn(v=>[...v,next])}
  function move(e:React.PointerEvent<HTMLCanvasElement>){if(!active.current)return;const next=[...active.current,coords(e)];active.current=next;setDrawn(v=>[...v.slice(0,-1),next])}
  function check(){if(evaluated||!template.length)return
    const reference=pathRefs.current.slice(0,template.length).map(path=>{const length=path!.getTotalLength();return Array.from({length:32},(_,i)=>{const p=path!.getPointAtLength(length*i/31);return{x:p.x,y:p.y}})})
    const result=checkStrokes(drawn,reference)
    try{if(!guide)commit('review',{key:`kanji:${card.id}`,grade:result.ok?(hintUsed?2:3):1,lesson:card.lesson,source:'writing'},`writing-${sessionId.current}`)}catch(e){setError(String(e));return}
    setMessage(`${result.message} Совпадение: ${result.score}%.${guide?' Обводка не оценивает запоминание.':' Результат записан в SRS.'}`);setEvaluated(true)
  }
  return <><div className="page-heading"><span>ПИСЬМО И ПАМЯТЬ</span><h1>Практика кандзи</h1><p>Каждая черта проверяется по траектории KanjiVG. Допуск учитывает письмо пальцем, стилусом и мышью.</p></div>
    <div className="chip-row">{kanji.map((k,i)=><button key={k.id} className={i===selected?'chip active':'chip'} onClick={()=>{setSelected(i);reset()}}>{guide?k.character:`Задание ${i+1}`}</button>)}</div>
    <div className="board-layout"><div><div className="canvas-toolbar"><label><input type="checkbox" checked={guide} onChange={e=>{setGuide(e.target.checked);reset()}}/> Обводка с образцом</label><button onClick={()=>{setDrawn(v=>v.slice(0,-1));setMessage('')}} disabled={evaluated}>Отменить черту</button><button onClick={reset}>Начать заново</button></div>
    <div className="canvas-wrap"><div className="grid-lines"/><svg viewBox="0 0 109 109" className="stroke-template" aria-hidden="true" key={`${card.id}-${animation}`}>
      {template.map((d,i)=><path key={i} ref={el=>{pathRefs.current[i]=el}} d={d} className={hint?'stroke-animation':''} pathLength="1" style={{opacity:guide||hint?1:0,animationDelay:`${i*.65}s`}}/>)}
    </svg><canvas ref={canvas} width={520} height={520} aria-label="Доска написания кандзи" onPointerDown={start} onPointerMove={move} onPointerUp={()=>{active.current=null}} onPointerCancel={()=>{active.current=null;setDrawn(v=>v.slice(0,-1))}}/></div>
    <div className="chip-row"><button className="primary-button" onClick={check} disabled={!drawn.length||evaluated||!template.length}>Проверить написание</button><button className="chip" onClick={()=>{setHint(true);setHintUsed(true);setAnimation(v=>v+1)}}>Показать анимацию</button></div><p role="status">{message||error}</p></div>
    <aside className="kanji-info">{guide?<div className="kanji-large">{card.character}</div>:<h2>Напишите по памяти</h2>}<span>ЗНАЧЕНИЕ</span><h3>{card.meanings.join(', ')}</h3><p>Он: {card.onyomi.join('・')}</p><p>Кун: {card.kunyomi.join('・')||'—'}</p><p>{card.strokes} черт</p>{guide&&card.examples.map(ex=><div className="kanji-word" key={ex.word}><b>{ex.word}</b><small>{ex.reading}</small><p>{ex.translation}</p></div>)}{!guide&&<p>Иероглиф и слова с ним скрыты. Образец появляется только по кнопке подсказки.</p>}<small>Проверка геометрии, а не распознавание любого почерка.</small></aside></div>
  </>
}
