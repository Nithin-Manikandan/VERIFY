const $=id=>document.getElementById(id);
function send(message){return new Promise(resolve=>chrome.runtime.sendMessage(message,response=>resolve(response||{ok:false,error:chrome.runtime.lastError?.message||'Extension unavailable.'})))}
function error(message){$('error').textContent=message;$('error').hidden=!message}
async function load(){
  const response=await send({type:'STATE'});if(!response.ok){error(response.error);return}
  const state=response.result||{},connected=Boolean(state.token);
  $('enabled').checked=state.enabled!==false;$('cloud').checked=Boolean(state.cloudEnabled&&connected);$('cloud').disabled=!connected;$('sync').checked=Boolean(state.syncEnabled&&connected);$('sync').disabled=!connected;
  $('status').textContent=connected?'Account paired':'Not paired yet';
  $('status-detail').textContent=connected?'Local guard is ready. Flagged email previews appear in your dashboard while Gmail is open.':'Create a pairing code in your VERIFY account and enter it here.';
  $('pair-form').hidden=connected;$('disconnect').hidden=!connected;
}
$('pair').addEventListener('click',async()=>{error('');$('pair').disabled=true;const response=await send({type:'PAIR',code:$('code').value});$('pair').disabled=false;if(!response.ok){error(response.error);return}$('code').value='';await load()});
$('disconnect').addEventListener('click',async()=>{error('');const response=await send({type:'DISCONNECT'});if(!response.ok){error(response.error);return}await load()});
$('enabled').addEventListener('change',async event=>{const response=await send({type:'SET_OPTIONS',enabled:event.target.checked});if(!response.ok)error(response.error)});
$('cloud').addEventListener('change',async event=>{const response=await send({type:'SET_OPTIONS',cloudEnabled:event.target.checked});if(!response.ok)error(response.error)});
$('sync').addEventListener('change',async event=>{const response=await send({type:'SET_OPTIONS',syncEnabled:event.target.checked});if(!response.ok)error(response.error)});
void load();
