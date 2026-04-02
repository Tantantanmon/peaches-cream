// screens/vault-fanfeed.js — v2.6

let feedTweets = [];

export function render() {
  syncStore();
  const cfg = store.fanFeedConfig || {};
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div style="padding:0;background:#fff;">
      <div style="padding:10px 16px;border-bottom:0.5px solid #efefef;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:700;color:#0f1419;">#${esc(charName)} · ${esc(cfg.group||'팬 피드')}</span>
        <button style="background:none;border:none;font-size:13px;color:#1d9bf0;cursor:pointer;font-family:inherit;" onclick="ffGenerate()">✦ 새로 불러오기</button>
      </div>
      <div class="loading-card" id="ff-loading" style="display:none;margin:10px 16px;"><div class="sp"></div><span class="loading-text">피드 생성 중...</span></div>
      <div id="ff-feed"></div>
      ${!feedTweets.length ? `<div style="padding:40px 16px;text-align:center;color:#536471;font-size:15px;">✦ 새로 불러오기를 눌러 피드를 생성하세요</div>` : ''}
    </div>
  `;
  if (feedTweets.length) renderFeed(feedTweets);
}

function renderFeed(tweets) {
  const feed = document.getElementById('ff-feed');
  if (!feed) return;
  feed.innerHTML = tweets.map(t => {
    const isChar = t.isChar;
    return `
      <div class="tweet${isChar?' char-tweet':''}">
        <div class="tw-avatar" style="background:${t.color||'#536471'};">${t.avatar||'?'}</div>
        <div class="tw-body">
          <div class="tw-header">
            <span class="tw-name">${esc(t.name)}</span>
            ${isChar?'<span class="badge-verified">✓</span><span class="badge-char">CHAR</span>':''}
            ${t.nsfw?'<span class="badge-nsfw">🔞</span>':''}
            ${t.thread?'<span class="badge-thread">THREAD</span>':''}
            <span class="tw-dot">·</span>
            <span class="tw-time">${esc(t.time||'')}</span>
          </div>
          <div class="tw-handle">${esc(t.handle||'')}</div>
          <div class="tw-text" style="margin-top:5px;">${esc(t.text).replace(/#(\w+)/g,'<span class="tw-hashtag">#$1</span>').replace(/@([\w가-힣]+)/g,'<span class="tw-mention">@$1</span>')}</div>
          <div class="tw-actions">
            <button class="tw-action">💬 ${t.replyCount||0}</button>
            <button class="tw-action">🔁 ${t.rtCount||0}</button>
            <button class="tw-action">❤️ ${t.likeCount||0}</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

window.ffGenerate = async function() {
  if (!generate) { alert('ST와 연결되지 않았어요.'); return; }
  document.getElementById('ff-loading').style.display = 'flex';
  document.getElementById('ff-feed').innerHTML = '';

  try {
    syncStore();
    const cfg     = store.fanFeedConfig || {};
    const history = store.fanFeedHistory || [];
    const wi      = (()=>{try{return getWorldInfo();}catch(e){return '';}})();
    const excluded= history.length ? `\nDo NOT reuse these tweet ideas: ${history.slice(-14).join(' / ')}` : '';
    const npcs    = cfg.npcs && cfg.npcs.length ? cfg.npcs.join(', ') : '';

    const sys = `You are generating a Twitter/X fan feed for a fictional character named ${charName}.
${charDesc?`Character description:\n${charDesc}\n`:''}
${wi?`World info:\n${wi.slice(0,500)}\n`:''}
Character's group/fandom: ${cfg.group||'unknown'}
Known NPCs/characters in their world: ${npcs||'none specified'}
${excluded}

Generate exactly 10 tweet objects. Return ONLY a JSON array (no markdown).
Mix these types: fan (3), ship/BL (1), char_official (1), anti (1), nsfw_thread (2), rumor_or_user_mention (2).

Each tweet object:
- name: Korean account display name
- handle: @handle
- avatar: single emoji or first letter
- color: hex color for avatar background
- time: Korean time ago (e.g. "3분 전", "1시간 전")
- text: tweet content in Korean. 4 lines. Explicit where appropriate. No female-degrading slurs.
- isChar: boolean (true only for char_official)
- nsfw: boolean
- thread: boolean
- likeCount: number
- rtCount: number
- replyCount: number`;

    const result = await generate(sys, '트윗 10개 생성해줘', 'fanfeed');
    let tweets = [];
    try { tweets = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(tweets)||!tweets.length) { alert('생성에 실패했어요.'); document.getElementById('ff-loading').style.display='none'; return; }

    const newHistory = [...history, ...tweets.map(t=>t.text.slice(0,30))].slice(-28);
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.fanFeedHistory = newHistory;
      if (saveStore) saveStore();
    }
    feedTweets = tweets;
    renderFeed(tweets);
  } catch(err) { console.error('[FanFeed] error', err); alert('AI 호출 중 오류가 발생했어요.'); }

  document.getElementById('ff-loading').style.display = 'none';
};
