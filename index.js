// index.js — Peaches & Cream v2.0
// ST 공식 API 기반

const MODULE_NAME = 'peaches-cream';

// ═══════════════════════════════════════════
// ST context
// ═══════════════════════════════════════════
function ctx() { return SillyTavern.getContext(); }

// ═══════════════════════════════════════════
// 캐릭터 키 생성
// ═══════════════════════════════════════════
function getCharKey() {
  try {
    const c = ctx();
    const avatar = c?.characters?.[c?.characterId]?.avatar?.replace(/\.[^/.]+$/, '')
                || c?.characters?.[c?.characterId]?.filename?.replace(/\.[^/.]+$/, '');
    const name = c?.name2 || c?.characters?.[c?.characterId]?.name || 'default';
    const raw = avatar ? `${name}_${avatar}` : name;
    return raw.replace(/[^a-zA-Z0-9가-힣]/g, '_');
  } catch(e) { return 'default'; }
}

// ═══════════════════════════════════════════
// 기본 데이터 구조
// ═══════════════════════════════════════════
const defaultCharData = {
  userProfile:   { height:'', weight:'', eyeColor:'', hair:'', skinTone:'', bodyType:'', chest:'', butt:'', waistHip:'', skinTexture:'', bodyHair:'', peachColor:'', venusDimples:'', scent:'' },
  userErogenous: { tightness:'', lubrication:'', texture:'', squirting:'', responsivity:'', moaning:'', flushing:'', experience:'', vibe:'', sensitiveZones:[], sensoryFeedback:[] },
  lastTouch:     { cards:[], pinned:[] },
  charProfile:   { size:'', sizeUnit:'cm', additionalFeatures:[], moaning:'', semen:'', multiRound:'', stamina:'', sensitiveZones:[] },
  charKink:      { acts:[], positions:[], customPositions:[], foreplay:[], customForeplay:[], intercourse:[], customIntercourse:[], ejaculationLocation:[], fetishes:[], customFetishes:[], role:'' },
  reviewsHistory:   [],
  cogHistory:       [],
  darkHistory:      [],
  fanFeedHistory:   [],
  fanFeedConfig:    { group:'', fandomName:'', npcs:[] },
};

const defaultGlobalConfig = { apiSource:'main', maxTokens:1500 };

// ═══════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════
function getStore() {
  const { extensionSettings } = ctx();
  if (!extensionSettings[MODULE_NAME]) {
    extensionSettings[MODULE_NAME] = { config:{ ...defaultGlobalConfig }, chars:{} };
  }
  const s = extensionSettings[MODULE_NAME];
  if (!s.config) s.config = { ...defaultGlobalConfig };
  if (!s.chars)  s.chars  = {};
  return s;
}

function getCharStore() {
  const s   = getStore();
  const key = getCharKey();
  if (!s.chars[key]) s.chars[key] = JSON.parse(JSON.stringify(defaultCharData));
  const cd = s.chars[key];
  // 누락 필드 보완
  const fill = (obj, def) => { Object.keys(def).forEach(k => { if (obj[k] === undefined) obj[k] = JSON.parse(JSON.stringify(def[k])); }); };
  fill(cd, defaultCharData);
  return cd;
}

function saveStore() { ctx().saveSettingsDebounced(); }

