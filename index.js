// index.js — Peaches & Cream v2.6
const MODULE_NAME  = 'peaches-cream';
const DATA_VERSION = '2.6';

function ctx() { return SillyTavern.getContext(); }

function isMobile() {
  try { return window.matchMedia('(max-width:430px),(pointer:coarse)').matches; }
  catch { return window.innerWidth <= 430; }
}

function getCharKey() {
  try {
    const c = ctx();
    const avatar = c?.characters?.[c?.characterId]?.avatar?.replace(/\.[^/.]+$/, '')
                || c?.characters?.[c?.characterId]?.filename?.replace(/\.[^/.]+$/, '');
    const name = c?.name2 || c?.characters?.[c?.characterId]?.name || 'default';
    return (avatar ? `${name}_${avatar}` : name).replace(/[^a-zA-Z0-9가-힣]/g, '_');
  } catch(e) { return 'default'; }
}

const defaultCharData = {
  userBody:      '',
  userMarks:     '',
  userErogenous: '',
  charBody:      '',
  charMarks:     '',
  charErogenous: '',
  reviewsHistory:[], reviewsSaved:[],
  cogHistory:[], cogCards:[],
  darkHistory:[], darkCards:[],
  fanFeedHistory:[],
  fanFeedConfig: { group:'', fandomName:'', npcs:[] },
  dreamLogCurrent: null,
};

const defaultGlobalConfig = {
  apiSource:'main', profileId:'', maxTokens:1500, toolbarEnabled:false,
  customTags:{ sfw:[], mood:[], foreplay:[], position:[], action:[], finish:[], orgasm:[] }
};

// ═══════════════════════════════════════════
// 공통 캐릭터 반응 지시문
// ═══════════════════════════════════════════
const CHAR_REACTION_INSTRUCTION = `React based on your character's personality as described in your character card. Show realistic emotions — embarrassment, defensiveness, pride, or guilt depending on your nature. Do not always default to shameless denial. No female-degrading slurs.`;

// ═══════════════════════════════════════════
// 어플별 토큰
// ═══════════════════════════════════════════
const APP_TOKENS = {
  redflag:   600,
  clinic:    800,
  reviews:    500,
  offrecord:  300,
  worldfeed:  1000,
  blackbox:   600,
  dreamlog:   300,
};

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════
function getStore() {
  const { extensionSettings } = ctx();
  const existing = extensionSettings[MODULE_NAME];
  if (!existing || existing.version !== DATA_VERSION) {
    extensionSettings[MODULE_NAME] = { version:DATA_VERSION, config:JSON.parse(JSON.stringify(defaultGlobalConfig)), chars:{} };
  }
  const s = extensionSettings[MODULE_NAME];
  if (!s.config) s.config = JSON.parse(JSON.stringify(defaultGlobalConfig));
  if (!s.chars)  s.chars  = {};
  Object.keys(defaultGlobalConfig).forEach(k => { if (s.config[k]===undefined) s.config[k]=JSON.parse(JSON.stringify(defaultGlobalConfig[k])); });
  if (!s.config.customTags) s.config.customTags = JSON.parse(JSON.stringify(defaultGlobalConfig.customTags));
  return s;
}

function getCharStore() {
  const s=getStore(), key=getCharKey();
  if (!s.chars[key]) s.chars[key]=JSON.parse(JSON.stringify(defaultCharData));
  const cd=s.chars[key];
  const fill=(obj,def)=>Object.keys(def).forEach(k=>{if(obj[k]===undefined)obj[k]=JSON.parse(JSON.stringify(def[k]));});
  fill(cd, defaultCharData);
  return cd;
}

function saveStore() { ctx().saveSettingsDebounced(); }

