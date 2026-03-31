// index.js — Peaches & Cream v2.5
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
  userProfile:   { height:'', weight:'', eyeColor:'', hair:'', skinTone:'', bodyType:'', chest:'', butt:'', waistHip:'', skinTexture:'', bodyHair:'', peachColor:'', venusDimples:'', scent:'' },
  userErogenous: { tightness:'', lubrication:'', texture:'', squirting:'', responsivity:'', moaning:'', flushing:'', experience:'', vibe:'', sensitiveZones:[], sensoryFeedback:[] },
  lastTouch:     { cards:[], pinned:[] },
  charProfile:   { size:'', sizeUnit:'cm', additionalFeatures:[], moaning:'', semen:'', multiRound:'', stamina:'', sensitiveZones:[], condom:'' },
  reviewsHistory:[], reviewsSaved:[],
  cogHistory:[], cogCards:[],
  darkHistory:[], darkCards:[],
  fanFeedHistory:[],
  fanFeedConfig: { group:'', fandomName:'', npcs:[] },
};

const defaultGlobalConfig = {
  apiSource:'main', maxTokens:1500, toolbarEnabled:false,
  customTags:{ mood:[], location:[], foreplayActs:[], pace:[], toys:[], positions:[], action:[], finish:[], sensitiveZones:[], orgasm:[] }
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
};

function mapVal(map, val) { return map[val]||val; }

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
5. 포지션 태그가 지정되면 반드시 삽입까지 진행하라. Action 태그에 Penetrate 없으면 애무 → 삽입 순서로 전개하라.
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
    // position 3 = After World Info (캐릭터 카드+로어북 다음)
    setExtensionPrompt(MODULE_NAME,        buildMainPrompt(), 3, 0);
    // position 1, depth 0 = 유저 메시지 바로 위
    setExtensionPrompt(MODULE_NAME+'_sex', buildSexPrompt(),  1, 0);
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
function getWorldInfo(){
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
  mood:        ['Romantic','Dominant','Teasing','Passionate'],
  location:    ['Bed','Wall','Floor','Chair'],
  foreplayActs:['Neck Kissing','Cunnilingus','Fingering','Blowjob','Teasing','Body Massage','Nipple Play','Hair Pulling','Spanking','Light Choking'],
  pace:        ['Slow','Normal','Fast','Rough'],
  toys:        ['Vibrator','Dildo','Womanizer','Ohmibod','Magic Wand','Nipple Clamps','Handcuffs','Blindfold'],
  positions:   ['Missionary','Doggy Style','Cowgirl','Reverse Cowgirl','Legs Up','Standing','Prone Bone','Face Sitting','Spooning','The Anvil'],
  action:      ['Penetrate','Continue','Faster','Finish'],
  finish:      ['Internal (Vaginal)','External','On Body','On Face','Inside Mouth'],
  orgasm:      ['Thigh Trembling','Squirt','Scream','Pass Out'],
};

const GROUPS = [
  { id:'g1', label:'1 · Mood & Setting',  subs:[ {key:'mood',label:'Mood'}, {key:'location',label:'Location'} ] },
  { id:'g2', label:'2 · Foreplay',        subs:[ {key:'foreplayActs',label:'Acts'}, {key:'pace',label:'Pace'} ] },
  { id:'g3', label:'3 · Toys',            subs:[ {key:'toys',label:'Toys'} ] },
  { id:'g4', label:'4 · Positions',       subs:[ {key:'positions',label:'Position'} ] },
  { id:'g5', label:'5 · Action',          subs:[ {key:'action',label:'Action'} ] },
  { id:'g6', label:'6 · Finish',          subs:[ {key:'finish',label:'Location'} ] },
  { id:'g7', label:'7 · User Response',   subs:[ {key:'sensitiveZones',label:'Sensitive zones'}, {key:'orgasm',label:'Orgasm'} ] },
];

let tbCollapsed = true;
let tbGroupOpen = {};