// ═══════════════════════════════════════════
// 태그 설명 매핑
// ═══════════════════════════════════════════
const USER_MAPS = {
  skinTone:    { Light:'porcelain white, very fair', Medium:'warm medium tone', Dark:'deep rich dark skin' },
  bodyType:    { Slim:'lean, slender limbs', Average:'balanced proportions, naturally feminine', Glamorous:'full and voluptuous, hourglass silhouette', Athletic:'toned and muscular, firm all over' },
  chest:       { A:'A-cup, small and perky, fits in one hand', B:'B-cup, round and natural', C:'C-cup, soft, bounces when moving', D:'D-cup, large and heavy, overflows hands', 'D+':'D+cup, very large, heavy and pendulous' },
  butt:        { 'Small & firm':'small, firm, tight', Average:'average, naturally round', 'Large & full':'large, full, jiggles with movement' },
  waistHip:    { Slim:'narrow hips, subtle waist curve', Hourglass:'dramatic waist, wide hips, hourglass silhouette', Full:'wide hips, full thighs, soft lower body' },
  skinTexture: { Soft:'silky smooth', Firm:'taut and elastic', Average:'smooth, natural' },
  bodyHair:    { Yes:'natural body hair', None:'fully smooth, completely hairless', 'A little':'sparse, faint body hair' },
  tightness:   { Normal:'comfortable fit, natural grip', Tight:'noticeably tight, strong grip', Extreme:'extremely tight, visible stomach bulge on deep penetration' },
  lubrication: { Dry:'little natural lubrication', Moist:'naturally wet, soft and slick', Soaking:'dripping wet, soaks through' },
  texture:     { Creamy:'creamy, thick consistency', Watery:'thin, clear consistency', Mixed:'varies between creamy and watery' },
  squirting:   { None:'no squirting', Rare:'squirts occasionally under intense stimulation', Frequent:'squirts easily and often, strong contractions' },
  responsivity:{ Normal:'average sensitivity', High:'very sensitive, reacts strongly to light touch', Extreme:'extremely sensitive, trembles at slightest touch' },
  moaning:     { Muted:'suppresses sounds, breathes hard through nose', Vocal:'expressive, unrestrained moaning', Passionate:'loud, uncontrollable moaning, completely loses composure' },
  flushing:    { Pale:'minimal skin color change when aroused', Rosy:'cheeks and chest flush pink when aroused', Deep:'face, neck, chest turn deep red when aroused' },
  experience:  { Novice:'inexperienced, easily flustered', Skilled:'comfortable and confident, knows her body well', Master:'highly experienced, knows exactly what she wants' },
  vibe:        { Romantic:'prefers soft emotional sex with eye contact', Rough:'prefers intense aggressive sex, reacts strongly to being dominated', Slow:'prefers long drawn-out sex, values buildup over climax' },
};