// ═══════════════════════════════════════════
// 프롬프트 빌더
// ═══════════════════════════════════════════
function buildMainPrompt() {
  const cd=getCharStore(), cname=getCurrentCharName();
  const lines=['<peaches_and_cream>'];

  if(cd.userBody) {
    lines.push(`<user_body>\nThis describes the female user's body.\n${cd.userBody}\n</user_body>`);
  }
  if(cd.userMarks) {
    lines.push(`<user_marks>\n${cd.userMarks}\n</user_marks>`);
  }
  if(cd.charBody) {
    lines.push(`<char_body name="${cname}">\nThis describes the male character's body.\n${cd.charBody}\n</char_body>`);
  }
  if(cd.charMarks) {
    lines.push(`<char_marks name="${cname}">\n${cd.charMarks}\n</char_marks>`);
  }

  lines.push(`<instruction>
[BODY DATA — ABSOLUTE CANON]
0. 이 프롬프트에 등록된 유저/캐릭터 신체 데이터는 모든 씬에서 반드시 반영된다.
1. 유저 신체 — 외형 묘사는 일상 씬 포함 자연스럽게 반영하라.
2. 유저 성감대 — 성적 씬에서만: 등록된 반응을 씬에서 즉각 묘사하라.
3. 캐릭터 신체 — 등록된 신체 묘사를 씬에서 현실적으로 반영하라.
4. 씬 서술 시 캐릭터 행동 + 유저 신체 반응을 반드시 함께 묘사하라.
5. 포지션 태그가 지정되면 반드시 삽입까지 진행하라.
6. 더티토크는 캐릭터 말투로. 여성혐오 단어 금지 (암캐, 창녀, 걸레, 화냥년).
</instruction>`);

  lines.push('</peaches_and_cream>');
  return lines.join('\n');
}

function buildSexPrompt() {
  const cd=getCharStore(), cname=getCurrentCharName();
  const lines=['<sex_data>'];

  if(cd.userErogenous) {
    lines.push(`<user_erogenous>\nThis describes the female user's sexual response.\n${cd.userErogenous}\n</user_erogenous>`);
  }
  if(cd.charErogenous) {
    lines.push(`<char_erogenous name="${cname}">\nThis describes the male character's erogenous response.\n${cd.charErogenous}\n</char_erogenous>`);
  }

  lines.push('</sex_data>');
  lines.push('REMINDER: 위 데이터는 현재 성적 씬이 진행 중일 때만 활성화된다. 성적 씬이 아닌 경우 이 REMINDER는 무시된다.');
  return lines.join('\n');
}

function refreshPrompt() {
  try {
    const { setExtensionPrompt } = ctx();
    setExtensionPrompt(MODULE_NAME,        buildMainPrompt(), 3, 0);
    setExtensionPrompt(MODULE_NAME+'_sex', buildSexPrompt(),  1, 2);
  } catch(e) { console.warn(`[${MODULE_NAME}] prompt error`, e); }
}

// ═══════════════════════════════════════════
// 캐릭터/유저 정보
// ═══════════════════════════════════════════
function getCurrentCharName() { try{return ctx().name2||'{{char}}';}catch(e){return '{{char}}';} }
function getCurrentUserName()  { try{return ctx().name1||'{{user}}';}catch(e){return '{{user}}';} }
function getCharDescription() {
  try{
    const c=ctx();
    if(c.characters&&c.characterId!==undefined){
      const ch=c.characters[c.characterId];
      if(ch) return [ch.description,ch.personality,ch.scenario,ch.mes_example].filter(Boolean).join('\n').trim();
    }
    return '';
  }catch(e){return '';}
}
function getUserPersona(){ try{const c=ctx();return c.persona||c?.powerUserSettings?.persona_description||'';}catch(e){return '';} }

