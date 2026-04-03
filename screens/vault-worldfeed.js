// screens/vault-worldfeed.js — v2.6 World Feed

let feedPosts = [];

export function render() {
  syncStore();
  const cfg = store.fanFeedConfig || {};
  const area = document.getElementById('scroll-area');
  area.innerHTML = `
    <div style="padding:0;background:#fff;">
      <div style="padding:10px 16px;border-bottom:0.5px solid #efefef;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:14px;font-weight:700;color:#0f1419;">🌐 World Feed · ${esc(cfg.group||'세계관')}</span>
        <button style="background:none;border:none;font-size:13px;color:#1d9bf0;cursor:pointer;font-family:inherit;" onclick="ffGenerate()">✦ 새로 불러오기</button>
      </div>
      <div class="loading-card" id="ff-loading" style="display:none;margin:10px 16px;"><div class="sp"></div><span class="loading-text">피드 생성 중...</span></div>
      <div id="ff-feed"></div>
      ${!feedPosts.length ? `<div style="padding:40px 16px;text-align:center;color:#536471;font-size:15px;">✦ 새로 불러오기를 눌러 피드를 생성하세요</div>` : ''}
    </div>
  `;
  if (feedPosts.length) renderFeed(feedPosts);
}

function renderFeed(posts) {
  const feed = document.getElementById('ff-feed');
  if (!feed) return;
  feed.innerHTML = posts.map(p => {
    const isChar = p.isChar;
    const bgStyle = isChar ? 'background:#f0f7ff;' : '';
    const nameStyle = isChar ? 'color:#1d4ed8;' : 'color:#0f1419;';
    const charBadge = isChar ? `<span style="font-size:10px;padding:1px 6px;border-radius:99px;background:#1d4ed8;color:#fff;font-weight:700;margin-left:4px;">CHAR</span>` : '';
    const nsfwBadge = p.nsfw ? `<span style="font-size:10px;padding:1px 5px;border-radius:99px;background:#fee2e2;color:#991b1b;font-weight:700;margin-left:4px;">🔞</span>` : '';
    const borderColor = isChar ? '#bfdbfe' : '#efefef';

    const repliesHTML = (p.replies||[]).map(r => `
      <div style="display:flex;gap:4px;align-items:flex-start;">
        <span style="font-size:13px;font-weight:700;color:#0f1419;">${esc(r.from)}</span>
        <span style="font-size:12px;color:#536471;">${esc(r.handle)}</span>
      </div>
      <div style="font-size:13px;color:#0f1419;margin-bottom:6px;">${sanitize(r.text)}</div>
    `).join('');

    return `
      <div style="padding:12px 16px;border-bottom:0.5px solid #efefef;${bgStyle}">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
          <span style="font-size:14px;font-weight:700;${nameStyle}">${esc(p.from)}</span>
          ${charBadge}${nsfwBadge}
          <span style="font-size:12px;color:#536471;">${esc(p.handle)} · ${esc(p.time||'')}</span>
        </div>
        <div style="font-size:14px;color:#0f1419;line-height:1.5;margin-bottom:8px;">${sanitize(p.text)}</div>
        <div style="display:flex;gap:16px;margin-bottom:${repliesHTML?'8px':'0'};">
          <span style="font-size:12px;color:#536471;">💬 ${p.replyCount||0}</span>
          <span style="font-size:12px;color:#536471;">🔁 ${p.rtCount||0}</span>
          <span style="font-size:12px;color:#536471;">❤️ ${p.likeCount||0}</span>
        </div>
        ${repliesHTML ? `<div style="padding-left:12px;border-left:2px solid ${borderColor};">${repliesHTML}</div>` : ''}
      </div>
    `;
  }).join('');
}

function sanitize(str) {
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.ffGenerate = async function() {
  if (!generateWithRole) { alert('ST와 연결되지 않았어요.'); return; }
  document.getElementById('ff-loading').style.display = 'flex';
  document.getElementById('ff-feed').innerHTML = '';

  try {
    syncStore();
    const cfg     = store.fanFeedConfig || {};
    const history = store.fanFeedHistory || [];
    const excluded = history.length ? `\nDo NOT reuse these ideas: ${history.slice(-15).join(' / ')}` : '';
    const npcs    = cfg.npcs && cfg.npcs.length ? cfg.npcs.slice(0,8).join(', ') : '';

    const sys = `You are generating a World Feed — a fictional SNS timeline for NPCs in ${cfg.group||'this world'}.
Main character (CHAR): ${charName}
${charDesc?`Character: ${charDesc.slice(0,100)}\n`:''}
NPCs who post: ${npcs||'none specified'}
${excluded}

Generate exactly 7 post objects. Return ONLY a JSON array (no markdown).
Sort by likeCount descending (most liked first).
Mix these vibes freely: comic, fight/trolling, nsfw, serious, meme_reaction, flex/brag, reunion/hangout_plan.
Posts feel like real SNS — short, punchy, raw. Max 2 sentences per post.
NPCs argue, troll, brag, plan meetups, react to world events, talk about girls.
${charName} must appear in: 1 original post (isChar:true) + at least 1 reply on someone else's post. Stay in character, post naturally about the world.

Each post object:
- from: NPC name or ${charName}
- handle: @handle
- time: Korean time ago
- text: 1-2 sentences Korean. No female-degrading slurs.
- isChar: boolean (true only for ${charName}'s original post)
- nsfw: boolean
- likeCount: number (vary widely, some posts go viral)
- rtCount: number
- replyCount: number
- replies: array of 3-4 reply objects. Each reply: { from, handle, text }. ${charName} may appear in replies too.`;

    const result = await generateWithRole(sys, '피드 7개 생성해줘', 'worldfeed');
    let posts = [];
    try { posts = JSON.parse(result.replace(/```json|```/g,'').trim()); } catch(e) {}
    if (!Array.isArray(posts)||!posts.length) { alert('생성에 실패했어요.'); document.getElementById('ff-loading').style.display='none'; return; }

    const newHistory = [...history, ...posts.map(p=>p.text.slice(0,30))].slice(-30);
    if (window.parent?.__PC_STORE__) {
      window.parent.__PC_STORE__.fanFeedHistory = newHistory;
      if (saveStore) saveStore();
    }
    feedPosts = [...posts].sort((a,b) => (b.likeCount||0) - (a.likeCount||0));
    renderFeed(feedPosts);
  } catch(err) { console.error('[WorldFeed] error', err); alert('AI 호출 중 오류가 발생했어요.'); }

  document.getElementById('ff-loading').style.display = 'none';
};
