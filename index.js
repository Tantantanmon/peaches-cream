// index.js — Peaches & Cream v2.4
const MODULE_NAME  = 'peaches-cream';
const DATA_VERSION = '2.4';

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
  userProfile:   { height:'', weight:'', eyeColor:'', hair:'', skinTone:'', bodyType:'', chest:'', butt:'', waistHip:'', skinTexture:'', bodyHair:'', peachColor:'', venusDimples:'', scent:'' },
  userErogenous: { tightness:'', lubrication:'', texture:'', squirting:'', responsivity:'', moaning:'', flushing:'', experience:'', vibe:'', sensitiveZones:[], sensoryFeedback:[] },
  lastTouch:     { cards:[], pinned:[] },
  charProfile:   { size:'', sizeUnit:'cm', additionalFeatures:[], moaning:'', semen:'', multiRound:'', stamina:'', sensitiveZones:[], condom:'' },
  charKink:      { positions:[], customPositions:[], foreplay:[], customForeplay:[], intercourse:[], customIntercourse:[], ejaculationLocation:[], fetishes:[], customFetishes:[], role:'' },
  reviewsHistory:[], reviewsSaved:[],
  cogHistory:[], cogCards:[],
  darkHistory:[], darkCards:[],
  fanFeedHistory:[],
  fanFeedConfig: { group:'', fandomName:'', npcs:[] },
};

const defaultGlobalConfig = { apiSource:'main', maxTokens:1500, toolbarEnabled:false };

// ═══════════════════════════════════════════
// STORE — 버전 체크 자동 초기화
// ═══════════════════════════════════════════
function getStore() {
  const { extensionSettings } = ctx();
  const existing = extensionSettings[MODULE_NAME];
  if (!existing || existing.version !== DATA_VERSION) {
    extensionSettings[MODULE_NAME] = { version:DATA_VERSION, config:{...defaultGlobalConfig}, chars:{} };
  }
  const s = extensionSettings[MODULE_NAME];
  if (!s.config) s.config = {...defaultGlobalConfig};
  if (!s.chars)  s.chars  = {};
  Object.keys(defaultGlobalConfig).forEach(k => { if (s.config[k]===undefined) s.config[k]=defaultGlobalConfig[k]; });
  return s;
}

function getCharStore() {
  const s = getStore(), key = getCharKey();
  if (!s.chars[key]) s.chars[key] = JSON.parse(JSON.stringify(defaultCharData));
  const cd = s.chars[key];
  const fill = (obj,def) => Object.keys(def).forEach(k => { if(obj[k]===undefined) obj[k]=JSON.parse(JSON.stringify(def[k])); });
  fill(cd, defaultCharData);
  return cd;
}

function saveStore() { ctx().saveSettingsDebounced(); }

// ═══════════════════════════════════════════
// 태그 매핑
// ═══════════════════════════════════════════
const USER_MAPS = {
  skinTone:    { Light:'porcelain white, very fair', Medium:'warm medium tone', Dark:'deep rich dark skin' },
  bodyType:    { Slim:'lean, slender limbs', Average:'balanced proportions, naturally feminine', Glamorous:'full and voluptuous, hourglass silhouette', Athletic:'toned and muscular, firm all over' },
  chest:       { A:'A-cup, small and perky', B:'B-cup, round and natural', C:'C-cup, soft, bounces when moving', D:'D-cup, large and heavy', 'D+':'D+cup, very large, heavy and pendulous' },
  butt:        { 'Small & firm':'small, firm, tight', Average:'average, naturally round', 'Large & full':'large, full, jiggles with movement' },
  waistHip:    { Slim:'narrow hips', Hourglass:'dramatic waist, wide hips, hourglass', Full:'wide hips, full thighs, soft lower body' },
  skinTexture: { Soft:'silky smooth', Firm:'taut and elastic', Average:'smooth, natural' },
  bodyHair:    { Yes:'natural body hair', None:'fully smooth, completely hairless', 'A little':'sparse, faint body hair' },
  tightness:   { Normal:'comfortable fit, natural grip', Tight:'noticeably tight, strong grip', Extreme:'extremely tight, visible stomach bulge on deep penetration' },
  lubrication: { Dry:'little natural lubrication — describe dryness explicitly', Moist:'naturally wet, soft and slick', Soaking:'dripping wet, soaks through' },
  texture:     { Creamy:'creamy, thick consistency', Watery:'thin, clear consistency', Mixed:'varies between creamy and watery' },
  squirting:   { None:'no squirting', Rare:'squirts occasionally under intense stimulation', Frequent:'squirts easily and often, strong contractions' },
  responsivity:{ Normal:'average sensitivity', High:'very sensitive, reacts strongly to light touch', Extreme:'extremely sensitive, trembles at slightest touch' },
  moaning:     { Muted:'suppresses sounds, breathes hard through nose', Vocal:'expressive, unrestrained moaning', Passionate:'loud, uncontrollable moaning' },
  flushing:    { Pale:'minimal skin color change when aroused', Rosy:'cheeks and chest flush pink when aroused', Deep:'face, neck, chest turn deep red when aroused' },
  experience:  { Novice:'inexperienced, easily flustered', Skilled:'comfortable and confident', Master:'highly experienced, knows exactly what she wants' },
  vibe:        { Romantic:'prefers soft emotional sex with eye contact', Rough:'prefers intense aggressive sex', Slow:'prefers long drawn-out sex, values buildup' },
  condom:      { Always:'condom always used', Never:'condom never used — raw sex only', Situational:'condom use varies by situation' },
};

