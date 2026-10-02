import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './MainApp'
import './styles.css'
import './updates.css'
import { Capacitor } from '@capacitor/core'

if(!Capacitor.isNativePlatform()&&!window.nihongoDesktop&&'serviceWorker' in navigator){
  let refreshing=false
  const hadController=!!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController&&!refreshing){refreshing=true;window.location.reload()}})
  window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js').then(reg=>{window.nihongoUpdate=reg;reg.addEventListener('updatefound',()=>{reg.installing?.addEventListener('statechange',()=>{if(reg.waiting)window.dispatchEvent(new Event('nihongo-update-ready'))})})}).catch(()=>{})})
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
