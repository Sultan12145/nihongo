export type Point = {x:number;y:number}
export type Stroke = Point[]
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y)
export function resample(points:Stroke,n=32):Stroke {
  if(points.length<2)return Array.from({length:n},()=>points[0]||{x:0,y:0})
  const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+dist(points[i-1],points[i]))
  const total=lengths.at(-1)!;if(total<.001)return Array.from({length:n},()=>points[0])
  let j=1;return Array.from({length:n},(_,i)=>{const target=total*i/(n-1);while(j<lengths.length-1&&lengths[j]<target)j++;const t=(target-lengths[j-1])/(lengths[j]-lengths[j-1]||1);return{x:points[j-1].x+(points[j].x-points[j-1].x)*t,y:points[j-1].y+(points[j].y-points[j-1].y)*t}})
}
export function checkStrokes(actual:Stroke[],expected:Stroke[],tolerance=12){
  if(actual.length!==expected.length)return{ok:false,score:0,message:`Нужно ${expected.length} черт; нарисовано ${actual.length}. Каждая черта — отдельное движение.`}
  const errors:number[]=[];let sum=0
  for(let i=0;i<expected.length;i++){
    const a=resample(actual[i]),b=resample(expected[i]);const mean=a.reduce((s,p,j)=>s+dist(p,b[j]),0)/a.length
    const ends=Math.max(dist(a[0],b[0]),dist(a.at(-1)!,b.at(-1)!));sum+=mean
    if(mean>tolerance||ends>tolerance*1.9)errors.push(i+1)
  }
  const score=Math.max(0,Math.round(100-(sum/expected.length)*3))
  return{ok:errors.length===0,score,message:errors.length?`Проверьте форму, порядок и направление черт: ${errors.join(', ')}.`:'Порядок, направление и форма черт совпали с образцом.'}
}