const KINK_DESC = {
  'Missionary':'Missionary (face-to-face, full eye contact)',
  'Doggy Style':'Doggy Style (rear-entry, user bent forward)',
  'Cowgirl':'Cowgirl (user on top riding, controls pace)',
  'Reverse Cowgirl':'Reverse Cowgirl (user on top facing away)',
  'Spooning':'Spooning (side-lying, intimate full body contact)',
  'Lotus':'Lotus (face-to-face seated, deeply intimate)',
  'Standing':'Standing (upright, often against wall)',
  '69':'69 (simultaneous oral)',
  'Face Sitting':'Face Sitting (user sits on partner\'s face)',
  'Prone Bone':'Prone Bone (user lying flat face down)',
  'The Anvil':'The Anvil (legs pushed back, deep penetration)',
  'Wheelbarrow':'Wheelbarrow (user lifted by hips)',
  'Legs Up':'Legs Up (legs raised on shoulders)',
  'Deep Kissing':'Deep Kissing (intense mouth-to-mouth, tongues)',
  'Neck Kissing':'Neck Kissing (lips on neck and collarbone)',
  'Teasing':'Teasing (deliberate withholding of stimulation)',
  'Blowjob':'Blowjob (oral stimulation)',
  'Cunnilingus':'Cunnilingus (oral on vulva)',
  'Fingering':'Fingering (manual stimulation)',
  'Handjob':'Handjob (manual stimulation)',
  'Body Massage':'Body Massage (full body tactile stimulation)',
  'Temperature Play':'Temperature Play (ice or heat on skin)',
  'Blindfolding':'Blindfolding (sensory deprivation via sight)',
  'Nipple Play':'Nipple Play (touching, pinching, sucking nipples)',
  'Dirty Talk':'Dirty Talk (explicit verbal during sex)',
  'Hair Pulling':'Hair Pulling (grabbing hair at nape)',
  'Spanking':'Spanking (open-hand strikes on buttocks)',
  'Light Choking':'Light Choking (hand around throat, controlled pressure)',
  'Eye Contact':'Eye Contact (maintained intense gaze throughout)',
  'Grinding':'Grinding (rhythmic friction without penetration)',
  'Slow & Deep':'Slow & Deep (deliberate deep thrusts, drawn out)',
  'Fast & Rough':'Fast & Rough (rapid aggressive thrusting)',
  'Orgasm Control':'Orgasm Control (edging, denial, forced orgasm)',
  'Internal (Vaginal)':'Internal — vaginal creampie',
  'External':'External — pulling out, finish outside',
  'On Body':'On Body — finish on skin',
  'On Face':'On Face — facial',
  'Inside Mouth':'Inside Mouth — oral finish',
  'Uniforms':'Uniforms (role-based costume)',
  'Lingerie':'Lingerie (lace preferred)',
  'Stockings':'Stockings (thigh-high preferred)',
  'High Heels':'High Heels (worn during sex)',
  'Leather':'Leather (material fetish)',
  'Latex':'Latex (tight material fetish)',
  'Glasses':'Glasses (worn during sex)',
  'Chokers':'Chokers (worn around neck)',
  'Silk & Satin':'Silk & Satin (smooth fabric fetish)',
  'Thigh-highs':'Thigh-highs (stay-up stockings)',
  'Formal Wear':'Formal Wear (suit/dress kept partially on)',
  'Body Oil':'Body Oil (slick skin)',
};

function mapVal(map, val) { return map[val]||val; }
function kinkArr(arr, custom) {
  const base = (arr||[]).map(k=>KINK_DESC[k]||k).join(', ');
  const cust = (custom||[]).join(', ');
  return [base,cust].filter(Boolean).join(', ');
}

