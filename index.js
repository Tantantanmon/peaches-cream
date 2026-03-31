// index.js — Peaches & Cream v2.2
// ST 공식 API 기반

const MODULE_NAME = 'peaches-cream';

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
  charKink:      { positions:[], customPositions:[], foreplay:[], customForeplay:[], intercourse:[], customIntercourse:[], ejaculationLocation:[], fetishes:[], customFetishes:[], role:'' },
  reviewsHistory:[], reviewsSaved:[],
  cogHistory:[], cogCards:[],
  darkHistory:[], darkCards:[],
  fanFeedHistory:[],
  fanFeedConfig: { group:'', fandomName:'', npcs:[] },
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
  lubrication: { Dry:'little natural lubrication — describe dryness explicitly', Moist:'naturally wet, soft and slick', Soaking:'dripping wet, soaks through' },
  texture:     { Creamy:'creamy, thick consistency', Watery:'thin, clear consistency', Mixed:'varies between creamy and watery' },
  squirting:   { None:'no squirting', Rare:'squirts occasionally under intense stimulation', Frequent:'squirts easily and often, strong contractions' },
  responsivity:{ Normal:'average sensitivity', High:'very sensitive, reacts strongly to light touch', Extreme:'extremely sensitive, trembles at slightest touch' },
  moaning:     { Muted:'suppresses sounds, breathes hard through nose', Vocal:'expressive, unrestrained moaning', Passionate:'loud, uncontrollable moaning, completely loses composure' },
  flushing:    { Pale:'minimal skin color change when aroused', Rosy:'cheeks and chest flush pink when aroused', Deep:'face, neck, chest turn deep red when aroused' },
  experience:  { Novice:'inexperienced, easily flustered', Skilled:'comfortable and confident, knows her body well', Master:'highly experienced, knows exactly what she wants' },
  vibe:        { Romantic:'prefers soft emotional sex with eye contact', Rough:'prefers intense aggressive sex, reacts strongly to being dominated', Slow:'prefers long drawn-out sex, values buildup over climax' },
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
  'Hair Pulling':'Hair Pulling (grabbing hair at nape, controlling head)',
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

function mapVal(map, val) { return map[val] || val; }
function kinkArr(arr, custom) {
  const base = (arr||[]).map(k => KINK_DESC[k] || k).join(', ');
  const cust = (custom||[]).join(', ');
  return [base, cust].filter(Boolean).join(', ');
}

