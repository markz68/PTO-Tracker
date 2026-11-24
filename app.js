'use strict';
const KEY='pto-tracker-v1';
const $=id=>document.getElementById(id);
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
const id=()=>crypto.randomUUID?.()||String(Date.now())+Math.random().toString(36).slice(2);
const fresh=()=>({version:1,entries:[],balances:[],holidayTemplates:{}});
const valid=o=>o&&o.version===1&&Array.isArray(o.entries)&&Array.isArray(o.balances)&&o.entries.length<10000&&o.balances.length<10000;
let data=fresh();try{const s=localStorage.getItem(KEY);if(s){const o=JSON.parse(s);if(valid(o))data=o}}catch(e){console.error('Storage read error',e)}
let tab='upcoming';
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));if(typeof scheduleSync==='function')scheduleSync();return true}catch(e){alert('Could not save. Export a backup and check browser storage.');return false}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateObj=s=>new Date(s+'T12:00:00Z');
const short=s=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(dateObj(s));
const dateBadge=s=>'<span>'+esc(short(s))+'</span><span class="badgeYear">'+esc(s.slice(0,4))+'</span>';
const long=s=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(dateObj(s));
function weekdays(start,end,excluded=[]){if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||end<start)return 0;const skips=new Set(excluded);let n=0,d=dateObj(start),last=dateObj(end);for(let i=0;d<=last&&i<4000;i++,d.setUTCDate(d.getUTCDate()+1)){const s=d.toISOString().slice(0,10);if(d.getUTCDay()>0&&d.getUTCDay()<6&&!skips.has(s))n++}return n}
const used=e=>['worked','cancelled','denied'].includes(e.status)?0:weekdays(e.start,e.end,e.exclude||[])*Number(e.hours||8);
function exactDays(hours){const parts=String(hours).split('.');const digits=parts[1]?.length||0;const value=BigInt(parts.join(''));const denominator=10n**BigInt(digits)*8n;const scaled=value*10000n/denominator;return (Number(scaled)/10000).toFixed(2)}
const latest=()=>[...data.balances].sort((a,b)=>b.date.localeCompare(a.date)||String(b.id).localeCompare(String(a.id)))[0];
function renderBalance(){const b=latest();$('balance').innerHTML=b?Number(b.hours).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' <small>hours</small>':'No balance yet';$('days').textContent=b?exactDays(b.hours)+' eight-hour days':'';$('balanceMeta').textContent=b?'Exact: '+b.hours+' hours · As of '+long(b.date):'Use Update to enter your employer-reported balance'}
function render(){renderBalance();document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x.dataset.tab===tab));$('heading').textContent=tab==='upcoming'?'Upcoming time off':tab==='history'?'Time off history':'Balance history';$('add').hidden=tab==='balances';let html='';if(tab==='balances'){const arr=[...data.balances].sort((a,b)=>b.date.localeCompare(a.date));$('summary').textContent=arr.length+' balance updates';html=arr.map(b=>'<div class="balanceItem"><div><strong>'+esc(b.hours)+' hours</strong><div class="muted">'+esc(long(b.date))+'</div></div><span class="muted">'+esc(exactDays(b.hours))+' days</span></div>').join('')}else{const past=tab==='history',arr=data.entries.filter(e=>past?e.end<today():e.end>=today()).sort((a,b)=>past?b.start.localeCompare(a.start):a.start.localeCompare(b.start));$('summary').textContent=arr.length+' entries · '+arr.reduce((n,e)=>n+used(e),0)+' recorded PTO hours';html=arr.map(e=>'<div class="item"><button type="button" class="itemEdit" data-edit="'+esc(e.id)+'" aria-label="Edit '+esc(e.title)+'"><span class="date">'+dateBadge(e.start)+(e.end!==e.start?'<span class="dateTo">to</span>'+dateBadge(e.end):'')+'</span><span class="detail"><strong>'+esc(e.title)+'</strong><small>'+esc(e.category)+' · '+used(e)+' PTO hours</small></span></button><label class="quickStatusLabel">Status<select class="quickStatus '+esc(e.status)+'" data-status-id="'+esc(e.id)+'" aria-label="Status for '+esc(e.title)+'">'+[['planned','Planned'],['requested','Requested'],['approved','Approved'],['taken','Taken'],['denied','Denied'],['cancelled','Cancelled'],['worked','Worked / Not off']].map(([v,label])=>'<option value="'+v+'"'+((e.status===v||(e.status==='recognized'&&v==='planned'))?' selected':'')+'>'+label+'</option>').join('')+'</select></label></div>').join('')} $('entries').innerHTML=html||'<div class="empty">No records yet.</div>'}
function show(name){$(name).showModal()}function hide(name){$(name).close()}
function exclusions(){return $('exclude').value.split(',').map(x=>x.trim()).filter(Boolean)}
function estimate(){const start=$('start').value,end=$('end').value;const n=weekdays(start,end,exclusions());const h=['worked','denied','cancelled'].includes($('status').value)?0:n*Number($('hours').value);$('estimate').textContent=start&&end&&end<start?'End date must be on or after start date':n+' weekdays · '+h+' PTO hours'}
function edit(entryId){const e=data.entries.find(x=>x.id===entryId);$('formTitle').textContent=e?'Edit PTO':'Add PTO';$('entryId').value=e?.id||'';$('title').value=e?.title||'';$('start').value=e?.start||today();$('end').value=e?.end||today();$('category').value=e?.category||'Vacation';$('status').value=e?.status==='recognized'?'planned':e?.status||'planned';$('hours').value=String(e?.hours||8);$('company').value=e?.company||'';$('exclude').value=(e?.exclude||[]).join(', ');$('notes').value=e?.notes||'';$('remove').hidden=!e;estimate();show('entryDialog')}
function saveEntry(event){event.preventDefault();const start=$('start').value,end=$('end').value,hours=Number($('hours').value),exclude=exclusions();if(end<start){alert('End date must be on or after start date');return}if(!Number.isInteger(hours)||hours<1||hours>8){alert('Hours must be 1 through 8');return}if(exclude.some(s=>!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<start||s>end||!Number.isFinite(dateObj(s).getTime()))){alert('Excluded dates must be valid dates within the range');return}const entryId=$('entryId').value;const e={id:entryId||id(),title:$('title').value.trim(),start,end,category:$('category').value,status:$('status').value,hours,company:$('company').value,exclude:[...new Set(exclude)],notes:$('notes').value.trim()};if(!e.title)return;if(entryId)data.entries=data.entries.map(v=>v.id===entryId?e:v);else data.entries.push(e);if(save()){hide('entryDialog');render();toast('PTO saved')}}
const decimal=s=>/^\d+(\.\d+)?$/.test(s)&&s.length<100;
function saveBalance(event){event.preventDefault();const hours=$('balanceHours').value.trim(),date=$('balanceDate').value;if(!decimal(hours)){alert('Enter exact nonnegative decimal hours without commas');return}data.balances.push({id:id(),date,hours});if(save()){hide('balanceDialog');render();toast('Balance saved')}}
function toast(s){const t=$('toast');t.textContent=s;t.style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.style.display='none',2500)}
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
function exportJSON(){download('pto-tracker-backup-'+today()+'.json',JSON.stringify({app:'PTO Tracker',exportedAt:new Date().toISOString(),data},null,2),'application/json')}
function csv(s){let t=String(s??'');if(/^\s*[=+@-]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"'}
function exportCSV(){const rows=[['Start','End','Title','Category','Status','Hours per weekday','Weekdays','PTO hours','Company holiday','Excluded dates','Notes'],...data.entries.map(e=>[e.start,e.end,e.title,e.category,e.status,e.hours,weekdays(e.start,e.end,e.exclude||[]),used(e),e.company||'',(e.exclude||[]).join('; '),e.notes||''])];download('pto-tracker-'+today()+'.csv',rows.map(r=>r.map(csv).join(',')).join('\r\n'),'text/csv;charset=utf-8')}
function validBackupDate(value){
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(dateObj(value).getTime());
}
function validBackupTemplates(templates){
 if(templates===undefined)return true;
 return templates&&typeof templates==='object'&&!Array.isArray(templates)&&
   Object.entries(templates).every(([year,holidays])=>/^20\d{2}$/.test(year)&&Array.isArray(holidays)&&
     holidays.every(holiday=>typeof holiday?.name==='string'&&typeof holiday.rule==='string'&&
       validBackupDate(holidayDate(Number(year),holiday.rule))));
}
function backupData(obj){
 const value=obj?.data||obj;
 if((obj?.app&&obj.app!=='PTO Tracker')||!valid(value)||
    value.entries.some(entry=>!entry?.id||!entry.title||!validBackupDate(entry.start)||!validBackupDate(entry.end))||
    value.balances.some(balance=>!validBackupDate(balance?.date)||!decimal(String(balance.hours)))||!validBackupTemplates(value.holidayTemplates)){
   throw Error('Invalid PTO Tracker backup');
 }
 return value;
}
function describeBackup(value){
 const count=(n,label)=>n+' '+label+(n===1?'':'s');
 return value.entries.length+' PTO '+(value.entries.length===1?'entry':'entries')+', '+
   count(value.balances.length,'balance update')+', '+
   count(Object.keys(value.holidayTemplates||{}).length,'holiday template');
}
function confirmBackup(title,detail,action){
 const dialog=$('backupConfirm');
 if(dialog.open)return Promise.resolve(false);
 $('backupConfirmTitle').textContent=title;
 $('backupConfirmDetail').textContent=detail;
 $('backupConfirmAction').textContent=action;
 dialog.returnValue='cancel';
 return new Promise(resolve=>{
   dialog.addEventListener('close',()=>resolve(dialog.returnValue==='confirm'),{once:true});
   dialog.showModal();
 });
}
function restoreLocal(value){
 const previous=data;
 data=value;
 if(!save()){data=previous;throw Error('Could not save restored data')}
 render();
 refreshHolidayUI();
}
async function importJSON(file){
 if(!file||syncBusy)return;
 const input=$('importFile'),status=$('importStatus');
 syncBusy=true;
 driveButtons(Boolean(driveToken));
 try{
   const before=snapshot(data),stored=localStorage.getItem(KEY);
   const value=backupData(JSON.parse(await file.text()));
   const accepted=await confirmBackup('Restore from Backup File?',
     'Replace '+describeBackup(data)+' on this device with '+describeBackup(value)+' from '+file.name+'?',
     'Restore Backup');
   if(!accepted){status.textContent='Restore canceled.';return}
   if(before!==snapshot(data)||stored!==localStorage.getItem(KEY))throw Error('Local data changed. Try again.');
   tab='upcoming';
   restoreLocal(value);
   status.textContent='Backup restored. This device now has '+describeBackup(value)+'.';
 }catch(error){status.textContent='Restore failed: '+error.message}
 finally{input.value='';finishDriveOperation()}
}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>hide(b.dataset.close));
$('settings').onclick=()=>{openSettingsSection('home');show('settingsDialog')};
$('updateBalance').onclick=()=>{$('balanceHours').value='';$('balanceDate').value=today();show('balanceDialog')};
$('add').onclick=()=>edit(null);
$('entryForm').addEventListener('submit',saveEntry);
$('balanceForm').addEventListener('submit',saveBalance);
document.querySelectorAll('#entryForm input,#entryForm select').forEach(el=>el.addEventListener('input',estimate));
$('start').addEventListener('change',()=>{if(!$('entryId').value){$('end').value=$('start').value;estimate()}});
$('entries').onclick=event=>{const b=event.target.closest('[data-edit]');if(b)edit(b.dataset.edit)};
$('entries').addEventListener('change',event=>{const select=event.target.closest('[data-status-id]');if(!select)return;const entry=data.entries.find(e=>e.id===select.dataset.statusId);if(!entry)return;const previous=entry.status,next=select.value;if(previous===next||(previous==='recognized'&&next==='planned'))return;if(!['recognized','planned','requested','approved','taken','denied','cancelled','worked'].includes(next)){select.value=previous;return}entry.status=next;if(save()){render();toast('Status updated to '+select.selectedOptions[0].textContent)}else{entry.status=previous;select.value=previous}});
$('remove').onclick=()=>{if(confirm('Delete this entry?')){data.entries=data.entries.filter(e=>e.id!==$('entryId').value);if(save()){hide('entryDialog');render();toast('Entry deleted')}}};
$('exportJSON').onclick=exportJSON;
$('exportCSV').onclick=exportCSV;
$('importFile').addEventListener('change',event=>importJSON(event.target.files?.[0]));
$('restoreFile').onclick=()=>$('importFile').click();
$('openBackup').onclick=()=>show('backupDialog');
$('backupClose').onclick=$('backupDone').onclick=()=>hide('backupDialog');
$('backupDialog').addEventListener('click',event=>{
 if(event.target===$('backupDialog'))hide('backupDialog');
});


const settingsSections=['holidays','about'];
function openSettingsSection(section){
 const home=section==='home';
 $('settingsHome').hidden=!home;
 $('settingsBack').hidden=home;
 $('settingsHeading').textContent=home?'Settings':({holidays:'Annual Holidays',about:'About'})[section];
 for(const name of settingsSections)$('settingsSection-'+name).hidden=home||name!==section;
 $('settingsDialog').scrollTop=0;
}
document.querySelectorAll('[data-settings-section]').forEach(button=>button.onclick=()=>openSettingsSection(button.dataset.settingsSection));
$('settingsBack').onclick=()=>openSettingsSection('home');
$('settingsDialog').addEventListener('close',()=>openSettingsSection('home'));

const HOLIDAYS=[
 {key:'newyear',name:"New Year's Day",rule:'fixed:01-01'},
 {key:'easter',name:'Easter',rule:'easter'},
 {key:'memorial',name:'Memorial Day',rule:'nth:05:1:-1'},
 {key:'independence',name:'Independence Day',rule:'fixed:07-04'},
 {key:'labor',name:'Labor Day',rule:'nth:09:1:1'},
 {key:'thanksgiving',name:'Thanksgiving',rule:'nth:11:4:4'},
 {key:'christmaseve',name:'Christmas Eve',rule:'fixed:12-24'},
 {key:'christmas',name:'Christmas Day',rule:'fixed:12-25'},
 {key:'mlk',name:'Martin Luther King Jr. Day',rule:'nth:01:1:3'}
];
function holidayDate(y,rule){
 if(rule==='easter'){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k+7)%7,m=Math.floor((a+11*h+22*l)/451),v=h+l-7*m+114;
  return y+'-'+String(Math.floor(v/31)).padStart(2,'0')+'-'+String(v%31+1).padStart(2,'0');
 }
 if(rule.startsWith('fixed:'))return y+'-'+rule.slice(6);
 const [,month,weekday,nth]=rule.split(':').map(Number);
 const last=new Date(Date.UTC(y,month,0)).getUTCDate();
 const firstDay=new Date(Date.UTC(y,month-1,1)).getUTCDay();
 const lastDay=new Date(Date.UTC(y,month-1,last)).getUTCDay();
 const day=nth===-1?last-(lastDay-weekday+7)%7:1+(weekday-firstDay+7)%7+7*(nth-1);
 return y+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
}
const holidayTemplates=()=>data.holidayTemplates||(data.holidayTemplates={});
const holidayDefault=()=>HOLIDAYS.filter(h=>h.key!=='mlk').map(h=>({...h,enabled:true}));
let holidayDraft=[];
function refreshHolidayUI(){
 const year=$('holidayYear').value;
 const stored=holidayTemplates()[year];
 holidayDraft=JSON.parse(JSON.stringify(stored||holidayDefault()));
 renderHolidayUI();
}
function renderHolidayUI(){
 if($('holidaySaveStatus')){$('holidaySaveStatus').textContent='Unsaved changes. Click Save year\'s template before generating.';$('holidaySaveStatus').classList.remove('saved');$('holidayGenerate').disabled=true;}
 const year=Number($('holidayYear').value);
 $('holidayList').innerHTML=holidayDraft.map((h,i)=>'<div class="holidayLine"><label><input type="checkbox" data-holiday-index="'+i+'" '+(h.enabled?'checked':'')+'> '+esc(h.name)+'</label><span class="holidayDay '+([0,6].includes(dateObj(holidayDate(year,h.rule)).getUTCDay())?'weekend':'')+'">'+esc(holidayDate(year,h.rule))+' · '+esc(new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'UTC'}).format(dateObj(holidayDate(year,h.rule))))+'</span><button type="button" class="secondary" data-holiday-delete="'+i+'">Remove</button></div>').join('');
 $('holidayInfo').textContent=holidayDraft.filter(h=>h.enabled).length+' holidays selected. Save this template before generating.';
}
$('holidayYear').value=String(new Date().getFullYear()+1);
$('holidayYear').addEventListener('change',refreshHolidayUI);
$('holidayList').addEventListener('change',e=>{
 const i=e.target.dataset.holidayIndex;
 if(i!==undefined){holidayDraft[Number(i)].enabled=e.target.checked;renderHolidayUI()}
});
$('holidayList').addEventListener('click',e=>{
 const b=e.target.closest('[data-holiday-delete]');
 if(b){holidayDraft.splice(Number(b.dataset.holidayDelete),1);renderHolidayUI()}
});
$('holidayAdd').onclick=()=>{
 const key=$('holidayCatalog').value,found=HOLIDAYS.find(h=>h.key===key);
 if(!found)return;
 if(holidayDraft.some(h=>h.key===key)){toast('Already in template');return}
 holidayDraft.push({...found,enabled:true});renderHolidayUI();
};
$('holidayAddCustom').onclick=()=>{
 const name=$('holidayCustomName').value.trim(),md=$('holidayCustomDate').value.trim();
 const validMD=/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(md)&&new Date('2028-'+md+'T12:00:00Z').toISOString().slice(5,10)===md;
 if(!name||!validMD){alert('Enter a holiday name and valid MM-DD date');return}
 holidayDraft.push({key:id(),name,rule:'fixed:'+md,enabled:true});
 $('holidayCustomName').value='';$('holidayCustomDate').value='';renderHolidayUI();
};
$('holidaySave').onclick=()=>{
 const year=$('holidayYear').value;
 if(!/^20\d\d$/.test(year)){alert('Choose a year from 2000 through 2099');return}
 holidayTemplates()[year]=JSON.parse(JSON.stringify(holidayDraft));
 if(save()){const count=holidayDraft.filter(h=>h.enabled).length;$('holidaySaveStatus').textContent='✓ Saved '+year+' template with '+count+' selected holiday'+(count===1?'':'s')+'.';$('holidaySaveStatus').classList.add('saved');$('holidayGenerate').disabled=false;}else{$('holidaySaveStatus').textContent='Save failed. Please export a backup and check storage.';}
};
$('holidayGenerate').onclick=()=>{
 const year=$('holidayYear').value,template=holidayTemplates()[year];
 if(!template){alert('Save the holiday template first');return}
 const current=new Set(data.entries.filter(e=>e.category==='Holiday').map(e=>e.start));
 const additions=template.filter(h=>h.enabled).map(h=>({h,date:holidayDate(Number(year),h.rule)})).filter(x=>!current.has(x.date));
 if(!additions.length){alert('No new holidays to add. Existing holidays were left unchanged.');return}
 const preview=additions.map(x=>x.date+' '+x.h.name).join('\n');
 if(!confirm('Add these '+additions.length+' planned holidays for '+year+'?\n\n'+preview+'\n\nWeekday holidays record 8 PTO hours each; weekend dates record 0. Your employer-reported balance will NOT change.'))return;
 for(const {h,date} of additions)data.entries.push({id:id(),title:h.name,start:date,end:date,category:'Holiday',status:'planned',hours:8,company:'yes',exclude:[],notes:'Company holiday. Planned day off unless scheduled to work.'});
 if(save()){render();toast('Added '+additions.length+' planned holidays')}
};
refreshHolidayUI();