const KINK_DESC = {
  'Missionary':        'Missionary (face-to-face, full eye contact)',
  'Doggy Style':       'Doggy Style (rear-entry, user bent forward)',
  'Cowgirl':           'Cowgirl (user on top riding, controls pace)',
  'Reverse Cowgirl':   'Reverse Cowgirl (user on top facing away)',
  'Spooning':          'Spooning (side-lying, intimate full body contact)',
  'Lotus':             'Lotus (face-to-face seated, deeply intimate)',
  'Standing':          'Standing (upright, often against wall)',
  '69':                '69 (simultaneous oral)',
  'Face Sitting':      'Face Sitting (user sits on partner\'s face)',
  'Prone Bone':        'Prone Bone (user lying flat face down)',
  'The Anvil':         'The Anvil (legs pushed back, deep penetration)',
  'Wheelbarrow':       'Wheelbarrow (user lifted by hips)',
  'Legs Up':           'Legs Up (legs raised on shoulders)',
  'Deep Kissing':      'Deep Kissing (intense mouth-to-mouth, tongues)',
  'Neck Kissing':      'Neck Kissing (lips on neck and collarbone)',
  'Teasing':           'Teasing (deliberate withholding of stimulation)',
  'Blowjob':           'Blowjob (oral stimulation)',
  'Cunnilingus':       'Cunnilingus (oral on vulva)',
  'Fingering':         'Fingering (manual stimulation)',
  'Handjob':           'Handjob (manual stimulation)',
  'Body Massage':      'Body Massage (full body tactile stimulation)',
  'Temperature Play':  'Temperature Play (ice or heat on skin)',
  'Blindfolding':      'Blindfolding (sensory deprivation via sight)',
  'Nipple Play':       'Nipple Play (touching, pinching, sucking nipples)',
  'Dirty Talk':        'Dirty Talk (explicit verbal during sex)',
  'Hair Pulling':      'Hair Pulling (grabbing hair at nape, controlling head)',
  'Spanking':          'Spanking (open-hand strikes on buttocks)',
  'Light Choking':     'Light Choking (hand around throat, controlled pressure)',
  'Eye Contact':       'Eye Contact (maintained intense gaze throughout)',
  'Grinding':          'Grinding (rhythmic friction without penetration)',
  'Slow & Deep':       'Slow & Deep (deliberate deep thrusts, drawn out)',
  'Fast & Rough':      'Fast & Rough (rapid aggressive thrusting)',
  'Orgasm Control':    'Orgasm Control (edging, denial, forced orgasm)',
  'Internal (Vaginal)':'Internal — vaginal creampie',
  'External':          'External — pulling out, finish outside',
  'On Body':           'On Body — finish on skin',
  'On Face':           'On Face — facial',
  'Inside Mouth':      'Inside Mouth — oral finish',
  'Uniforms':          'Uniforms (role-based costume)',
  'Lingerie':          'Lingerie (lace preferred)',
  'Stockings':         'Stockings (thigh-high preferred)',
  'High Heels':        'High Heels (worn during sex)',
  'Leather':           'Leather (material fetish)',
  'Latex':             'Latex (tight material fetish)',
  'Glasses':           'Glasses (worn during sex)',
  'Chokers':           'Chokers (worn around neck)',
  'Silk & Satin':      'Silk & Satin (smooth fabric fetish)',
  'Thigh-highs':       'Thigh-highs (stay-up stockings)',
  'Formal Wear':       'Formal Wear (suit/dress kept partially on)',
  'Body Oil':          'Body Oil (slick skin)',
};

function mapVal(map, val) { return map[val] || val; }
function kinkArr(arr, custom) {
  const base = (arr||[]).map(k => KINK_DESC[k] || k).join(', ');
  const cust = (custom||[]).join(', ');
  return [base, cust].filter(Boolean).join(', ');
}

