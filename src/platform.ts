import { Capacitor } from '@capacitor/core'
export async function exportBackup(text:string, filename:string){
  if(Capacitor.isNativePlatform()){
    const [{Filesystem,Directory,Encoding},{Share}]=await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')])
    const result=await Filesystem.writeFile({path:filename,data:text,directory:Directory.Cache,encoding:Encoding.UTF8})
    await Share.share({title:'Прогресс 日本語',url:result.uri})
  }else{
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a')
    a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }
}