// ═══════════════════════════════════════════
// generateRaw 래퍼 (API 라우팅 - Gemini 호환)
// ═══════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt, appName) {
  const c = ctx(), store = getStore();
  const tokens = (appName && APP_TOKENS[appName]) ? APP_TOKENS[appName] : (store.config.maxTokens || 1500);

  if (store.config.apiSource === 'profile' && store.config.profileId) {
    if (!c.ConnectionManagerRequestService) {
      return '⚠️ Connection Manager가 로드되지 않았습니다. SillyTavern을 새로고침해주세요.';
    }

    const combinedPrompt = [];
    if (systemPrompt && systemPrompt.trim()) combinedPrompt.push(systemPrompt.trim());
    if (userPrompt   && userPrompt.trim())   combinedPrompt.push(userPrompt.trim());

    if (combinedPrompt.length === 0) {
      console.warn(`[${MODULE_NAME}] 빈 프롬프트 — API 호출 취소`);
      return '';
    }

    const contextMessages = [
      { role: 'user', content: combinedPrompt.join('\n\n') }
    ];

    try {
      const response = await c.ConnectionManagerRequestService.sendRequest(
        store.config.profileId,
        contextMessages,
        tokens,
        { stream: false, extractData: true, includePreset: false, includeInstruct: false }
      );
      if (typeof response === 'string') return response;
      return response?.text || response?.content || response?.choices?.[0]?.message?.content || String(response);
    } catch(err) {
      console.error(`[${MODULE_NAME}] 프로필 통신 에러:`, err);
      return `⚠️ API 통신 에러: ${err.message}`;
    }
  }

  // 기본 Main API
  try {
    const params = { systemPrompt: systemPrompt||'', prompt: userPrompt||'', max_new_tokens: tokens, streaming: false };
    return await c.generateRaw(params);
  } catch(err) {
    console.error(`[${MODULE_NAME}] 메인 API 에러:`, err);
    return `⚠️ 메인 API 에러: ${err.message}`;
  }
}

// ═══════════════════════════════════════════
// 챗 읽기
// ═══════════════════════════════════════════
function getRecentChat(limit){
  try{const{chat}=ctx();return(chat||[]).slice(-(limit||10)).map(m=>({role:m.is_user?'user':'assistant',content:m.mes||'',name:m.name||''}));}
  catch(e){return[];}
}
function getChatRange(s,e){
  try{
    const{chat}=ctx(),arr=chat||[];
    if(!s&&!e) return getRecentChat(10);
    const si=s?Math.max(1,parseInt(s)):1, ei=e?Math.min(arr.length,parseInt(e)):arr.length;
    return arr.slice(si-1,ei).map(m=>({role:m.is_user?'user':'assistant',content:m.mes||'',name:m.name||''}));
  }catch(e){return getRecentChat(10);}
}

// ═══════════════════════════════════════════
// NSFW 툴바
// ═══════════════════════════════════════════
const TOOLBAR_ID = 'pc-nsfw-toolbar';

const FIXED_TAGS = {
  sfw:      ['Kiss','Hug','Cuddle','Head Pat','Back Hug','Forehead Kiss','Pout','Whisper in Ear'],
  mood:     ['Romantic','Dominant','Bed','Wall'],
  foreplay: ['Kissing','Fingering','Blowjob','Cunnilingus'],
  position: ['Missionary','Doggy','Cowgirl','Standing'],
  action:   ['Slow','Fast','Rough','Penetrate','Continue'],
  finish:   ['Internal','External','On Body'],
  orgasm:   ['Squirt','Scream'],
};

const GROUPS = [
  { id:'sfw',      label:'SFW',          key:'sfw'      },
  { id:'mood',     label:'Mood & Place', key:'mood'     },
  { id:'foreplay', label:'Foreplay',     key:'foreplay' },
  { id:'position', label:'Position',     key:'position' },
  { id:'action',   label:'Action',       key:'action'   },
  { id:'finish',   label:'Finish',       key:'finish'   },
  { id:'orgasm',   label:'Orgasm',       key:'orgasm'   },
];

let tbCollapsed = false;
let tbActiveGroup = 'sfw';