const DRIVE_CLIENT_ID='694239144470-8rpg1ij8ribd8htd9p1parbu48fl9vme.apps.googleusercontent.com';
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const DRIVE_NAME='pto-tracker-backup.json';
let driveToken='',driveTokenClient=null;
function driveStatus(message){$('driveStatus').textContent=message}
const LAST_DRIVE_SYNC='pto-tracker-last-drive-sync';
function driveButtons(connected){
 $('driveConnect').hidden=connected;
 $('driveActions').hidden=!connected;
 for(const control of ['syncNow','driveUpload','driveDownload','driveDisconnect']){
   $(control).disabled=!connected||syncBusy;
 }
 $('importFile').disabled=$('restoreFile').disabled=syncBusy;
 const last=localStorage.getItem(LAST_DRIVE_SYNC);
 $('lastDriveSync').hidden=!connected||!last;
 $('lastDriveSync').textContent=last?'Last successful sync or backup/restore: '+new Date(last).toLocaleString():'';
}
function recordDriveSuccess(value){
 localStorage.setItem(SYNC_BASE,JSON.stringify(value));
 try{localStorage.setItem(LAST_DRIVE_SYNC,new Date().toISOString())}catch{}
}
function finishDriveOperation(){
 syncBusy=false;
 driveButtons(Boolean(driveToken));
 if(syncQueued){syncQueued=false;scheduleSync()}
}
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
async function readDriveBackup(file){
 const url='https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(file.id)+'?alt=media';
 return backupData(await (await driveRequest(url)).json());
}
function hasRecords(value){
 return Boolean(value.entries.length||value.balances.length||Object.keys(value.holidayTemplates||{}).length);
}
async function checkBackupCopies(file,remote,localSnapshot,stored){
 const latest=await driveFile();
 if(latest?.id!==file?.id||latest?.modifiedTime!==file?.modifiedTime||
    (latest&&snapshot(await readDriveBackup(latest))!==snapshot(remote))){
   throw Error('Google Drive backup changed. Try again.');
 }
 if(localSnapshot!==snapshot(data)||stored!==localStorage.getItem(KEY)){
   throw Error('Local data changed. Try again.');
 }
}
async function driveBackup(){
 if(syncBusy||!driveToken)return;
 syncBusy=true;
 driveButtons(true);
 try{
   driveStatus('Checking Google Drive backup…');
   const local=structuredClone(data),before=snapshot(local),stored=localStorage.getItem(KEY);
   const file=await driveFile(),remote=file?await readDriveBackup(file):null;
   if(remote&&hasRecords(remote)&&!hasRecords(local)){
     driveStatus('This device is empty. Choose Restore from Google Drive to retrieve your records.');return;
   }
   const detail=remote?'Replace '+describeBackup(remote)+' in Google Drive with '+describeBackup(local)+' from this device?':
     'Save '+describeBackup(local)+' from this device to Google Drive?';
   if(!await confirmBackup('Back Up to Google Drive?',detail,'Back Up to Google Drive')){
     driveStatus('Backup canceled.');return;
   }
   await checkBackupCopies(file,remote,before,stored);
   await uploadSync(file,local);
   const uploaded=await driveFile();
   if(!uploaded||snapshot(await readDriveBackup(uploaded))!==before)throw Error('Could not verify the Google Drive backup.');
   recordDriveSuccess(local);
   syncIndicator('Backed up');
   driveStatus('Google Drive backup verified. '+describeBackup(local)+'.');
 }catch(error){driveStatus('Backup failed: '+error.message)}
 finally{finishDriveOperation()}
}
async function driveRestore(){
 if(syncBusy||!driveToken)return;
 syncBusy=true;
 driveButtons(true);
 try{
   driveStatus('Looking for Google Drive backup…');
   const before=snapshot(data),stored=localStorage.getItem(KEY);
   const file=await driveFile();
   if(!file){driveStatus('No PTO Tracker backup found in Google Drive.');return}
   const value=await readDriveBackup(file);
   const detail='Replace '+describeBackup(data)+' on this device with '+describeBackup(value)+' from Google Drive?';
   if(!await confirmBackup('Restore from Google Drive?',detail,'Restore from Google Drive')){
     driveStatus('Restore canceled.');return;
   }
   await checkBackupCopies(file,value,before,stored);
   restoreLocal(value);
   recordDriveSuccess(value);
   syncIndicator('Synced');
   driveStatus('Restore complete. This device now has '+describeBackup(value)+'.');
 }catch(error){driveStatus('Restore failed: '+error.message)}
 finally{finishDriveOperation()}
}

