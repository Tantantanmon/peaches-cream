// index.js — Peaches & Cream
// ST 공식 API 기준으로 작성

const MODULE_NAME = 'peaches-cream';

// ═══════════════════════════════════════════════
// ST context 가져오기
// ═══════════════════════════════════════════════
function ctx() {
    return SillyTavern.getContext();
}

// ═══════════════════════════════════════════════
// 기본 설정값
// ═══════════════════════════════════════════════
const defaultSettings = {
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

// ═══════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════
function getStore() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = JSON.parse(JSON.stringify(defaultSettings));
    }
    const s = extensionSettings[MODULE_NAME];
    if (!s.config)    s.config    = { ...defaultSettings.config };
    if (!s.profile)   s.profile   = { ...defaultSettings.profile };
    if (!s.lastTouch) s.lastTouch = { cards: [], pinned: [] };
    return s;
}

function saveStore() {
    ctx().saveSettingsDebounced();
}

function updateConfig(data) {
    const s = getStore();
    s.config = { ...s.config, ...data };
    saveStore();
}

function buildPrompt() {
    const s = getStore();
    const p = s.profile;
    const lines = ['[Peaches & Cream — User Profile]'];

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

    const pinned = s.lastTouch.cards.filter(c => s.lastTouch.pinned.includes(c.id));
    if (pinned.length) {
        lines.push('\n[Pinned Memories]');
        pinned.forEach(c => lines.push(`- ${c.title} (${c.date}, ${c.place || '?'}): ${c.mood || ''}`));
    }

    return lines.join('\n');
}

// ═══════════════════════════════════════════════
// 프롬프트 주입
// ═══════════════════════════════════════════════
function refreshPrompt() {
    try {
        const { setExtensionPrompt } = ctx();
        setExtensionPrompt(MODULE_NAME, buildPrompt(), 1, 0);
    } catch (e) {
        console.warn(`[${MODULE_NAME}] setExtensionPrompt error`, e);
    }
}

// ═══════════════════════════════════════════════
// generateRaw 래퍼
// ═══════════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
    const s = getStore();
    const { generateRaw } = ctx();
    return await generateRaw({
        systemPrompt,
        prompt: userPrompt,
    });
}

// ═══════════════════════════════════════════════
// ST 채팅 읽기
// ═══════════════════════════════════════════════
function getRecentChat(limit) {
    limit = limit || 20;
    try {
        const { chat } = ctx();
        return (chat || []).slice(-limit).map(function(m) {
            return {
                role:    m.is_user ? 'user' : 'assistant',
                content: m.mes  || '',
                name:    m.name || '',
            };
        });
    } catch (e) {
        console.warn(`[${MODULE_NAME}] getRecentChat error`, e);
        return [];
    }
}

function getCurrentCharName() {
    try {
        return ctx().name2 || '{{char}}';
    } catch (e) {
        return '{{char}}';
    }
}

// ═══════════════════════════════════════════════
// 확장 탭 설정 패널
// ═══════════════════════════════════════════════
function renderSettingsPanel() {
    const store = getStore();
    const settingsHtml = `
        <div id="pc-settings-panel">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>🍑 Peaches &amp; Cream</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <div class="pc-setting-row">
                        <label for="pc-api-source">API 소스</label>
                        <select id="pc-api-source">
                            <option value="main" ${store.config.apiSource === 'main' ? 'selected' : ''}>Main API</option>
                        </select>
                    </div>
                    <div class="pc-setting-row">
                        <label for="pc-max-tokens">최대 응답 토큰 수</label>
                        <input id="pc-max-tokens" type="number" value="${store.config.maxTokens}" min="100" max="8000" />
                    </div>
                    <hr>
                    <small style="color:#888;">요술봉 메뉴에서 🍑 Peaches &amp; Cream 을 클릭해 앱을 여세요.</small>
                </div>
            </div>
        </div>
    `;

    // ST 확장 설정 영역에 추가
    $('#extensions_settings2').append(settingsHtml);

    $('#pc-api-source').on('change', function() {
        updateConfig({ apiSource: $(this).val() });
    });
    $('#pc-max-tokens').on('change', function() {
        updateConfig({ maxTokens: parseInt($(this).val()) || 1500 });
    });
}

// ═══════════════════════════════════════════════
// 요술봉 메뉴 항목 추가
// ═══════════════════════════════════════════════
function addWandMenuItem() {
    // ST 요술봉 드롭다운에 항목 추가
    const $item = $(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5">
        <span>🍑</span>
        <span>Peaches &amp; Cream</span>
    </div>`);

    $item.on('click', function() {
        // 드롭다운 닫기
        $('#options').hide();
        openMainHub();
    });

    // 요술봉 메뉴 리스트에 추가
    $('#options').append($item);
}

// ═══════════════════════════════════════════════
// 메인 허브 팝업
// ═══════════════════════════════════════════════
const POPUP_ID = 'pc-popup-overlay';

function openMainHub() {
    if ($(`#${POPUP_ID}`).length) return;

    const extUrl = `scripts/extensions/third-party/${MODULE_NAME}/main.html`;

    const $overlay = $(`
        <div id="${POPUP_ID}" style="
            position:fixed;inset:0;z-index:9999;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.6);
            backdrop-filter:blur(4px);
        ">
            <div style="
                position:relative;
                width:min(520px,95vw);
                height:min(90vh,800px);
                border-radius:28px;
                overflow:hidden;
                box-shadow:0 24px 64px rgba(0,0,0,0.5);
            ">
                <iframe
                    id="pc-iframe"
                    src="${extUrl}"
                    style="width:100%;height:100%;border:none;display:block;"
                ></iframe>
            </div>
        </div>
    `);

    $overlay.on('click', function(e) {
        if ($(e.target).is(`#${POPUP_ID}`)) closeMainHub();
    });

    $('body').append($overlay);

    $overlay.find('#pc-iframe').on('load', function() {
        try {
            const iw = this.contentWindow;
            iw.__PC_STORE__     = getStore();
            iw.__PC_CLOSE__     = closeMainHub;
            iw.__PC_GENERATE__  = generateWithRole;
            iw.__PC_GET_CHAT__  = getRecentChat;
            iw.__PC_CHAR__      = getCurrentCharName();
            iw.__PC_SAVE__      = saveStore;
        } catch (e) {
            console.warn(`[${MODULE_NAME}] iframe bridge error`, e);
        }
    });
}

function closeMainHub() {
    $(`#${POPUP_ID}`).remove();
    refreshPrompt();
}

// ═══════════════════════════════════════════════
// 초기화
// ═══════════════════════════════════════════════
(async function init() {
    // 설정 초기화
    getStore();

    // 확장 탭 패널 렌더링
    renderSettingsPanel();

    // 요술봉 메뉴 항목 추가
    addWandMenuItem();

    // 이벤트 리스너
    const { eventSource, event_types } = ctx();
    eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
    eventSource.on(event_types.CHAT_CHANGED,     refreshPrompt);

    // 초기 프롬프트 주입
    refreshPrompt();

    // iframe에서 접근할 수 있도록 전역 노출
    window.__PC_REFRESH_PROMPT__ = refreshPrompt;
    window.__PC_SAVE_STORE__     = saveStore;

    console.log(`[${MODULE_NAME}] 로드 완료`);
})();
