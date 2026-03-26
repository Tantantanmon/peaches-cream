// index.js — Peaches & Cream
// store.js 내용 인라인 포함 (ST는 ES module import 미지원)

const EXT_NAME   = 'peaches-cream';
const POPUP_ID   = 'pc-popup-overlay';
const WAND_LABEL = '🍑 Peaches & Cream';

// ═══════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════
const defaultState = {
  config: {
    apiSource: 'main',
    maxTokens: 1500,
  },
  profile: {
    height: '',
    weight: '',
    eyeColor: '',
    hair: '',
    skinTone: '',
    bodyType: '',
    chest: '',
    butt: '',
    waistHip: '',
    skinTexture: '',
    bodyHair: '',
    sensitiveParts: [],
    bodyScent: '',
    moanType: '',
  },
  lastTouch: {
    cards: [],
    pinned: [],
  },
};

function getStore() {
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = JSON.parse(JSON.stringify(defaultState));
  }
  const s = extension_settings[EXT_NAME];
  if (!s.config)    s.config    = { ...defaultState.config };
  if (!s.profile)   s.profile   = { ...defaultState.profile };
  if (!s.lastTouch) s.lastTouch = { cards: [], pinned: [] };
  return s;
}

function saveStore() {
  saveSettingsDebounced();
}

function updateConfig(configData) {
  const s = getStore();
  s.config = { ...s.config, ...configData };
  saveStore();
}

