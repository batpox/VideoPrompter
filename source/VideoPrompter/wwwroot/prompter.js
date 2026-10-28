// Browser Web Speech API bridge. Matching is performed by the C# ScriptTracker.
// SRT cue timing is estimated from when final recognition results arrive, not audio timestamps.
let recognition, reference, active=false;
let sessionStart=0, cues=[], lastCueEnd=0;
function scrollToWord(index){document.getElementById('word-'+index)?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}
function recordCaption(text){
 const words=text.trim().split(/\s+/).length;
 const end=Math.max(0,(performance.now()-sessionStart)/1000);
 const duration=Math.max(1,Math.min(8,words*0.42));
 const start=Math.max(lastCueEnd,end-duration);
 const cueEnd=Math.max(start+0.25,end);
 cues.push({start,end:cueEnd,text:text.trim()});
 lastCueEnd=cueEnd;
}
function srtTime(seconds){
 const ms=Math.round(Math.max(0,seconds)*1000);
 const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60;
 return [h,m,s].map(v=>String(v).padStart(2,'0')).join(':')+','+String(ms%1000).padStart(3,'0');
}
function exportSrt(){
 if(!cues.length){alert('No finalized speech captions yet. Start speaking, then export.');return;}
 const content=cues.map((cue,i)=>`${i+1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`).join('\n');
 const url=URL.createObjectURL(new Blob([content],{type:'application/x-subrip;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='VideoPrompter-'+new Date().toISOString().replace(/[:.]/g,'-')+'.srt';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function start(dotnet){
 reference=dotnet;
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition)throw new Error('This browser does not support speech recognition. Use Edge or Chrome.');
 recognition=new SpeechRecognition();recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=true;
 cues=[];lastCueEnd=0;sessionStart=performance.now();
 recognition.onresult=event=>{
   for(let i=event.resultIndex;i<event.results.length;i++){
     const result=event.results[i],text=result[0]?.transcript||'';
     if(text.trim()){
       if(result.isFinal)recordCaption(text);
       reference?.invokeMethodAsync('OnTranscript',text,result.isFinal);
     }
   }
 };
 recognition.onerror=e=>{reference?.invokeMethodAsync('OnStatus','Speech error: '+e.error);};
 recognition.onend=()=>{if(active)recognition.start();};
 active=true;recognition.start();
}
function stop(){active=false;recognition?.stop();recognition=null;}
window.videoPrompter={start,stop,scrollTo:scrollToWord,exportSrt};
