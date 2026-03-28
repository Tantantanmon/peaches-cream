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
// 캐릭터 고유 키 생성 (avatar 파일명 기반)
// ═══════════════════════════════════════════════
function getCharKey() {
    try {
        const c = ctx();
        const avatar = c?.characters?.[c?.characterId]?.avatar?.replace(/\.[^/.]+$/, '')
                    || c?.characters?.[c?.characterId]?.filename?.replace(/\.[^/.]+$/, '');
        const name = c?.name2 || c?.characters?.[c?.characterId]?.name || 'default';
        const raw = avatar ? `${name}_${avatar}` : name;
        return raw.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    } catch(e) {
        console.warn(`[${MODULE_NAME}] getCharKey error`, e);
        return 'default';
    }
}

// ═══════════════════════════════════════════════
// 기본값 — 캐릭터별 데이터 템플릿
// ═══════════════════════════════════════════════
const defaultCharData = {
    // 유저 데이터 (이 캐릭터와의 유저 페르소나)
    userProfile: {
        height: '', weight: '', eyeColor: '', hair: '',
        skinTone: '', bodyType: '', chest: '', butt: '',
        waistHip: '', skinTexture: '', bodyHair: '',
        peachColor: '', venusDimples: '', scent: '',
    },
    userErogenous: {
        tightness: '', lubrication: '', texture: '', squirting: '',
        responsivity: '', moaning: '', flushing: '', experience: '', vibe: '',
        sensitiveZones: [], sensoryFeedback: [],
    },
    casual: {
        charToUser: [],
        userToChar: [],
    },
    lastTouch: {
        cards: [],
        pinned: [],
    },
    // 캐릭터 데이터 (Vault)
    charProfile: {
        height: '', weight: '', eyeColor: '', hair: '',
        bodyType: '', size: '', sizeUnit: 'cm',
        pubicHair: '', circumcision: '',
        additionalFeatures: [],
    },
    charErogenous: {
        moaning: '', semen: '', preCum: '', responsivity: '',
        multiRound: '', stamina: '',
        aftercareMoods: [], sensitiveZones: [],
    },
    charKink: {
        acts: [], positions: [], foreplay: [], intercourse: [],
        ejaculationLocation: [], fetishes: [], role: '',
    },
};

// 전역 설정 (캐릭터 무관)
const defaultGlobalConfig = {
    enabled:            true,
    apiSource:          'main',
    connectionProfileId: '',
    maxTokens:          1500,
};

// ═══════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════
function getStore() {
    const { extensionSettings } = ctx();
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = { config: { ...defaultGlobalConfig }, chars: {} };
    }
    const s = extensionSettings[MODULE_NAME];
    if (!s.config) s.config = { ...defaultGlobalConfig };
    if (!s.chars)  s.chars  = {};
    return s;
}

function getCharStore() {
    const s    = getStore();
    const key  = getCharKey();
    if (!s.chars[key]) {
        s.chars[key] = JSON.parse(JSON.stringify(defaultCharData));
    }
    // 누락 필드 보완
    const cd = s.chars[key];
    if (!cd.userProfile)   cd.userProfile   = { ...defaultCharData.userProfile };
    if (!cd.userErogenous) cd.userErogenous = { ...defaultCharData.userErogenous };
    if (!cd.casual)        cd.casual        = { charToUser: [], userToChar: [] };
    if (!cd.lastTouch)     cd.lastTouch     = { cards: [], pinned: [] };
    if (!cd.charProfile)   cd.charProfile   = { ...defaultCharData.charProfile };
    if (!cd.charErogenous) cd.charErogenous = { ...defaultCharData.charErogenous };
    if (!cd.charKink)      cd.charKink      = { ...defaultCharData.charKink };
    return cd;
}

function saveStore() {
    ctx().saveSettingsDebounced();
}

function updateConfig(data) {
    const s = getStore();
    s.config = { ...s.config, ...data };
    saveStore();
}