// ═══════════════════════════════════════════
// 프롬프트 빌더
// ═══════════════════════════════════════════
function buildMainPrompt() {
  const cd=getCharStore(), cname=getCurrentCharName();
  const p=cd.userProfile||{}, cp=cd.charProfile||{}, lt=cd.lastTouch||{cards:[],pinned:[]};
  const lines=['<peaches_and_cream>'];

  const pinned=(lt.cards||[]).filter(c=>(lt.pinned||[]).includes(c.id));
  if(pinned.length){
    lines.push('<last_touch_memories>');
    pinned.forEach(c=>{
      lines.push(`  <memory date="${c.date||''}" place="${c.place||''}" mood="${c.mood||''}">`);
      if(c.positions?.length) lines.push(`    positions: ${c.positions.join(', ')}`);
      if(c.charReview) lines.push(`    ${c.charReview.slice(0,120)}...`);
      lines.push('  </memory>');
    });
    lines.push('</last_touch_memories>');
  }

  lines.push('<user_profile>');
  if(p.height)      lines.push(`  <height>${p.height}cm</height>`);
  if(p.weight)      lines.push(`  <weight>${p.weight}kg</weight>`);
  if(p.eyeColor)    lines.push(`  <eye_color>${p.eyeColor}</eye_color>`);
  if(p.hair)        lines.push(`  <hair>${p.hair}</hair>`);
  if(p.skinTone)    lines.push(`  <skin_tone>${mapVal(USER_MAPS.skinTone,p.skinTone)}</skin_tone>`);
  if(p.bodyType)    lines.push(`  <body_type>${mapVal(USER_MAPS.bodyType,p.bodyType)}</body_type>`);
  if(p.chest)       lines.push(`  <bust>${mapVal(USER_MAPS.chest,p.chest)}</bust>`);
  if(p.butt)        lines.push(`  <butt>${mapVal(USER_MAPS.butt,p.butt)}</butt>`);
  if(p.waistHip)    lines.push(`  <waist_hip>${mapVal(USER_MAPS.waistHip,p.waistHip)}</waist_hip>`);
  if(p.skinTexture) lines.push(`  <skin_texture>${mapVal(USER_MAPS.skinTexture,p.skinTexture)}</skin_texture>`);
  if(p.bodyHair)    lines.push(`  <body_hair>${mapVal(USER_MAPS.bodyHair,p.bodyHair)}</body_hair>`);
  if(p.peachColor)  lines.push(`  <vulva_color>${p.peachColor} — color of inner labia and vaginal opening</vulva_color>`);
  if(p.venusDimples==='Yes') lines.push(`  <venus_dimples>two small dimples above lower back</venus_dimples>`);
  if(p.scent)       lines.push(`  <scent>${p.scent}</scent>`);
  lines.push('</user_profile>');

  lines.push(`<char_profile name="${cname}">`);
  if(cp.size){
    const sl=cp.sizeUnit==='in'?`${cp.size}in (approx. ${Math.round(cp.size*2.54*10)/10}cm)`:`${cp.size}cm`;
    lines.push(`  <size>${sl}</size>`);
  }
  if(cp.additionalFeatures?.length) lines.push(`  <additional_features>${cp.additionalFeatures.join(', ')}</additional_features>`);
  if(cp.moaning)    lines.push(`  <moaning>${cp.moaning}</moaning>`);
  if(cp.semen)      lines.push(`  <semen>${cp.semen}</semen>`);
  if(cp.multiRound) lines.push(`  <multi_round>${cp.multiRound}</multi_round>`);
  if(cp.stamina)    lines.push(`  <stamina>${cp.stamina}</stamina>`);
  if(cp.condom)     lines.push(`  <condom>${mapVal(USER_MAPS.condom,cp.condom)}</condom>`);
  lines.push('</char_profile>');

  lines.push(`<instruction>
[BODY DATA — ABSOLUTE CANON]
0. 이 프롬프트에 등록된 유저/캐릭터 신체 데이터는 모든 씬에서 반드시 반영된다.
1. 유저 신체 — 외형(체형, 가슴, 엉덩이 등)을 씬에서 구체적으로 묘사하라.
2. 유저 성감대 — 등록된 민감 부위가 터치되면 즉각 반응을 묘사하라. 애액, 조임, 홍조, 신음, 떨림을 등록된 수치 그대로 서술하라.
3. 캐릭터 신체 — 사이즈, 반응, 스태미나를 씬에서 현실적으로 반영하라.
4. 씬 서술 시 캐릭터 행동 + 유저 신체 반응을 반드시 함께 묘사하라.
5. 포지션 태그가 지정되면 애무로만 끝내지 말고 반드시 삽입까지 진행하라. 단, Action 태그에 Penetrate가 없으면 애무 → 삽입 순서로 자연스럽게 전개하라.
6. 더티토크는 캐릭터 말투로. 여성혐오 단어 금지 (암캐, 창녀, 걸레, 화냥년).
</instruction>`);

  lines.push('</peaches_and_cream>');
  return lines.join('\n');
}

