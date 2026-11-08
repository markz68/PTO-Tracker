'use strict';
const KEY='pto-tracker-v1';
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const id=()=>crypto.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);
const fresh=()=>({version:1,entries:[],balances:[]});
const valid=o=>o&&o.version===1&&Array.isArray(o.entries)&&Array.isArray(o.balances)&&o.entries.length<10000&&o.balances.length<10000;
let data=fresh();try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(valid(o))data=o}}catch(e){console.error('Storage read error',e)}
let tab='upcoming';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));if(typeof scheduleSync==='function')scheduleSync();return true}catch(e){alert('Could not save. Export a backup and check browser storage.');return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateObj=s=>new Date(s+'T12:00:00Z');
const short=s=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(dateObj(s));
const long=s=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(dateObj(s));
function weekdays(start,end,excluded=[]){if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start)return 0;const skips=new Set(excluded);let n=0,d=dateObj(start),last=dateObj(end);for(let i=0;d<=last&&i<4000;i++,d.setUTCDate(d.getUTCDate()+1)){const s=d.toISOString().slice(0,10);if(d.getUTCDay()>0&&d.getUTCDay()<6&&!skips.has(s))n++}return n}
const used=e=>['worked','cancelled','denied'].includes(e.status)?0:weekdays(e.start,e.end,e.exclude||[])*Number(e.hours||8);
function exactDays(hours){const parts=String(hours).split('.');const digits=parts[1]?.length||0;const value=BigInt(parts.join(''));const denominator=10n**BigInt(digits)*8n;const scaled=value*10000n/denominator;return (Number(scaled)/10000).toFixed(2)}
const latest=()=>[...data.balances].sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)))[0];
function renderBalance(){const b=latest();$('balance').innerHTML=b?Number(b.hours).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' <small>hours</small>':'No balance yet';$('days').textContent=b?exactDays(b.hours)+' eight-hour days':'';$('balanceMeta').textContent=b?'Exact: '+b.hours+' hours · As of '+long(b.date):'Use Update to enter your employer-reported balance'}
function render(){renderBalance();document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x.dataset.tab===tab));$('heading').textContent=tab==='upcoming'?'Upcoming time off':tab==='history'?'Time off history':'Balance history';$('add').hidden=tab==='balances';let html='';if(tab==='balances'){const arr=[...data.balances].sort((a,b)=>b.date.localeCompare(a.date));$('summary').textContent=arr.length+' balance updates';html=arr.map(b=>'<div class="balanceItem"><div><strong>'+esc(b.hours)+' hours</strong><div class="muted">'+esc(long(b.date))+'</div></div><span class="muted">'+esc(exactDays(b.hours))+' days</span></div>').join('')}else{const past=tab==='history',arr=data.entries.filter(e=>past?e.end<today():e.end>=today()).sort((a,b)=>past?b.start.localeCompare(a.start):a.start.localeCompare(b.start));$('summary').textContent=arr.length+' entries · '+arr.reduce((n,e)=>n+used(e),0)+' recorded PTO hours';html=arr.map(e=>'<button class="item" data-edit="'+esc(e.id)+'"><span class="date">'+esc(short(e.start))+(e.end!==e.start?'<br>to<br>'+esc(short(e.end)):'')+'</span><span class="detail"><strong>'+esc(e.title)+'</strong><small>'+esc(e.category)+' · '+used(e)+' PTO hours</small></span><span class="status '+esc(e.status)+'">'+esc(e.status==='worked'?'Worked':e.status[0].toUpperCase()+e.status.slice(1))+'</span></button>').join('')} $('entries').innerHTML=html||'<div class="empty">No records yet.</div>'}
function show(name){$(name).showModal()}function hide(name){$(name).close()}
function exclusions(){return $('exclude').value.split(',').map(x=>x.trim()).filter(Boolean)}
function estimate(){const start=$('start').value,end=$('end').value;const n=weekdays(start,end,exclusions());const h=['worked','denied','cancelled'].includes($('status').value)?0:n*Number($('hours').value);$('estimate').textContent=start&&end&&end<start?'End date must be on or after start date':n+' weekdays · '+h+' PTO hours'}
function edit(entryId){const e=data.entries.find(x=>x.id===entryId);$('formTitle').textContent=e?'Edit PTO':'Add PTO';$('entryId').value=e?.id||'';$('title').value=e?.title||'';$('start').value=e?.start||today();$('end').value=e?.end||today();$('category').value=e?.category||'Vacation';$('status').value=e?.status||'planned';$('hours').value=String(e?.hours||8);$('company').value=e?.company||'';$('exclude').value=(e?.exclude||[]).join(', ');$('notes').value=e?.notes||'';$('remove').hidden=!e;estimate();show('entryDialog')}
function saveEntry(event){event.preventDefault();const start=$('start').value,end=$('end').value,hours=Number($('hours').value),exclude=exclusions();if(end<start){alert('End date must be on or after start date');return}if(!Number.isInteger(hours)||hours<1||hours>8){alert('Hours must be 1 through 8');return}if(exclude.some(s=>!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<start||s>end||!Number.isFinite(dateObj(s).getTime()))){alert('Excluded dates must be valid dates within the range');return}const entryId=$('entryId').value;const e={id:entryId||id(),title:$('title').value.trim(),start,end,category:$('category').value,status:$('status').value,hours,company:$('company').value,exclude:[...new Set(exclude)],notes:$('notes').value.trim()};if(!e.title)return;if(entryId)data.entries=data.entries.map(v=>v.id===entryId?e:v);else data.entries.push(e);if(save()){hide('entryDialog');render();toast('PTO saved')}}
const decimal=s=>/^\d+(\.\d+)?$/.test(s)&&s.length<100;
function saveBalance(event){event.preventDefault();const hours=$('balanceHours').value.trim(),date=$('balanceDate').value;if(!decimal(hours)){alert('Enter exact nonnegative decimal hours without commas');return}data.balances.push({id:id(),date,hours});if(save()){hide('balanceDialog');render();toast('Balance saved')}}
function toast(s){const t=$('toast');t.textContent=s;t.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display='none',2500)}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function exportJSON(){download('pto-tracker-backup-'+today()+'.json',JSON.stringify({app:'PTO Tracker',exportedAt:new Date().toISOString(),data},null,2),'application/json')}
function csv(s){let t=String(s??'');if(/^\s*[=+@-]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'}
function exportCSV(){const rows=[['Start','End','Title','Category','Status','Hours per weekday','Weekdays','PTO hours','Company holiday','Excluded dates','Notes'],...data.entries.map(e=>[e.start,e.end,e.title,e.category,e.status,e.hours,weekdays(e.start,e.end,e.exclude||[]),used(e),e.company||'',(e.exclude||[]).join('; '),e.notes||''])];download('pto-tracker-'+today()+'.csv',rows.map(r=>r.map(csv).join(',')).join('\r\n'),'text/csv;charset=utf-8')}
function importJSON(file){if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result),v=obj.data||obj;if(!valid(v)||v.entries.some(e=>!e.id||!e.title||!e.start||!e.end)||v.balances.some(b=>!b.date||!decimal(String(b.hours))))throw Error('Invalid PTO Tracker backup');if(!confirm('Replace local data with '+v.entries.length+' entries and '+v.balances.length+' balance updates? Export your current data first if needed.'))return;data=v;if(save()){hide('settingsDialog');tab='upcoming';render();toast('Backup restored')}}catch(e){alert('Restore failed: '+e.message)}finally{$('importFile').value='';$('importStatus').textContent='Choose a backup file to restore another backup.'}};reader.onerror=()=>alert('Could not read file');reader.readAsText(file)}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>hide(b.dataset.close));
$('settings').onclick=()=>show('settingsDialog');
$('updateBalance').onclick=()=>{$('balanceHours').value='';$('balanceDate').value=today();show('balanceDialog')};
$('add').onclick=()=>edit(null);
$('entryForm').addEventListener('submit',saveEntry);
$('balanceForm').addEventListener('submit',saveBalance);
document.querySelectorAll('#entryForm input,#entryForm select').forEach(el=>el.addEventListener('input',estimate));
$('start').addEventListener('change',()=>{if(!$('entryId').value){$('end').value=$('start').value;estimate()}});
$('entries').onclick=event=>{const b=event.target.closest('[data-edit]');if(b)edit(b.dataset.edit)};
$('remove').onclick=()=>{if(confirm('Delete this entry?')){data.entries=data.entries.filter(e=>e.id!==$('entryId').value);if(save()){hide('entryDialog');render();toast('Entry deleted')}}};
$('exportJSON').onclick=exportJSON;$('exportCSV').onclick=exportCSV;$('importFile').addEventListener('change',()=>{const f=$('importFile').files?.[0];$('importStatus').textContent=f?'Selected: '+f.name+' ('+Math.ceil(f.size/1024)+' KB)':'Choose a JSON backup file, then tap Restore selected backup.'});$('restoreSelected').onclick=()=>{const f=$('importFile').files?.[0];if(!f){alert('No file is selected. Choose a JSON backup file first.');return}importJSON(f)};