function injectToolbarStyle(){
  if(document.getElementById('pc-tb-style')) return;
  const s=document.createElement('style');
  s.id='pc-tb-style';
  s.textContent=`
#${TOOLBAR_ID}{width:100%;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;}
.pc-tb-wrap{background:#fff;border-top:0.5px solid #e0e0e0;border-bottom:0.5px solid #e0e0e0;}
.pc-tb-topbar{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:0.5px solid #f0f0f0;background:#fafafa;}
.pc-tb-title{font-size:13px;font-weight:700;color:#1a1a1a;flex-shrink:0;}
.pc-tb-condom{display:flex;gap:4px;margin-left:4px;}
.pc-tb-condom-btn{padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;border:0.5px solid #e0e0e0;background:#f4f4f4;color:#666;cursor:pointer;}
.pc-tb-condom-btn.on.active{background:#2563eb;color:#fff;border-color:#2563eb;}
.pc-tb-condom-btn.off.active{background:#dc2626;color:#fff;border-color:#dc2626;}
.pc-tb-spacer{flex:1;}
.pc-tb-collapse{font-size:11px;color:#aaa;background:none;border:none;cursor:pointer;padding:4px 8px;}
.pc-tb-close{font-size:14px;color:#bbb;background:none;border:none;cursor:pointer;padding:4px 8px;}
.pc-tb-body{max-height:220px;overflow-y:auto;}
.pc-tb-body.hidden{display:none;}
.pc-tb-group{border-bottom:0.5px solid #f5f5f5;}
.pc-tb-g-header{display:flex;align-items:center;justify-content:space-between;padding:7px 12px 5px;cursor:pointer;user-select:none;}
.pc-tb-g-name{font-size:10px;font-weight:700;letter-spacing:0.8px;color:#bbb;text-transform:uppercase;}
.pc-tb-g-arr{font-size:10px;color:#ccc;transition:transform .15s;}
.pc-tb-g-arr.open{transform:rotate(90deg);}
.pc-tb-g-content{padding:0 12px 8px;}
.pc-tb-g-content.hidden{display:none;}
.pc-tb-sub{margin-bottom:6px;}
.pc-tb-sub-label{font-size:9px;font-weight:600;letter-spacing:0.5px;color:#d0d0d0;text-transform:uppercase;margin-bottom:4px;}
.pc-tb-tags{display:flex;flex-wrap:wrap;gap:4px;}
.pc-tb-tag{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;background:#f4f4f4;color:#444;cursor:pointer;border:0.5px solid #e8e8e8;transition:all .1s;user-select:none;}
.pc-tb-tag:hover{background:#eee;}
.pc-tb-tag.active{background:#1a1a1a;color:#fff;border-color:#1a1a1a;}
.pc-tb-add{padding:4px 10px;border-radius:20px;font-size:12px;background:transparent;color:#ccc;border:0.5px dashed #ddd;cursor:pointer;}
.pc-tb-add:hover{border-color:#bbb;color:#999;}
.pc-tb-footer{display:flex;align-items:center;gap:6px;padding:7px 12px;background:#fafafa;border-top:0.5px solid #f0f0f0;}
.pc-tb-hint{flex:1;font-size:11px;color:#aaa;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.pc-tb-reset{font-size:11px;color:#ccc;background:none;border:none;cursor:pointer;padding:3px 8px;border-radius:6px;}
.pc-tb-reset:hover{color:#999;background:#f5f5f5;}
.pc-tb-apply{background:#1a1a1a;color:#fff;border:none;border-radius:20px;padding:6px 16px;font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;}
.pc-tb-apply:active{opacity:.8;}
@media(prefers-color-scheme:dark){
  .pc-tb-wrap{background:#1c1c1e;border-color:#3a3a3c;}
  .pc-tb-topbar,.pc-tb-footer{background:#161618;border-color:#3a3a3c;}
  .pc-tb-title{color:#fff;}
  .pc-tb-g-header{color:#fff;}
  .pc-tb-tag{background:#2c2c2e;color:#e0e0e0;border-color:#3a3a3c;}
  .pc-tb-tag.active{background:#fff;color:#000;}
  .pc-tb-condom-btn{background:#2c2c2e;color:#aaa;border-color:#3a3a3c;}
  .pc-tb-group{border-color:#2c2c2e;}
  .pc-tb-apply{background:#fff;color:#000;}
}
@media(max-width:430px){
  #pc-popup-overlay{align-items:flex-end!important;justify-content:center!important;}
  #pc-popup-wrap{width:100%!important;height:92vh!important;height:92dvh!important;border-radius:24px 24px 0 0!important;padding-bottom:env(safe-area-inset-bottom,0px)!important;}
}`;
  document.head.appendChild(s);
}