const SYNC_BASE='pto-tracker-sync-base-v1';
let syncBusy=false,syncQueued=false,syncTimer=null;
const snapshot=x=>JSON.stringify({...{version:1,entries:x.entries,balances:x.balances},...(x.holidayTemplates&&Object.keys(x.holidayTemplates).length?{holidayTemplates:x.holidayTemplates}:{})});
function syncIndicator(s){$('syncIndicator').textContent=s;if(driveToken&&$('driveStatus'))$('driveStatus').textContent=s}
function scheduleSync(){if(!driveToken)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>syncNow(),1200)}
async function uploadSync(existing,value){
  const payload=JSON.stringify({app:'PTO Tracker',exportedAt:new Date().toISOString(),data:value});
  const meta=existing?{name:DRIVE_NAME}:{name:DRIVE_NAME,parents:['appDataFolder']};
  const boundary='pto_sync_'+Date.now();
  const body='--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify(meta)+'\r\n--'+boundary+'\r\nContent-Type: application/json\r\n\r\n'+payload+'\r\n--'+boundary+'--';
  await driveRequest(existing?'https://www.googleapis.com/upload/drive/v3/files/'+encodeURIComponent(existing.id)+'?uploadType=multipart':'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',{method:existing?'PATCH':'POST',headers:{'Content-Type':'multipart/related; boundary='+boundary},body});
}
async function syncNow(){
  if(!driveToken||!navigator.onLine){syncIndicator(navigator.onLine?'Not connected':'Offline, changes kept locally');return}
  if(syncBusy){syncQueued=true;return}
  syncBusy=true;driveButtons(true);syncIndicator('Syncing…');
  try{
    const stored=localStorage.getItem(KEY);
    const file=await driveFile();
    let remote=null;
    if(file){
      remote=await readDriveBackup(file);
    }
    if(stored!==localStorage.getItem(KEY))throw Error('Local data changed during sync. Try Sync Now.');
    const raw=localStorage.getItem(SYNC_BASE),base=raw?JSON.parse(raw):null;
    const localSnap=snapshot(data),remoteSnap=remote?snapshot(remote):null,baseSnap=base?snapshot(base):null;
    if(localSnap===remoteSnap){
      recordDriveSuccess(data);
      syncIndicator('Synced '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
    }else if(remote&&hasRecords(remote)&&!hasRecords(data)){
      syncIndicator('Restore available');
      driveStatus('This device is empty. Choose Restore from Google Drive to retrieve your records.');
    }else if(baseSnap!==null&&localSnap===baseSnap&&remote){
      restoreLocal(remote);
      recordDriveSuccess(remote);
      syncIndicator('Synced from Drive '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
    }else if((baseSnap!==null&&remoteSnap===baseSnap)||(!remote&&!base)){
      // Re-read before writing; refuse a changed remote snapshot.
      const latestFile=await driveFile();
      if((latestFile?.modifiedTime||null)!==(file?.modifiedTime||null))throw Error('Drive changed during sync. Try Sync Now.');
      if(snapshot(data)!==localSnap||stored!==localStorage.getItem(KEY))throw Error('Local data changed during sync. Try Sync Now.');
      const local=structuredClone(data);
      await uploadSync(file,local);
      recordDriveSuccess(local);
      syncIndicator('Synced to Drive '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}));
    }else if(!base&&remote){
      syncIndicator('Needs review: device and Drive differ');
      driveStatus('Device and Drive contain different data. Automatic sync paused to protect your records. Export JSON backups before choosing which copy to restore.');
    }else{
      syncIndicator('Sync conflict: review needed');
      driveStatus('Both this device and Google Drive changed. Automatic sync paused. Export JSON backups and reconcile before restoring or backing up.');
    }
  }catch(e){syncIndicator('Sync pending');driveStatus('Sync could not finish: '+e.message)}
  finally{finishDriveOperation()}
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