function buildSexPrompt() {
  const cd=getCharStore(), cname=getCurrentCharName();
  const e=cd.userErogenous||{}, cp=cd.charProfile||{};
  const lines=['<sex_data>'];

  lines.push('<user_erogenous>');
  if(e.tightness)    lines.push(`  <tightness>${mapVal(USER_MAPS.tightness,e.tightness)}</tightness>`);
  if(e.lubrication)  lines.push(`  <lubrication>${mapVal(USER_MAPS.lubrication,e.lubrication)}</lubrication>`);
  if(e.texture)      lines.push(`  <texture>${mapVal(USER_MAPS.texture,e.texture)}</texture>`);
  if(e.squirting)    lines.push(`  <squirting>${mapVal(USER_MAPS.squirting,e.squirting)}</squirting>`);
  if(e.responsivity) lines.push(`  <responsivity>${mapVal(USER_MAPS.responsivity,e.responsivity)}</responsivity>`);
  if(e.moaning)      lines.push(`  <moaning>${mapVal(USER_MAPS.moaning,e.moaning)}</moaning>`);
  if(e.flushing)     lines.push(`  <flushing>${mapVal(USER_MAPS.flushing,e.flushing)}</flushing>`);
  if(e.experience)   lines.push(`  <experience>${mapVal(USER_MAPS.experience,e.experience)}</experience>`);
  if(e.vibe)         lines.push(`  <preferred_vibe>${mapVal(USER_MAPS.vibe,e.vibe)}</preferred_vibe>`);
  if(e.sensitiveZones?.length)   lines.push(`  <sensitive_zones>${e.sensitiveZones.join(', ')} — 이 부위가 터치되면 즉각적이고 가시적인 반응을 묘사하라</sensitive_zones>`);
  if(e.sensoryFeedback?.length)  lines.push(`  <sensory_feedback>${e.sensoryFeedback.join(', ')}</sensory_feedback>`);
  lines.push('</user_erogenous>');

  if(cp.sensitiveZones?.length)
    lines.push(`<char_sensitive_zones name="${cname}">${cp.sensitiveZones.join(', ')} — 이 부위가 터치되면 즉각적이고 가시적인 반응을 묘사하라</char_sensitive_zones>`);

  lines.push('</sex_data>');
  lines.push('REMINDER: 위에 등록된 신체 데이터는 지금 당장 응답에 반영해야 하는 활성 규칙이다.');
  return lines.join('\n');
}

function refreshPrompt() {
  try {
    const { setExtensionPrompt } = ctx();
    setExtensionPrompt(MODULE_NAME,          buildMainPrompt(), 5, 1);
    setExtensionPrompt(MODULE_NAME+'_sex',   buildSexPrompt(),  5, 0);
  } catch(e) { console.warn(`[${MODULE_NAME}] prompt error`, e); }
}

// ═══════════════════════════════════════════
// 캐릭터/유저 정보
// ═══════════════════════════════════════════
function getCurrentCharName() { try{return ctx().name2||'{{char}}';}catch(e){return '{{char}}';} }
function getCurrentUserName()  { try{return ctx().name1||'{{user}}';}catch(e){return '{{user}}';} }
function getCharDescription() {
  try {
    const c=ctx();
    if(c.characters&&c.characterId!==undefined){
      const ch=c.characters[c.characterId];
      if(ch) return [ch.description,ch.personality,ch.scenario,ch.mes_example].filter(Boolean).join('\n').trim();
    }
    return '';
  } catch(e){return '';}
}
function getUserPersona() { try{const c=ctx();return c.persona||c?.powerUserSettings?.persona_description||'';}catch(e){return '';} }
function getWorldInfo() {
  try{
    const c=ctx();
    if(typeof c.getWorldInfoPrompt==='function') return c.getWorldInfoPrompt()||'';
    if(c.worldInfoData) return JSON.stringify(c.worldInfoData).slice(0,3000);
    return '';
  }catch(e){return '';}
}

// ═══════════════════════════════════════════
// generateRaw 래퍼
// ═══════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
  const c=ctx(), store=getStore(), apiSrc=store.config.apiSource||'main';
  if(apiSrc.startsWith('profile:')){
    try{
      const cmrs=c.ConnectionManagerRequestService;
      if(cmrs&&typeof cmrs.loadProfile==='function') await cmrs.loadProfile(apiSrc.replace('profile:',''));
    }catch(e){}
  }
  return await c.generateRaw({ systemPrompt, prompt:userPrompt, max_new_tokens:store.config.maxTokens||1500 });
}

