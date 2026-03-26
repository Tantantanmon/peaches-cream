// store.js — Peaches & Cream 상태 저장소
// extension_settings['peaches-cream'] 와 연결됨

const STORE_KEY = 'peaches-cream';

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
    skinTone: '',       // 밝음 / 보통 / 어두움
    bodyType: '',       // 슬림 / 보통 / 글래머 / 근육질
    chest: '',          // A / B / C / D / D+
    butt: '',           // 작고 탄탄 / 크고 볼륨 / 보통
    waistHip: '',       // 슬림 / 잘록 / 풍성
    skinTexture: '',    // 부드러운 / 탄탄한 / 보통
    bodyHair: '',       // 있음 / 없음 / 적음
    sensitiveParts: [], // 목, 귀, 허벅지 등
    bodyScent: '',      // 달콤 / 중성 / 머스크 / 없음
    moanType: '',       // 참는 편 / 소리 내는 편 / 거의 없음
  },
  lastTouch: {
    cards: [],   // 최대 5개 { id, title, date, place, mood, positions, charReview, genitalComment, genitalCommentKo, condom, pinned }
    pinned: [],  // 핀된 카드 id 목록
  },
};

function getStore() {
  if (!extension_settings[STORE_KEY]) {
    extension_settings[STORE_KEY] = JSON.parse(JSON.stringify(defaultState));
  }
  // 누락된 키 보완 (버전 업 대비)
  const s = extension_settings[STORE_KEY];
  if (!s.config)    s.config    = { ...defaultState.config };
  if (!s.profile)   s.profile   = { ...defaultState.profile };
  if (!s.lastTouch) s.lastTouch = { cards: [], pinned: [] };
  return s;
}

function saveStore() {
  saveSettingsDebounced();
}

function updateProfile(profileData) {
  const s = getStore();
  s.profile = { ...s.profile, ...profileData };
  saveStore();
}

function updateConfig(configData) {
  const s = getStore();
  s.config = { ...s.config, ...configData };
  saveStore();
}

// Last Touch 카드 저장 (최대 5개, 핀된 건 제외하고 오래된 것부터 삭제)
function saveLastTouchCards(newCards) {
  const s = getStore();
  const pinned = s.lastTouch.pinned;

  // 핀된 카드 유지
  const pinnedCards = s.lastTouch.cards.filter(c => pinned.includes(c.id));
  // 새 카드 + 핀된 카드 합치기, 최대 5개
  const merged = [...newCards, ...pinnedCards];
  s.lastTouch.cards = merged.slice(0, 5);
  saveStore();
}

function addLastTouchCard(card) {
  const s = getStore();
  const pinned = s.lastTouch.pinned;
  const pinnedCards = s.lastTouch.cards.filter(c => pinned.includes(c.id));
  const unpinnedCards = s.lastTouch.cards.filter(c => !pinned.includes(c.id));

  // 새 카드를 앞에 추가, 핀 제외 카드 최대 (5 - pinnedCards.length) 개 유지
  const maxUnpinned = 5 - pinnedCards.length;
  const newUnpinned = [card, ...unpinnedCards].slice(0, maxUnpinned);
  s.lastTouch.cards = [...pinnedCards, ...newUnpinned];
  saveStore();
}

function deleteLastTouchCard(id) {
  const s = getStore();
  s.lastTouch.cards = s.lastTouch.cards.filter(c => c.id !== id);
  s.lastTouch.pinned = s.lastTouch.pinned.filter(pid => pid !== id);
  saveStore();
}

function togglePin(id) {
  const s = getStore();
  if (s.lastTouch.pinned.includes(id)) {
    s.lastTouch.pinned = s.lastTouch.pinned.filter(pid => pid !== id);
  } else {
    s.lastTouch.pinned.push(id);
  }
  saveStore();
}

// 프롬프트용 텍스트 생성
function buildPrompt() {
  const s = getStore();
  const p = s.profile;
  const lines = [];

  lines.push('[Peaches & Cream — User Profile]');

  if (p.height || p.weight) {
    lines.push(`신체: 키 ${p.height || '?'}cm, 몸무게 ${p.weight || '?'}kg`);
  }
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

  // 핀된 Last Touch 카드
  const pinnedCards = s.lastTouch.cards.filter(c => s.lastTouch.pinned.includes(c.id));
  if (pinnedCards.length) {
    lines.push('\n[Pinned Memories]');
    pinnedCards.forEach(c => {
      lines.push(`- ${c.title} (${c.date}, ${c.place || '?'}): ${c.mood || ''}`);
    });
  }

  return lines.join('\n');
}

// Clinic용 컨텍스트 태그 생성
function buildClinicContext() {
  const s = getStore();
  const tags = [];

  // Last Touch 최근 카드에서 추출
  const recent = s.lastTouch.cards[0];
  if (recent) {
    if (recent.condom === false || recent.condom === 'NO CONDOM') {
      tags.push({ label: '콘돔 미사용 (최근)', type: 'w' });
    }
    if (recent.positions && recent.positions.length) {
      recent.positions.forEach(pos => tags.push({ label: pos, type: 'w' }));
    }
    if (recent.date) {
      tags.push({ label: `${recent.date} 관계`, type: 'n' });
    }
  }

  // Profile에서 추출
  const p = s.profile;
  if (p.chest)     tags.push({ label: `${p.chest}컵`, type: 'n' });
  if (p.bodyHair === '없음') tags.push({ label: '제모 완료', type: 'g' });

  return tags;
}

export {
  getStore,
  saveStore,
  updateProfile,
  updateConfig,
  saveLastTouchCards,
  addLastTouchCard,
  deleteLastTouchCard,
  togglePin,
  buildPrompt,
  buildClinicContext,
};