// ═══════════════════════════════════════════════
// 프롬프트 빌더
// ═══════════════════════════════════════════════
function buildPrompt() {
    const cd       = getCharStore();
    const charName = getCurrentCharName();
    const userName = getCurrentUserName();
    const sections = [];

    // ── 유저 프로필 ──
    const p = cd.userProfile || {};
    const profileLines = ['[Peaches & Cream — User Profile]'];

    const skinToneMap = {
        'Light':  '피부가 매우 밝고 도자기처럼 하얀 피부',
        'Medium': '따뜻한 중간 톤의 피부',
        'Dark':   '깊고 풍부한 어두운 피부',
    };
    const bodyTypeMap = {
        'Slim':      '가늘고 날씬한 체형, 군살 없이 마른 팔다리',
        'Average':   '균형 잡힌 비율, 자연스러운 여성스러운 체형',
        'Glamorous': '풍만하고 볼륨감 있는 체형, 모래시계 실루엣',
        'Athletic':  '탄탄하고 근육질, 전체적으로 탄력 있음',
    };
    const bustMap = {
        'A':  '작고 오똑한 가슴, 손에 쏙 들어오는 크기',
        'B':  '아담하고 둥근 가슴, 자연스러운 형태',
        'C':  '풍성하고 부드러운 가슴, 움직일 때 출렁임',
        'D':  '크고 무거운 가슴, 손으로 다 감싸기 어려운 크기',
        'D+': '매우 크고 넘칠 듯한 가슴, 묵직하게 처짐',
    };
    const buttMap = {
        'Small & firm': '작고 탄탄하게 올라붙은 엉덩이',
        'Large & full': '크고 부드러운 엉덩이, 움직일 때마다 흔들림',
        'Average':      '적당히 둥글고 자연스러운 형태',
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

    if (p.height || p.weight) profileLines.push(`신체: ${p.height || '?'}cm, ${p.weight || '?'}kg`);
    if (p.eyeColor)    profileLines.push(`눈 색깔: ${p.eyeColor}`);
    if (p.hair)        profileLines.push(`헤어: ${p.hair}`);
    if (p.skinTone    && skinToneMap[p.skinTone])      profileLines.push(`피부: ${skinToneMap[p.skinTone]}`);
    if (p.bodyType    && bodyTypeMap[p.bodyType])      profileLines.push(`체형: ${bodyTypeMap[p.bodyType]}`);
    if (p.chest       && bustMap[p.chest])             profileLines.push(`가슴: ${bustMap[p.chest]}`);
    if (p.butt        && buttMap[p.butt])              profileLines.push(`엉덩이: ${buttMap[p.butt]}`);
    if (p.waistHip    && waistHipMap[p.waistHip])     profileLines.push(`허리-골반: ${waistHipMap[p.waistHip]}`);
    if (p.skinTexture && skinTextureMap[p.skinTexture]) profileLines.push(`피부 질감: ${skinTextureMap[p.skinTexture]}`);
    if (p.bodyHair    && bodyHairMap[p.bodyHair])     profileLines.push(`체모: ${bodyHairMap[p.bodyHair]}`);
    if (p.peachColor)  profileLines.push(`음부 색: ${p.peachColor}`);
    if (p.venusDimples === 'Yes') profileLines.push(`등 보조개: 허리 아래 등에 두 개의 작은 보조개가 있음`);
    if (p.scent)       profileLines.push(`체향: ${p.scent}`);

    // ── 유저 성감대 ──
    const e = cd.userErogenous || {};
    const tightnessMap  = { 'Normal':'편안하게 받아들이는 정도의 조임', 'Tight':'단단하게 조여드는 느낌, 눈에 띄는 저항감', 'Extreme':'극도로 조임, 깊이 삽입 시 아랫배가 눈에 띄게 불룩해짐' };
    const lubricationMap = { 'Dry':'자연 애액이 거의 없음', 'Moist':'자연스럽게 촉촉함, 부드럽게 젖어있음', 'Soaking':'매우 많이 젖어있음, 흘러내릴 정도' };
    const textureMap    = { 'Creamy':'진하고 크리미한 질감', 'Watery':'묽고 투명한 질감', 'Mixed':'크리미와 묽은 질감이 섞여 변화함' };
    const squirtingMap  = { 'None':'분출 없음', 'Rare':'강한 자극에서 가끔 분출', 'Frequent':'쉽게 그리고 자주 분출, 강한 수축 동반' };
    const responsivityMap = { 'Normal':'평균적인 민감도로 반응', 'High':'매우 민감함, 가벼운 터치에도 강하게 반응', 'Extreme':'극도로 민감함, 아주 작은 자극에도 몸이 떨리는 반응' };
    const moaningMap    = { 'Muted':'소리를 억누르고 코로 거칠게 숨을 쉼', 'Vocal':'솔직하고 표현이 풍부한 신음', 'Passionate':'크고 통제 불가능한 신음, 완전히 이성을 잃음' };
    const flushingMap   = { 'Pale':'흥분해도 피부색 변화가 거의 없음', 'Rosy':'흥분 시 볼과 가슴이 분홍빛으로 물듦', 'Deep':'얼굴, 목, 가슴까지 온몸이 새빨개짐' };
    const experienceMap = { 'Novice':'경험이 적고 수줍음, 쉽게 당황함', 'Skilled':'편안하고 자신감 있음, 자기 몸을 잘 앎', 'Master':'경험이 매우 풍부함, 원하는 것과 방법을 정확히 앎' };
    const vibeMap       = { 'Romantic':'눈 맞춤과 함께하는 부드럽고 감정적인 섹스 선호', 'Rough':'강렬하고 공격적인 섹스 선호, 제압당할 때 강하게 반응', 'Slow':'길게 끌고 뜸들이는 섹스 선호, 절정보다 과정을 더 원함' };

    const ezLines = [];
    if (e.tightness    && tightnessMap[e.tightness])     ezLines.push(`조임: ${tightnessMap[e.tightness]}`);
    if (e.lubrication  && lubricationMap[e.lubrication]) ezLines.push(`애액: ${lubricationMap[e.lubrication]}`);
    if (e.texture      && textureMap[e.texture])         ezLines.push(`질감: ${textureMap[e.texture]}`);
    if (e.squirting    && squirtingMap[e.squirting])     ezLines.push(`분출: ${squirtingMap[e.squirting]}`);
    if (e.responsivity && responsivityMap[e.responsivity]) ezLines.push(`민감도: ${responsivityMap[e.responsivity]}`);
    if (e.moaning      && moaningMap[e.moaning])         ezLines.push(`신음: ${moaningMap[e.moaning]}`);
    if (e.flushing     && flushingMap[e.flushing])       ezLines.push(`홍조: ${flushingMap[e.flushing]}`);
    if (e.experience   && experienceMap[e.experience])   ezLines.push(`경험: ${experienceMap[e.experience]}`);
    if (e.vibe         && vibeMap[e.vibe])               ezLines.push(`선호 분위기: ${vibeMap[e.vibe]}`);
    if (e.sensitiveZones  && e.sensitiveZones.length)    ezLines.push(`민감 부위: ${e.sensitiveZones.join(', ')}`);
    if (e.sensoryFeedback && e.sensoryFeedback.length)   ezLines.push(`감각 반응: ${e.sensoryFeedback.join(', ')}`);

    if (ezLines.length) {
        profileLines.push('\n[성감대 / 신체 반응]');
        ezLines.forEach(l => profileLines.push(l));
    }

    // 핀된 라스트터치 메모리
    const lt = cd.lastTouch || { cards: [], pinned: [] };
    const pinnedCards = (lt.cards || []).filter(c => (lt.pinned || []).includes(c.id));
    if (pinnedCards.length) {
        profileLines.push('\n[Pinned Memories]');
        pinnedCards.forEach(c => profileLines.push(`- ${c.title} (${c.date}, ${c.place || '?'}): ${c.mood || ''}`));
    }

    sections.push(profileLines.join('\n'));

    // ── Casual (핀된 것만) ──
    const casual = cd.casual || {};
    const charToUser = (casual.charToUser || []).filter(c => c.pinned);
    const userToChar = (casual.userToChar || []).filter(c => c.pinned);
    if (charToUser.length || userToChar.length) {
        const casualLines = ['[Casual — 일상 스킨십 습관]'];
        if (charToUser.length) {
            casualLines.push(`\n[${charName}가 ${userName}에게]`);
            charToUser.forEach(c => { if (c.detail) casualLines.push(c.detail); });
        }
        if (userToChar.length) {
            casualLines.push(`\n[${userName}가 ${charName}에게]`);
            userToChar.forEach(c => { if (c.detail) casualLines.push(c.detail); });
        }
        sections.push(casualLines.join('\n'));
    }

    // ── 캐릭터 프로필 (Vault) ──
    const cp = cd.charProfile || {};
    const charProfileLines = [`[Character Profile — ${charName}]`];
    const charBodyTypeMap = { 'Average':'균형 잡힌 체형', 'Athletic':'탄탄하고 근육질인 체형', 'Bulk':'크고 근육량이 많은 체형' };
    const charPubicMap    = { 'Yes':'음모 있음', 'None':'완전히 제모됨', 'A little':'옅은 음모' };
    const charCircMap     = { 'Cut':'포경 수술 완료', 'Uncut':'포경 수술 없음' };

    if (cp.height || cp.weight) charProfileLines.push(`신체: ${cp.height || '?'}cm, ${cp.weight || '?'}kg`);
    if (cp.eyeColor) charProfileLines.push(`눈 색깔: ${cp.eyeColor}`);
    if (cp.hair)     charProfileLines.push(`헤어: ${cp.hair}`);
    if (cp.bodyType && charBodyTypeMap[cp.bodyType]) charProfileLines.push(`체형: ${charBodyTypeMap[cp.bodyType]}`);
    if (cp.size) {
        const sizeLabel = cp.sizeUnit === 'in'
            ? `${cp.size}인치 (약 ${Math.round(cp.size * 2.54 * 10) / 10}cm)`
            : `${cp.size}cm`;
        charProfileLines.push(`사이즈: ${sizeLabel}`);
    }
    if (cp.pubicHair    && charPubicMap[cp.pubicHair])    charProfileLines.push(`음모: ${charPubicMap[cp.pubicHair]}`);
    if (cp.circumcision && charCircMap[cp.circumcision])  charProfileLines.push(`포경: ${charCircMap[cp.circumcision]}`);
    if (cp.additionalFeatures && cp.additionalFeatures.length)
        charProfileLines.push(`추가 특징: ${cp.additionalFeatures.join(', ')}`);

    if (charProfileLines.length > 1) sections.push(charProfileLines.join('\n'));

    // ── 캐릭터 성감대 (Vault) ──
    const ce = cd.charErogenous || {};
    const charEzLines = [`[Character Erogenous — ${charName}]`];
    const cMoaningMap     = { 'Muted':'소리를 억누름', 'Low Groan':'낮은 신음', 'Vocal':'솔직하고 표현이 풍부한 신음' };
    const cSemenMap       = { 'Normal':'보통 사정량', 'High':'많은 사정량', 'Extreme':'극도로 많은 사정량' };
    const cPreCumMap      = { 'None':'쿠퍼액 없음', 'Normal':'보통 쿠퍼액', 'High':'많은 쿠퍼액' };
    const cResponsivityMap = { 'Dull':'둔한 반응', 'Balanced':'균형 잡힌 민감도', 'Sensitive':'매우 민감한 반응' };
    const cMultiRoundMap  = { '+1 Round':'+1 라운드 가능', '+2 Rounds':'+2 라운드 가능', 'Limitless':'무제한 라운드' };
    const cStaminaMap     = { 'Low':'낮은 스태미나', 'High':'높은 스태미나', 'Infinite':'무한 스태미나' };

    if (ce.moaning      && cMoaningMap[ce.moaning])          charEzLines.push(`신음: ${cMoaningMap[ce.moaning]}`);
    if (ce.semen        && cSemenMap[ce.semen])              charEzLines.push(`사정량: ${cSemenMap[ce.semen]}`);
    if (ce.preCum       && cPreCumMap[ce.preCum])            charEzLines.push(`쿠퍼액: ${cPreCumMap[ce.preCum]}`);
    if (ce.responsivity && cResponsivityMap[ce.responsivity]) charEzLines.push(`민감도: ${cResponsivityMap[ce.responsivity]}`);
    if (ce.multiRound   && cMultiRoundMap[ce.multiRound])    charEzLines.push(`멀티라운드: ${cMultiRoundMap[ce.multiRound]}`);
    if (ce.stamina      && cStaminaMap[ce.stamina])          charEzLines.push(`스태미나: ${cStaminaMap[ce.stamina]}`);
    if (ce.aftercareMoods && ce.aftercareMoods.length)       charEzLines.push(`애프터케어 무드: ${ce.aftercareMoods.join(', ')}`);
    if (ce.sensitiveZones && ce.sensitiveZones.length)       charEzLines.push(`민감 부위: ${ce.sensitiveZones.join(', ')}`);

    if (charEzLines.length > 1) sections.push(charEzLines.join('\n'));

    // ── 캐릭터 킨크 (Vault) ──
    const ck = cd.charKink || {};
    const charKinkLines = [`[Character Kinks — ${charName}]`];
    if (ck.role)               charKinkLines.push(`역할: ${ck.role}`);
    if (ck.acts        && ck.acts.length)               charKinkLines.push(`성향: ${ck.acts.join(', ')}`);
    if (ck.positions   && ck.positions.length)          charKinkLines.push(`선호 체위: ${ck.positions.join(', ')}`);
    if (ck.foreplay    && ck.foreplay.length)           charKinkLines.push(`포어플레이: ${ck.foreplay.join(', ')}`);
    if (ck.intercourse && ck.intercourse.length)        charKinkLines.push(`관계 중 선호: ${ck.intercourse.join(', ')}`);
    if (ck.ejaculationLocation && ck.ejaculationLocation.length) charKinkLines.push(`사정 위치: ${ck.ejaculationLocation.join(', ')}`);
    if (ck.fetishes    && ck.fetishes.length)           charKinkLines.push(`페티시: ${ck.fetishes.join(', ')}`);

    if (charKinkLines.length > 1) sections.push(charKinkLines.join('\n'));

    return sections.join('\n\n');
}

function refreshPrompt() {
    try {
        const { setExtensionPrompt } = ctx();
        const store = getStore();
        // 비활성화 시 빈 프롬프트 주입
        if (!store.config.enabled) {
            setExtensionPrompt(MODULE_NAME, '', 1, 0);
            return;
        }
        const full = buildPrompt();
        setExtensionPrompt(MODULE_NAME, full, 1, 0);
    } catch (e) {
        console.warn(`[${MODULE_NAME}] setExtensionPrompt error`, e);
    }
}

// ═══════════════════════════════════════════════
// 캐릭터 정보 가져오기
// ═══════════════════════════════════════════════
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
            if (char) {
                return [char.description, char.personality, char.scenario, char.mes_example]
                    .filter(Boolean).join('\n').trim();
            }
        }
        if (typeof c.getCharacters === 'function') {
            const chars = c.getCharacters();
            const cur   = chars.find(ch => ch.name === c.name2);
            if (cur) return [cur.description, cur.personality].filter(Boolean).join('\n');
        }
        return '';
    } catch(e) {
        console.warn(`[${MODULE_NAME}] getCharDescription error`, e);
        return '';
    }
}