// ═══════════════════════════════════════════
// 챗 읽기
// ═══════════════════════════════════════════
function getRecentChat(limit) {
  try{const{chat}=ctx();return(chat||[]).slice(-(limit||10)).map(m=>({role:m.is_user?'user':'assistant',content:m.mes||'',name:m.name||''}));}
  catch(e){return[];}
}
function getChatRange(s,e) {
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
const TOOLBAR_ID    = 'pc-nsfw-toolbar';
const TOOLBAR_STYLE_ID = 'pc-toolbar-style';

const FIXED_TAGS = {
  location:   ['Bed','Wall','Floor','Chair'],
  pace:       ['Slow','Normal','Fast','Rough'],
  mood:       ['Romantic','Dominant','Teasing','Passionate'],
  action:     ['Penetrate','Continue','Faster','Finish'],
  orgasm:     ['Thigh Trembling','Squirt','Scream','Pass Out'],
  toys:       ['Vibrator','Dildo','Womanizer','Ohmibod','Magic Wand','Nipple Clamps','Handcuffs','Blindfold'],
};

const GROUPS = [
  { id:'g1', label:'Positions / Location',      keys:['positions','location'] },
  { id:'g2', label:'Foreplay / Pace / Mood',     keys:['foreplay','pace','mood'] },
  { id:'g3', label:'Action / User Orgasm',       keys:['action','orgasm'] },
  { id:'g4', label:'Finish / Condom',            keys:['ejaculation','condom'] },
  { id:'g5', label:'Sensitive Zones / Sensory',  keys:['sensitiveZones','sensoryFeedback'] },
  { id:'g6', label:'Toys',                       keys:['toys'] },
];

let tbCollapsed = true;
let tbGroupState = { g1:false, g2:false, g3:false, g4:false, g5:false, g6:false };

function injectToolbarStyle() {
  if(document.getElementById(TOOLBAR_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = TOOLBAR_STYLE_ID;
  style.textContent = `
#${TOOLBAR_ID}{position:fixed;bottom:54px;left:0;right:0;z-index:9000;padding:0 8px 4px;}
.pc-tb-wrap{background:#fff;border:0.5px solid #e0e0e0;border-radius:16px;overflow:hidden;box-shadow:0 -4px 20px rgba(0,0,0,0.1);}
.pc-tb-topbar{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;cursor:pointer;user-select:none;}
.pc-tb-top-title{font-size:13px;font-weight:700;color:#1a1a1a;display:flex;align-items:center;gap:6px;}
.pc-tb-top-right{display:flex;align-items:center;gap:8px;}
.pc-tb-collapse-btn{font-size:12px;color:#aaa;background:none;border:none;cursor:pointer;padding:2px 6px;}
.pc-tb-close-btn{font-size:14px;color:#aaa;background:none;border:none;cursor:pointer;padding:2px 6px;}
.pc-tb-body{border-top:0.5px solid #f0f0f0;overflow:hidden;}
.pc-tb-body.collapsed{display:none;}
.pc-tb-groups{padding:8px 10px;display:flex;flex-direction:column;gap:4px;max-height:260px;overflow-y:auto;}
.pc-tb-group-header{display:flex;align-items:center;justify-content:space-between;padding:5px 6px;cursor:pointer;border-radius:8px;user-select:none;}
.pc-tb-group-header:active{background:#f5f5f5;}
.pc-tb-group-name{font-size:10px;font-weight:700;letter-spacing:0.8px;color:#aaa;text-transform:uppercase;}
.pc-tb-group-arr{font-size:11px;color:#ccc;transition:transform .2s;}
.pc-tb-group-arr.open{transform:rotate(90deg);}
.pc-tb-group-tags{display:flex;flex-wrap:wrap;gap:5px;padding:4px 6px 8px;}
.pc-tb-group-tags.hidden{display:none;}
.pc-tb-tag{padding:5px 11px;border-radius:20px;font-size:12px;background:#f2f2f2;color:#333;cursor:pointer;border:0.5px solid #e0e0e0;transition:all .12s;user-select:none;}
.pc-tb-tag.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.pc-tb-tag.condom-on.active{background:#2563eb;border-color:#2563eb;}
.pc-tb-tag.condom-off.active{background:#dc2626;border-color:#dc2626;}
.pc-tb-footer{display:flex;align-items:center;justify-content:space-between;padding:7px 14px 9px;border-top:0.5px solid #f0f0f0;}
.pc-tb-hint{font-size:11px;color:#aaa;flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;margin-right:8px;}
.pc-tb-reset{font-size:12px;color:#aaa;background:none;border:none;cursor:pointer;padding:2px 8px;}
.pc-tb-apply{background:#1a1a1a;color:#fff;border:none;border-radius:20px;padding:6px 16px;font-size:13px;font-weight:700;cursor:pointer;}
.pc-tb-apply:active{opacity:.8;}
@media(prefers-color-scheme:dark){
  .pc-tb-wrap{background:#1c1c1e;border-color:#3a3a3c;}
  .pc-tb-top-title{color:#fff;}
  .pc-tb-tag{background:#2c2c2e;color:#e0e0e0;border-color:#3a3a3c;}
  .pc-tb-tag.active{background:#fff;color:#000;}
  .pc-tb-footer,.pc-tb-topbar,.pc-tb-body{border-color:#3a3a3c;}
  .pc-tb-apply{background:#fff;color:#000;}
  .pc-tb-group-header:active{background:#2c2c2e;}
}
@media(max-width:430px){
  #pc-popup-overlay{align-items:flex-end!important;justify-content:center!important;}
  #pc-popup-wrap{width:100%!important;height:92vh!important;height:92dvh!important;border-radius:24px 24px 0 0!important;padding-bottom:env(safe-area-inset-bottom,0px)!important;}
}`;
  document.head.appendChild(style);
}

function buildToolbarHTML() {
  const cd=getCharStore(), ck=cd.charKink||{}, e=cd.userErogenous||{};
  const dynTags = {
    positions:      [...(ck.positions||[]),...(ck.customPositions||[])],
    foreplay:       [...(ck.foreplay||[]),...(ck.customForeplay||[])],
    ejaculation:    [...(ck.ejaculationLocation||[])],
    sensitiveZones: [...(e.sensitiveZones||[])],
    sensoryFeedback:[...(e.sensoryFeedback||[])],
    location:       FIXED_TAGS.location,
    pace:           FIXED_TAGS.pace,
    mood:           FIXED_TAGS.mood,
    action:         FIXED_TAGS.action,
    orgasm:         FIXED_TAGS.orgasm,
    toys:           FIXED_TAGS.toys,
    condom:         ['Condom ON','Condom OFF'],
  };

  const groupsHTML = GROUPS.map(g => {
    const isOpen = tbGroupState[g.id]||false;
    const tagsHTML = g.keys.map(key => {
      const items = dynTags[key]||[];
      if(!items.length) return '';
      return items.map(t => {
        let cls = 'pc-tb-tag';
        if(key==='condom'){ cls += t==='Condom ON'?' condom-on':' condom-off'; }
        return `<div class="${cls}" data-key="${key}" data-val="${t.replace(/"/g,'&quot;')}" onclick="pcTagClick(this)">${t}</div>`;
      }).join('');
    }).join('');
    if(!tagsHTML.trim()) return '';
    return `
      <div class="pc-tb-group">
        <div class="pc-tb-group-header" onclick="pcGroupToggle('${g.id}')">
          <span class="pc-tb-group-name">${g.label}</span>
          <span class="pc-tb-group-arr${isOpen?' open':''}" id="pc-garr-${g.id}">›</span>
        </div>
        <div class="pc-tb-group-tags${isOpen?'':' hidden'}" id="pc-gtags-${g.id}">${tagsHTML}</div>
      </div>`;
  }).join('');

  return `
    <div id="${TOOLBAR_ID}">
      <div class="pc-tb-wrap">
        <div class="pc-tb-topbar" onclick="pcToolbarToggleCollapse()">
          <span class="pc-tb-top-title">🍑 NSFW <span style="font-size:10px;color:#aaa;font-weight:400;">${tbCollapsed?'▲ 펼치기':'▼ 접기'}</span></span>
          <div class="pc-tb-top-right">
            <button class="pc-tb-close-btn" onclick="event.stopPropagation();pcToolbarClose()">✕</button>
          </div>
        </div>
        <div class="pc-tb-body${tbCollapsed?' collapsed':''}">
          <div class="pc-tb-groups">${groupsHTML}</div>
          <div class="pc-tb-footer">
            <span class="pc-tb-hint" id="pc-tb-hint">태그를 선택하세요</span>
            <button class="pc-tb-reset" onclick="pcResetTags()">초기화</button>
            <button class="pc-tb-apply" onclick="pcToolbarApply()">Apply →</button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderToolbar() {
  removeToolbar();
  const store = getStore();
  if(!store.config.toolbarEnabled) return;
  injectToolbarStyle();
  const div = document.createElement('div');
  div.innerHTML = buildToolbarHTML();
  document.body.appendChild(div.firstElementChild);
}

function removeToolbar() {
  document.getElementById(TOOLBAR_ID)?.remove();
}

window.pcToolbarToggleCollapse = function() {
  tbCollapsed = !tbCollapsed;
  renderToolbar();
};

window.pcGroupToggle = function(gid) {
  tbGroupState[gid] = !tbGroupState[gid];
  const tags = document.getElementById('pc-gtags-'+gid);
  const arr  = document.getElementById('pc-garr-'+gid);
  if(tags) tags.classList.toggle('hidden', !tbGroupState[gid]);
  if(arr)  arr.classList.toggle('open', tbGroupState[gid]);
};

window.pcTagClick = function(el) {
  const key = el.dataset.key;
  // condom은 단일선택
  if(key==='condom'){
    document.querySelectorAll(`.pc-tb-tag[data-key="condom"]`).forEach(t=>t.classList.remove('active'));
  }
  el.classList.toggle('active');
  updateHint();
};

window.pcResetTags = function() {
  document.querySelectorAll('.pc-tb-tag.active').forEach(t=>t.classList.remove('active'));
  updateHint();
};

function updateHint() {
  const sel = getSelectedTags();
  const hint = document.getElementById('pc-tb-hint');
  if(hint) hint.textContent = sel.length ? sel.join(', ') : '태그를 선택하세요';
}

function getSelectedTags() {
  return Array.from(document.querySelectorAll('.pc-tb-tag.active')).map(t=>t.dataset.val);
}

window.pcToolbarClose = function() {
  const store = getStore();
  store.config.toolbarEnabled = false;
  saveStore();
  removeToolbar();
  // 홈 토글 상태 업데이트
  if(window.__PC_IFRAME__){
    try{
      const iw = window.__PC_IFRAME__.contentWindow;
      if(iw&&typeof iw.pcSyncToolbarToggle==='function') iw.pcSyncToolbarToggle(false);
    }catch(e){}
  }
};

window.pcToolbarApply = async function() {
  const selected = getSelectedTags();
  if(!selected.length) return;

  // 선택 조합 → 메시지 빌드
  const parts = [];
  const byKey = {};
  document.querySelectorAll('.pc-tb-tag.active').forEach(t=>{
    const k=t.dataset.key, v=t.dataset.val;
    if(!byKey[k]) byKey[k]=[];
    byKey[k].push(v);
  });

  if(byKey.positions?.length)      parts.push(`Position: ${byKey.positions.join(', ')}`);
  if(byKey.location?.length)       parts.push(`Location: ${byKey.location.join(', ')}`);
  if(byKey.foreplay?.length)       parts.push(`Foreplay: ${byKey.foreplay.join(', ')}`);
  if(byKey.pace?.length)           parts.push(`Pace: ${byKey.pace.join(', ')}`);
  if(byKey.mood?.length)           parts.push(`Mood: ${byKey.mood.join(', ')}`);
  if(byKey.action?.length)         parts.push(`Action: ${byKey.action.join(', ')}`);
  if(byKey.orgasm?.length)         parts.push(`User orgasm: ${byKey.orgasm.join(', ')}`);
  if(byKey.ejaculation?.length)    parts.push(`Finish: ${byKey.ejaculation.join(', ')}`);
  if(byKey.condom?.length)         parts.push(byKey.condom[0]==='Condom ON'?'Use condom':'No condom');
  if(byKey.sensitiveZones?.length) parts.push(`Stimulate: ${byKey.sensitiveZones.join(', ')}`);
  if(byKey.sensoryFeedback?.length)parts.push(`Sensory: ${byKey.sensoryFeedback.join(', ')}`);
  if(byKey.toys?.length)           parts.push(`Use toy: ${byKey.toys.join(', ')}`);

  const actionMsg = `[PC ACTION] ${parts.join(' | ')}`;

  // 선택 초기화 (툴바 유지)
  pcResetTags();

  // 프롬프트 주입 후 generate('normal') 트리거
  try {
    const { setExtensionPrompt, generate } = ctx();
    setExtensionPrompt(MODULE_NAME+'_action', actionMsg, 5, 0);
    await generate('normal');
    // 응답 완료 후 액션 프롬프트 제거
    setTimeout(()=>{ try{ setExtensionPrompt(MODULE_NAME+'_action','',5,0); }catch(e){} }, 500);
  } catch(e) {
    console.error(`[${MODULE_NAME}] toolbar apply error`, e);
  }
};

window.__PC_TOOLBAR_TOGGLE__ = function(enabled) {
  const store = getStore();
  store.config.toolbarEnabled = enabled;
  saveStore();
  if(enabled) renderToolbar();
  else removeToolbar();
};

// ═══════════════════════════════════════════
// 설정 패널
// ═══════════════════════════════════════════
function renderSettingsPanel() {
  const store = getStore();
  $('#extensions_settings2').append(`
    <div id="pc-settings-panel">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>🍑 Peaches &amp; Cream</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <label style="white-space:nowrap;">API 소스</label>
            <select id="pc-api-source" style="flex:1;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:13px;">
              <option value="main">Main API</option>
            </select>
            <button id="pc-api-refresh" style="padding:4px 8px;font-size:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc;background:#f5f5f5;">🔄</button>
          </div>
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
  function fillApiSelect(){
    const $sel=$('#pc-api-source'), cur=getStore().config.apiSource||'main';
    $sel.empty().append('<option value="main">Main API</option>');
    try{
      const cmrs=ctx().ConnectionManagerRequestService;
      if(cmrs&&typeof cmrs.getSupportedProfiles==='function'){
        (cmrs.getSupportedProfiles()||[]).forEach(p=>{
          const id=p.id||p.profileId||p.uuid||'', name=p.name||p.profileName||id;
          if(id) $sel.append(`<option value="profile:${id}">${name}</option>`);
        });
      }
    }catch(e){}
    $sel.val(cur);
  }
  fillApiSelect();
  $('#pc-api-refresh').on('click',fillApiSelect);
  $('#pc-api-source').on('change',function(){ getStore().config.apiSource=$(this).val(); saveStore(); });
  $('#pc-max-tokens').on('change',function(){ getStore().config.maxTokens=parseInt($(this).val())||1500; saveStore(); });
}

// ═══════════════════════════════════════════
// 요술봉 메뉴
// ═══════════════════════════════════════════
function addWandMenuItem() {
  const $item=$(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5"><span>🍑</span><span>Peaches &amp; Cream</span></div>`);
  $item.on('click',function(){ $('#extensionsMenu').hide(); openMainHub(); });
  $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════
// 메인 허브 팝업 — dvh + pointer:coarse 감지
// ═══════════════════════════════════════════
const POPUP_ID = 'pc-popup-overlay';

async function openMainHub() {
  if($(`#${POPUP_ID}`).length) return;
  injectToolbarStyle();

  const bridgeData = {
    __PC_STORE__:          getCharStore(),
    __PC_GLOBAL_STORE__:   getStore(),
    __PC_CLOSE__:          closeMainHub,
    __PC_GENERATE__:       generateWithRole,
    __PC_GET_CHAT__:       getRecentChat,
    __PC_GET_CHAT_RANGE__: getChatRange,
    __PC_CHAR__:           getCurrentCharName(),
    __PC_USER__:           getCurrentUserName(),
    __PC_CHAR_DESC__:      getCharDescription(),
    __PC_USER_PERSONA__:   getUserPersona(),
    __PC_WORLD_INFO__:     getWorldInfo(),
    __PC_SAVE__:           saveStore,
    __PC_REFRESH_PROMPT__: refreshPrompt,
    __PC_CHAR_KEY__:       getCharKey(),
    __PC_TOOLBAR_TOGGLE__: window.__PC_TOOLBAR_TOGGLE__,
  };
  Object.assign(window, bridgeData);

  const extUrl  = `scripts/extensions/third-party/${MODULE_NAME}/main.html`;
  const mobile  = isMobile();

  const overlay = document.createElement('div');
  overlay.id = POPUP_ID;
  overlay.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;height:100dvh;z-index:9999;display:flex;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);${mobile?'align-items:flex-end;justify-content:center;':'align-items:center;justify-content:center;'}`;
  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeMainHub(); });
  overlay.addEventListener('touchstart', e=>{ if(e.target===overlay) closeMainHub(); }, {passive:true});

  const wrap = document.createElement('div');
  wrap.id = 'pc-popup-wrap';
  if(mobile){
    wrap.style.cssText = 'position:relative;width:100%;height:92vh;height:92dvh;border-radius:24px 24px 0 0;overflow:hidden;box-shadow:0 -8px 40px rgba(0,0,0,0.4);';
  } else {
    wrap.style.cssText = 'position:relative;width:min(460px,92vw);height:min(90vh,800px);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5);';
  }

  const iframe = document.createElement('iframe');
  iframe.src   = extUrl;
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.id    = 'pc-iframe';
  window.__PC_IFRAME__ = iframe;

  iframe.addEventListener('load', function(){
    try{
      const iw=iframe.contentWindow;
      Object.assign(iw, bridgeData);
      if(typeof iw.__PC_ON_BRIDGE__==='function') iw.__PC_ON_BRIDGE__();
    }catch(e){ console.error(`[${MODULE_NAME}] iframe bridge error`,e); }
  });

  wrap.appendChild(iframe);
  overlay.appendChild(wrap);
  document.body.appendChild(overlay);
}

function closeMainHub() {
  $(`#${POPUP_ID}`).remove();
  window.__PC_IFRAME__ = null;
  refreshPrompt();
  if(getStore().config.toolbarEnabled) renderToolbar();
}

// ═══════════════════════════════════════════
// 초기화
// ═══════════════════════════════════════════
(async function init(){
  getStore();
  renderSettingsPanel();
  addWandMenuItem();
  injectToolbarStyle();
  const{eventSource,event_types}=ctx();
  eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
  eventSource.on(event_types.CHAT_CHANGED, ()=>{
    refreshPrompt();
    if(getStore().config.toolbarEnabled) renderToolbar();
  });
  refreshPrompt();
  if(getStore().config.toolbarEnabled) renderToolbar();
  window.__PC_REFRESH_PROMPT__ = refreshPrompt;
  window.__PC_SAVE_STORE__     = saveStore;
  window.__PC_GET_CHAR_STORE__ = getCharStore;
  console.log(`[${MODULE_NAME}] v2.4 로드 완료`);
})();
