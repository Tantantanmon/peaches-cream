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

    // ── Profile 매핑 ──
    const skinToneMap = {
        'Light':  '피부가 매우 밝고 도자기처럼 하얀 피부',
        'Medium': '따뜻한 중간 톤의 피부',
        'Dark':   '깊고 풍부한 어두운 피부',
    };
    const bodyTypeMap = {
        'Slim':       '가늘고 날씬한 체형, 군살 없이 마른 팔다리',
        'Average':    '균형 잡힌 비율, 자연스러운 여성스러운 체형',
        'Glamorous':  '풍만하고 볼륨감 있는 체형, 모래시계 실루엣',
        'Athletic':   '탄탄하고 근육질, 전체적으로 탄력 있음',
    };
    const bustMap = {
        'A':  '작고 오똑한 가슴, 손에 쏙 들어오는 크기',
        'B':  '아담하고 둥근 가슴, 자연스러운 형태',
        'C':  '풍성하고 부드러운 가슴, 움직일 때 출렁임',
        'D':  '크고 무거운 가슴, 손으로 다 감싸기 어려운 크기',
        'D+': '매우 크고 넘칠 듯한 가슴, 묵직하게 처짐',
    };
    const buttMap = {
        'Small & firm':  '작고 탄탄하게 올라붙은 엉덩이',
        'Large & full':  '크고 부드러운 엉덩이, 움직일 때마다 흔들림',
        'Average':       '적당히 둥글고 자연스러운 형태',
    };
    const waistHipMap = {
        'Slim':      '좁은 골반, 허리 라인이 완만함',
        'Hourglass': '극적으로 잘록한 허리, 넓게 퍼진 골반',
        'Full':      '넓은 골반, 풍성한 허벅지, 부드러운 하체',
    };
    const skinTextureMap = {
        'Soft':    '믿을 수 없이 부드럽고 비단결 같은 피부',
        'Firm':    '탄탄하고 탄력 있는 피부',
        'Average': '매끄럽고 자연스러운 피부결',
    };
    const bodyHairMap = {
        'Yes':      '자연스러운 체모 있음',
        'None':     '완전히 제모됨, 전체적으로 매끄러움',
        'A little': '옅고 드문드문한 체모',
    };
    const venusDimplesMap = {
        'Yes': '허리 아래 등에 두 개의 작은 보조개가 있음',
        'No':  null,
    };

    if (p.height || p.weight) lines.push(`신체: ${p.height || '?'}cm, ${p.weight || '?'}kg`);
    if (p.eyeColor)     lines.push(`눈 색깔: ${p.eyeColor}`);
    if (p.hair)         lines.push(`헤어: ${p.hair}`);
    if (p.skinTone   && skinToneMap[p.skinTone])    lines.push(`피부: ${skinToneMap[p.skinTone]}`);
    if (p.bodyType   && bodyTypeMap[p.bodyType])    lines.push(`체형: ${bodyTypeMap[p.bodyType]}`);
    if (p.chest      && bustMap[p.chest])           lines.push(`가슴: ${bustMap[p.chest]}`);
    if (p.butt       && buttMap[p.butt])            lines.push(`엉덩이: ${buttMap[p.butt]}`);
    if (p.waistHip   && waistHipMap[p.waistHip])   lines.push(`허리-골반: ${waistHipMap[p.waistHip]}`);
    if (p.skinTexture && skinTextureMap[p.skinTexture]) lines.push(`피부 질감: ${skinTextureMap[p.skinTexture]}`);
    if (p.bodyHair   && bodyHairMap[p.bodyHair])   lines.push(`체모: ${bodyHairMap[p.bodyHair]}`);
    if (p.peachColor)   lines.push(`음부 색: ${p.peachColor}`);
    if (p.venusDimples && venusDimplesMap[p.venusDimples]) lines.push(`등 보조개: ${venusDimplesMap[p.venusDimples]}`);
    if (p.scent)        lines.push(`체향: ${p.scent}`);

    // ── Erogenous Zone 매핑 ──
    const tightnessMap = {
        'Normal':  '편안하게 받아들이는 정도의 조임',
        'Tight':   '단단하게 조여드는 느낌, 눈에 띄는 저항감',
        'Extreme': '극도로 조임, 깊이 삽입 시 아랫배가 눈에 띄게 불룩해짐',
    };
    const lubricationMap = {
        'Dry':     '자연 애액이 거의 없음',
        'Moist':   '자연스럽게 촉촉함, 부드럽게 젖어있음',
        'Soaking': '매우 많이 젖어있음, 흘러내릴 정도',
    };
    const textureMap = {
        'Creamy': '진하고 크리미한 질감',
        'Watery': '묽고 투명한 질감',
        'Mixed':  '크리미와 묽은 질감이 섞여 변화함',
    };
    const squirtingMap = {
        'None':     '분출 없음',
        'Rare':     '강한 자극에서 가끔 분출',
        'Frequent': '쉽게 그리고 자주 분출, 강한 수축 동반',
    };
    const responsivityMap = {
        'Normal':  '평균적인 민감도로 반응',
        'High':    '매우 민감함, 가벼운 터치에도 강하게 반응',
        'Extreme': '극도로 민감함, 아주 작은 자극에도 몸이 떨리는 반응',
    };
    const moaningMap = {
        'Muted':      '소리를 억누르고 코로 거칠게 숨을 쉼',
        'Vocal':      '솔직하고 표현이 풍부한 신음',
        'Passionate': '크고 통제 불가능한 신음, 완전히 이성을 잃음',
    };
    const flushingMap = {
        'Pale':  '흥분해도 피부색 변화가 거의 없음',
        'Rosy':  '흥분 시 볼과 가슴이 분홍빛으로 물듦',
        'Deep':  '얼굴, 목, 가슴까지 온몸이 새빨개짐',
    };
    const experienceMap = {
        'Novice':  '경험이 적고 수줍음, 쉽게 당황함, 머리보다 몸이 먼저 반응',
        'Skilled': '편안하고 자신감 있음, 자기 몸을 잘 앎',
        'Master':  '경험이 매우 풍부함, 원하는 것과 방법을 정확히 앎',
    };
    const vibeMap = {
        'Romantic': '눈 맞춤과 함께하는 부드럽고 감정적인 섹스 선호',
        'Rough':    '강렬하고 공격적인 섹스 선호, 제압당할 때 강하게 반응',
        'Slow':     '길게 끌고 뜸들이는 섹스 선호, 절정보다 과정을 더 원함',
    };

    const ezLines = [];
    if (e.tightness   && tightnessMap[e.tightness])     ezLines.push(`조임: ${tightnessMap[e.tightness]}`);
    if (e.lubrication && lubricationMap[e.lubrication]) ezLines.push(`애액: ${lubricationMap[e.lubrication]}`);
    if (e.texture     && textureMap[e.texture])         ezLines.push(`질감: ${textureMap[e.texture]}`);
    if (e.squirting   && squirtingMap[e.squirting])     ezLines.push(`분출: ${squirtingMap[e.squirting]}`);
    if (e.responsivity && responsivityMap[e.responsivity]) ezLines.push(`민감도: ${responsivityMap[e.responsivity]}`);
    if (e.moaning     && moaningMap[e.moaning])         ezLines.push(`신음: ${moaningMap[e.moaning]}`);
    if (e.flushing    && flushingMap[e.flushing])       ezLines.push(`홍조: ${flushingMap[e.flushing]}`);
    if (e.experience  && experienceMap[e.experience])   ezLines.push(`경험: ${experienceMap[e.experience]}`);
    if (e.vibe        && vibeMap[e.vibe])               ezLines.push(`선호 분위기: ${vibeMap[e.vibe]}`);
    if (e.sensitiveZones && e.sensitiveZones.length)
        ezLines.push(`민감 부위: ${e.sensitiveZones.join(', ')}`);
    if (e.sensoryFeedback && e.sensoryFeedback.length)
        ezLines.push(`감각 반응: ${e.sensoryFeedback.join(', ')}`);

    if (ezLines.length) {
        lines.push('\n[성감대 / 신체 반응]');
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
// 멀티 API 목록 가져오기
// ═══════════════════════════════════════════════
function getAvailableApis() {
    try {
        const c = ctx();
        const apis = [{ value: 'main', label: 'Main API' }];

        // ST extras / secondary connections
        if (c.extensionSettings && c.extensionSettings.secondary_api) {
            apis.push({ value: 'secondary', label: 'Secondary API' });
        }

        // openai compatible connections
        const connections = c.openAICompatibleApis || c.oai_settings?.connections || [];
        connections.forEach((conn, i) => {
            if (conn && conn.name) {
                apis.push({ value: `oai_${i}`, label: conn.name });
            }
        });

        // kobold / horde / novel
        const apiType = c.main_api || '';
        if (apiType === 'kobold')  apis.push({ value: 'kobold',  label: 'KoboldAI' });
        if (apiType === 'horde')   apis.push({ value: 'horde',   label: 'AI Horde' });
        if (apiType === 'novel')   apis.push({ value: 'novel',   label: 'NovelAI' });

        return apis;
    } catch (e) {
        console.warn(`[${MODULE_NAME}] getAvailableApis error`, e);
        return [{ value: 'main', label: 'Main API' }];
    }
}

// ═══════════════════════════════════════════════
// generateRaw 래퍼 (API 소스 반영)
// ═══════════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
    const { generateRaw } = ctx();
    const store = getStore();
    const apiSource = store.config.apiSource || 'main';

    const params = {
        systemPrompt,
        prompt: userPrompt,
        max_new_tokens: store.config.maxTokens || 1500,
    };

    // main 이외의 소스 지정 시 파라미터 추가
    if (apiSource !== 'main') {
        params.api = apiSource;
    }

    return await generateRaw(params);
}