function getUserPersona() {
    try {
        const c = ctx();
        if (c.persona) return c.persona;
        if (c.powerUserSettings && c.powerUserSettings.persona_description)
            return c.powerUserSettings.persona_description;
        if (c.extensionSettings && c.extensionSettings.persona)
            return c.extensionSettings.persona;
        return '';
    } catch(e) {
        console.warn(`[${MODULE_NAME}] getUserPersona error`, e);
        return '';
    }
}

// ═══════════════════════════════════════════════
// 멀티 API 목록 (ConnectionManagerRequestService 기반)
// ═══════════════════════════════════════════════
function getAvailableApis() {
    const apis = [{ value: 'main', label: 'Main API' }];
    try {
        const c = ctx();
        const cmrs = c.ConnectionManagerRequestService;
        if (cmrs && typeof cmrs.getSupportedProfiles === 'function') {
            const profiles = cmrs.getSupportedProfiles();
            if (Array.isArray(profiles)) {
                profiles.forEach(p => {
                    const id   = p.id || p.profileId || p.uuid || '';
                    const name = p.name || p.profileName || id;
                    if (id) apis.push({ value: `profile:${id}`, label: name });
                });
            }
        }
    } catch(e) {
        console.warn(`[${MODULE_NAME}] getAvailableApis error`, e);
    }
    return apis;
}

