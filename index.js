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
  stashStolenHistory:  [],
  stashEvidenceHistory:[],
  studyBodyHistory:    [],
  studyTrainingHistory:[],
};

const defaultGlobalConfig = {
  apiSource:'main', maxTokens:1500, toolbarEnabled:false,
  customTags:{ sfw:[], mood:[], foreplay:[], position:[], action:[], finish:[], orgasm:[], fetish:[] },
  deletedTags:{},
  deletedGroups:[],
  customGroups:[],
  favoriteTags:[],
  favoriteTabEnabled:false,
};

// ═══════════════════════════════════════════
// 공통 캐릭터 반응 지시문
// ═══════════════════════════════════════════
const CHAR_REACTION_INSTRUCTION = `React based on your character's personality as described in your character card. Show realistic emotions — embarrassment, defensiveness, pride, or guilt depending on your nature. Do not always default to shameless denial. No female-degrading slurs.`;

// ═══════════════════════════════════════════
// 어플별 토큰
// ═══════════════════════════════════════════
const APP_TOKENS = {
  redflag:    400,
  clinic:     400,
  reviews:    400,
  offrecord:  300,
  worldfeed:  700,
  blackbox:   400,
  dreamlog:   300,
  apology:    300,
  wanted:     600,
  monologue:  500,
  stash:      300,
  studynotes: 300,
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
  // v2.6 migration — new fields (preserves existing data)
  if (!s.config.deletedTags)   s.config.deletedTags   = {};
  if (!s.config.deletedGroups) s.config.deletedGroups  = [];
  if (!s.config.customGroups)  s.config.customGroups   = [];
  if (!s.config.favoriteTags)  s.config.favoriteTags   = [];
  if (s.config.favoriteTabEnabled===undefined) s.config.favoriteTabEnabled = false;
  // clean up legacy tochar
  delete s.config.customTags.tochar;
  delete s.config.deletedTags.tochar;
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
    lines.push(`<user_body>\nThis describes the user's body. Always incorporate these details naturally in scene descriptions.\n${cd.userBody}\n</user_body>`);
  }
  if(cd.userMarks) {
    lines.push(`<user_marks>\nThese are the user's physical marks and distinguishing features. Always reference them naturally in descriptions.\n${cd.userMarks}\n</user_marks>`);
  }
  if(cd.charBody) {
    lines.push(`<char_body name="${cname}">\nThis describes ${cname}'s body.\n${cd.charBody}\n</char_body>`);
  }
  if(cd.charMarks) {
    lines.push(`<char_marks name="${cname}">\nThese are ${cname}'s physical marks and distinguishing features. Always reference them naturally in descriptions.\n${cd.charMarks}\n</char_marks>`);
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
    lines.push(`<user_erogenous>\nThis describes the user's erogenous zones and sexual responses. Apply these during intimate scenes.\n${cd.userErogenous}\n</user_erogenous>`);
  }
  if(cd.charErogenous) {
    lines.push(`<char_erogenous name="${cname}">\nThis describes ${cname}'s erogenous zones and sexual responses. Apply these during intimate scenes.\n${cd.charErogenous}\n</char_erogenous>`);
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
// generateRaw 래퍼
// ═══════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt, appName) {
  const c=ctx(), store=getStore();
  const tokens = (appName && APP_TOKENS[appName]) ? APP_TOKENS[appName] : (store.config.maxTokens||1500);
  const params = { systemPrompt: systemPrompt||'', prompt: userPrompt||'', max_new_tokens: tokens, streaming: false };
  return await c.generateRaw(params);
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
  mood:     ['Romantic','Dominant','Bed','Wall','Angry'],
  foreplay: ['Kissing','Fingering','Blowjob','Cunnilingus'],
  position: ['Missionary','Doggy','Cowgirl','Standing'],
  action:   ['Slow','Fast','Rough','Penetrate','Continue'],
  finish:   ['Internal','External','On Body'],
  orgasm:   ['Squirt','Scream'],
  fetish:   ['Tie','Blindfold','Choke','Spank','Hair Pull'],
};