function injectToolbarStyle(){
  if(document.getElementById('pc-tb-style')) return;
  const s=document.createElement('style');
  s.id='pc-tb-style';
  s.textContent=`
#${TOOLBAR_ID}{width:100%;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;}
.pc-tb-wrap{background:#fff;border-top:0.5px solid #e8e8e8;}
.pc-tb-topbar{display:flex;align-items:center;gap:8px;padding:6px 14px;border-bottom:0.5px solid #f0f0f0;}
.pc-tb-title{font-size:12px;font-weight:500;color:#1a1a1a;flex-shrink:0;}
.pc-tb-condom{display:flex;gap:3px;margin-left:2px;}
.pc-tb-condom-btn{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:500;border:0.5px solid #e0e0e0;background:transparent;color:#888;cursor:pointer;transition:all .12s;}
.pc-tb-condom-btn.on.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
.pc-tb-condom-btn.off.active{background:#dc2626;color:#fff;border-color:#dc2626;}
.pc-tb-spacer{flex:1;}
.pc-tb-collapse{font-size:11px;color:#aaa;background:none;border:none;cursor:pointer;padding:2px 6px;opacity:.7;}
.pc-tb-collapse:hover{opacity:1;}
.pc-tb-close{font-size:13px;color:#bbb;background:none;border:none;cursor:pointer;padding:2px 6px;opacity:.7;}
.pc-tb-close:hover{opacity:1;}
.pc-tb-collapsible{}
.pc-tb-collapsible.hidden{display:none;}
.pc-tb-tabs{display:flex;overflow-x:auto;scrollbar-width:none;border-bottom:0.5px solid #f0f0f0;padding:0 14px;gap:2px;}
.pc-tb-tabs::-webkit-scrollbar{display:none;}
.pc-tb-tab{padding:6px 10px;font-size:11px;font-weight:500;color:#888;border:none;background:none;cursor:pointer;white-space:nowrap;border-bottom:1.5px solid transparent;font-family:inherit;flex-shrink:0;margin-bottom:-0.5px;transition:color .12s;}
.pc-tb-tab:hover{color:#1a1a1a;}
.pc-tb-tab.active{color:#1a1a1a;border-bottom-color:#1a1a1a;}
.pc-tb-body{padding:7px 14px 8px;}
.pc-tb-tags{display:flex !important;flex-wrap:wrap !important;gap:4px !important;}
.pc-tb-tag{padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;background:#f4f4f4;color:#555;cursor:pointer;border:0.5px solid transparent;transition:all .1s;user-select:none;display:inline-block !important;width:fit-content !important;}
.pc-tb-tag:hover{border-color:#ddd;color:#1a1a1a;}
.pc-tb-tag.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.pc-tb-add{padding:3px 9px;border-radius:20px;font-size:11px;background:transparent;color:#aaa;border:0.5px dashed #ccc;cursor:pointer;display:inline-block !important;width:fit-content !important;}
.pc-tb-add:hover{border-color:#999;color:#666;}
.pc-tb-footer{display:flex;align-items:center;gap:6px;padding:6px 14px 7px;border-top:0.5px solid #f0f0f0;}
.pc-tb-hint{flex:1;font-size:11px;color:#aaa;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.pc-tb-reset{font-size:11px;color:#bbb;background:none;border:none;cursor:pointer;padding:2px 6px;}
.pc-tb-reset:hover{color:#888;}
.pc-tb-apply{background:#1a1a1a;color:#fff;border:none;border-radius:20px;padding:5px 14px;font-size:11px;font-weight:500;cursor:pointer;flex-shrink:0;letter-spacing:0.2px;}
.pc-tb-apply:active{opacity:.8;}
@media(prefers-color-scheme:dark){
  .pc-tb-wrap{background:#1c1c1e;border-color:#3a3a3c;}
  .pc-tb-topbar,.pc-tb-footer{border-color:#2c2c2e;}
  .pc-tb-title{color:#fff;}
  .pc-tb-tabs{border-color:#2c2c2e;}
  .pc-tb-tab{color:#888;}
  .pc-tb-tab.active{color:#fff;border-bottom-color:#fff;}
  .pc-tb-tag{background:#2c2c2e;color:#ccc;}
  .pc-tb-tag.active{background:#fff;color:#000;}
  .pc-tb-condom-btn{color:#888;border-color:#3a3a3c;}
  .pc-tb-apply{background:#fff;color:#000;}
  .pc-tb-footer{border-color:#2c2c2e;}
}
@media(max-width:430px){
  #pc-popup-overlay{align-items:flex-end!important;justify-content:center!important;}
  #pc-popup-wrap{width:100%!important;height:92vh!important;height:92dvh!important;border-radius:24px 24px 0 0!important;padding-bottom:env(safe-area-inset-bottom,0px)!important;}
}`;
  document.head.appendChild(s);
}