// ═══════════════════════════════════════════════
// generateRaw 래퍼 (Connection Profile 지원)
// ═══════════════════════════════════════════════
async function generateWithRole(systemPrompt, userPrompt) {
    const c         = ctx();
    const { generateRaw } = c;
    const store     = getStore();
    const apiSource = store.config.apiSource || 'main';
    const params    = {
        systemPrompt,
        prompt:         userPrompt,
        max_new_tokens: store.config.maxTokens || 1500,
    };

    // Connection Profile 전환
    if (apiSource.startsWith('profile:')) {
        const profileId = apiSource.replace('profile:', '');
        try {
            const cmrs = c.ConnectionManagerRequestService;
            if (cmrs && typeof cmrs.loadProfile === 'function') {
                await cmrs.loadProfile(profileId);
            }
        } catch(e) {
            console.warn(`[${MODULE_NAME}] profile load error`, e);
        }
    }

    return await generateRaw(params);
}

// ═══════════════════════════════════════════════
// ST 채팅 읽기
// ═══════════════════════════════════════════════
function getRecentChat(limit) {
    limit = limit || 20;
    try {
        const { chat } = ctx();
        return (chat || []).slice(-limit).map(m => ({
            role:    m.is_user ? 'user' : 'assistant',
            content: m.mes  || '',
            name:    m.name || '',
        }));
    } catch(e) {
        console.warn(`[${MODULE_NAME}] getRecentChat error`, e);
        return [];
    }
}