// ═══════════════════════════════════════════════
// ST 채팅 읽기 — 범위 지정 지원
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

// 시작/끝 메시지 번호(#1 기준)로 범위 슬라이싱
function getChatRange(startNum, endNum) {
    try {
        const { chat } = ctx();
        const arr = chat || [];
        const total = arr.length;

        // 번호 미입력시 최근 20개 fallback
        if (!startNum && !endNum) return getRecentChat(20);

        const s = startNum ? Math.max(1, parseInt(startNum)) : 1;
        const e = endNum   ? Math.min(total, parseInt(endNum)) : total;

        return arr.slice(s - 1, e).map(function(m) {
            return {
                role:    m.is_user ? 'user' : 'assistant',
                content: m.mes  || '',
                name:    m.name || '',
            };
        });
    } catch (err) {
        console.warn(`[${MODULE_NAME}] getChatRange error`, err);
        return getRecentChat(20);
    }
}

// ═══════════════════════════════════════════════
// 캐릭터 디스크립션 가져오기
// ═══════════════════════════════════════════════
function getCharDescription() {
    try {
        const c = ctx();
        // 방법 1: characters 배열에서 현재 캐릭터 찾기
        if (c.characters && c.characterId !== undefined) {
            const char = c.characters[c.characterId];
            if (char) {
                const parts = [];
                if (char.description)    parts.push(char.description);
                if (char.personality)    parts.push(char.personality);
                if (char.scenario)       parts.push(char.scenario);
                if (char.mes_example)    parts.push(char.mes_example);
                return parts.join('\n').trim();
            }
        }
        // 방법 2: getCharacters() 함수
        if (typeof c.getCharacters === 'function') {
            const chars = c.getCharacters();
            const cur   = chars.find(ch => ch.name === c.name2);
            if (cur) return [cur.description, cur.personality].filter(Boolean).join('\n');
        }
        return '';
    } catch (e) {
        console.warn(`[${MODULE_NAME}] getCharDescription error`, e);
        return '';
    }
}