const DEFAULT_GROUPS = [
  { id:'sfw',      label:'SFW'          },
  { id:'mood',     label:'Mood & Place' },
  { id:'foreplay', label:'Foreplay'     },
  { id:'position', label:'Position'     },
  { id:'action',   label:'Action'       },
  { id:'finish',   label:'Finish'       },
  { id:'orgasm',   label:'Orgasm'       },
  { id:'fetish',   label:'Fetish'       },
];

const ROLE_OPTIONS = [
  { id:'c2u',  label:'C→U' },
  { id:'u2c',  label:'U→C' },
  { id:'c',    label:'C'   },
  { id:'u',    label:'U'   },
  { id:'none', label:'없음' },
];

let tbCollapsed = false;
let tbActiveGroup = 'sfw';
let tbSelected = [];
let tbPendingTag = null;

function getVisibleGroups() {
  const store = getStore();
  const dg = store.config.deletedGroups || [];
  const defaults = DEFAULT_GROUPS.filter(g => !dg.includes(g.id));
  const custom = store.config.customGroups || [];
  return [...defaults, ...custom];
}

function getVisibleTags(groupId) {
  const store = getStore();
  const isDefault = DEFAULT_GROUPS.some(g => g.id === groupId);
  const fixed = isDefault ? (FIXED_TAGS[groupId] || []) : [];
  const deleted = store.config.deletedTags?.[groupId] || [];
  const custom = store.config.customTags?.[groupId] || [];
  const customGroup = (store.config.customGroups || []).find(g => g.id === groupId);
  const base = isDefault ? fixed.filter(t => !deleted.includes(t)) : (customGroup?.tags || []);
  return [...base, ...custom];
}