function buildToolbarHTML(){
  const cd=getCharStore(), e=cd.userErogenous||{};
  const store=getStore(), ct=store.config.customTags||{};
  const condomActive = store.config.condomState||'';

  // 동적 태그 소스
  const dynSrc = {
    sensitiveZones: [...(e.sensitiveZones||[])],
    orgasm:         ['Thigh Trembling','Squirt','Scream','Pass Out'],
  };

  const groupsHTML = GROUPS.map(g=>{
    const isOpen = tbGroupOpen[g.id]||false;
    const subsHTML = g.subs.map(sub=>{
      const fixed  = FIXED_TAGS[sub.key]||[];
      const dyn    = dynSrc[sub.key]||[];
      const custom = ct[sub.key]||[];
      const items  = sub.key==='sensitiveZones' ? dyn : [...fixed,...custom];
      if(!items.length && !dyn.length) return '';
      return `
        <div class="pc-tb-sub">
          <div class="pc-tb-sub-label">${sub.label}</div>
          <div class="pc-tb-tags" id="tags-${sub.key}">
            ${items.map(t=>`<div class="pc-tb-tag" data-key="${sub.key}" data-val="${t.replace(/"/g,'&quot;')}" onclick="pcTag(this)">${t}</div>`).join('')}
            <button class="pc-tb-add" onclick="pcAddCustom('${sub.key}')">+</button>
          </div>
        </div>`;
    }).join('');
    if(!subsHTML.trim()) return '';
    return `
      <div class="pc-tb-group">
        <div class="pc-tb-g-header" onclick="pcGroupToggle('${g.id}')">
          <span class="pc-tb-g-name">${g.label}</span>
          <span class="pc-tb-g-arr${isOpen?' open':''}" id="garr-${g.id}">›</span>
        </div>
        <div class="pc-tb-g-content${isOpen?'':' hidden'}" id="gcontent-${g.id}">${subsHTML}</div>
      </div>`;
  }).join('');

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
          <button class="pc-tb-collapse" onclick="pcTbCollapse()">${tbCollapsed?'▲ 펼치기':'▼ 접기'}</button>
          <button class="pc-tb-close" onclick="pcTbClose()">✕</button>
        </div>
        <div class="pc-tb-body${tbCollapsed?' hidden':''}" id="pc-tb-body">
          ${groupsHTML}
        </div>
        <div class="pc-tb-footer" id="pc-tb-footer">
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
  const body=document.getElementById('pc-tb-body');
  const btn=document.querySelector('.pc-tb-collapse');
  if(body) body.classList.toggle('hidden', tbCollapsed);
  if(btn)  btn.textContent=tbCollapsed?'▲ 펼치기':'▼ 접기';
};

window.pcGroupToggle=function(gid){
  tbGroupOpen[gid]=!tbGroupOpen[gid];
  const content=document.getElementById('gcontent-'+gid);
  const arr=document.getElementById('garr-'+gid);
  if(content) content.classList.toggle('hidden',!tbGroupOpen[gid]);
  if(arr)     arr.classList.toggle('open',tbGroupOpen[gid]);
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
  store.config.customTags[key].push(trimmed);
  saveStore();
  const wrap=document.getElementById('tags-'+key);
  if(wrap){
    const addBtn=wrap.querySelector('.pc-tb-add');
    const tag=document.createElement('div');
    tag.className='pc-tb-tag';
    tag.dataset.key=key;
    tag.dataset.val=trimmed;
    tag.textContent=trimmed;
    tag.onclick=function(){ pcTag(this); };
    wrap.insertBefore(tag, addBtn);
  }
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
  if(byKey.mood?.length)           parts.push(`set the mood to ${byKey.mood.join(' and ')}`);
  if(byKey.location?.length)       parts.push(`do it on the ${byKey.location.join(', ')}`);
  if(byKey.foreplayActs?.length)   parts.push(`perform ${byKey.foreplayActs.join(' and ')}`);
  if(byKey.pace?.length)           parts.push(`pace is ${byKey.pace.join(', ')}`);
  if(byKey.toys?.length)           parts.push(`use ${byKey.toys.join(' and ')}`);
  if(byKey.positions?.length)      parts.push(`switch to ${byKey.positions.join(', ')} position`);
  if(byKey.action?.length)         parts.push(byKey.action.includes('Penetrate') ? 'penetrate now without further foreplay' : byKey.action.join(', ').toLowerCase());
  if(byKey.finish?.length)         parts.push(`finish ${byKey.finish.join(', ')}`);
  if(byKey.sensitiveZones?.length) parts.push(`stimulate ${byKey.sensitiveZones.join(' and ')}`);
  if(byKey.orgasm?.length)         parts.push(`user reaches orgasm with ${byKey.orgasm.join(' and ')}`);
  if(condom==='on')                parts.push('put on a condom first');
  else if(condom==='off')          parts.push('no condom');

  if(!parts.length) return;

  const actionMsg = `IMMEDIATE INSTRUCTION: In your very next response, you MUST — ${parts.join(', ')}. Do this without exception.`;
  pcTbReset();

  try{
    const c = ctx();
    // chat 배열에 임시 시스템 메시지 삽입
    const tempMsg = {
      is_user: false,
      name: 'System',
      mes: actionMsg,
      is_system: true,
      send_date: Date.now(),
    };
    c.chat.push(tempMsg);
    await c.generate('normal', {});
    // 응답 후 임시 메시지 제거
    const idx = c.chat.indexOf(tempMsg);
    if(idx !== -1) c.chat.splice(idx, 1);
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
// 설정 패널
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
    const $sel=$('#pc-api-source'),cur=getStore().config.apiSource||'main';
    $sel.empty().append('<option value="main">Main API</option>');
    try{
      const cmrs=ctx().ConnectionManagerRequestService;
      if(cmrs&&typeof cmrs.getSupportedProfiles==='function'){
        (cmrs.getSupportedProfiles()||[]).forEach(p=>{
          const id=p.id||p.profileId||p.uuid||'',name=p.name||p.profileName||id;
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
function addWandMenuItem(){
  const $item=$(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5"><span>🍑</span><span>Peaches &amp; Cream</span></div>`);
  $item.on('click',function(){ $('#extensionsMenu').hide(); openMainHub(); });
  $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════
// 메인 허브 팝업
// ═══════════════════════════════════════════
const POPUP_ID='pc-popup-overlay';

async function openMainHub(){
  if($(`#${POPUP_ID}`).length) return;
  injectToolbarStyle();

  const bridgeData={
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
