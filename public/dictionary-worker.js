let index;
let loading;
async function load() {
  if (index) return;
  loading ??= fetch('./data/dictionary-manifest.json').then(r => {
    if (!r.ok) throw Error('Словарь недоступен');
    return r.json();
  }).then(async manifest => {
    const entries=(await Promise.all(manifest.parts.map(async part=>{const r=await fetch('./data/'+part);if(!r.ok)throw Error('Не удалось загрузить часть словаря');return r.json()}))).flat();
    const next = new Map();
    for (const entry of entries) for (const form of new Set(entry.forms)) {
      const found = next.get(form) || [];
      found.push(entry); next.set(form, found);
    }
    index = next;
  }).catch(e => { loading = undefined; throw e; });
  await loading;
}
function variants(word) {
  const found = new Set([word]);
  const rules = [['ました','る'],['ます','る'],['ません','る'],['ている','る'],['ていた','る'],['った','う'],['った','つ'],['った','る'],['いた','く'],['いだ','ぐ'],['んだ','む'],['んだ','ぶ'],['んだ','ぬ'],['した','す'],['して','する'],['した','する'],['かった','い'],['くない','い'],['ない','る'],['た','る'],['て','る']];
  for (const [suffix,end] of rules) if (word.endsWith(suffix)) found.add(word.slice(0,-suffix.length)+end);
  for (const suffix of ['ます','ました','ません','ましょう']) if (word.endsWith(suffix)) {
    const stem=word.slice(0,-suffix.length),last=stem.at(-1);
    const rows={'い':'う','き':'く','ぎ':'ぐ','し':'す','ち':'つ','に':'ぬ','び':'ぶ','み':'む','り':'る'};
    if(last && rows[last]) found.add(stem.slice(0,-1)+rows[last]);
    if(stem.endsWith('し')) found.add(stem.slice(0,-1)+'する');
  }
  return [...found];
}
self.onmessage = async e => {
  try {
    await load();
    const matches=variants(e.data.word.trim()).flatMap(word=>(index.get(word)||[]).map(entry=>({...entry,matched:word})));
    const unique=[...new Map(matches.map(x=>[x.id,x])).values()];
    const rus=unique.filter(x=>x.lang==='rus');
    self.postMessage({id:e.data.id,results:(rus.length?rus:unique).slice(0,8)});
  } catch(error) { self.postMessage({id:e.data.id,error:String(error)}); }
};