function injectToolbarStyle(){
  if(document.getElementById('pc-tb-style')) return;
  const s=document.createElement('style');
  s.id='pc-tb-style';
  s.textContent=`
#${TOOLBAR_ID}{width:100%;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;}
.pc-tb-wrap{background:#fff;border-top:0.5px solid #e8e8e8;}
.pc-tb-topbar{display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:0.5px solid #f0f0f0;}
.pc-tb-title{font-size:14px;font-weight:500;color:#1a1a1a;flex-shrink:0;}
.pc-tb-condom{display:flex;gap:3px;margin-left:2px;}
.pc-tb-condom-btn{padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;border:0.5px solid #e0e0e0;background:transparent;color:#888;cursor:pointer;transition:all .12s;font-family:inherit;}
.pc-tb-condom-btn.on.active{background:#1d4ed8;color:#fff;border-color:#1d4ed8;}
.pc-tb-condom-btn.off.active{background:#dc2626;color:#fff;border-color:#dc2626;}
.pc-tb-spacer{flex:1;}
.pc-tb-collapse{font-size:13px;color:#aaa;background:none;border:none;cursor:pointer;padding:2px 6px;opacity:.7;font-family:inherit;}
.pc-tb-collapse:hover{opacity:1;}
.pc-tb-close{font-size:14px;color:#bbb;background:none;border:none;cursor:pointer;padding:2px 6px;opacity:.7;}
.pc-tb-close:hover{opacity:1;}
.pc-tb-collapsible{}
.pc-tb-collapsible.hidden{display:none;}
.pc-tb-tabs{display:flex;overflow-x:auto;scrollbar-width:none;border-bottom:0.5px solid #f0f0f0;padding:0 14px;gap:2px;}
.pc-tb-tabs::-webkit-scrollbar{display:none;}
.pc-tb-tab{padding:8px 12px;font-size:13px;font-weight:500;color:#888;border:none;background:none;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;font-family:inherit;flex-shrink:0;margin-bottom:-0.5px;transition:color .12s;}
.pc-tb-tab:hover{color:#1a1a1a;}
.pc-tb-tab.active{color:#1a1a1a;border-bottom-color:#1a1a1a;}
.pc-tb-body{padding:8px 14px 6px;}
.pc-tb-tags{display:flex !important;flex-wrap:wrap !important;gap:5px !important;}
.pc-tb-tag{padding:5px 12px;border-radius:20px;font-size:13px;font-weight:500;background:#f4f4f4;color:#555;cursor:pointer;border:0.5px solid transparent;transition:all .1s;user-select:none;display:inline-block !important;width:fit-content !important;}
.pc-tb-tag:hover{border-color:#ddd;color:#1a1a1a;}
.pc-tb-tag.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.pc-tb-add{padding:5px 12px;border-radius:20px;font-size:13px;background:transparent;color:#aaa;border:0.5px dashed #ccc;cursor:pointer;display:inline-block !important;width:fit-content !important;font-family:inherit;}
.pc-tb-add:hover{border-color:#999;color:#666;}
.pc-tb-mini-popup{display:none;padding:3px 6px;background:#fff;border:0.5px solid #e0e0e0;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08);gap:3px;align-items:center;vertical-align:middle;}
.pc-tb-mini-popup.show{display:inline-flex;}
.pc-tb-mini-label{display:none;}
.pc-tb-mini-role{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;border:0.5px solid #e0e0e0;background:#f4f4f4;color:#555;cursor:pointer;font-family:inherit;transition:all .1s;white-space:nowrap;}
.pc-tb-mini-role:hover{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.pc-tb-selected-area{padding:4px 14px 8px;display:none;}
.pc-tb-selected-area.show{display:block;}
.pc-tb-selected-label{font-size:11px;color:#aaa;margin-bottom:5px;}
.pc-tb-selected-wrap{display:flex;flex-wrap:wrap;gap:5px;}
.pc-tb-sel-chip{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;font-size:13px;background:#f4f4f4;border:0.5px solid #e8e8e8;color:#1a1a1a;}
.pc-tb-sel-name{font-weight:500;}
.pc-tb-sel-role{font-size:11px;color:#888;padding:1px 6px;background:#e8e8e8;border-radius:8px;}
.pc-tb-sel-x{font-size:14px;color:#aaa;cursor:pointer;line-height:1;transition:color .1s;}
.pc-tb-sel-x:hover{color:#c03020;}
.pc-tb-footer{display:flex;align-items:center;gap:8px;padding:8px 14px 10px;border-top:0.5px solid #f0f0f0;}
.pc-tb-input{flex:1;padding:8px 12px;border-radius:10px;border:0.5px solid #e8e8e8;background:#f9f9f9;font-size:13px;color:#1a1a1a;outline:none;font-family:inherit;}
.pc-tb-input::placeholder{color:#bbb;}
.pc-tb-input:focus{border-color:#aaa;}
.pc-tb-reset{padding:7px 14px;border-radius:10px;font-size:13px;font-weight:500;color:#888;background:#f4f4f4;border:0.5px solid #e8e8e8;cursor:pointer;font-family:inherit;white-space:nowrap;}
.pc-tb-reset:hover{color:#555;}
.pc-tb-apply{background:#1a1a1a;color:#fff;border:none;border-radius:10px;padding:7px 16px;font-size:13px;font-weight:500;cursor:pointer;flex-shrink:0;letter-spacing:0.2px;font-family:inherit;white-space:nowrap;transition:background .15s;}
.pc-tb-apply:active{opacity:.8;}
.pc-tb-tag.fav-tag{background:#fdf6e3;border-color:#f0d080;color:#8a6d20;}
.pc-tb-tab.fav-tab{color:#f0a020;}
.pc-tb-tab.fav-tab.active{color:#d48f00;border-bottom-color:#d48f00;}
.pc-tb-add-input{padding:5px 12px;border-radius:20px;font-size:13px;background:#fff;color:#1a1a1a;border:0.5px solid #e0e0e0;outline:none;font-family:inherit;width:100px;}
.pc-tb-add-input::placeholder{color:#bbb;}
.pc-tb-add-input:focus{border-color:#aaa;}
@media(prefers-color-scheme:dark){
  .pc-tb-wrap{background:#1c1c1e;border-color:#3a3a3c;}
  .pc-tb-topbar,.pc-tb-footer{border-color:#2c2c2e;}
  .pc-tb-title{color:#fff;}
  .pc-tb-tabs{border-color:#2c2c2e;}
  .pc-tb-tab{color:#888;}
  .pc-tb-tab.active{color:#fff;border-bottom-color:#fff;}
  .pc-tb-tag{background:#2c2c2e;color:#ccc;}
  .pc-tb-tag:hover{color:#fff;border-color:#555;}
  .pc-tb-tag.active{background:#fff;color:#000;border-color:#fff;}
  .pc-tb-add{color:#666;border-color:#555;}
  .pc-tb-condom-btn{color:#888;border-color:#3a3a3c;}
  .pc-tb-mini-popup{background:#2c2c2e;border-color:#3a3a3c;box-shadow:0 2px 8px rgba(0,0,0,0.2);}
  .pc-tb-mini-label{color:#fff;}
  .pc-tb-mini-role{background:#3a3a3c;color:#ccc;border-color:#555;}
  .pc-tb-mini-role:hover{background:#fff;color:#000;border-color:#fff;}
  .pc-tb-sel-chip{background:#2c2c2e;border-color:#3a3a3c;color:#e0e0e0;}
  .pc-tb-sel-role{background:#3a3a3c;color:#aaa;}
  .pc-tb-sel-x{color:#666;}
  .pc-tb-sel-x:hover{color:#ff6b6b;}
  .pc-tb-selected-label{color:#666;}
  .pc-tb-input{background:#2c2c2e;border-color:#3a3a3c;color:#e0e0e0;}
  .pc-tb-input::placeholder{color:#666;}
  .pc-tb-reset{background:#2c2c2e;border-color:#3a3a3c;color:#888;}
  .pc-tb-apply{background:#fff;color:#000;}
  .pc-tb-tag.fav-tag{background:#3a3520;border-color:#6a5a20;color:#f0d080;}
  .pc-tb-tab.fav-tab{color:#f0a020;}
  .pc-tb-tab.fav-tab.active{color:#ffc040;border-bottom-color:#ffc040;}
  .pc-tb-add-input{background:#2c2c2e;border-color:#3a3a3c;color:#e0e0e0;}
  .pc-tb-add-input::placeholder{color:#666;}
}
@media(max-width:430px){
  #pc-popup-overlay{align-items:flex-end!important;justify-content:center!important;}
  #pc-popup-wrap{width:100%!important;height:92vh!important;height:92dvh!important;border-radius:24px 24px 0 0!important;padding-bottom:env(safe-area-inset-bottom,0px)!important;}
}`;
  document.head.appendChild(s);
}