function buildTabTagsHTML(groupId){
  const store=getStore(), ct=store.config.customTags||{};
  const fixed  = FIXED_TAGS[groupId]||[];
  const custom = ct[groupId]||[];
  const items  = [...fixed,...custom];
  return items.map(t=>`<div class="pc-tb-tag" data-key="${groupId}" data-val="${t.replace(/"/g,'&quot;')}" onclick="pcTag(this)">${t}</div>`).join('')
    + `<button class="pc-tb-add" onclick="pcAddCustom('${groupId}')">+</button>`;
}

function buildToolbarHTML(){
  const store=getStore();
  const condomActive = store.config.condomState||'';
  const tabsHTML = GROUPS.map(g=>
    `<button class="pc-tb-tab${g.id===tbActiveGroup?' active':''}" onclick="pcSwitchTab('${g.id}')">${g.label}</button>`
  ).join('');

  return `
    <div id="${TOOLBAR_ID}">
      <div class="pc-tb-wrap">
        <div class="pc-tb-topbar">
          <span class="pc-tb-title">🍑 NSFW</span>
          <div class="pc-tb-condom">
            <button class="pc-tb-condom-btn on${condomActive==='on'?' active':''}" onclick="pcCondom('on')">Condom ON</button>
            <button class="pc-tb-condom-btn off${condomActive==='off'?' active':''}" onclick="pcCondom('off')">Condom OFF</button>
          </div>
          <span class="pc-tb-spacer"></span>
          <button class="pc-tb-collapse" onclick="pcTbCollapse()">${tbCollapsed?'펼치기 ▲':'접기 ▼'}</button>
          <button class="pc-tb-close" onclick="pcTbClose()">✕</button>
        </div>
        <div class="pc-tb-collapsible${tbCollapsed?' hidden':''}" id="pc-tb-collapsible">
          <div class="pc-tb-tabs" id="pc-tb-tabs">${tabsHTML}</div>
          <div class="pc-tb-body">
            <div class="pc-tb-tags" id="pc-tb-tag-area">${buildTabTagsHTML(tbActiveGroup)}</div>
          </div>
        </div>
        <div class="pc-tb-footer">
          <span class="pc-tb-hint" id="pc-tb-hint">태그를 선택하세요</span>
          <button class="pc-tb-reset" onclick="pcTbReset()">초기화</button>
          <button class="pc-tb-apply" onclick="pcTbApply()">Apply →</button>
        </div>
      </div>
    </div>`;
}

function renderToolbar(){
  removeToolbar();
  if(!getStore().config.toolbarEnabled) return;
  injectToolbarStyle();
  const div=document.createElement('div');
  div.innerHTML=buildToolbarHTML();
  const sendForm=document.getElementById('send_form');
  if(sendForm) sendForm.insertAdjacentElement('beforebegin', div.firstElementChild);
  else document.body.appendChild(div.firstElementChild);
}

function removeToolbar(){ document.getElementById(TOOLBAR_ID)?.remove(); }

window.pcTbCollapse=function(){
  tbCollapsed=!tbCollapsed;
  const col=document.getElementById('pc-tb-collapsible');
  const btn=document.querySelector('.pc-tb-collapse');
  if(col) col.classList.toggle('hidden', tbCollapsed);
  if(btn) btn.textContent=tbCollapsed?'펼치기 ▲':'접기 ▼';
};

