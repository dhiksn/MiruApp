/**
 * Shared helpers  struktur data sudah disesuaikan dengan response asli API
 * Key penting:
 *   animeId    slug untuk navigasi
 *   episodeId  slug untuk episode
 *   title, poster, type, score, status, episodes, releasedOn
 */

const API = '';

/*  Navigasi  */
function MiruApp(animeId)   { window.location.href = `/anime/${animeId}`; }
function goEpisode(epId)    { window.location.href = `/episode/${epId}`; }
function goBatch(animeId)   { window.location.href = `/batch/${animeId}`; }
function goGenre(genreId)   { window.location.href = `/genres/${genreId}`; }

/*  Navbar search  */
function initNavSearch() {
  const inp = document.getElementById('navSearch');
  if (!inp) return;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') doNavSearch(); });
}
function doNavSearch() {
  const q = (document.getElementById('navSearch')?.value || '').trim();
  if (!q) return;
  const btn = document.querySelector('.navbar-search button');
  if (btn) {
    btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:2px;margin:0 auto"></div>`;
    btn.disabled = true;
    btn.style.minWidth = '52px';
  }
  window.location.href = `/search?q=${encodeURIComponent(q)}`;
}

/*  Card templates  */
function animeCard(a) {
  const id    = a.animeId || a.slug || '';
  const score = a.score && a.score !== '0' && a.score !== '' ? a.score : null;
  return `
    <div class="anime-card" onclick="MiruApp('${id}')">
      <div class="anime-card-thumb">
        <img src="${a.poster || '/img/placeholder.svg'}" alt="${a.title}" loading="lazy"
             onerror="this.src='/img/placeholder.svg'"/>
        <span class="anime-card-badge">${a.type || 'TV'}</span>
        ${score ? `<span class="anime-card-badge" style="left:auto;right:1rem;background:var(--color-white)">&#11088; ${score}</span>` : ''}
      </div>
      <div class="anime-card-info">
        <div class="anime-card-title">${a.title}</div>
        <div class="anime-card-meta">${a.status || ''}</div>
      </div>
    </div>`;
}

function recentCard(e) {
  const id = e.animeId || e.slug || '';
  const iconPlay    = `<svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,1 11,6 2,11"/></svg>`;
  const iconClock   = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
  return `
    <div class="episode-card" onclick="MiruApp('${id}')">
      <div class="episode-card-thumb">
        <img src="${e.poster || '/img/placeholder.svg'}" alt="${e.title}" loading="lazy"
             onerror="this.src='/img/placeholder.svg'"/>
      </div>
      <div class="episode-card-body">
        <div class="episode-card-title">${e.title}</div>
        <div class="episode-card-ep">${iconPlay} Episode ${e.episodes || '?'}</div>
        <div class="episode-card-meta">${iconClock} ${e.releasedOn || e.releaseDate || '-'}</div>
      </div>
    </div>`;
}

function episodeCard(e) {
  const id = e.episodeId || e.slug || '';
  return `
    <div class="episode-card" onclick="goEpisode('${id}')">
      <div class="episode-card-thumb">
        <img src="${e.poster || '/img/placeholder.svg'}" alt="${e.title}" loading="lazy"
             onerror="this.src='/img/placeholder.svg'"/>
      </div>
      <div class="episode-card-body">
        <div class="episode-card-title">${e.title}</div>
        <div class="episode-card-ep">Episode ${e.episodes || e.episode || '?'}</div>
        <div class="episode-card-meta">${e.releasedOn || e.releaseDate || ''}</div>
      </div>
    </div>`;
}

/*  Pagination  */
async function checkHasNext(baseApiUrl, page, dataExtractor, extraParams = {}) {
  try {
    const url = new URL(baseApiUrl, window.location.origin);
    const params = new URLSearchParams(url.search);
    params.set('page', page + 1);
    
    // Tambahkan parameter tambahan jika ada
    Object.entries(extraParams).forEach(([key, value]) => {
      params.set(key, value);
    });
    
    url.search = params.toString();
    const res = await fetch(url.toString());
    const json = await res.json();
    const list = dataExtractor(json);
    return list.length > 0;
  } catch {
    return false;
  }
}

