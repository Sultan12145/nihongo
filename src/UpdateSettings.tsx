import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
export const VERSION='0.2.0'
type Desktop={version:()=>Promise<string>;check:(url:string)=>Promise<{status:string;version?:string}>;install:()=>Promise<void>}
declare global{interface Window{nihongoDesktop?:Desktop;nihongoUpdate?:ServiceWorkerRegistration}}
export function UpdateSettings(){
  const [address,setAddress]=useState(()=>localStorage.getItem('nihongo-update-url')||''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[available,setAvailable]=useState(false)
  const platform=window.nihongoDesktop?'Windows':Capacitor.getPlatform()==='android'?'Android':Capacitor.getPlatform()==='ios'?'iPhone':'Браузер'
  useEffect(()=>{const ready=()=>setAvailable(!!window.nihongoUpdate?.waiting);ready();window.addEventListener('nihongo-update-ready',ready);return()=>window.removeEventListener('nihongo-update-ready',ready)},[])
  async function check(){setBusy(true);setMessage('');setAvailable(false);try{
    if(window.nihongoDesktop){if(!address)throw Error('Укажите адрес сервера обновлений. Пока можно установить новую EXE поверх текущей версии.');const url=new URL(address);if(url.protocol!=='https:')throw Error('Адрес обновлений должен начинаться с https://');localStorage.setItem('nihongo-update-url',address);const result=await window.nihongoDesktop.check(address);setMessage(result.status);setAvailable(!!result.version)}
    else if(Capacitor.isNativePlatform())setMessage(platform==='Android'?'Новая версия устанавливается из APK поверх текущей. Сохранение остаётся. Не удаляйте приложение перед обновлением.':'Обновления нативной версии приходят через TestFlight или App Store.')
    else if(window.nihongoUpdate){await window.nihongoUpdate.update();setAvailable(!!window.nihongoUpdate.waiting);setMessage(window.nihongoUpdate.waiting?'Обновление готово. Сохраните текущий ответ перед перезапуском.':'Запрошена проверка обновлений. Если появится новая версия, станет доступна кнопка перезапуска.')}
    else setMessage('Откройте последнюю сборку. Устанавливаемые версии запускаются без временного сервера.')
  }catch(e){setMessage(e instanceof Error?e.message:String(e))}finally{setBusy(false)}}
  async function install(){setBusy(true);try{if(window.nihongoDesktop)await window.nihongoDesktop.install();else window.nihongoUpdate?.waiting?.postMessage({type:'ACTIVATE_UPDATE'})}catch(e){setMessage(String(e));setBusy(false)}}
  return <section className="theory-card"><h2>Приложение и обновления</h2><p>日本語 · Альфа {VERSION} · {platform}</p>{window.nihongoDesktop&&<label className="file-import">Адрес сервера обновлений (необязательно)<input type="url" value={address} onChange={e=>setAddress(e.target.value)} placeholder="https://…/updates/"/><small>До подключения сервера обновляйте приложение новым установщиком.</small></label>}<div className="chip-row"><button className="chip" disabled={busy} onClick={()=>void check()}>Проверить обновления</button>{available&&<button className="primary-button" disabled={busy} onClick={()=>void install()}>Обновить и перезапустить</button>}</div><p role="status">{message}</p></section>
}