window.pcSwitchTab=function(groupId){
  tbActiveGroup=groupId;
  document.querySelectorAll('.pc-tb-tab').forEach(t=>t.classList.toggle('active', t.textContent===GROUPS.find(g=>g.id===groupId)?.label));
  const area=document.getElementById('pc-tb-tag-area');
  if(area) area.innerHTML=buildTabTagsHTML(groupId);
};

window.pcTag=function(el){
  el.classList.toggle('active');
  pcUpdateHint();
};

window.pcCondom=function(val){
  const store=getStore();
  const current=store.config.condomState||'';
  store.config.condomState = current===val ? '' : val;
  saveStore();
  document.querySelectorAll('.pc-tb-condom-btn').forEach(b=>{
    b.classList.toggle('active', b.classList.contains(store.config.condomState));
  });
};

window.pcAddCustom=function(key){
  const val=prompt('Add (English):');
  if(!val||!val.trim()) return;
  const trimmed=val.trim();
  const store=getStore();
  if(!store.config.customTags[key]) store.config.customTags[key]=[];
  if(store.config.customTags[key].includes(trimmed)) return;
  store.config.customTags[key].push(trimmed);
  saveStore();
  const area=document.getElementById('pc-tb-tag-area');
  if(area) area.innerHTML=buildTabTagsHTML(key);
};

window.pcTbReset=function(){
  document.querySelectorAll('.pc-tb-tag.active').forEach(t=>t.classList.remove('active'));
  pcUpdateHint();
};

function pcUpdateHint(){
  const sel=Array.from(document.querySelectorAll('.pc-tb-tag.active')).map(t=>t.dataset.val);
  const hint=document.getElementById('pc-tb-hint');
  if(hint) hint.textContent=sel.length?sel.join(', '):'태그를 선택하세요';
}

window.pcTbApply=async function(){
  const byKey={};
  document.querySelectorAll('.pc-tb-tag.active').forEach(t=>{
    const k=t.dataset.key, v=t.dataset.val;
    if(!byKey[k]) byKey[k]=[];
    byKey[k].push(v);
  });

  const store=getStore();
  const condom=store.config.condomState||'';
  const parts=[];
  let actionMsg='';

  if(byKey.sfw?.length){
    const sfwMap={
      'Kiss':           'kiss her softly',
      'Hug':            'pull her into a hug',
      'Cuddle':         'cuddle with her',
      'Head Pat':       'gently pat her head',
      'Back Hug':       'wrap your arms around her from behind',
      'Forehead Kiss':  'kiss her forehead',
      'Pout':           'pout and act sulky toward her',
      'Whisper in Ear': 'lean in and whisper something in her ear',
    };
    const sfwParts=byKey.sfw.map(v=>sfwMap[v]||v.toLowerCase());
    actionMsg=`IMMEDIATE INSTRUCTION: In your very next response, you MUST — ${sfwParts.join(', ')}. Stay in character. Do this without exception.`;
  } else {
    if(byKey.mood?.length)     parts.push(`set the mood to ${byKey.mood.join(' and ')}`);
    if(byKey.foreplay?.length) parts.push(`perform ${byKey.foreplay.join(' and ')}`);
    if(byKey.position?.length) parts.push(`switch to ${byKey.position.join(', ')} position`);
    if(byKey.action?.length)   parts.push(byKey.action.includes('Penetrate')?'penetrate now without further foreplay':byKey.action.join(', ').toLowerCase());
    if(byKey.finish?.length)   parts.push(`finish ${byKey.finish.join(', ')}`);
    if(byKey.orgasm?.length)   parts.push(`user reaches orgasm with ${byKey.orgasm.join(' and ')}`);
    if(condom==='on')          parts.push('put on a condom first');
    else if(condom==='off')    parts.push('no condom');
    if(!parts.length) return;
    actionMsg=`IMMEDIATE INSTRUCTION: In your very next response, you MUST — ${parts.join(', ')}. Do this without exception.`;
  }

  pcTbReset();
  try{
    const {setExtensionPrompt, generate} = ctx();
    setExtensionPrompt(MODULE_NAME+'_action', actionMsg, 1, 0);
    await generate('normal', {});
    setTimeout(()=>{ try{ setExtensionPrompt(MODULE_NAME+'_action','',1,0); }catch(e){} }, 300);
  }catch(e){ console.error(`[${MODULE_NAME}] apply error`,e); }
};