function renderPagination(containerId, page, hasNext, onPageChange) {
  document.getElementById(containerId).innerHTML = `
    <button class="page-btn" onclick="${onPageChange}(${page - 1})" ${page <= 1 ? 'disabled' : ''}> Prev</button>
    <span class="page-btn active">${page}</span>
    <button class="page-btn" onclick="${onPageChange}(${page + 1})" ${!hasNext ? 'disabled' : ''}>Next </button>`;

  // Update URL tanpa reload
  const url = new URL(window.location.href);
  if (page > 1) {
    url.searchParams.set('page', page);
  } else {
    url.searchParams.delete('page');
  }
  window.history.replaceState(null, '', url.toString());
}

/*  State boxes  */
function loadingHTML() {
  return '<div class="loading-overlay"><div class="spinner"></div><span>Memuat...</span></div>';
}
function emptyHTML(icon = '', msg = 'Tidak ada data') {
  return `<div class="state-box"><div class="icon">${icon}</div><h3>${msg}</h3></div>`;
}
function errorHTML(msg) {
  return `<div class="state-box"><div class="icon"></div><h3>Gagal memuat</h3><p>${msg}</p></div>`;
}









/*  Watch History Management  */
function saveWatchHistory(data) {
  // Simpan ke database jika sudah login
  if (Auth.isLoggedIn()) {
    authFetch('/api/user/history', {
      method: 'POST',
      body: JSON.stringify({
        video_slug:      data.episodeId,
        video_title:     data.episodeTitle || data.animeTitle,
        video_cover_url: data.poster,
        watch_progress:  data.progress || 0,
      }),
    }).catch(err => console.warn('saveWatchHistory failed:', err));
  }
}

/*  Favorites Management  */
async function toggleFavorite(anime) {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login';
    return false;
  }

  const checkRes = await authFetch(`/api/user/favorites/check/${encodeURIComponent(anime.animeId)}`);
  const check    = await checkRes.json();

  if (check.isFavorite) {
    await authFetch(`/api/user/favorites/${encodeURIComponent(anime.animeId)}`, { method: 'DELETE' });
    return false; // removed
  } else {
    await authFetch('/api/user/favorites', {
      method: 'POST',
      body: JSON.stringify({
        video_slug:      anime.animeId,
        video_title:     anime.title,
        video_cover_url: anime.poster,
      }),
    });
    return true; // added
  }
}

async function isFavorite(animeId) {
  if (!Auth.isLoggedIn()) return false;
  try {
    const res  = await authFetch(`/api/user/favorites/check/${encodeURIComponent(animeId)}`);
    const json = await res.json();
    return json.isFavorite || false;
  } catch {
    return false;
  }
}

/*  Watchlist Management (localStorage — belum ada tabel) */
function addToWatchlist(anime, status = 'planning') {
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  const existing  = watchlist.find(w => w.animeId === anime.animeId);
  if (existing) {
    existing.status    = status;
    existing.updatedAt = new Date().toISOString();
  } else {
    watchlist.push({ ...anime, status, addedAt: new Date().toISOString() });
  }
  localStorage.setItem('watchlist', JSON.stringify(watchlist));
}

function removeFromWatchlist(animeId) {
  const watchlist = JSON.parse(localStorage.getItem('watchlist') || '[]');
  localStorage.setItem('watchlist', JSON.stringify(watchlist.filter(w => w.animeId !== animeId)));
}

function isInWatchlist(animeId) {
  return JSON.parse(localStorage.getItem('watchlist') || '[]').find(w => w.animeId === animeId);
}

function updateWatchProgress(episodeId, progress, positionSec, serverId) {
  if (Auth.isLoggedIn()) {
    authFetch('/api/user/history', {
      method: 'POST',
      body: JSON.stringify({
        video_slug:      episodeId,
        video_title:     window._currentVideoTitle || undefined,
        video_cover_url: window._currentVideoCover || undefined,
        watch_progress:  Math.min(100, Math.max(0, progress)),
        last_position:   Math.floor(positionSec || 0),
        last_server_id:  serverId || window._currentServerId || undefined,
      }),
    }).catch(err => console.warn('updateWatchProgress failed:', err));
  }
}
