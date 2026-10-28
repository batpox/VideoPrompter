// Browser Web Speech API bridge. Matching is performed by the C# ScriptTracker.
// SRT cue timing is estimated from when final recognition results arrive, not audio timestamps.
let recognition, reference, active=false;
let sessionStart=0, cues=[], lastCueEnd=0;

let textFolder=null, srtFolder=null;
function openStore(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open('VideoPrompterFolders',1);
  request.onupgradeneeded=()=>request.result.createObjectStore('handles');
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 });
}
async function saveHandle(key,handle){
 const db=await openStore();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('handles','readwrite');tx.objectStore('handles').put(handle,key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
 finally{db.close();}
}
async function readHandle(key){
 const db=await openStore();
 try{return await new Promise((resolve,reject)=>{const req=db.transaction('handles').objectStore('handles').get(key);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});}
 finally{db.close();}
}
async function initializeFolders(dotnet){
 reference=dotnet;
 try{textFolder=await readHandle('text');srtFolder=await readHandle('srt');await reportFolders();}
 catch(e){await reference?.invokeMethodAsync('OnFolderError',String(e.message||e));}
}
async function reportFolders(){
 const files=[];
 if(textFolder)for await(const [name,handle] of textFolder.entries())
  if(handle.kind==='file'&&/\.(txt|md)$/i.test(name))files.push(name);
 files.sort((a,b)=>a.localeCompare(b));
 await reference?.invokeMethodAsync('OnFoldersChanged',textFolder?.name||'',srtFolder?.name||'',files);
}
async function selectFolder(which){
 if(!window.showDirectoryPicker)throw new Error('Folder selection requires Edge or Chrome on localhost/HTTPS.');
 try{
  const handle=await window.showDirectoryPicker({mode:which==='srt'?'readwrite':'read'});
  if(which==='text')textFolder=handle;else srtFolder=handle;
  await saveHandle(which,handle);await reportFolders();
 }catch(e){if(e.name!=='AbortError')throw e;}
}
async function clearSrtFolder(){srtFolder=null;await saveHandle('srt',null);await reportFolders();}
async function loadTextFile(name){
 if(!textFolder||!name)throw new Error('Select a text folder and file first.');
 const permission=await textFolder.requestPermission({mode:'read'});
 if(permission!=='granted')throw new Error('Text folder permission was not granted.');
 const file=await(await textFolder.getFileHandle(name)).getFile();
 return await file.text();
}

function scrollToWord(index){document.getElementById('word-'+index)?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}
let captionQueue=Promise.resolve();
function recordScriptCaption(words,recognitionEnd){
 if(!words?.length)return;
 // Split original-script words into readable groups; preserve spelling and punctuation.
 const duration=Math.max(1,Math.min(12,words.length*0.42));
 const start=Math.max(lastCueEnd,recognitionEnd-duration);
 const actualEnd=Math.max(start+0.25,recognitionEnd);
 const chunkSize=8;
 const chunks=[];
 for(let i=0;i<words.length;i+=chunkSize)chunks.push(words.slice(i,i+chunkSize));
 chunks.forEach((chunk,i)=>{
  const from=start+(actualEnd-start)*i/chunks.length;
  const to=start+(actualEnd-start)*(i+1)/chunks.length;
  cues.push({start:from,end:to,text:chunk.join(' ')});
 });
 lastCueEnd=actualEnd;
}
function clearCaptions(){cues=[];lastCueEnd=0;captionQueue=Promise.resolve();}
function srtTime(seconds){
 const ms=Math.round(Math.max(0,seconds)*1000);
 const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;
 return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');
}
async function exportSrt(){
 await captionQueue;
 if(!cues.length){alert('No finalized speech captions yet. Start speaking, then export.');return;}
 const content=cues.map((cue,i)=>`${i+1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`).join('\n');
 const destination=srtFolder||textFolder;
 if(destination){
  try{
   const permission=await destination.requestPermission({mode:'readwrite'});
   if(permission!=='granted')throw new Error('Write permission was not granted.');
   const handle=await destination.getFileHandle('VideoPrompter-'+new Date().toISOString().replace(/[:.]/g,'-')+'.srt',{create:true});
   const stream=await handle.createWritable();await stream.write(content);await stream.close();
   alert('SRT saved to '+destination.name);return;
  }catch(e){alert('Unable to save SRT in selected folder: '+(e.message||e));return;}
 }
 const url=URL.createObjectURL(new Blob([content],{type:'application/x-subrip;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='VideoPrompter-'+new Date().toISOString().replace(/[:.]/g,'-')+'.srt';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function getSpeechEngine(){return localStorage.getItem("VideoPrompterSpeechEngine")==="local"?"local":"browser";}
function setSpeechEngine(engine){if(engine!=="browser"&&engine!=="local")throw new Error("Unknown speech source");localStorage.setItem("VideoPrompterSpeechEngine",engine);}
async function start(dotnet,engine="browser"){
 if(engine!=="browser")throw new Error("Local speech recognition is not implemented yet.");
 reference=dotnet;
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition)throw new Error('This browser does not support speech recognition. Use Edge or Chrome.');
 recognition=new SpeechRecognition();recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=true;
 clearCaptions();sessionStart=performance.now();
 recognition.onresult=event=>{
   for(let i=event.resultIndex;i<event.results.length;i++){
     const result=event.results[i],text=result[0]?.transcript||'';
     if(text.trim()){
       reference?.invokeMethodAsync('OnTranscript',text,result.isFinal);
       if(result.isFinal){
        const end=(performance.now()-sessionStart)/1000;
        const currentReference=reference;
        captionQueue=captionQueue.then(async()=>{
         const words=await currentReference.invokeMethodAsync('OnFinalCaption',text);
         recordScriptCaption(words,end);
        }).catch(e=>console.warn('Caption matching failed:',e));
       }
     }
   }
 };
 recognition.onerror=e=>{reference?.invokeMethodAsync('OnStatus','Speech error: '+e.error);};
 recognition.onend=()=>{if(active)recognition.start();};
 active=true;recognition.start();
}
function stop(){active=false;recognition?.stop();recognition=null;}
window.videoPrompter={start,stop,getSpeechEngine,setSpeechEngine,scrollTo:scrollToWord,exportSrt,clearCaptions,initializeFolders,selectFolder,clearSrtFolder,loadTextFile};
