// screens/vault-fanfeed.js — Fan Feed

const STORY_POOL = [
  {id:'normal',    emoji:'📚', title:'노멀 피플',           genre:'로맨스 드라마'},
  {id:'gonegirl',  emoji:'🔪', title:'나를 찾아줘',          genre:'스릴러 로맨스'},
  {id:'notebook',  emoji:'🌧️', title:'노트북',              genre:'로맨스'},
  {id:'bridgerton',emoji:'🌹', title:'브리저튼',             genre:'시대극 로맨스'},
  {id:'sex_city',  emoji:'👠', title:'섹스 앤 더 시티',       genre:'로맨스 드라마'},
  {id:'365',       emoji:'🔥', title:'365일',               genre:'에로 로맨스'},
  {id:'50shades',  emoji:'⛓️', title:'그레이의 50가지 그림자', genre:'BDSM 로맨스'},
  {id:'romeo',     emoji:'🗡️', title:'로미오와 줄리엣',       genre:'비극 로맨스'},
  {id:'twilight',  emoji:'🌙', title:'트와일라잇',           genre:'판타지 로맨스'},
  {id:'lovact',    emoji:'🎄', title:'러브 액츄얼리',         genre:'로맨스 코미디'},
  {id:'oneday',    emoji:'☀️', title:'원 데이',             genre:'로맨스 드라마'},
  {id:'normal_ppl',emoji:'📖', title:'노멀 피플',           genre:'로맨스 드라마'},
  {id:'before',    emoji:'🚉', title:'비포 선라이즈',         genre:'로맨스'},
  {id:'serendipity',emoji:'🎁',title:'세렌디피티',           genre:'로맨스 코미디'},
  {id:'notting',   emoji:'🎬', title:'노팅힐',              genre:'로맨스 코미디'},
  {id:'cmbyn',     emoji:'🍑', title:'콜 미 바이 유어 네임',   genre:'로맨스 드라마'},
  {id:'cinderella',emoji:'👑', title:'신데렐라',             genre:'동화'},
  {id:'beauty',    emoji:'🌹', title:'미녀와 야수',           genre:'동화'},
  {id:'sleeping',  emoji:'💤', title:'잠자는 숲속의 공주',    genre:'동화'},
  {id:'hp',        emoji:'⚡', title:'해리포터',             genre:'판타지'},
  {id:'hunger',    emoji:'🏹', title:'헝거게임',             genre:'SF 로맨스'},
];

let feedTweets    = [];
let openTweetIdxs = new Set();

export function render() {
  syncStore();
  const cfg = store.fanFeedConfig || {};
  const area = document.getElementById('scroll-area');
  area.style.padding = '0';
  area.style.background = '#fff';

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
  feed.innerHTML = tweets.map((t,i) => {
    const isChar = t.isChar;
    const repliesHtml = (t.replies||[]).map(r=>`
      <div class="reply-item">
        <div class="reply-avatar" style="background:${r.color||'#536471'};">${r.avatar||'?'}</div>
        <div>
          <div style="display:flex;gap:4px;align-items:center;">
            <span class="reply-name">${esc(r.name)}</span>
            <span class="reply-handle">${esc(r.handle)}</span>
          </div>
          <div class="reply-text">${esc(r.text)}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="tweet${isChar?' char-tweet':''}" onclick="ffToggleReplies(${i})">
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
          <div class="tw-text" style="margin-top:5px;">${esc(t.text).replace(/<br>/g,'<br>').replace(/#(\w+)/g,'<span class="tw-hashtag">#$1</span>').replace(/@([\w가-힣]+)/g,'<span class="tw-mention">@$1</span>')}</div>
          <div class="tw-actions">
            <button class="tw-action">💬 ${t.replyCount||0}</button>
            <button class="tw-action">🔁 ${t.rtCount||0}</button>
            <button class="tw-action">❤️ ${t.likeCount||0}</button>
          </div>
        </div>
      </div>
      <div class="tweet-replies${openTweetIdxs.has(i)?' open':''}" id="ff-replies-${i}">
        ${repliesHtml}
      </div>
    `;
  }).join('');
}

window.ffToggleReplies = function(i) {
  if (openTweetIdxs.has(i)) openTweetIdxs.delete(i); else openTweetIdxs.add(i);
  renderFeed(feedTweets);
};

window.ffGenerate = async function() {
  if (!generate) { alert('ST와 연결되지 않았어요.'); return; }
  document.getElementById('ff-loading').style.display = 'flex';
  document.getElementById('ff-feed').innerHTML = '';

  try {
    syncStore();
    const cfg     = store.fanFeedConfig || {};
    const history = store.fanFeedHistory || [];
    const wi      = getWorldInfo();
    const chatText= buildChatText(10);
    const excluded= history.length ? `\nDo NOT reuse these tweet ideas: ${history.slice(-14).join(' / ')}` : '';
    const npcs    = cfg.npcs && cfg.npcs.length ? cfg.npcs.join(', ') : '';

    const sys = `You are generating a Twitter/X fan feed for a fictional character named ${charName}.
${charDesc?`Character description:\n${charDesc}\n`:''}
${wi?`World info:\n${wi}\n`:''}
${chatText?`Recent chat context:\n${chatText}\n`:''}
Character's group/fandom: ${cfg.group||'unknown'}
Known NPCs/characters in their world: ${npcs||'none specified'}
${excluded}

Generate exactly 7 tweet objects. Return ONLY a JSON array (no markdown).
Mix these types: fan (2), ship/BL (1), char_official (1), anti (1), nsfw_thread (1), rumor_or_user_mention (1).

Each tweet object:
- name: Korean account display name
- handle: @handle
- avatar: single emoji or first letter
- color: hex color for avatar background
- time: Korean time ago (e.g. "3분 전", "1시간 전")
- text: tweet content in Korean. 4 lines. Explicit where appropriate. In-character. No female-degrading slurs.
- isChar: boolean (true only for char_official)
- nsfw: boolean
- thread: boolean
- likeCount: number
- rtCount: number
- replyCount: number
- replies: array of 2-3 reply objects {name, handle, avatar, color, text}

For nsfw_thread: start with 🔞 and write explicit content about ${charName}.
For ship/BL: pair ${charName} with a known NPC from world info or a generic name. Explicit shipping.
For char_official: ${charName} posts something short and cryptic. 1-2 lines.
For anti: someone criticizes ${charName}. Gets ratio'd in replies.
For rumor: someone claims to have seen ${charName} with "someone special".`;

    const result = await generate(sys, '트윗 7개 생성해줘');
    let tweets = [];
    try { tweets = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(tweets)||!tweets.length) { alert('생성에 실패했어요.'); document.getElementById('ff-loading').style.display='none'; return; }

    const newHistory = [...history, ...tweets.map(t=>t.text.slice(0,30))].slice(-28);
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.fanFeedHistory = newHistory;
      if (saveStore) saveStore();
    }
    feedTweets = tweets;
    openTweetIdxs.clear();
    renderFeed(tweets);
  } catch(err) { console.error('[FanFeed] error', err); alert('AI 호출 중 오류가 발생했어요.'); }

  document.getElementById('ff-loading').style.display = 'none';
};