// ═══════════════════════════════════════════
// 프롬프트 빌더
// ═══════════════════════════════════════════
function buildMainPrompt() {
  const cd    = getCharStore();
  const cname = getCurrentCharName();
  const p     = cd.userProfile   || {};
  const cp    = cd.charProfile   || {};
  const lt    = cd.lastTouch     || { cards:[], pinned:[] };

  const lines = ['<peaches_and_cream>'];

  // 1. Last Touch
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

  // 2. User Profile
  lines.push('<user_profile>');
  if (p.height)      lines.push(`  <height>${p.height}cm</height>`);
  if (p.weight)      lines.push(`  <weight>${p.weight}kg</weight>`);
  if (p.eyeColor)    lines.push(`  <eye_color>${p.eyeColor}</eye_color>`);
  if (p.hair)        lines.push(`  <hair>${p.hair}</hair>`);
  if (p.skinTone)    lines.push(`  <skin_tone>${mapVal(USER_MAPS.skinTone, p.skinTone)}</skin_tone>`);
  if (p.bodyType)    lines.push(`  <body_type>${mapVal(USER_MAPS.bodyType, p.bodyType)}</body_type>`);
  if (p.chest)       lines.push(`  <bust>${mapVal(USER_MAPS.chest, p.chest)}</bust>`);
  if (p.butt)        lines.push(`  <butt>${mapVal(USER_MAPS.butt, p.butt)}</butt>`);
  if (p.waistHip)    lines.push(`  <waist_hip>${mapVal(USER_MAPS.waistHip, p.waistHip)}</waist_hip>`);
  if (p.skinTexture) lines.push(`  <skin_texture>${mapVal(USER_MAPS.skinTexture, p.skinTexture)}</skin_texture>`);
  if (p.bodyHair)    lines.push(`  <body_hair>${mapVal(USER_MAPS.bodyHair, p.bodyHair)}</body_hair>`);
  if (p.peachColor)  lines.push(`  <vulva_color>${p.peachColor} — color of inner labia and vaginal opening</vulva_color>`);
  if (p.venusDimples === 'Yes') lines.push(`  <venus_dimples>two small dimples above lower back</venus_dimples>`);
  if (p.scent)       lines.push(`  <scent>${p.scent}</scent>`);
  lines.push('</user_profile>');

  // 3. Char Profile
  lines.push(`<char_profile name="${cname}">`);
  if (cp.size) {
    const sizeLabel = cp.sizeUnit === 'in'
      ? `${cp.size}in (approx. ${Math.round(cp.size * 2.54 * 10)/10}cm)`
      : `${cp.size}cm`;
    lines.push(`  <size>${sizeLabel}</size>`);
  }
  if (cp.additionalFeatures && cp.additionalFeatures.length) lines.push(`  <additional_features>${cp.additionalFeatures.join(', ')}</additional_features>`);
  if (cp.moaning)    lines.push(`  <moaning>${cp.moaning}</moaning>`);
  if (cp.semen)      lines.push(`  <semen>${cp.semen}</semen>`);
  if (cp.multiRound) lines.push(`  <multi_round>${cp.multiRound}</multi_round>`);
  if (cp.stamina)    lines.push(`  <stamina>${cp.stamina}</stamina>`);
  lines.push('</char_profile>');

  // 4. Instruction
  lines.push(`<instruction>
MANDATORY — 아래 규칙은 모든 응답에 예외 없이 적용된다:

[ABSOLUTE RULE]
0. 이 프롬프트에 등록된 모든 태그와 설정값은 {{user}}와 {{char}} 양쪽 모두에 적용되는 절대적 규칙이다.
   선택된 태그는 예외 없이 전부 따르라. 무시하거나 임의로 변경하는 것은 금지된다.

[BODY & RESPONSE]
1. {{user}}와 {{char}} 양쪽의 신체 특징, 성감대, 신체 반응은 절대적 설정이다.
   모든 성적 씬에서 양쪽 모두 적극적으로 묘사하라.
2. 등록된 성감대가 터치되면 반드시 즉각적인 신체 반응을 묘사하라.
   호흡, 근육 긴장, 소리, 표정, 애액 변화 등을 구체적으로 서술하라.
3. 씬 서술 시 {{char}}의 행동과 {{user}}의 신체 반응을 함께 묘사하라.
   lubrication, tightness, texture, squirting, flushing, moaning 수치를 그대로 반영하라.
   예: lubrication이 Dry면 "그녀의 안이 바짝 말라있었다" 식으로 명시적으로 서술하라.

[SEXUAL ACTS]
4. 선택된 foreplay 태그들을 본 행위 전에 순서대로 자연스럽게 수행하라.
5. 선택된 positions 태그들 안에서만 체위를 사용하라.
   씬 흐름에 따라 자연스럽게 순서대로 활용하라.
6. 선택된 intercourse 태그들을 씬 진행 중 흐름에 맞게 순차적으로 반영하라.
7. 선택된 ejaculation_location을 반드시 따르라. 임의 변경 절대 금지.
8. 선택된 fetishes 요소들을 씬에 자연스럽게 녹여내라.

[CHAR TRAITS]
9. multiRound 태그가 설정되어 있으면 1라운드 종료 후 자연스럽게 이어서 진행하라.
10. stamina 태그를 따라 지구력과 회복력을 묘사하라.
11. {{char}}의 role(Dominant/Submissive/Switch)에 맞게 주도권을 묘사하라.
12. 신체 사이즈 차이를 현실적으로 묘사하라.

[STYLE]
13. 더티토크는 {{char}}의 정확한 말투로 적극 사용하라.
14. 여성혐오 단어 절대 금지 (암캐, 창녀, 걸레, 화냥년 및 유사 표현).
</instruction>`);

  lines.push('</peaches_and_cream>');
  return lines.join('\n');
}

// 성감대 + 킨크 — depth 0 (최고 우선순위)
function buildSexPrompt() {
  const cd    = getCharStore();
  const cname = getCurrentCharName();
  const e     = cd.userErogenous || {};
  const cp    = cd.charProfile   || {};
  const ck    = cd.charKink      || {};

  const lines = ['<sex_data>'];

  // User Erogenous
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
  if (e.sensitiveZones && e.sensitiveZones.length)
    lines.push(`  <sensitive_zones>${e.sensitiveZones.join(', ')} — 이 부위가 터치되면 즉각적이고 가시적인 반응을 묘사하라</sensitive_zones>`);
  if (e.sensoryFeedback && e.sensoryFeedback.length)
    lines.push(`  <sensory_feedback>${e.sensoryFeedback.join(', ')}</sensory_feedback>`);
  lines.push('</user_erogenous>');

  // Char Sensitive Zones
  if (cp.sensitiveZones && cp.sensitiveZones.length) {
    lines.push(`<char_sensitive_zones name="${cname}">${cp.sensitiveZones.join(', ')} — 이 부위가 터치되면 즉각적이고 가시적인 반응을 묘사하라</char_sensitive_zones>`);
  }

  // Char Kinks
  const hasKink = (ck.positions||[]).length || (ck.customPositions||[]).length ||
                  (ck.foreplay||[]).length   || (ck.intercourse||[]).length    ||
                  (ck.ejaculationLocation||[]).length || (ck.fetishes||[]).length || ck.role;
  if (hasKink) {
    lines.push(`<char_kinks name="${cname}">`);
    const pos = kinkArr(ck.positions, ck.customPositions);
    if (pos) lines.push(`  <positions>${pos}</positions>`);
    const fp  = kinkArr(ck.foreplay, ck.customForeplay);
    if (fp)  lines.push(`  <foreplay>${fp}</foreplay>`);
    const ic  = kinkArr(ck.intercourse, ck.customIntercourse);
    if (ic)  lines.push(`  <intercourse>${ic}</intercourse>`);
    const ej  = kinkArr(ck.ejaculationLocation, []);
    if (ej)  lines.push(`  <ejaculation_location>${ej}</ejaculation_location>`);
    const fe  = kinkArr(ck.fetishes, ck.customFetishes);
    if (fe)  lines.push(`  <fetishes>${fe}</fetishes>`);
    if (ck.role) lines.push(`  <role>${ck.role}</role>`);
    lines.push('</char_kinks>');
  }

  lines.push('</sex_data>');
  lines.push('REMINDER: 위에 등록된 모든 태그는 지금 당장 응답에 반영해야 하는 활성 규칙이다.');
  return lines.join('\n');
}

