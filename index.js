// index.js — Peaches & Cream ST 브릿지 (유일한 ST 연결 파일)

import {
  getStore,
  updateConfig,
  buildPrompt,
} from './store.js';

const EXT_NAME   = 'peaches-cream';
const POPUP_ID   = 'pc-popup-overlay';
const WAND_LABEL = '🍑 Peaches & Cream';

// ─────────────────────────────────────────────
// 1. 확장 로드
// ─────────────────────────────────────────────
jQuery(async () => {
  // 설정 초기화
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = {};
  }
  getStore(); // 기본값 보완

  // 확장 탭 설정 패널 렌더링
  renderSettingsPanel();

  // 요술봉 메뉴 항목 추가
  addWandMenuItem();

  // 채팅 이벤트 감지 → 프롬프트 갱신
  eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
  eventSource.on(event_types.CHAT_CHANGED,     refreshPrompt);

  // 초기 프롬프트 주입
  refreshPrompt();
});

// ─────────────────────────────────────────────
// 2. 확장 탭 설정 패널
// ─────────────────────────────────────────────
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

  // ST 확장 설정 영역에 추가
  $('#extensions_settings').append(html);

  // 이벤트
  $('#pc-api-source').on('change', function () {
    updateConfig({ apiSource: $(this).val() });
  });
  $('#pc-max-tokens').on('change', function () {
    updateConfig({ maxTokens: parseInt($(this).val()) || 1500 });
  });
}

// ─────────────────────────────────────────────
// 3. 요술봉 메뉴 항목
// ─────────────────────────────────────────────
function addWandMenuItem() {
  // ST 요술봉(#options_button) 드롭다운에 항목 추가
  const $item = $(`
    <div id="pc-wand-item" class="options-content-item" title="${WAND_LABEL}">
      <i class="fa-solid fa-peach" style="margin-right:6px;"></i>${WAND_LABEL}
    </div>
  `);

  $item.on('click', () => {
    // 요술봉 메뉴 닫기
    $('#options').hide();
    openMainHub();
  });

  // 요술봉 드롭다운 컨테이너에 삽입
  $('#options').append($item);
}

// ─────────────────────────────────────────────
// 4. 메인 허브 팝업 열기
// ─────────────────────────────────────────────
function openMainHub() {
  if ($(`#${POPUP_ID}`).length) return; // 이미 열려있으면 무시

  // main.html을 iframe으로 로드
  const extUrl = `scripts/extensions/third-party/${EXT_NAME}/main.html`;

  const $overlay = $(`
    <div id="${POPUP_ID}" style="
      position:fixed;inset:0;z-index:9999;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.55);
      backdrop-filter:blur(4px);
    ">
      <div id="pc-popup-wrap" style="
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
          allowtransparency="true"
        ></iframe>
      </div>
    </div>
  `);

  // 오버레이 클릭 시 닫기 (팝업 내부 클릭은 무시)
  $overlay.on('click', function (e) {
    if ($(e.target).is(`#${POPUP_ID}`)) closeMainHub();
  });

  $('body').append($overlay);

  // iframe이 로드된 뒤 store 데이터 전달
  $overlay.find('#pc-iframe').on('load', function () {
    try {
      const iframeWin = this.contentWindow;
      iframeWin.__PC_STORE__   = getStore();
      iframeWin.__PC_CLOSE__   = closeMainHub;
      iframeWin.__PC_GENERATE__ = generateWithRole;
      iframeWin.__PC_GET_CHAT__ = getRecentChat;
      iframeWin.__PC_CHAR__     = getCurrentCharName();
      iframeWin.__PC_EXT_NAME__ = EXT_NAME;
    } catch (e) {
      console.warn('[PC] iframe bridge error', e);
    }
  });
}

function closeMainHub() {
  $(`#${POPUP_ID}`).remove();
  refreshPrompt(); // 팝업 닫힐 때 프롬프트 갱신
}

// ─────────────────────────────────────────────
// 5. ST 데이터 접근
// ─────────────────────────────────────────────
function getRecentChat(limit = 20) {
  try {
    const ctx   = getContext();
    const chat  = ctx.chat || [];
    return chat.slice(-limit).map(m => ({
      role:    m.is_user ? 'user' : 'assistant',
      content: m.mes || '',
      name:    m.name || '',
    }));
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

// ─────────────────────────────────────────────
// 6. generateRaw 래퍼
// ─────────────────────────────────────────────
async function generateWithRole(systemPrompt, userPrompt) {
  const store    = getStore();
  const maxTokens = store.config.maxTokens || 1500;

  try {
    const result = await generateRaw(userPrompt, {
      system:     systemPrompt,
      max_tokens: maxTokens,
    });
    return result;
  } catch (e) {
    console.error('[PC] generateRaw error', e);
    throw e;
  }
}

// ─────────────────────────────────────────────
// 7. 프롬프트 주입
// ─────────────────────────────────────────────
function refreshPrompt() {
  try {
    const promptText = buildPrompt();
    setExtensionPrompt(EXT_NAME, promptText, 1, 0); // position=1(after system), depth=0
  } catch (e) {
    console.warn('[PC] setExtensionPrompt error', e);
  }
}
