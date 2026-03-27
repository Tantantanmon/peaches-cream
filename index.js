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
        peachColor: '',
        venusDimples: '',
        scent: '',
    },
    erogenous: {
        tightness: '',
        lubrication: '',
        texture: '',
        squirting: '',
        responsivity: '',
        moaning: '',
        flushing: '',
        experience: '',
        vibe: '',
        sensitiveZones: [],
        sensoryFeedback: [],
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
    if (!s.config)     s.config     = { ...defaultSettings.config };
    if (!s.profile)    s.profile    = { ...defaultSettings.profile };
    if (!s.erogenous)  s.erogenous  = { ...defaultSettings.erogenous };
    if (!s.lastTouch)  s.lastTouch  = { cards: [], pinned: [] };
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
    const p = s.profile   || {};
    const e = s.erogenous || {};
    const lines = ['[Peaches & Cream — User Profile]'];

    // ── Profile ──
    if (p.height || p.weight) lines.push(`Body: ${p.height || '?'}cm, ${p.weight || '?'}kg`);
    if (p.eyeColor)      lines.push(`Eye color: ${p.eyeColor}`);
    if (p.hair)          lines.push(`Hair: ${p.hair}`);
    if (p.skinTone)      lines.push(`Skin tone: ${p.skinTone}`);
    if (p.bodyType)      lines.push(`Body type: ${p.bodyType}`);
    if (p.chest)         lines.push(`Bust: ${p.chest}`);
    if (p.butt)          lines.push(`Butt: ${p.butt}`);
    if (p.waistHip)      lines.push(`Waist-hip: ${p.waistHip}`);
    if (p.skinTexture)   lines.push(`Skin texture: ${p.skinTexture}`);
    if (p.bodyHair)      lines.push(`Body hair: ${p.bodyHair}`);
    if (p.peachColor)    lines.push(`Peach color: ${p.peachColor}`);
    if (p.venusDimples)  lines.push(`Venus dimples: ${p.venusDimples}`);
    if (p.scent)         lines.push(`Scent: ${p.scent}`);

    // ── Erogenous Zone ──
    const ezLines = [];
    if (e.tightness)     ezLines.push(`Tightness: ${e.tightness}`);
    if (e.lubrication)   ezLines.push(`Lubrication: ${e.lubrication}`);
    if (e.texture)       ezLines.push(`Texture: ${e.texture}`);
    if (e.squirting)     ezLines.push(`Squirting: ${e.squirting}`);
    if (e.responsivity)  ezLines.push(`Responsivity: ${e.responsivity}`);
    if (e.moaning)       ezLines.push(`Moaning: ${e.moaning}`);
    if (e.flushing)      ezLines.push(`Flushing: ${e.flushing}`);
    if (e.experience)    ezLines.push(`Experience: ${e.experience}`);
    if (e.vibe)          ezLines.push(`Preferred vibe: ${e.vibe}`);
    if (e.sensitiveZones && e.sensitiveZones.length)
        ezLines.push(`Sensitive zones: ${e.sensitiveZones.join(', ')}`);
    if (e.sensoryFeedback && e.sensoryFeedback.length)
        ezLines.push(`Sensory feedback: ${e.sensoryFeedback.join(', ')}`);

    if (ezLines.length) {
        lines.push('\n[Erogenous Zone]');
        ezLines.forEach(l => lines.push(l));
    }

    // ── Pinned Memories ──
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
    const $item = $(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5">
        <span>🍑</span>
        <span>Peaches &amp; Cream</span>
    </div>`);

    $item.on('click', function() {
        $('#extensionsMenu').hide();
        openMainHub();
    });

    $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════════
// 메인 허브 팝업
// ═══════════════════════════════════════════════
const POPUP_ID = 'pc-popup-overlay';

async function openMainHub() {
    if ($(`#${POPUP_ID}`).length) return;

    window.__PC_STORE__    = getStore();
    window.__PC_CLOSE__    = closeMainHub;
    window.__PC_GENERATE__ = generateWithRole;
    window.__PC_GET_CHAT__ = getRecentChat;
    window.__PC_CHAR__     = getCurrentCharName();
    window.__PC_SAVE__     = saveStore;

    const extUrl = `scripts/extensions/third-party/${MODULE_NAME}/main.html`;

    const overlay = document.createElement('div');
    overlay.id = POPUP_ID;
    overlay.style.cssText = [
        'position:fixed', 'inset:0', 'z-index:9999',
        'display:flex', 'align-items:center', 'justify-content:center',
        'background:rgba(0,0,0,0.6)', 'backdrop-filter:blur(4px)',
    ].join(';');

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeMainHub();
    });

    const wrap = document.createElement('div');
    wrap.style.cssText = [
        'position:relative',
        'width:min(520px,95vw)',
        'height:min(90vh,800px)',
        'border-radius:28px',
        'overflow:hidden',
        'box-shadow:0 24px 64px rgba(0,0,0,0.5)',
    ].join(';');

    const iframe = document.createElement('iframe');
    iframe.src = extUrl;
    iframe.style.cssText = 'width:100%;height:100%;border:none;display:block;';
    iframe.setAttribute('id', 'pc-iframe');

    iframe.addEventListener('load', function() {
        try {
            const iw = iframe.contentWindow;
            iw.__PC_STORE__    = getStore();
            iw.__PC_CLOSE__    = closeMainHub;
            iw.__PC_GENERATE__ = generateWithRole;
            iw.__PC_GET_CHAT__ = getRecentChat;
            iw.__PC_CHAR__     = getCurrentCharName();
            iw.__PC_SAVE__     = saveStore;
            if (typeof iw.__PC_ON_BRIDGE__ === 'function') {
                iw.__PC_ON_BRIDGE__();
            }
            console.log(`[${MODULE_NAME}] iframe bridge OK`);
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

// ═══════════════════════════════════════════════
// 초기화
// ═══════════════════════════════════════════════
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

    console.log(`[${MODULE_NAME}] 로드 완료`);
})();
