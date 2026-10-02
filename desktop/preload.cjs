const {contextBridge,ipcRenderer}=require('electron')
contextBridge.exposeInMainWorld('nihongoDesktop',{version:()=>ipcRenderer.invoke('nihongo:version'),check:address=>ipcRenderer.invoke('nihongo:check',address),install:()=>ipcRenderer.invoke('nihongo:install')})