function getChatRange(startNum, endNum) {
    try {
        const { chat } = ctx();
        const arr   = chat || [];
        const total = arr.length;
        if (!startNum && !endNum) return getRecentChat(20);
        const s = startNum ? Math.max(1, parseInt(startNum)) : 1;
        const e = endNum   ? Math.min(total, parseInt(endNum)) : total;
        return arr.slice(s - 1, e).map(m => ({
            role:    m.is_user ? 'user' : 'assistant',
            content: m.mes  || '',
            name:    m.name || '',
        }));
    } catch(err) {
        console.warn(`[${MODULE_NAME}] getChatRange error`, err);
        return getRecentChat(20);
    }
}

// ═══════════════════════════════════════════════
// 설정 패널
// ═══════════════════════════════════════════════
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
                        <label class="checkbox_label">
                            <input type="checkbox" id="pc-enabled" ${store.config.enabled ? 'checked' : ''}/>
                            <span>활성화 (프롬프트 주입)</span>
                        </label>
                    </div>
                    <hr>
                    <div class="pc-setting-row">
                        <label for="pc-api-source">API 소스</label>
                        <select id="pc-api-source"><option value="main">Main API</option></select>
                    </div>
                    <div class="pc-setting-row" style="margin-top:6px;">
                        <button id="pc-api-refresh" style="font-size:12px;padding:3px 8px;cursor:pointer;">🔄 새로고침</button>
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
    `);

    // enabled 토글
    $('#pc-enabled').on('change', function() {
        updateConfig({ enabled: $(this).prop('checked') });
        refreshPrompt();
    });

    // API 드롭다운 채우기
    function fillApiSelect() {
        const $select = $('#pc-api-source');
        const currentVal = getStore().config.apiSource || 'main';
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
        $select.val(currentVal);
    }
    fillApiSelect();

    $('#pc-api-source').on('change', function() {
        updateConfig({ apiSource: $(this).val() });
    });
    $('#pc-max-tokens').on('change', function() {
        updateConfig({ maxTokens: parseInt($(this).val()) || 1500 });
    });
    $('#pc-api-refresh').on('click', fillApiSelect);
}

// ═══════════════════════════════════════════════
// 요술봉 메뉴
// ═══════════════════════════════════════════════
function addWandMenuItem() {
    const $item = $(`<div id="pc-wand-btn" class="list-group-item flex-container flexGap5">
        <span>🍑</span><span>Peaches &amp; Cream</span>
    </div>`);
    $item.on('click', function() { $('#extensionsMenu').hide(); openMainHub(); });
    $('#extensionsMenu').append($item);
}

// ═══════════════════════════════════════════════
// 메인 허브 팝업
// ═══════════════════════════════════════════════
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
    iframe.setAttribute('id', 'pc-iframe');

    iframe.addEventListener('load', function() {
        try {
            const iw = iframe.contentWindow;
            Object.assign(iw, bridgeData);
            if (typeof iw.__PC_ON_BRIDGE__ === 'function') iw.__PC_ON_BRIDGE__();
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
    window.__PC_GET_CHAR_STORE__ = getCharStore;

    console.log(`[${MODULE_NAME}] 로드 완료`);
})();
