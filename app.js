const KEY='hero-stars-v1';
const defaultMissions=()=>structuredClone(DAILY_PLAN.missions);
const initial=()=>({name:'芃芃',planRevision:DAILY_PLAN.revision,theme:'iron',missions:defaultMissions(),entries:[],rewardRevision:DAILY_PLAN.rewardRevision,rewards:structuredClone(DAILY_PLAN.rewards)});
let state=initial(),storageBlocked=false;
try{const raw=localStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(!Array.isArray(parsed.entries)||!Array.isArray(parsed.rewards)||typeof parsed.name!=='string')throw Error();const {pin,salt,...saved}=parsed;state={...saved,missions:parsed.missions??defaultMissions()};if(!Array.isArray(state.missions))throw Error();if(state.planRevision!==DAILY_PLAN.revision){state.previousMissionConfig={missions:state.missions,planRevision:state.planRevision??null};state.missions=defaultMissions();state.planRevision=DAILY_PLAN.revision;if(state.name==='小小英雄')state.name='芃芃';localStorage.setItem(KEY,JSON.stringify(state));}}if(state.rewardRevision!==DAILY_PLAN.rewardRevision){state.previousRewardConfig={rewards:state.rewards,rewardRevision:state.rewardRevision??null};state.rewards=structuredClone(DAILY_PLAN.rewards);state.rewardRevision=DAILY_PLAN.rewardRevision;localStorage.setItem(KEY,JSON.stringify(state));}}catch{storageBlocked=true;}
const $=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const localDay=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const visibleMissions=()=>[...DAILY_PLAN.weekdays[new Date().getDay()].map(id=>state.missions.find(m=>m.id===id)).filter(Boolean),...state.missions.filter(m=>!m.id.startsWith('nov26-'))];
const balance=()=>state.entries.reduce((sum,e)=>sum+(e.undone?0:e.delta),0);
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3200);}
function commit(change){if(storageBlocked){toast('無法讀取本機資料，請檢查瀏覽器儲存空間。');return false;}const previous=JSON.stringify(state);try{change();localStorage.setItem(KEY,JSON.stringify(state));render();return true;}catch{state=JSON.parse(previous);toast('儲存失敗，這次操作未完成。請檢查儲存空間。');return false;}}
function render(){renderMissions();document.body.dataset.theme=state.theme;$('hero-name').textContent=state.name;$('balance').textContent=balance();$('total').textContent='已累積 '+state.entries.reduce((sum,e)=>sum+(!e.undone&&e.delta>0?e.delta:0),0)+' 顆星星的努力';document.querySelectorAll('[data-theme]').forEach(b=>{const active=b.dataset.theme===state.theme;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});$('rewards').innerHTML=state.rewards.map(r=>`<article class="reward"><div class="reward-icon">${escapeHTML(r.icon)}</div><h3>${escapeHTML(r.name)}</h3><span class="cost">★ ${r.cost} 顆星星</span><div class="progress"><i style="width:${Math.min(100,balance()/r.cost*100)}%"></i></div><div class="reward-bottom"><span>${balance()>=r.cost?'太棒了！可以兌換囉':'還差 '+(r.cost-balance())+' 顆星星'}</span><button class="redeem" data-reward="${escapeHTML(r.id)}" ${balance()<r.cost?'disabled':''}>兌換獎勵</button></div></article>`).join('');$('history').innerHTML=state.entries.length?state.entries.slice().reverse().slice(0,30).map(e=>`<div class="entry"><span class="entry-icon">${e.delta>0?'★':'🎁'}</span><div>${escapeHTML(e.reason)}${e.undone?'（已撤銷）':''}<small>${new Date(e.time).toLocaleString('zh-TW',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</small></div><span class="delta">${e.delta>0?'+':''}${e.delta} ★</span>${e.undone?'':`<button class="undo" data-undo="${escapeHTML(e.id)}">撤銷</button>`}</div>`).join(''):'<div class="empty">第一個英雄任務，等你來完成 ✨</div>';}
let submitAction;
function modal(title,fields,action){$('form').querySelector('[type=submit]').textContent='確認';$('dialog-title').textContent=title;$('fields').innerHTML=fields;$('error').textContent='';submitAction=action;$('form').querySelector('[type=submit]').hidden=false;if(!$('dialog').open)$('dialog').showModal();setTimeout(()=>$('fields').querySelector('input')?.focus(),0);}
$('close').onclick=()=>$('dialog').close();$('dialog').addEventListener('click',e=>{if(e.target===$('dialog')){const r=$('dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('dialog').close();}});
$('form').onsubmit=async e=>{e.preventDefault();const button=$('form').querySelector('[type=submit]');button.disabled=true;try{await submitAction(new FormData($('form')));}catch(err){$('error').textContent=err.message||'操作失敗，請重試。';}finally{button.disabled=false;}};
const input=(name,label,value='',attrs='')=>`<label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" value="${escapeHTML(value)}" ${attrs}>`;
function addStars(reason,amount,details={}){if(commit(()=>state.entries.push({id:crypto.randomUUID(),time:Date.now(),reason,delta:amount,undone:false,...details}))){$('dialog').close();toast('任務完成！獲得 '+amount+' 顆星星 ✨');}}
function renderMissions(){
 const items=visibleMissions();const weekday=new Date().toLocaleDateString('zh-TW',{weekday:'long'});$('plan-summary').textContent=weekday+'・'+items.length+' 個項目，共 '+items.reduce((sum,m)=>sum+m.stars,0)+' 顆星星。任務依獎勵表原文設定。';
 $('missions').innerHTML=items.length?items.map(m=>`<button class="mission" data-mission="${escapeHTML(m.id)}"><span class="emoji">${escapeHTML(m.icon)}</span><span><strong>${escapeHTML(m.name)}</strong><small>${escapeHTML(m.description)}</small></span><span class="plus">+${m.stars} ★</span></button>`).join(''):'<p class="empty">還沒有集星項目，請到家長設定新增。</p>';
}
$('missions').onclick=e=>{const button=e.target.closest('[data-mission]');if(button){const m=state.missions.find(m=>m.id===button.dataset.mission);if(m)addStars(m.name,m.stars,{missionId:m.id,day:localDay()});}};
$('custom').onclick=()=>modal('每一份努力都值得鼓勵',input('reason','鼓勵的原因','','required maxlength="60" placeholder="例如：勇敢嘗試新事物"')+input('amount','獎勵星星',1,'type="number" min="1" max="100" step="1" required'),data=>{const amount=Number(data.get('amount')),reason=data.get('reason').trim();if(!reason||!Number.isInteger(amount)||amount<1||amount>100)throw Error('請填寫原因，星星需為 1–100 的整數。');addStars(reason,amount);});
$('rewards').onclick=e=>{const button=e.target.closest('[data-reward]');if(!button)return;const reward=state.rewards.find(r=>r.id===button.dataset.reward);modal('兌換 '+reward.name,`<p class="hint">使用 ${reward.cost} 顆星星兌換這份獎勵。兌換後剩下 ${balance()-reward.cost} 顆星星。</p>`,()=>{if(balance()<reward.cost)throw Error('星星不足，繼續加油！');if(commit(()=>state.entries.push({id:crypto.randomUUID(),time:Date.now(),reason:'兌換：'+reward.name,delta:-reward.cost,undone:false}))){$('dialog').close();toast('兌換成功！享受你的獎勵 🎉');}});};
$('add-reward').onclick=()=>modal('新增期待的獎勵',input('name','獎勵名稱','','required maxlength="40"')+input('cost','需要的星星',10,'type="number" min="1" max="10000" step="1" required'),data=>{const name=data.get('name').trim(),cost=Number(data.get('cost'));if(!name||!Number.isInteger(cost)||cost<1||cost>10000)throw Error('請填寫名稱與 1–10000 的整數星數。');if(commit(()=>state.rewards.push({id:crypto.randomUUID(),name,cost,icon:'🎁'}))){$('dialog').close();toast('新的期待已加入！');}});
$('history').onclick=e=>{const button=e.target.closest('[data-undo]');if(!button)return;const entry=state.entries.find(e=>e.id===button.dataset.undo);if(!entry||entry.undone)return;if(balance()-entry.delta<0){$('dialog').close();toast('這些星星已用於兌換，請先撤銷相關兌換。');return;}if(commit(()=>entry.undone=true)){$('dialog').close();toast('已撤銷這筆紀錄');}};
function showSettings(){modal('家長設定','<div class="management-links"><button type="button" data-manage="missions">★ 管理集星項目 <span>新增、編輯與刪除 →</span></button><button type="button" data-manage="rewards">🎁 管理兌換項目 <span>獎勵內容與所需星數 →</span></button></div>'+input('name','小英雄的名字',state.name,'required maxlength="20"')+'<p class="hint">資料只保存在此瀏覽器，清除網站資料會失去紀錄。</p>',data=>{const name=data.get('name').trim();if(!name)throw Error('請輸入小英雄的名字。');if(commit(()=>{state.name=name;})){$('dialog').close();toast('設定已儲存');}});}
$('settings').onclick=showSettings;
document.querySelectorAll('[data-theme]').forEach(button=>button.onclick=()=>commit(()=>state.theme=button.dataset.theme));
function refreshDay(){ $('date').textContent=new Date().toLocaleDateString('zh-TW',{month:'long',day:'numeric',weekday:'long'});renderMissions();}
window.addEventListener('focus',refreshDay);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDay();});setInterval(refreshDay,60000);refreshDay();
render();if(storageBlocked)toast('本機資料無法讀取，已暫停變更以保護紀錄。');

function showManager(kind){
 const mission=kind==='missions',items=state[kind];
 modal(mission?'管理集星項目':'管理兌換項目',`<p class="hint">${mission?'此清單包含平日、週五、週六與週日的任務版本；新項目每天都會顯示。':'調整獎勵內容與兌換所需的星數。'}修改或刪除不會影響已記錄的星星與歷史紀錄。</p><div class="manager-list">${items.length?items.map(item=>`<div class="manager-row"><span class="manager-icon">${escapeHTML(item.icon)}</span><div class="manager-title"><strong>${escapeHTML(item.name)}</strong><small>${mission?'獲得':'需要'} ${mission?item.stars:item.cost} 顆星星</small></div><button type="button" data-edit="${escapeHTML(item.id)}" data-kind="${kind}">編輯</button><button type="button" class="danger" data-delete="${escapeHTML(item.id)}" data-kind="${kind}">刪除</button></div>`).join(''):'<p class="empty">目前沒有項目，新增第一個吧！</p>'}</div><button type="button" class="primary" data-new="${kind}">＋ 新增${mission?'集星':'兌換'}項目</button><button type="button" class="custom" data-settings>返回家長設定</button>`,()=>{});
 $('form').querySelector('[type=submit]').hidden=true;
}
function editItem(kind,id){
 const mission=kind==='missions',existing=id?state[kind].find(item=>item.id===id):null;
 if(id&&!existing)return;
 modal((existing?'編輯':'新增')+(mission?'集星項目':'兌換項目'),input('name','項目名稱',existing?.name??'','required maxlength="40"')+input('icon','圖示（可輸入表情符號）',existing?.icon??(mission?'⭐':'🎁'),'required maxlength="16"')+(mission?input('description','說明（選填）',existing?.description??'','maxlength="60"'):'')+input('stars',mission?'每次獲得星數':'兌換所需星數',existing?(mission?existing.stars:existing.cost):(mission?1:10),`type="number" min="1" max="${mission?100:10000}" step="1" required`)+`<button type="button" class="custom" data-manage="${kind}">取消，返回項目管理</button>`,data=>{
  const name=data.get('name').trim(),icon=data.get('icon').trim(),stars=Number(data.get('stars'));
  if(!name||!icon||!Number.isInteger(stars)||stars<1||stars>(mission?100:10000))throw Error('請填寫名稱、圖示與範圍內的整數星數。');
  const item={id:existing?.id??crypto.randomUUID(),name,icon,...(mission?{stars,description:data.get('description').trim()}:{cost:stars})};
  if(commit(()=>{if(existing)state[kind]=state[kind].map(row=>row.id===id?item:row);else state[kind].push(item);})) {showManager(kind);toast('項目已儲存');}
 });
}
function deleteItem(kind,id){
 const item=state[kind].find(item=>item.id===id);if(!item)return;
 modal('確認刪除項目',`<p class="hint">要刪除「${escapeHTML(item.name)}」嗎？此項目會從主畫面移除，既有星星和歷史紀錄會保留。</p><button type="button" class="custom" data-manage="${kind}">取消，保留項目</button>`,()=>{if(commit(()=>state[kind]=state[kind].filter(row=>row.id!==id))){showManager(kind);toast('項目已刪除');}});
 $('form').querySelector('[type=submit]').textContent='確認刪除';
}
$('fields').addEventListener('click',e=>{
 const button=e.target.closest('button');if(!button)return;
 if(button.dataset.manage)showManager(button.dataset.manage);
 else if(button.dataset.new)editItem(button.dataset.new);
 else if(button.dataset.edit)editItem(button.dataset.kind,button.dataset.edit);
 else if(button.dataset.delete)deleteItem(button.dataset.kind,button.dataset.delete);
 else if(button.hasAttribute('data-settings'))showSettings();
});
