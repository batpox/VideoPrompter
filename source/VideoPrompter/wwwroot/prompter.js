// Browser API bridge. The UI and script tracker are C#; audio/model inference remains in browser workers.
// TODO: replace native SpeechRecognition with Lars's Moonshine/Silero pipeline for full offline parity.
let recognition, reference, active=false;
function scrollToWord(index){document.getElementById('word-'+index)?.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});}
async function start(dotnet){
 reference=dotnet;
 const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SpeechRecognition)throw new Error('This browser does not support speech recognition. Use Edge or Chrome.');
 recognition=new SpeechRecognition(); recognition.lang='en-US';recognition.continuous=true;recognition.interimResults=true;
 recognition.onresult=event=>{
   for(let i=event.resultIndex;i<event.results.length;i++){
     const result=event.results[i];const text=result[0]?.transcript||'';
     if(text.trim())reference?.invokeMethodAsync('OnTranscript',text,result.isFinal);
   }
 };
 recognition.onerror=e=>{reference?.invokeMethodAsync('OnStatus','Speech error: '+e.error);};
 recognition.onend=()=>{if(active)recognition.start();};
 active=true;recognition.start();
}
function stop(){active=false;recognition?.stop();recognition=null;}
window.videoPrompter={start,stop,scrollTo:scrollToWord};