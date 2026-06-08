/**
 * auth.js — shared auth utilities
 * Include di setiap halaman yang butuh navbar dengan auth state
 */

const Auth = {
  getToken() { return localStorage.getItem('auth_token'); },
  getUser()  { return JSON.parse(localStorage.getItem('auth_user') || 'null'); },
  isLoggedIn() { return !!this.getToken(); },
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/';
  },
};

let _meFetchPromise = null;

function setAuthUser(nextUser) {
  if (!nextUser) return;
  const current = Auth.getUser() || {};
  const merged = { ...current, ...nextUser };
  if (!merged.avatarUrl && merged.avatar_url) merged.avatarUrl = merged.avatar_url;
  localStorage.setItem('auth_user', JSON.stringify(merged));
}

async function refreshAuthUserFromMe() {
  if (_meFetchPromise) return _meFetchPromise;
  if (!Auth.isLoggedIn()) return null;
  _meFetchPromise = (async () => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          ...(Auth.getToken() ? { Authorization: `Bearer ${Auth.getToken()}` } : {}),
        },
      });
      const json = await res.json().catch(() => null);
      if (json?.success && json.user) {
        setAuthUser(json.user);
        return json.user;
      }
      return null;
    } catch {
      return null;
    } finally {
      _meFetchPromise = null;
    }
  })();
  return _meFetchPromise;
}

function getAvatarHTML(user) {
  if (user?.avatarUrl) {
    return `<img src="${user.avatarUrl}" alt="${user.username}" style="width:100%;height:100%;object-fit:cover;">`;
  }
  if (user?.avatar_url) {
    return `<img src="${user.avatar_url}" alt="${user.username}" style="width:100%;height:100%;object-fit:cover;">`;
  }
  const initial = (user?.username || '?')[0].toUpperCase();
  return initial;
}

/**
 * Render auth button di navbar
 * Panggil setelah DOM ready, pass selector container navbar kanan
 */
function renderAuthNav(containerId = 'navAuth') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const user = Auth.getUser();
  if (Auth.isLoggedIn()) {
    if (!user) {
      refreshAuthUserFromMe().then(() => renderAuthNav(containerId));
      el.innerHTML = `
        <a href="/profile" class="nav-profile-btn" title="Akun">
          <span class="nav-avatar">?</span>
          <span class="nav-username">...</span>
        </a>`;
      return;
    }

    if (!user.avatarUrl && !user.avatar_url) {
      refreshAuthUserFromMe().then(() => renderAuthNav(containerId));
    }

    el.innerHTML = `
      <a href="/profile" class="nav-profile-btn" title="${user.username}">
        <span class="nav-avatar">${getAvatarHTML(user)}</span>
        <span class="nav-username">${user.username}</span>
      </a>`;
    return;
  }

  el.innerHTML = `
    <a href="/login" class="nav-auth-masuk">Masuk</a>
    <a href="/register" class="nav-auth-daftar">Daftar</a>`;
}

/**
 * Helper untuk API call dengan auth token
 */
function authFetch(url, options = {}) {
  const token = Auth.getToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
}
