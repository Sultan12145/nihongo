const {app,BrowserWindow,protocol,net,ipcMain,shell}=require('electron')
const path=require('node:path')
const {pathToFileURL}=require('node:url')
const {autoUpdater}=require('electron-updater')
protocol.registerSchemesAsPrivileged([{scheme:'nihongo',privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,allowServiceWorkers:true,stream:true}}])
app.setName('Nihongo')
const locked=app.requestSingleInstanceLock()
let mainWindow
autoUpdater.autoDownload=false
autoUpdater.autoInstallOnAppQuit=false
autoUpdater.allowPrerelease=true
autoUpdater.on('error',()=>{})
if(!locked)app.quit()
else app.whenReady().then(()=>{
  const root=path.join(__dirname,'..','dist')
  protocol.handle('nihongo',request=>{
    const url=new URL(request.url)
    if(url.hostname!=='app')return new Response('Not found',{status:404})
    let rel
    try{rel=decodeURIComponent(url.pathname)}catch{return new Response('Bad request',{status:400})}
    const filename=path.resolve(root,'.'+(rel==='/'?'/index.html':rel))
    if(!filename.startsWith(root+path.sep))return new Response('Forbidden',{status:403})
    return net.fetch(pathToFileURL(filename).href)
  })
  const trusted=event=>event.sender===mainWindow?.webContents&&event.senderFrame?.url.startsWith('nihongo://app/')
  ipcMain.handle('nihongo:version',event=>{if(!trusted(event))throw Error('Недоступно');return app.getVersion()})
  ipcMain.handle('nihongo:check',async(event,address)=>{
    if(!trusted(event)||typeof address!=='string')throw Error('Недоступно')
    const url=new URL(address)
    if(url.protocol!=='https:'||url.username||url.password)throw Error('Нужен HTTPS-адрес сервера обновлений')
    autoUpdater.setFeedURL({provider:'generic',url:url.href})
    const result=await autoUpdater.checkForUpdates()
    if(!result||result.updateInfo.version===app.getVersion())return {status:'Установлена последняя версия.'}
    return {status:`Доступна версия ${result.updateInfo.version}.`,version:result.updateInfo.version}
  })
  ipcMain.handle('nihongo:install',async event=>{if(!trusted(event))throw Error('Недоступно');await autoUpdater.downloadUpdate();autoUpdater.quitAndInstall(false,true)})
  mainWindow=new BrowserWindow({width:1260,height:860,minWidth:390,minHeight:600,title:'日本語',backgroundColor:'#f5f3ed',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}})
  mainWindow.setMenuBarVisibility(false)
  mainWindow.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))void shell.openExternal(url);return {action:'deny'}})
  mainWindow.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith('nihongo://app/'))event.preventDefault()})
  mainWindow.loadURL('nihongo://app/index.html#/home')
  app.on('second-instance',()=>{mainWindow.show();mainWindow.focus()})
})
app.on('window-all-closed',()=>app.quit())
