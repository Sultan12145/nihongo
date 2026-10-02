// Explicit token readings keep kana and particles outside ruby annotations.
const readings:Record<string,string>={'青森県':'あおもりけん','産地':'さんち','有名':'ゆうめい','茶':'ちゃ','静岡':'しずおか','地方':'ちほう','米':'こめ','栽培':'さいばい','温室':'おんしつ','野菜':'やさい','秋':'あき','旬':'しゅん','迎':'むか','魚':'さかな','留学生':'りゅうがくせい','日本':'にほん','来':'き','一人':'ひとり','水':'みず','飲':'の','終':'お','食':'た','急':'いそ','間':'ま','合':'あ'}
const keys=Object.keys(readings).sort((a,b)=>b.length-a.length)
export function Japanese({text,hideWord}:{text:string;hideWord?:string}) {
  const result=[];let i=0
  while(i<text.length){const k=keys.find(k=>text.startsWith(k,i));if(k){result.push(k===hideWord?<span key={i}>{k}</span>:<ruby key={i}>{k}<rt>{readings[k]}</rt></ruby>);i+=k.length}else{result.push(<span key={i}>{text[i]}</span>);i++}}
  return <span lang="ja" className="japanese">{result}</span>
}