// ═══════════════════════════════════════════════
// 유저 페르소나 디스크립션 가져오기
// ═══════════════════════════════════════════════
function getUserPersona() {
    try {
        const c = ctx();
        // 방법 1: persona 직접 접근
        if (c.persona) return c.persona;
        // 방법 2: power_user 설정의 persona
        if (c.powerUserSettings && c.powerUserSettings.persona_description) {
            return c.powerUserSettings.persona_description;
        }
        // 방법 3: extension settings 내 persona
        if (c.extensionSettings && c.extensionSettings.persona) {
            return c.extensionSettings.persona;
        }
        return '';
    } catch (e) {
        console.warn(`[${MODULE_NAME}] getUserPersona error`, e);
        return '';
    }
}

function getCurrentCharName() {
    try {
        return ctx().name2 || '{{char}}';
    } catch (e) {
        return '{{char}}';
    }
}

function getCurrentUserName() {
    try {
        return ctx().name1 || '{{user}}';
    } catch (e) {
        return '{{user}}';
    }
}

// ═══════════════════════════════════════════════
// 확장 탭 설정 패널
// ═══════════════════════════════════════════════
function renderSettingsPanel() {
    const store = getStore();
    const apis  = getAvailableApis();

    const apiOptions = apis.map(a =>
        `<option value="${a.value}" ${store.config.apiSource === a.value ? 'selected' : ''}>${a.label}</option>`
    ).join('');

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
                        <select id="pc-api-source">${apiOptions}</select>
                    </div>
                    <div class="pc-setting-row" style="margin-top:6px;">
                        <button id="pc-api-refresh" style="font-size:12px;padding:3px 8px;cursor:pointer;">🔄 API 목록 새로고침</button>
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

    // API 목록 새로고침 버튼
    $('#pc-api-refresh').on('click', function() {
        const currentVal = getStore().config.apiSource;
        const freshApis  = getAvailableApis();
        const $select    = $('#pc-api-source');
        $select.empty();
        freshApis.forEach(a => {
            const opt = $(`<option value="${a.value}">${a.label}</option>`);
            if (a.value === currentVal) opt.attr('selected', true);
            $select.append(opt);
        });
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

    window.__PC_STORE__          = getStore();
    window.__PC_CLOSE__          = closeMainHub;
    window.__PC_GENERATE__       = generateWithRole;
    window.__PC_GET_CHAT__       = getRecentChat;
    window.__PC_GET_CHAT_RANGE__ = getChatRange;
    window.__PC_CHAR__           = getCurrentCharName();
    window.__PC_USER__           = getCurrentUserName();
    window.__PC_CHAR_DESC__      = getCharDescription();
    window.__PC_USER_PERSONA__   = getUserPersona();
    window.__PC_SAVE__           = saveStore;

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
            iw.__PC_STORE__          = getStore();
            iw.__PC_CLOSE__          = closeMainHub;
            iw.__PC_GENERATE__       = generateWithRole;
            iw.__PC_GET_CHAT__       = getRecentChat;
            iw.__PC_GET_CHAT_RANGE__ = getChatRange;
            iw.__PC_CHAR__           = getCurrentCharName();
            iw.__PC_USER__           = getCurrentUserName();
            iw.__PC_CHAR_DESC__      = getCharDescription();
            iw.__PC_USER_PERSONA__   = getUserPersona();
            iw.__PC_SAVE__           = saveStore;
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
