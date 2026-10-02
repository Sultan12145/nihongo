import { grammar, kanji, vocabulary } from './data'
import type { Exercise } from './core'
import type { VocabularyCard } from './types'
export function allWords(custom:VocabularyCard[]=[]){return [...new Map([...vocabulary,...custom].map(w=>[w.id,w])).values()]}
export function exercises(custom:VocabularyCard[]=[]):Exercise[]{return [
  ...allWords(custom).map(w=>({id:`ex-${w.id}`,key:`word:${w.id}`,category:'word' as const,lesson:w.lesson,prompt:`Впишите слово: ${w.meanings.join('; ')}. Допустимы кана и кандзи.`,sentence:w.examples[0]?.japanese.includes(w.written)?w.examples[0].japanese.replaceAll(w.written,'＿＿＿'):'＿＿＿',answers:[w.written,w.reading],explanation:`${w.written}【${w.reading}】 — ${w.meanings.join('; ')}`})),
  ...grammar.map((g,i)=>({id:`ex-${g.id}`,key:`grammar:${g.id}`,category:'grammar' as const,lesson:g.lesson,prompt:['Вставьте конструкцию «в качестве».','Вставьте частицу «только».','Закончите условную форму глагола 急ぐ: «если не поторопиться».'][i],sentence:['留学生＿＿＿日本へ来ました。','水＿＿＿飲みました。','急が＿＿＿、間に合わない。'][i],answers:[['として'],['だけ'],['なければ']][i],explanation:`${g.title}: ${g.explanation} ${g.formation}`})),
  ...kanji.map(k=>({id:`ex-${k.id}`,key:`kanji:${k.id}`,category:'kanji' as const,lesson:k.lesson,prompt:`Напишите кандзи: ${k.meanings.join(', ')}. Онные чтения: ${k.onyomi.join('・')}.`,sentence:'＿＿＿',answers:[k.character],explanation:`${k.character}: ${k.meanings.join(', ')}. Примеры: ${k.examples.map(e=>`${e.word} (${e.reading}) — ${e.translation}`).join('; ')}`}))
]}