window.pcTbClose=function(){
  const store=getStore();
  store.config.toolbarEnabled=false;
  saveStore();
  removeToolbar();
  try{
    const iw=window.__PC_IFRAME__?.contentWindow;
    if(iw&&typeof iw.pcSyncToolbarToggle==='function') iw.pcSyncToolbarToggle(false);
  }catch(e){}
};

window.__PC_TOOLBAR_TOGGLE__=function(enabled){
  const store=getStore();
  store.config.toolbarEnabled=enabled;
  saveStore();
  if(enabled) renderToolbar();
  else removeToolbar();
};

// ═══════════════════════════════════════════
// 설정 UI (Connection Profile 드롭다운)
// ═══════════════════════════════════════════
function renderSettingsPanel(){
  const store=getStore();
  $('#extensions_settings2').append(`
    <div id="pc-settings-panel">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>🍑 Peaches &amp; Cream</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">

          <div style="margin-bottom:10px;">
            <label style="display:block;margin-bottom:4px;font-weight:bold;">API 소스</label>
            <select id="pc-api-source" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ccc;background:var(--bgSecondary);">
              <option value="main"    ${store.config.apiSource==='main'   ?'selected':''}>Main API</option>
              <option value="profile" ${store.config.apiSource==='profile'?'selected':''}>Connection Profile</option>
            </select>
          </div>

          <div id="pc-profile-wrap" style="display:${store.config.apiSource==='profile'?'block':'none'};margin-bottom:12px;">
            <label style="display:block;margin-bottom:4px;font-size:12px;">Connection Profile 선택</label>
            <select class="pc-connection-profile" style="width:100%;padding:6px;border-radius:6px;border:1px solid #ccc;background:var(--bgSecondary);"></select>
            <small style="display:block;margin-top:6px;color:#888;">SillyTavern API 설정 탭에서 만든 프로필을 선택하세요.</small>
          </div>
          <hr>

          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <label style="white-space:nowrap;">최대 토큰</label>
            <input id="pc-max-tokens" type="number" value="${store.config.maxTokens||1500}" min="100" max="8000" style="width:80px;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:13px;"/>
          </div>
          <hr>
          <small style="color:#888;">요술봉 메뉴에서 🍑 Peaches &amp; Cream을 클릭해 여세요.</small>
        </div>
      </div>
    </div>
  `);

  $('#pc-api-source').on('change', function(){
    store.config.apiSource = $(this).val();
    $('#pc-profile-wrap').toggle($(this).val() === 'profile');
    saveStore();
  });

  $('#pc-max-tokens').on('change', function(){
    getStore().config.maxTokens = parseInt($(this).val()) || 1500;
    saveStore();
  });

  try {
    const c = ctx();
    if (c.ConnectionManagerRequestService) {
      c.ConnectionManagerRequestService.handleDropdown(
        '#pc-settings-panel .pc-connection-profile',
        store.config.profileId,
        (profile) => {
          store.config.profileId = profile?.id ?? '';
          saveStore();
        }
      );
    }
  } catch(e) {
    console.warn(`[${MODULE_NAME}] ConnectionManagerRequestService 초기화 실패:`, e);
  }
}