// ═══════════════════════════════════════════
// 프롬프트 빌더
// ═══════════════════════════════════════════
function buildPrompt() {
  const cd = getCharStore();
  const cname = getCurrentCharName();
  const p  = cd.userProfile   || {};
  const e  = cd.userErogenous || {};
  const cp = cd.charProfile   || {};
  const ck = cd.charKink      || {};
  const lt = cd.lastTouch     || { cards:[], pinned:[] };

  const lines = ['<peaches_and_cream>'];

  // ── User Profile ──
  lines.push('<user_profile>');
  if (p.height)       lines.push(`  <height>${p.height}cm</height>`);
  if (p.weight)       lines.push(`  <weight>${p.weight}kg</weight>`);
  if (p.eyeColor)     lines.push(`  <eye_color>${p.eyeColor}</eye_color>`);
  if (p.hair)         lines.push(`  <hair>${p.hair}</hair>`);
  if (p.skinTone)     lines.push(`  <skin_tone>${mapVal(USER_MAPS.skinTone, p.skinTone)}</skin_tone>`);
  if (p.bodyType)     lines.push(`  <body_type>${mapVal(USER_MAPS.bodyType, p.bodyType)}</body_type>`);
  if (p.chest)        lines.push(`  <bust>${mapVal(USER_MAPS.chest, p.chest)}</bust>`);
  if (p.butt)         lines.push(`  <butt>${mapVal(USER_MAPS.butt, p.butt)}</butt>`);
  if (p.waistHip)     lines.push(`  <waist_hip>${mapVal(USER_MAPS.waistHip, p.waistHip)}</waist_hip>`);
  if (p.skinTexture)  lines.push(`  <skin_texture>${mapVal(USER_MAPS.skinTexture, p.skinTexture)}</skin_texture>`);
  if (p.bodyHair)     lines.push(`  <body_hair>${mapVal(USER_MAPS.bodyHair, p.bodyHair)}</body_hair>`);
  if (p.peachColor)   lines.push(`  <peach_color>${p.peachColor}</peach_color>`);
  if (p.venusDimples === 'Yes') lines.push(`  <venus_dimples>two small dimples above lower back</venus_dimples>`);
  if (p.scent)        lines.push(`  <scent>${p.scent}</scent>`);
  lines.push('</user_profile>');

  // ── User Erogenous ──
  lines.push('<user_erogenous>');
  if (e.tightness)    lines.push(`  <tightness>${mapVal(USER_MAPS.tightness, e.tightness)}</tightness>`);
  if (e.lubrication)  lines.push(`  <lubrication>${mapVal(USER_MAPS.lubrication, e.lubrication)}</lubrication>`);
  if (e.texture)      lines.push(`  <texture>${mapVal(USER_MAPS.texture, e.texture)}</texture>`);
  if (e.squirting)    lines.push(`  <squirting>${mapVal(USER_MAPS.squirting, e.squirting)}</squirting>`);
  if (e.responsivity) lines.push(`  <responsivity>${mapVal(USER_MAPS.responsivity, e.responsivity)}</responsivity>`);
  if (e.moaning)      lines.push(`  <moaning>${mapVal(USER_MAPS.moaning, e.moaning)}</moaning>`);
  if (e.flushing)     lines.push(`  <flushing>${mapVal(USER_MAPS.flushing, e.flushing)}</flushing>`);
  if (e.experience)   lines.push(`  <experience>${mapVal(USER_MAPS.experience, e.experience)}</experience>`);
  if (e.vibe)         lines.push(`  <preferred_vibe>${mapVal(USER_MAPS.vibe, e.vibe)}</preferred_vibe>`);
  if (e.sensitiveZones  && e.sensitiveZones.length)  lines.push(`  <sensitive_zones>${e.sensitiveZones.join(', ')}</sensitive_zones>`);
  if (e.sensoryFeedback && e.sensoryFeedback.length) lines.push(`  <sensory_feedback>${e.sensoryFeedback.join(', ')}</sensory_feedback>`);
  lines.push('</user_erogenous>');

  // ── Char Profile ──
  lines.push(`<char_profile name="${cname}">`);
  if (cp.size) {
    const sizeLabel = cp.sizeUnit === 'in'
      ? `${cp.size}in (approx. ${Math.round(cp.size * 2.54 * 10)/10}cm)`
      : `${cp.size}cm`;
    lines.push(`  <size>${sizeLabel}</size>`);
  }
  if (cp.additionalFeatures && cp.additionalFeatures.length) lines.push(`  <additional_features>${cp.additionalFeatures.join(', ')}</additional_features>`);
  if (cp.moaning)     lines.push(`  <moaning>${cp.moaning}</moaning>`);
  if (cp.semen)       lines.push(`  <semen>${cp.semen}</semen>`);
  if (cp.multiRound)  lines.push(`  <multi_round>${cp.multiRound}</multi_round>`);
  if (cp.stamina)     lines.push(`  <stamina>${cp.stamina}</stamina>`);
  if (cp.sensitiveZones && cp.sensitiveZones.length) lines.push(`  <sensitive_zones>${cp.sensitiveZones.join(', ')}</sensitive_zones>`);
  lines.push('</char_profile>');

  // ── Char Kinks ──
  const hasKink = (ck.positions||[]).length || (ck.customPositions||[]).length ||
                  (ck.foreplay||[]).length   || (ck.intercourse||[]).length    ||
                  (ck.ejaculationLocation||[]).length || (ck.fetishes||[]).length || ck.role;
  if (hasKink) {
    lines.push(`<char_kinks name="${cname}">`);
    const pos = kinkArr(ck.positions, ck.customPositions);
    if (pos) lines.push(`  <positions>${pos}</positions>`);
    const fp = kinkArr(ck.foreplay, ck.customForeplay);
    if (fp) lines.push(`  <foreplay>${fp}</foreplay>`);
    const ic = kinkArr(ck.intercourse, ck.customIntercourse);
    if (ic) lines.push(`  <intercourse>${ic}</intercourse>`);
    const ej = kinkArr(ck.ejaculationLocation, []);
    if (ej) lines.push(`  <ejaculation_location>${ej}</ejaculation_location>`);
    const fe = kinkArr(ck.fetishes, ck.customFetishes);
    if (fe) lines.push(`  <fetishes>${fe}</fetishes>`);
    if (ck.role) lines.push(`  <role>${ck.role}</role>`);
    lines.push('</char_kinks>');
  }

  // ── Last Touch (pinned only) ──
  const pinnedCards = (lt.cards||[]).filter(c => (lt.pinned||[]).includes(c.id));
  if (pinnedCards.length) {
    lines.push('<last_touch_memories>');
    pinnedCards.forEach(c => {
      lines.push(`  <memory date="${c.date||''}" place="${c.place||''}" mood="${c.mood||''}">`);
      if (c.positions && c.positions.length) lines.push(`    positions: ${c.positions.join(', ')}`);
      if (c.charReview) lines.push(`    ${c.charReview.slice(0,120)}...`);
      lines.push('  </memory>');
    });
    lines.push('</last_touch_memories>');
  }

  // ── Instruction ──
  lines.push(`<instruction>
IMPORTANT: You MUST incorporate ALL physical traits, preferences, and kinks listed above into every sexual scene. These are absolute canon.
Reflect size difference physically and realistically in descriptions.
Use explicit language. Dirty talk is strongly encouraged.
Write in ${cname}'s exact speech style and personality as described in their character card.
Never use misogynistic slurs (암캐, 창녀, 걸레, 화냥년 or any similar terms).
</instruction>`);

  lines.push('</peaches_and_cream>');
  return lines.join('\n');
}

