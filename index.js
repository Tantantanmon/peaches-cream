// index.js — Peaches & Cream (safe ST version)
(() => {
  const EXT_NAME = 'peaches-cream';
  const POPUP_ID = 'pc-popup-overlay';
  const WAND_ITEM_ID = 'pc-wand-item';
  const SETTINGS_ID = 'pc-settings';
  const WAND_LABEL = 'Peaches & Cream';

  const CURRENT_SCRIPT_SRC = document.currentScript?.src || '';
  const EXT_BASE = CURRENT_SCRIPT_SRC
    ? CURRENT_SCRIPT_SRC.replace(/\/index\.js(?:\?.*)?$/, '')
    : `scripts/extensions/third-party/${EXT_NAME}`;

  const defaultState = Object.freeze({
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
  });

  function log(...args) {
    console.log('[Peaches & Cream]', ...args);
  }

  function warn(...args) {
    console.warn('[Peaches & Cream]', ...args);
  }

  function getCtx() {
    try {
      if (globalThis.SillyTavern?.getContext) {
        return globalThis.SillyTavern.getContext();
      }
    } catch (err) {
      warn('getContext failed', err);
    }
    return null;
  }

  function deepClone(obj) {
    if (typeof structuredClone === 'function') return structuredClone(obj);
    return JSON.parse(JSON.stringify(obj));
  }

  function mergeDefaults(target, defaults) {
    if (!target || typeof target !== 'object') return deepClone(defaults);
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in target)) {
        target[key] = deepClone(value);
      } else if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        target[key] &&
        typeof target[key] === 'object' &&
        !Array.isArray(target[key])
      ) {
        mergeDefaults(target[key], value);
      }
    }
    return target;
  }

  function getSettingsContainer() {
    const ctx = getCtx();
    if (!ctx) return null;
    if (!ctx.extensionSettings) ctx.extensionSettings = {};
    return ctx.extensionSettings;
  }

  function getStore() {
    const extensionSettings = getSettingsContainer();
    if (!extensionSettings) return deepClone(defaultState);

    if (!extensionSettings[EXT_NAME]) {
      extensionSettings[EXT_NAME] = deepClone(defaultState);
    }

    return mergeDefaults(extensionSettings[EXT_NAME], defaultState);
  }

  function saveStore() {
    try {
      const ctx = getCtx();
      if (ctx?.saveSettingsDebounced) {
        ctx.saveSettingsDebounced();
      }
    } catch (err) {
      warn('saveSettingsDebounced failed', err);
    }
  }

  function updateConfig(configData) {
    const store = getStore();
    store.config = { ...store.config, ...configData };
    saveStore();
  }

  function buildPrompt() {
    const store = getStore();
    const p = store.profile || {};
    const lines = [];

    lines.push('[Peaches & Cream — User Profile]');
    if (p.height || p.weight) lines.push(`신체: 키 ${p.height || '?'}cm, 몸무게 ${p.weight || '?'}kg`);
    if (p.eyeColor) lines.push(`눈 색깔: ${p.eyeColor}`);
    if (p.hair) lines.push(`헤어: ${p.hair}`);
    if (p.skinTone) lines.push(`피부 톤: ${p.skinTone}`);
    if (p.bodyType) lines.push(`체형: ${p.bodyType}`);
    if (p.chest) lines.push(`가슴: ${p.chest}컵`);
    if (p.butt) lines.push(`엉덩이: ${p.butt}`);
    if (p.waistHip) lines.push(`허리-골반: ${p.waistHip}`);
    if (p.skinTexture) lines.push(`피부 질감: ${p.skinTexture}`);
    if (p.bodyHair) lines.push(`체모: ${p.bodyHair}`);
    if (Array.isArray(p.sensitiveParts) && p.sensitiveParts.length) {
      lines.push(`민감 부위: ${p.sensitiveParts.join(', ')}`);
    }
    if (p.bodyScent) lines.push(`체향: ${p.bodyScent}`);
    if (p.moanType) lines.push(`신음 타입: ${p.moanType}`);

    const lastTouch = store.lastTouch || {};
    const cards = Array.isArray(lastTouch.cards) ? lastTouch.cards : [];
    const pinned = Array.isArray(lastTouch.pinned) ? lastTouch.pinned : [];
    const pinnedCards = cards.filter((c) => c && pinned.includes(c.id));

    if (pinnedCards.length) {
      lines.push('', '[Pinned Memories]');
      pinnedCards.forEach((c) => {
        lines.push(`- ${c.title || 'Untitled'} (${c.date || '?'}, ${c.place || '?'}): ${c.mood || ''}`);
      });
    }

    return lines.join('\n');
  }

  function refreshPrompt() {
    try {
      const promptText = buildPrompt();
      const ctx = getCtx();
      const setPrompt = ctx?.setExtensionPrompt || globalThis.setExtensionPrompt;

      if (typeof setPrompt === 'function') {
        setPrompt(EXT_NAME, promptText, 1, 0);
      }
    } catch (err) {
      warn('refreshPrompt failed', err);
    }
  }

  function getRecentChat(limit = 20) {
    try {
      const ctx = getCtx();
      const chat = Array.isArray(ctx?.chat) ? ctx.chat : [];
      return chat.slice(-limit).map((m) => ({
        role: m?.is_user ? 'user' : 'assistant',
        content: m?.mes || '',
        name: m?.name || '',
      }));
    } catch (err) {
      warn('getRecentChat failed', err);
      return [];
    }
  }

  function getCurrentCharName() {
    try {
      const ctx = getCtx();
      return ctx?.name2 || '{{char}}';
    } catch (err) {
      return '{{char}}';
    }
  }

  async function generateWithRole(systemPrompt, userPrompt) {
    const ctx = getCtx();
    const generateRaw = ctx?.generateRaw;

    if (typeof generateRaw !== 'function') {
      throw new Error('generateRaw is not available in this SillyTavern context.');
    }

    const store = getStore();
    return await generateRaw({
      systemPrompt: systemPrompt || '',
      prompt: userPrompt || '',
      maxTokens: Number(store?.config?.maxTokens) || 1500,
    });
  }

  function renderSettingsPanel() {
    const root = $('#extensions_settings');
    if (!root.length || document.getElementById(SETTINGS_ID)) return;

    const store = getStore();

    const html = `
      <div id="${SETTINGS_ID}" style="padding:10px 0;">
        <h4 style="margin-bottom:12px;font-size:14px;font-weight:600;">🍑 Peaches &amp; Cream</h4>
        <div style="margin-bottom:12px;">
          <label style="display:block;font-size:12px;color:#aaa;margin-bottom:4px;">API 소스</label>
          <select id="pc-api-source" style="width:100%;padding:6px 8px;border-radius:6px;border:1px solid #444;background:#2a2a2a;color:#eee;font-size:13px;">
            <option value="main" ${store.config.apiSource === 'main' ? 'selected' : ''}>Main API</option>
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

    root.append(html);

    $('#pc-api-source').on('change', function () {
      updateConfig({ apiSource: $(this).val() });
    });

    $('#pc-max-tokens').on('change', function () {
      updateConfig({ maxTokens: parseInt($(this).val(), 10) || 1500 });
    });
  }

  function openMainHub() {
    if (document.getElementById(POPUP_ID)) return;

    const extUrl = `${EXT_BASE}/main.html`;

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
          background:#111;
        ">
          <iframe
            id="pc-iframe"
            src="${extUrl}"
            style="width:100%;height:100%;border:none;display:block;background:#111;"
          ></iframe>
        </div>
      </div>
    `);

    $overlay.on('click', function (e) {
      if (e.target?.id === POPUP_ID) closeMainHub();
    });

    $('body').append($overlay);

    $overlay.find('#pc-iframe').on('load', function () {
      try {
        const iw = this.contentWindow;
        iw.__PC_STORE__ = getStore();
        iw.__PC_CLOSE__ = closeMainHub;
        iw.__PC_GENERATE__ = generateWithRole;
        iw.__PC_GET_CHAT__ = getRecentChat;
        iw.__PC_CHAR__ = getCurrentCharName();
        iw.__PC_EXT_NAME__ = EXT_NAME;
      } catch (err) {
        warn('iframe bridge failed', err);
      }
    });

    $overlay.find('#pc-iframe').on('error', function (err) {
      warn('iframe failed to load', err);
    });
  }

  function closeMainHub() {
    $(`#${POPUP_ID}`).remove();
    refreshPrompt();
  }

  function addWandMenuItem() {
    const root = $('#options');
    if (!root.length || document.getElementById(WAND_ITEM_ID)) return;

    const $item = $(`
      <div id="${WAND_ITEM_ID}" class="options-content-item" title="${WAND_LABEL}">
        🍑 ${WAND_LABEL}
      </div>
    `);

    $item.on('click', () => {
      $('#options').hide();
      openMainHub();
    });

    root.append($item);
  }

  function bindEvents() {
    try {
      const ctx = getCtx();
      const eventSource = ctx?.eventSource;
      const event_types = ctx?.event_types;

      if (!eventSource || !event_types || typeof eventSource.on !== 'function') {
        warn('eventSource is not ready; skipping event binding');
        return;
      }

      eventSource.on(event_types.APP_READY, () => {
        renderSettingsPanel();
        addWandMenuItem();
        refreshPrompt();
      });

      eventSource.on(event_types.MESSAGE_RECEIVED, refreshPrompt);
      eventSource.on(event_types.CHAT_CHANGED, refreshPrompt);
    } catch (err) {
      warn('bindEvents failed', err);
    }
  }

  function ensureUIUntilReady() {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      renderSettingsPanel();
      addWandMenuItem();

      if (
        (document.getElementById(SETTINGS_ID) && document.getElementById(WAND_ITEM_ID)) ||
        attempts > 40
      ) {
        clearInterval(timer);
      }
    }, 500);
  }

  function boot() {
    try {
      getStore();
      bindEvents();
      ensureUIUntilReady();
      refreshPrompt();

      globalThis.__PC_REFRESH_PROMPT__ = refreshPrompt;
      log('loaded');
    } catch (err) {
      console.error('[Peaches & Cream] boot failed', err);
    }
  }

  if (globalThis.jQuery) {
    jQuery(boot);
  } else {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  }
})();
