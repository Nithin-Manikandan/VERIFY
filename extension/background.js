const SITE='https://verify-scam-investigator.randomdude15.chatgpt.site';
function storageGet(keys){return chrome.storage.local.get(keys)}
async function clearPairing(){await chrome.storage.local.remove(['token','deviceId']);await chrome.storage.local.set({cloudEnabled:false,syncEnabled:false})}
async function pair(code){
  const response=await fetch(`${SITE}/api/extension/pair`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,label:'Chrome Gmail Guard'})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not pair extension.');
  await chrome.storage.local.set({token:data.token,deviceId:data.deviceId,syncEnabled:true});
  return {connected:true};
}
async function scan(text){
  const {token,cloudEnabled}=await storageGet(['token','cloudEnabled']);
  if(!token||!cloudEnabled)return {skipped:true};
  const response=await fetch(`${SITE}/api/extension/analyze`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({text})});
  const data=await response.json();if(response.status===401)await clearPairing();if(!response.ok)throw new Error(data.error||'Cloud check unavailable.');
  return data;
}
async function syncAlerts(alerts){
  const {token,syncEnabled}=await storageGet(['token','syncEnabled']);
  if(!token||!syncEnabled)return {skipped:true};
  if(!Array.isArray(alerts)||alerts.length>30)throw new Error('Invalid alert batch.');
  const response=await fetch(`${SITE}/api/extension/alerts`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({alerts})});
  const data=await response.json();if(response.status===401)await clearPairing();if(!response.ok)throw new Error(data.error||'Dashboard update unavailable.');
  return data;
}
async function disconnect(){
  const {token}=await storageGet(['token']);
  if(token)await fetch(`${SITE}/api/extension/revoke`,{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>null);
  await clearPairing();
  return {connected:false};
}
chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  const fromGmail=sender.tab?.url?.startsWith('https://mail.google.com/');
  const fromPopup=sender.url?.startsWith(chrome.runtime.getURL('popup.html'));
  if(['SCAN','SYNC_ALERTS'].includes(message?.type)&&!fromGmail)return;
  if(['PAIR','DISCONNECT','STATE','SET_OPTIONS'].includes(message?.type)&&!fromPopup)return;
  (async()=>{
    if(message.type==='SCAN'){
      if(typeof message.text!=='string'||message.text.length>6000)throw new Error('Email is too long for a cloud check.');
      return scan(message.text);
    }
    if(message.type==='SYNC_ALERTS')return syncAlerts(message.alerts);
    if(message.type==='PAIR')return pair(message.code);
    if(message.type==='DISCONNECT')return disconnect();
    if(message.type==='STATE')return storageGet(['token','enabled','cloudEnabled','syncEnabled']);
    if(message.type==='SET_OPTIONS'){
      const updates={};
      if(typeof message.enabled==='boolean')updates.enabled=message.enabled;
      if(typeof message.cloudEnabled==='boolean')updates.cloudEnabled=message.cloudEnabled;
      if(typeof message.syncEnabled==='boolean')updates.syncEnabled=message.syncEnabled;
      await chrome.storage.local.set(updates);return {ok:true};
    }
    throw new Error('Unknown action.');
  })().then(result=>sendResponse({ok:true,result})).catch(error=>sendResponse({ok:false,error:error.message||'Request failed.'}));
  return true;
});