function refreshPrompt() {
  try {
    const { setExtensionPrompt } = ctx();
    const full = buildPrompt();
    setExtensionPrompt(MODULE_NAME, full, 5, 1);
  } catch(e) {
    console.warn(`[${MODULE_NAME}] setExtensionPrompt error`, e);
  }
}

// ═══════════════════════════════════════════
// 캐릭터/유저 정보
// ═══════════════════════════════════════════
function getCurrentCharName() {
  try { return ctx().name2 || '{{char}}'; } catch(e) { return '{{char}}'; }
}
function getCurrentUserName() {
  try { return ctx().name1 || '{{user}}'; } catch(e) { return '{{user}}'; }
}
function getCharDescription() {
  try {
    const c = ctx();
    if (c.characters && c.characterId !== undefined) {
      const char = c.characters[c.characterId];
      if (char) return [char.description, char.personality, char.scenario, char.mes_example].filter(Boolean).join('\n').trim();
    }
    return '';
  } catch(e) { return ''; }
}
function getUserPersona() {
  try {
    const c = ctx();
    return c.persona || c?.powerUserSettings?.persona_description || '';
  } catch(e) { return ''; }
}
function getWorldInfo() {
  try {
    const c = ctx();
    if (typeof c.getWorldInfoPrompt === 'function') return c.getWorldInfoPrompt() || '';
    if (c.worldInfoData) return JSON.stringify(c.worldInfoData).slice(0, 3000);
    return '';
  } catch(e) { return ''; }
}

// ═══════════════════════════════════════════
// generateRaw 래퍼
// ═══════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
  const c = ctx();
  const store = getStore();
  return await c.generateRaw({
    systemPrompt,
    prompt:         userPrompt,
    max_new_tokens: store.config.maxTokens || 1500,
  });
}