function addWandMenuItem(){
  const $item=$(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5"><span>🍑</span><span>Peaches &amp; Cream</span></div>`);
  $item.on('click',function(){ $('#extensionsMenu').hide(); openMainHub(); });
  $('#extensionsMenu').append($item);
}

const POPUP_ID='pc-popup-overlay';

async function openMainHub(){
  if($(`#${POPUP_ID}`).length) return;
  injectToolbarStyle();

  const bridgeData={
    __PC_STORE__:          getCharStore(),
    __PC_GLOBAL_STORE__:   getStore(),
    __PC_CLOSE__:          closeMainHub,
    __PC_GENERATE__:       (sys, usr, app) => generateWithRole(sys, usr, app),
    __PC_GET_CHAT__:       getRecentChat,
    __PC_GET_CHAT_RANGE__: getChatRange,
    __PC_CHAR__:           getCurrentCharName(),
    __PC_USER__:           getCurrentUserName(),
    __PC_CHAR_DESC__:      getCharDescription(),
    __PC_USER_PERSONA__:   getUserPersona(),
    __PC_SAVE__:           saveStore,
    __PC_REFRESH_PROMPT__: refreshPrompt,
    __PC_CHAR_KEY__:       getCharKey(),
    __PC_TOOLBAR_TOGGLE__: window.__PC_TOOLBAR_TOGGLE__,
    __PC_CHAR_REACTION__:  CHAR_REACTION_INSTRUCTION,
    __PC_APP_TOKENS__:     APP_TOKENS,
  };
  Object.assign(window, bridgeData);

  const extUrl=`scripts/extensions/third-party/${MODULE_NAME}/main.html`;
  const mobile=isMobile();

  const overlay=document.createElement('div');
  overlay.id=POPUP_ID;
  overlay.style.cssText=`position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:9999;display:flex;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);${mobile?'align-items:flex-end;justify-content:center;':'align-items:center;justify-content:center;'}`;
  overlay.addEventListener('click',e=>{ if(e.target===overlay) closeMainHub(); });
  overlay.addEventListener('touchstart',e=>{ if(e.target===overlay) closeMainHub(); },{passive:true});

  const wrap=document.createElement('div');
  wrap.id='pc-popup-wrap';
  wrap.style.cssText=mobile
    ?'position:relative;width:100%;height:92vh;height:92dvh;border-radius:24px 24px 0 0;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,0.4);'
    :'position:relative;width:min(460px,92vw);height:min(90vh,800px);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5);';

  const iframe=document.createElement('iframe');
  iframe.src=extUrl;
  iframe.style.cssText='width:100%;height:100%;border:none;display:block;';
  iframe.id='pc-iframe';
  window.__PC_IFRAME__=iframe;

  iframe.addEventListener('load',function(){
    try{
      const iw=iframe.contentWindow;
      Object.assign(iw,bridgeData);
      if(typeof iw.__PC_ON_BRIDGE__==='function') iw.__PC_ON_BRIDGE__();
    }catch(e){ console.error(`[${MODULE_NAME}] bridge error`,e); }
  });

  wrap.appendChild(iframe);
  overlay.appendChild(wrap);
  document.body.appendChild(overlay);
}

function closeMainHub(){
  $(`#${POPUP_ID}`).remove();
  window.__PC_IFRAME__=null;
  refreshPrompt();
  if(getStore().config.toolbarEnabled) renderToolbar();
}

(async function init(){
  getStore();
  renderSettingsPanel();
  addWandMenuItem();
  injectToolbarStyle();
  const{eventSource,event_types}=ctx();
  eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
  eventSource.on(event_types.CHAT_CHANGED,()=>{
    refreshPrompt();
    if(getStore().config.toolbarEnabled) renderToolbar();
  });
  refreshPrompt();
  if(getStore().config.toolbarEnabled) renderToolbar();
  window.__PC_REFRESH_PROMPT__=refreshPrompt;
  window.__PC_SAVE_STORE__    =saveStore;
  window.__PC_GET_CHAR_STORE__=getCharStore;
  console.log(`[${MODULE_NAME}] v2.6 로드 완료`);
})();