function buildToolbarHTML(){
  const store=getStore();
  const condomActive = store.config.condomState||'';
  const groups = getVisibleGroups();
  if (groups.length > 0 && !groups.find(g => g.id === tbActiveGroup)) {
    tbActiveGroup = groups[0].id;
  }
  const favTab = store.config.favoriteTabEnabled
    ? `<button class="pc-tb-tab fav-tab${tbActiveGroup==='__fav__'?' active':''}" onclick="pcSwitchTab('__fav__')">★</button>`
    : '';
  const tabsHTML = favTab + groups.map(g=>
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
            <div class="pc-tb-tags" id="pc-tb-tag-area"></div>
          </div>
          <div id="pc-tb-selected-area" class="pc-tb-selected-area">
            <div class="pc-tb-selected-label">선택됨</div>
            <div class="pc-tb-selected-wrap" id="pc-tb-selected-wrap"></div>
          </div>
        </div>
        <div class="pc-tb-footer">
          <input class="pc-tb-input" id="pc-tb-input" type="text" placeholder="추가 지시를 입력하세요..." />
          <button class="pc-tb-reset" onclick="pcTbReset()">초기화</button>
          <button class="pc-tb-apply" id="pc-tb-apply-btn" onclick="pcTbApply()">Apply</button>
        </div>
      </div>
    </div>`;
}

function renderToolbarTags(){
  const area = document.getElementById('pc-tb-tag-area');
  if(!area) return;
  const isFavTab = tbActiveGroup === '__fav__';
  const store = getStore();
  const tags = isFavTab ? (store.config.favoriteTags||[]) : getVisibleTags(tbActiveGroup);
  area.innerHTML = '';
  tags.forEach(tag => {
    const isSel = tbSelected.some(s => s.tag === tag && s.group === tbActiveGroup);
    const el = document.createElement('div');
    el.className = 'pc-tb-tag' + (isSel ? ' active' : '') + (isFavTab ? ' fav-tag' : '');
    el.textContent = tag;
    el.onclick = (e) => {
      e.stopPropagation();
      if(isSel){
        tbSelected = tbSelected.filter(s => !(s.tag === tag && s.group === tbActiveGroup));
        pcHideMiniPopup();
        renderToolbarTags();
        renderToolbarSelected();
      } else {
        pcHideMiniPopup();
        tbPendingTag = { tag, group: tbActiveGroup };
        const pendingTag = tag;
        const pendingGroup = tbActiveGroup;
        const popup = document.createElement('div');
        popup.id = 'pc-tb-mini-popup';
        popup.className = 'pc-tb-mini-popup show';
        ROLE_OPTIONS.forEach(r => {
          const btn = document.createElement('button');
          btn.className = 'pc-tb-mini-role';
          btn.textContent = r.label;
          btn.onclick = (ev) => {
            ev.stopPropagation();
            tbSelected.push({ tag: pendingTag, group: pendingGroup, role: r.id, roleLabel: r.label });
            tbPendingTag = null;
            pcHideMiniPopup();
            renderToolbarTags();
            renderToolbarSelected();
          };
          popup.appendChild(btn);
        });
        el.insertAdjacentElement('afterend', popup);
      }
    };
    area.appendChild(el);
  });
  // inline add input + button
  if(!isFavTab){
    const addInput = document.createElement('input');
    addInput.className = 'pc-tb-add-input';
    addInput.type = 'text';
    addInput.placeholder = 'Tag name...';
    addInput.onclick = (e) => e.stopPropagation();
    const addBtn = document.createElement('button');
    addBtn.className = 'pc-tb-add';
    addBtn.textContent = '+ add';
    const doAdd = () => {
      const val = addInput.value.trim();
      if(!val) return;
      const store=getStore();
      if(!store.config.customTags[tbActiveGroup]) store.config.customTags[tbActiveGroup]=[];
      if(store.config.customTags[tbActiveGroup].includes(val)) return;
      if(FIXED_TAGS[tbActiveGroup]?.includes(val)) return;
      store.config.customTags[tbActiveGroup].push(val);
      saveStore();
      addInput.value = '';
      renderToolbarTags();
    };
    addInput.onkeydown = (e) => { if(e.key==='Enter'){ e.preventDefault(); doAdd(); } };
    addBtn.onclick = (e) => { e.stopPropagation(); doAdd(); };
    area.appendChild(addInput);
    area.appendChild(addBtn);
  }
}

function pcShowMiniPopup(tagName){
  // now handled inline in renderToolbarTags
}

function pcHideMiniPopup(){
  const popup = document.getElementById('pc-tb-mini-popup');
  if(popup) popup.remove();
  tbPendingTag = null;
}

function renderToolbarSelected(){
  const area = document.getElementById('pc-tb-selected-area');
  const wrap = document.getElementById('pc-tb-selected-wrap');
  if(!area||!wrap) return;
  if(tbSelected.length === 0){ area.className = 'pc-tb-selected-area'; return; }
  area.className = 'pc-tb-selected-area show';
  wrap.innerHTML = '';
  tbSelected.forEach((s, i) => {
    const chip = document.createElement('div');
    chip.className = 'pc-tb-sel-chip';
    const safeTag = s.tag.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const safeRole = s.roleLabel.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    chip.innerHTML = `<span class="pc-tb-sel-name">${safeTag}</span><span class="pc-tb-sel-role">${safeRole}</span><span class="pc-tb-sel-x" data-idx="${i}">×</span>`;
    chip.querySelector('.pc-tb-sel-x').onclick = () => {
      tbSelected.splice(i, 1);
      renderToolbarTags();
      renderToolbarSelected();
    };
    wrap.appendChild(chip);
  });
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
  renderToolbarTags();
  renderToolbarSelected();
  document.addEventListener('click', pcDocClick);
  // prevent touch events from propagating to SillyTavern swipe handler
  const toolbar = document.getElementById(TOOLBAR_ID);
  if(toolbar){
    ['touchstart','touchmove','touchend'].forEach(evt=>{
      toolbar.addEventListener(evt, e=>e.stopPropagation(), {passive:false});
    });
  }
}

function pcDocClick(e){
  const popup = document.getElementById('pc-tb-mini-popup');
  if(!popup) return;
  if(!popup.contains(e.target) && !e.target.classList.contains('pc-tb-tag')){
    pcHideMiniPopup();
  }
}

function removeToolbar(){
  document.getElementById(TOOLBAR_ID)?.remove();
  document.removeEventListener('click', pcDocClick);
}

window.pcTbCollapse=function(){
  tbCollapsed=!tbCollapsed;
  const col=document.getElementById('pc-tb-collapsible');
  const btn=document.querySelector('.pc-tb-collapse');
  if(col) col.classList.toggle('hidden', tbCollapsed);
  if(btn) btn.textContent=tbCollapsed?'펼치기 ▲':'접기 ▼';
};

window.pcSwitchTab=function(groupId){
  tbActiveGroup=groupId;
  const store=getStore();
  const groups = getVisibleGroups();
  const hasFav = store.config.favoriteTabEnabled;
  document.querySelectorAll('.pc-tb-tab').forEach((t,i)=>{
    if(hasFav && i===0){
      t.classList.toggle('active', groupId==='__fav__');
    } else {
      const gi = hasFav ? i-1 : i;
      const g = groups[gi];
      if(g) t.classList.toggle('active', g.id===groupId);
    }
  });
  pcHideMiniPopup();
  renderToolbarTags();
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
  // handled by inline input in renderToolbarTags
};

window.pcTbReset=function(){
  tbSelected=[];
  tbPendingTag=null;
  pcHideMiniPopup();
  renderToolbarTags();
  renderToolbarSelected();
  const input = document.getElementById('pc-tb-input');
  if(input) input.value = '';
};

function buildRoleInstruction(tag, role){
  const cname = getCurrentCharName();
  const uname = getCurrentUserName();
  switch(role){
    case 'c2u': return `${cname} performs "${tag}" on/toward ${uname}`;
    case 'u2c': return `${uname} performs "${tag}" on/toward ${cname}`;
    case 'c':   return `${cname} independently does "${tag}"`;
    case 'u':   return `${uname} independently does "${tag}"`;
    case 'none':
    default:    return tag.toLowerCase();
  }
}

window.pcTbApply=async function(){
  const store=getStore();
  const condom=store.config.condomState||'';
  const userText = document.getElementById('pc-tb-input')?.value?.trim() || '';
  const parts=[];

  tbSelected.forEach(s => {
    parts.push(buildRoleInstruction(s.tag, s.role));
  });

  if(condom==='on')  parts.push('put on a condom first');
  if(condom==='off') parts.push('no condom');

  if(userText) parts.push(`User's additional instruction: "${userText}"`);

  if(!parts.length) return;

  const actionMsg=`IMMEDIATE INSTRUCTION: In your very next response, you MUST — ${parts.join('. ')}. Stay in character. Do this without exception.`;

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
  function fillApiSelect(){ }

  $('#pc-max-tokens').on('change',function(){ getStore().config.maxTokens=parseInt($(this).val())||1500; saveStore(); });
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
    try{
      const iw=window.__PC_IFRAME__?.contentWindow;
      if(iw){
        const newStore   = getCharStore();
        const newCharKey = getCharKey();
        const newCharName= getCurrentCharName();
        iw.__PC_STORE__       = newStore;
        iw.__PC_CHAR_KEY__    = newCharKey;
        iw.__PC_CHAR__        = newCharName;
        iw.__PC_USER__        = getCurrentUserName();
        iw.__PC_CHAR_DESC__   = getCharDescription();
        iw.__PC_USER_PERSONA__= getUserPersona();
        window.__PC_STORE__    = newStore;
        window.__PC_CHAR_KEY__ = newCharKey;
        window.__PC_CHAR__     = newCharName;
        if(typeof iw.router?.go==='function') iw.router.go('home');
      }
    }catch(e){ console.warn(`[${MODULE_NAME}] CHAT_CHANGED bridge sync error`,e); }
  });
  refreshPrompt();
  if(getStore().config.toolbarEnabled) renderToolbar();
  window.__PC_REFRESH_PROMPT__=refreshPrompt;
  window.__PC_SAVE_STORE__    =saveStore;
  window.__PC_GET_CHAR_STORE__=getCharStore;
  console.log(`[${MODULE_NAME}] v2.6 로드 완료`);
})();