// ═══════════════════════════════════════════
// 챗 읽기
// ═══════════════════════════════════════════
function getRecentChat(limit) {
  limit = limit || 20;
  try {
    const { chat } = ctx();
    return (chat||[]).slice(-limit).map(m => ({ role:m.is_user?'user':'assistant', content:m.mes||'', name:m.name||'' }));
  } catch(e) { return []; }
}
function getChatRange(startNum, endNum) {
  try {
    const { chat } = ctx();
    const arr = chat || [];
    if (!startNum && !endNum) return getRecentChat(20);
    const s = startNum ? Math.max(1, parseInt(startNum)) : 1;
    const e = endNum   ? Math.min(arr.length, parseInt(endNum)) : arr.length;
    return arr.slice(s-1, e).map(m => ({ role:m.is_user?'user':'assistant', content:m.mes||'', name:m.name||'' }));
  } catch(e) { return getRecentChat(20); }
}

// ═══════════════════════════════════════════
// 설정 패널 (ST 사이드바)
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
          <div class="pc-setting-row">
            <label for="pc-max-tokens">최대 응답 토큰 수</label>
            <input id="pc-max-tokens" type="number" value="${store.config.maxTokens||1500}" min="100" max="8000"/>
          </div>
          <hr>
          <small style="color:#888;">요술봉 메뉴에서 🍑 Peaches &amp; Cream을 클릭해 앱을 여세요.</small>
        </div>
      </div>
    </div>
  `);
  $('#pc-max-tokens').on('change', function() {
    getStore().config.maxTokens = parseInt($(this).val()) || 1500;
    saveStore();
  });
}

// ═══════════════════════════════════════════
// 요술봉 메뉴
// ═══════════════════════════════════════════
function addWandMenuItem() {
  const $item = $(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5">
    <span>🍑</span><span>Peaches &amp; Cream</span>
  </div>`);
  $item.on('click', function() { $('#extensionsMenu').hide(); openMainHub(); });
  $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════
// 메인 허브 팝업
// ═══════════════════════════════════════════
const POPUP_ID = 'pc-popup-overlay';

async function openMainHub() {
  if ($(`#${POPUP_ID}`).length) return;

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
  };

  Object.assign(window, bridgeData);

  const extUrl = `scripts/extensions/third-party/${MODULE_NAME}/main.html`;

  const overlay = document.createElement('div');
  overlay.id = POPUP_ID;
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);';
  overlay.addEventListener('click', e => { if (e.target === overlay) closeMainHub(); });

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:min(520px,95vw);height:min(90vh,800px);border-radius:28px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5);';

  const iframe = document.createElement('iframe');
  iframe.src = extUrl;
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.id = 'pc-iframe';

  iframe.addEventListener('load', function() {
    try {
      const iw = iframe.contentWindow;
      Object.assign(iw, bridgeData);
      if (typeof iw.__PC_ON_BRIDGE__ === 'function') iw.__PC_ON_BRIDGE__();
    } catch(e) {
      console.error(`[${MODULE_NAME}] iframe bridge error`, e);
    }
  });

  wrap.appendChild(iframe);
  overlay.appendChild(wrap);
  document.body.appendChild(overlay);
}

function closeMainHub() {
  $(`#${POPUP_ID}`).remove();
  refreshPrompt();
}

// ═══════════════════════════════════════════
// 초기화
// ═══════════════════════════════════════════
(async function init() {
  getStore();
  renderSettingsPanel();
  addWandMenuItem();

  const { eventSource, event_types } = ctx();
  eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
  eventSource.on(event_types.CHAT_CHANGED,     refreshPrompt);

  refreshPrompt();

  // 전역 노출
  window.__PC_REFRESH_PROMPT__ = refreshPrompt;
  window.__PC_SAVE_STORE__     = saveStore;
  window.__PC_GET_CHAR_STORE__ = getCharStore;

  console.log(`[${MODULE_NAME}] v2.0 로드 완료`);
})();
