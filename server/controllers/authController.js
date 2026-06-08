const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service role key — bypass RLS
);

const JWT_SECRET  = process.env.JWT_SECRET || 'miruapp1';
const JWT_EXPIRES = '30d';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ success: false, message: 'Semua field wajib diisi' });

  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return res.status(400).json({ success: false, message: 'Username hanya huruf, angka, dan underscore' });

  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });

  try {
    // Cek username/email sudah ada
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .maybeSingle();

    if (existing)
      return res.status(409).json({ success: false, message: 'Username atau email sudah digunakan' });

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error } = await supabase
      .from('users')
      .insert({ username, email, password_hash })
      .select('id, username, email, role, avatar_url, created_at')
      .single();

    if (error) throw error;

    const token = makeToken(user);
    return res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, password_hash, role, avatar_url, is_active')
      .eq('email', email)
      .maybeSingle();

    if (error || !user)
      return res.status(401).json({ success: false, message: 'Email atau password salah' });

    // Hanya blokir jika is_active secara eksplisit false (bukan null/undefined)
    if (user.is_active === false)
      return res.status(403).json({ success: false, message: 'Akun tidak aktif' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const { password_hash, ...safeUser } = user;
    const token = makeToken(safeUser);
    return res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  // Stateless JWT — client hapus token sendiri
  return res.json({ success: true, message: 'Logout berhasil' });
};

// PATCH /api/auth/profile
exports.updateProfile = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const { username, email, avatar_url } = req.body;

    const updates = {};
    if (username) updates.username = username;
    if (email)    updates.email    = email;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0)
      return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate' });

    // Cek duplikat username/email
    if (username || email) {
      const orClauses = [];
      if (username) orClauses.push(`username.eq.${username}`);
      if (email)    orClauses.push(`email.eq.${email}`);
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .or(orClauses.join(','))
        .neq('id', payload.id)
        .maybeSingle();
      if (existing)
        return res.status(409).json({ success: false, message: 'Username atau email sudah digunakan' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', payload.id)
      .select('id, username, email, role, avatar_url')
      .single();

    if (error) throw error;
    return res.json({ success: true, user });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password)
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });

    if (new_password.length < 6)
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter' });

    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', payload.id)
      .single();

    if (error || !user)
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Password lama salah' });

    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('users').update({ password_hash }).eq('id', payload.id);

    return res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('id, username, email, role, avatar_url')
      .eq('id', payload.id)
      .single();

    return res.json({ success: true, user });
  } catch {
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

// POST /api/auth/avatar  (multipart/form-data, field: "avatar")
exports.uploadAvatar = async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);

    if (!req.file)
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });

    const ext  = req.file.originalname.split('.').pop().toLowerCase() || 'jpg';
    const path = `avatars/${payload.id}.${ext}`;

    // Upload ke Supabase Storage pakai service role (bypass RLS)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Simpan avatar_url ke tabel users
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', payload.id);

    if (updateError) throw updateError;

    return res.json({ success: true, avatar_url: avatarUrl });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Gagal upload avatar' });
  }
};