function buildPrompt() {
  const s = getStore();
  const p = s.profile;
  const lines = [];

  lines.push('[Peaches & Cream — User Profile]');
  if (p.height || p.weight) lines.push(`신체: 키 ${p.height || '?'}cm, 몸무게 ${p.weight || '?'}kg`);
  if (p.eyeColor)    lines.push(`눈 색깔: ${p.eyeColor}`);
  if (p.hair)        lines.push(`헤어: ${p.hair}`);
  if (p.skinTone)    lines.push(`피부 톤: ${p.skinTone}`);
  if (p.bodyType)    lines.push(`체형: ${p.bodyType}`);
  if (p.chest)       lines.push(`가슴: ${p.chest}컵`);
  if (p.butt)        lines.push(`엉덩이: ${p.butt}`);
  if (p.waistHip)    lines.push(`허리-골반: ${p.waistHip}`);
  if (p.skinTexture) lines.push(`피부 질감: ${p.skinTexture}`);
  if (p.bodyHair)    lines.push(`체모: ${p.bodyHair}`);
  if (p.sensitiveParts && p.sensitiveParts.length) {
    lines.push(`민감 부위: ${p.sensitiveParts.join(', ')}`);
  }
  if (p.bodyScent)   lines.push(`체향: ${p.bodyScent}`);
  if (p.moanType)    lines.push(`신음 타입: ${p.moanType}`);

  const pinnedCards = s.lastTouch.cards.filter(c => s.lastTouch.pinned.includes(c.id));
  if (pinnedCards.length) {
    lines.push('\n[Pinned Memories]');
    pinnedCards.forEach(c => {
      lines.push(`- ${c.title} (${c.date}, ${c.place || '?'}): ${c.mood || ''}`);
    });
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════
// 1. 확장 로드
// ═══════════════════════════════════════════════
jQuery(async () => {
  getStore();

  renderSettingsPanel();
  addWandMenuItem();

  eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
  eventSource.on(event_types.CHAT_CHANGED,     refreshPrompt);

  refreshPrompt();

  window.__PC_REFRESH_PROMPT__ = refreshPrompt;
});

// ═══════════════════════════════════════════════
// 2. 확장 탭 설정 패널
// ═══════════════════════════════════════════════
function renderSettingsPanel() {
  const store = getStore();

  const html = `
    <div id="pc-settings" style="padding:10px 0;">
      <h4 style="margin-bottom:12px;font-size:14px;font-weight:600;">🍑 Peaches &amp; Cream</h4>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px;">API 소스</label>
        <select id="pc-api-source" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #444;background:#2a2a2a;color:#eee;font-size:13px;">
          <option value="main"   ${store.config.apiSource === 'main'   ? 'selected' : ''}>Main API</option>
          <option value="openai" ${store.config.apiSource === 'openai' ? 'selected' : ''}>OpenAI</option>
          <option value="claude" ${store.config.apiSource === 'claude' ? 'selected' : ''}>Claude</option>
        </select>
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px;">최대 응답 토큰 수</label>
        <input id="pc-max-tokens" type="number" value="${store.config.maxTokens}" min="100" max="8000"
          style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #444;background:#2a2a2a;color:#eee;font-size:13px;" />
      </div>
    </div>
  `;

  $('#extensions_settings').append(html);

  $('#pc-api-source').on('change', function () {
    updateConfig({ apiSource: $(this).val() });
  });
  $('#pc-max-tokens').on('change', function () {
    updateConfig({ maxTokens: parseInt($(this).val()) || 1500 });
  });
}

// ═══════════════════════════════════════════════
// 3. 요술봉 메뉴 항목
// ═══════════════════════════════════════════════
function addWandMenuItem() {
  const $item = $(`
    <div id="pc-wand-item" class="options-content-item" title="${WAND_LABEL}">
      🍑 ${WAND_LABEL}
    </div>
  `);

  $item.on('click', () => {
    $('#options').hide();
    openMainHub();
  });

  $('#options').append($item);
}

// ═══════════════════════════════════════════════
// 4. 메인 허브 팝업
// ═══════════════════════════════════════════════
function openMainHub() {
  if ($(`#${POPUP_ID}`).length) return;

  const extUrl = `scripts/extensions/third-party/${EXT_NAME}/main.html`;

  const $overlay = $(`
    <div id="${POPUP_ID}" style="
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.55);
      backdrop-filter:blur(4px);
    ">
      <div style="
        position:relative;
        width:min(520px,95vw);
        height:min(90vh,800px);
        border-radius:28px;
        overflow:hidden;
        box-shadow:0 24px 64px rgba(0,0,0,0.4);
      ">
        <iframe
          id="pc-iframe"
          src="${extUrl}"
          style="width:100%;height:100%;border:none;display:block;"
        ></iframe>
      </div>
    </div>
  `);

  $overlay.on('click', function (e) {
    if ($(e.target).is(`#${POPUP_ID}`)) closeMainHub();
  });

  $('body').append($overlay);

  $overlay.find('#pc-iframe').on('load', function () {
    try {
      const iw = this.contentWindow;
      iw.__PC_STORE__    = getStore();
      iw.__PC_CLOSE__    = closeMainHub;
      iw.__PC_GENERATE__ = generateWithRole;
      iw.__PC_GET_CHAT__ = getRecentChat;
      iw.__PC_CHAR__     = getCurrentCharName();
      iw.__PC_EXT_NAME__ = EXT_NAME;
    } catch (e) {
      console.warn('[PC] iframe bridge error', e);
    }
  });
}

function closeMainHub() {
  $(`#${POPUP_ID}`).remove();
  refreshPrompt();
}

// ═══════════════════════════════════════════════
// 5. ST 데이터 접근
// ═══════════════════════════════════════════════
function getRecentChat(limit) {
  limit = limit || 20;
  try {
    const ctx  = getContext();
    const chat = ctx.chat || [];
    return chat.slice(-limit).map(function(m) {
      return {
        role:    m.is_user ? 'user' : 'assistant',
        content: m.mes  || '',
        name:    m.name || '',
      };
    });
  } catch (e) {
    console.warn('[PC] getRecentChat error', e);
    return [];
  }
}

function getCurrentCharName() {
  try {
    return getContext().name2 || '{{char}}';
  } catch (e) {
    return '{{char}}';
  }
}

// ═══════════════════════════════════════════════
// 6. generateRaw 래퍼
// ═══════════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
  const store = getStore();
  try {
    const result = await generateRaw(userPrompt, {
      system:     systemPrompt,
      max_tokens: store.config.maxTokens || 1500,
    });
    return result;
  } catch (e) {
    console.error('[PC] generateRaw error', e);
    throw e;
  }
}

// ═══════════════════════════════════════════════
// 7. 프롬프트 주입
// ═══════════════════════════════════════════════
function refreshPrompt() {
  try {
    const promptText = buildPrompt();
    setExtensionPrompt(EXT_NAME, promptText, 1, 0);
  } catch (e) {
    console.warn('[PC] setExtensionPrompt error', e);
  }
}