function refreshPrompt() {
  try {
    const { setExtensionPrompt } = ctx();
    setExtensionPrompt(MODULE_NAME,          buildMainPrompt(), 5, 1);
    setExtensionPrompt(MODULE_NAME + '_sex', buildSexPrompt(),  5, 0);
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
// generateRaw 래퍼 — 멀티 API 지원
// ═══════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
  const c      = ctx();
  const store  = getStore();
  const apiSrc = store.config.apiSource || 'main';

  if (apiSrc.startsWith('profile:')) {
    const profileId = apiSrc.replace('profile:', '');
    try {
      const cmrs = c.ConnectionManagerRequestService;
      if (cmrs && typeof cmrs.loadProfile === 'function') {
        await cmrs.loadProfile(profileId);
      }
    } catch(e) { console.warn(`[${MODULE_NAME}] profile load error`, e); }
  }

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
  limit = limit || 10;
  try {
    const { chat } = ctx();
    return (chat||[]).slice(-limit).map(m => ({ role:m.is_user?'user':'assistant', content:m.mes||'', name:m.name||'' }));
  } catch(e) { return []; }
}
function getChatRange(startNum, endNum) {
  try {
    const { chat } = ctx();
    const arr = chat || [];
    if (!startNum && !endNum) return getRecentChat(10);
    const s = startNum ? Math.max(1, parseInt(startNum)) : 1;
    const e = endNum   ? Math.min(arr.length, parseInt(endNum)) : arr.length;
    return arr.slice(s-1, e).map(m => ({ role:m.is_user?'user':'assistant', content:m.mes||'', name:m.name||'' }));
  } catch(e) { return getRecentChat(10); }
}

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
          <div class="pc-setting-row" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <label for="pc-api-source" style="white-space:nowrap;">API 소스</label>
            <select id="pc-api-source" style="flex:1;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:13px;">
              <option value="main">Main API</option>
            </select>
            <button id="pc-api-refresh" style="padding:4px 8px;font-size:12px;cursor:pointer;border-radius:6px;border:1px solid #ccc;background:#f5f5f5;">🔄</button>
          </div>
          <div class="pc-setting-row" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
            <label for="pc-max-tokens" style="white-space:nowrap;">최대 토큰</label>
            <input id="pc-max-tokens" type="number" value="${store.config.maxTokens||1500}" min="100" max="8000" style="width:80px;padding:4px 8px;border-radius:6px;border:1px solid #ccc;font-size:13px;"/>
          </div>
          <hr>
          <small style="color:#888;">요술봉 메뉴에서 🍑 Peaches &amp; Cream을 클릭해 여세요.</small>
        </div>
      </div>
    </div>
  `);

  function fillApiSelect() {
    const $select = $('#pc-api-source');
    const current = getStore().config.apiSource || 'main';
    $select.empty().append('<option value="main">Main API</option>');
    try {
      const cmrs = ctx().ConnectionManagerRequestService;
      if (cmrs && typeof cmrs.getSupportedProfiles === 'function') {
        const profiles = cmrs.getSupportedProfiles();
        if (Array.isArray(profiles)) {
          profiles.forEach(p => {
            const id   = p.id || p.profileId || p.uuid || '';
            const name = p.name || p.profileName || id;
            if (id) $select.append(`<option value="profile:${id}">${name}</option>`);
          });
        }
      }
    } catch(e) {}
    $select.val(current);
  }

  fillApiSelect();
  $('#pc-api-refresh').on('click', fillApiSelect);
  $('#pc-api-source').on('change', function() {
    getStore().config.apiSource = $(this).val();
    saveStore();
  });
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
// 메인 허브 팝업 — CSS 미디어쿼리로 모바일 처리
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
  wrap.id = 'pc-popup-wrap';
  wrap.style.cssText = 'position:relative;width:min(460px,92vw);height:min(90vh,800px);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.5);';

  const iframe = document.createElement('iframe');
  iframe.src   = extUrl;
  iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
  iframe.id    = 'pc-iframe';

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

  window.__PC_REFRESH_PROMPT__ = refreshPrompt;
  window.__PC_SAVE_STORE__     = saveStore;
  window.__PC_GET_CHAR_STORE__ = getCharStore;

  console.log(`[${MODULE_NAME}] v2.2 로드 완료`);
})();