const DRIVE_CLIENT_ID='694239144470-8rpg1ij8ribd8htd9p1parbu48fl9vme.apps.googleusercontent.com';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const DRIVE_NAME='pto-tracker-backup.json';
let driveToken='',driveTokenClient=null;
function driveStatus(message){$('driveStatus').textContent=message}
function driveButtons(connected){$('driveUpload').disabled=!connected;$('driveDownload').disabled=!connected;$('driveDisconnect').disabled=!connected;$('driveConnect').textContent=connected?'Reconnect Google Drive':'Connect Google Drive'}
function driveConnect(){
  if(!window.google?.accounts?.oauth2){driveStatus('Google sign-in is not loaded. Check your connection and try again.');return}
  if(!driveTokenClient)driveTokenClient=google.accounts.oauth2.initTokenClient({client_id:DRIVE_CLIENT_ID,scope:DRIVE_SCOPE,callback:response=>{
    if(response.error||!response.access_token){driveStatus('Google authorization failed: '+(response.error||'No access token'));return}
    driveToken=response.access_token;driveButtons(true);driveStatus('Connected. Checking for changes…');syncNow()
  }});
  driveTokenClient.requestAccessToken({prompt:driveToken?'':'consent'});
}
function driveDisconnect(){if(driveToken&&window.google?.accounts?.oauth2)google.accounts.oauth2.revoke(driveToken,()=>{});driveToken='';driveButtons(false);driveStatus('Disconnected');syncIndicator('Not connected')}
async function driveRequest(url,options={}){
  if(!driveToken)throw Error('Connect Google Drive first');
  const headers={Authorization:'Bearer '+driveToken,...options.headers};
  const r=await fetch(url,{...options,headers});
  if(!r.ok){let msg='HTTP '+r.status;try{const body=await r.json();msg=body.error?.message||msg}catch{}if(r.status===401){driveToken='';driveButtons(false);syncIndicator('Reconnect required')}throw Error(msg)}
  return r;
}
async function driveFile(){
  const url='https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime),nextPageToken&page_size=100&q='+encodeURIComponent("name = '"+DRIVE_NAME+"' and trashed = false");
  const list=await (await driveRequest(url)).json();
  return (list.files||[]).sort((a,b)=>b.modifiedTime.localeCompare(a.modifiedTime))[0]||null;
}
async function driveBackup(){
  try{
    driveStatus('Checking Google Drive backup…');
    const existing=await driveFile();
    if(existing&&!confirm('Replace the existing Google Drive backup (last updated '+new Date(existing.modifiedTime).toLocaleString()+') with the records on THIS device? If this device is out of date, cancel and restore from Drive first.')){driveStatus('Backup cancelled');return}
    if(!existing&&!confirm('Create a private Google Drive backup of the PTO data on this device?')){driveStatus('Backup cancelled');return}
    const payload=JSON.stringify({app:'PTO Tracker',exportedAt:new Date().toISOString(),data});
    const meta=existing?{name:DRIVE_NAME}:{name:DRIVE_NAME,parents:['appDataFolder']};
    const boundary='pto_tracker_boundary_'+Date.now();
    const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+payload+'\r\n--'+boundary+'--';
    const url=existing?'https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(existing.id)+'?uploadType=multipart':'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    await driveRequest(url,{method:existing?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
    localStorage.setItem(SYNC_BASE,JSON.stringify(data));driveStatus('Backup saved to Google Drive at '+new Date().toLocaleString());syncIndicator('Backed up');
  }catch(e){driveStatus('Backup failed: '+e.message)}
}
async function driveRestore(){
  try{
    driveStatus('Looking for Google Drive backup…');
    const f=await driveFile();if(!f){driveStatus('No PTO Tracker backup found in Google Drive');return}
    const obj=await (await driveRequest('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(f.id)+'?alt=media')).json();
    const v=obj.data||obj;
    if(!valid(v)||v.entries.some(e=>!e.id||!e.title||!e.start||!e.end)||v.balances.some(b=>!b.date||!decimal(String(b.hours))))throw Error('Invalid backup format');
    if(!confirm('Replace ALL PTO data on THIS device with Google Drive backup from '+new Date(f.modifiedTime).toLocaleString()+'? Drive contains '+v.entries.length+' entries and '+v.balances.length+' balances. Download a JSON backup first if you need to preserve local changes.')){driveStatus('Restore cancelled');return}
    const old=data;data=v;
    if(!save()){data=old;throw Error('Could not save restored data')}
    localStorage.setItem(SYNC_BASE,JSON.stringify(v));render();driveStatus('Restored '+v.entries.length+' PTO entries from Google Drive');syncIndicator('Synced');toast('Google Drive backup restored');
  }catch(e){driveStatus('Restore failed: '+e.message)}
}

const SYNC_BASE='pto-tracker-sync-base-v1';
let syncBusy=false,syncQueued=false,syncTimer=null;
const snapshot=x=>JSON.stringify({version:1,entries:x.entries,balances:x.balances});
function syncIndicator(s){$('syncIndicator').textContent=s;if(driveToken&&$('driveStatus'))$('driveStatus').textContent=s}
function scheduleSync(){if(!driveToken)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(),1200)}
async function uploadSync(existing){
  const payload=JSON.stringify({app:'PTO Tracker',exportedAt:new Date().toISOString(),data});
  const meta=existing?{name:DRIVE_NAME}:{name:DRIVE_NAME,parents:['appDataFolder']};
  const boundary='pto_sync_'+Date.now();
  const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+payload+'\r\n--'+boundary+'--';
  await driveRequest(existing?'https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(existing.id)+'?uploadType=multipart':'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:existing?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
}
async function syncNow(){
  if(!driveToken||!navigator.onLine){syncIndicator(navigator.onLine?'Not connected':'Offline, changes kept locally');return}
  if(syncBusy){syncQueued=true;return}
  syncBusy=true;syncIndicator('Syncing…');
  try{
    const file=await driveFile();
    let remote=null;
    if(file){
      const obj=await (await driveRequest('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media')).json();
      remote=obj.data||obj;
      if(!valid(remote))throw Error('Drive backup format is invalid');
    }
    const raw=localStorage.getItem(SYNC_BASE),base=raw?JSON.parse(raw):null;
    const localSnap=snapshot(data),remoteSnap=remote?snapshot(remote):null,baseSnap=base?snapshot(base):null;
    if(localSnap===remoteSnap){
      localStorage.setItem(SYNC_BASE,JSON.stringify(data));
      syncIndicator('Synced '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
    }else if(baseSnap!==null&&localSnap===baseSnap&&remote){
      data=remote;if(!save())throw Error('Local storage failed');
      localStorage.setItem(SYNC_BASE,JSON.stringify(data));render();
      syncIndicator('Synced from Drive '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
    }else if((baseSnap!==null&&remoteSnap===baseSnap)||(!remote&&!base)){
      // Re-read before writing; refuse a changed remote snapshot.
      const latestFile=await driveFile();
      if((latestFile?.modifiedTime||null)!==(file?.modifiedTime||null))throw Error('Drive changed during sync. Try Sync Now.');
      await uploadSync(file);
      localStorage.setItem(SYNC_BASE,JSON.stringify(data));
      syncIndicator('Synced to Drive '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
    }else if(!base&&remote){
      syncIndicator('Needs review: device and Drive differ');
      driveStatus('Device and Drive contain different data. Automatic sync paused to protect your records. Export JSON backups before choosing which copy to restore.');
    }else{
      syncIndicator('Sync conflict: review needed');
      driveStatus('Both this device and Google Drive changed. Automatic sync paused. Export JSON backups and reconcile before restoring or backing up.');
    }
  }catch(e){syncIndicator('Sync pending');driveStatus('Sync could not finish: '+e.message)}
  finally{syncBusy=false;if(syncQueued){syncQueued=false;scheduleSync()}}
}
$('syncNow').onclick=syncNow;
window.addEventListener('online',()=>scheduleSync());
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&driveToken)syncNow()});
setInterval(()=>{if(driveToken&&!document.hidden)syncNow()},60000);

$('driveConnect').onclick=driveConnect;
$('driveUpload').onclick=driveBackup;
$('driveDownload').onclick=driveRestore;
$('driveDisconnect').onclick=driveDisconnect;

render();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(console.error);
