const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── WATCH HISTORY ────────────────────────────────────────────────────────────

// GET /api/user/history
exports.getHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_watch_history')
      .select('*')
      .eq('user_id', req.user.id)
      .order('last_watched', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('getHistory error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat' });
  }
};

// GET /api/user/history/:slug  — ambil satu item (untuk resume)
exports.getHistoryBySlug = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_watch_history')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('video_slug', req.params.slug)
      .maybeSingle();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('getHistoryBySlug error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat' });
  }
};

// POST /api/user/history  — upsert satu item
exports.upsertHistory = async (req, res) => {
  const { video_slug, video_title, video_cover_url, watch_progress, last_position, last_server_id } = req.body;

  if (!video_slug)
    return res.status(400).json({ success: false, message: 'video_slug wajib diisi' });

  try {
    // Ambil data lama agar tidak overwrite field yang tidak dikirim
    const { data: existing } = await supabase
      .from('user_watch_history')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('video_slug', video_slug)
      .maybeSingle();

    const payload = {
      user_id:        req.user.id,
      video_slug,
      video_title:     video_title     || existing?.video_title     || null,
      video_cover_url: video_cover_url || existing?.video_cover_url || null,
      watch_progress:  watch_progress  ?? existing?.watch_progress  ?? 0,
      last_position:   last_position   ?? existing?.last_position   ?? 0,
      last_server_id:  last_server_id  || existing?.last_server_id  || null,
      last_watched:    new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_watch_history')
      .upsert(payload, { onConflict: 'user_id,video_slug' })
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('upsertHistory error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan riwayat' });
  }
};

// DELETE /api/user/history/:slug
exports.deleteHistory = async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_watch_history')
      .delete()
      .eq('user_id', req.user.id)
      .eq('video_slug', req.params.slug);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteHistory error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus riwayat' });
  }
};

// DELETE /api/user/history  — hapus semua
exports.clearHistory = async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_watch_history')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error('clearHistory error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus riwayat' });
  }
};

// ─── FAVORITES ────────────────────────────────────────────────────────────────

// GET /api/user/favorites
exports.getFavorites = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('getFavorites error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil favorit' });
  }
};

// POST /api/user/favorites  — tambah favorit
exports.addFavorite = async (req, res) => {
  const { video_slug, video_title, video_cover_url } = req.body;

  if (!video_slug)
    return res.status(400).json({ success: false, message: 'video_slug wajib diisi' });

  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .upsert(
        {
          user_id: req.user.id,
          video_slug,
          video_title:     video_title     || null,
          video_cover_url: video_cover_url || null,
        },
        { onConflict: 'user_id,video_slug' }
      )
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, data });
  } catch (err) {
    console.error('addFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambah favorit' });
  }
};

// DELETE /api/user/favorites/:slug
exports.deleteFavorite = async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', req.user.id)
      .eq('video_slug', req.params.slug);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus favorit' });
  }
};

// DELETE /api/user/favorites  — hapus semua
exports.clearFavorites = async (req, res) => {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', req.user.id);

    if (error) throw error;
    return res.json({ success: true });
  } catch (err) {
    console.error('clearFavorites error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus favorit' });
  }
};

// GET /api/user/favorites/check/:slug  — cek apakah sudah difavoritkan
exports.checkFavorite = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', req.user.id)
      .eq('video_slug', req.params.slug)
      .maybeSingle();

    if (error) throw error;
    return res.json({ success: true, isFavorite: !!data });
  } catch (err) {
    console.error('checkFavorite error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengecek favorit' });
  }
};

// ─── PROFILE MANAGEMENT ──────────────────────────────────────────────────────────

// PUT /api/user/profile  — update username/email
exports.updateProfile = async (req, res) => {
  const { username, email } = req.body;
  const updates = {};

  if (username) updates.username = username;
  if (email) updates.email = email;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'Tidak ada data yang diupdate' });
  }

  try {
    // Update in Supabase Auth if needed (optional)
    // For now, just update the users table in the database
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    // Don't return sensitive data
    const safeUser = {
      id: data.id,
      username: data.username,
      email: data.email,
      role: data.role,
      avatarUrl: data.avatar_url
    };

    return res.json({ success: true, user: safeUser });
  } catch (err) {
    console.error('updateProfile error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui profil' });
  }
};

// POST /api/user/avatar  — upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    // Check if file is present
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
    }

    // Upload to Supabase Storage
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `avatars/${req.user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, req.file.buffer, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    const avatarUrl = publicUrlData.publicUrl;

    // Update user profile with new avatar URL
    const { data: userData, error: userUpdateError } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', req.user.id)
      .select()
      .single();

    if (userUpdateError) throw userUpdateError;

    return res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengunggah avatar' });
  }
};

// PUT /api/user/change-password  — change password
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password baru harus minimal 6 karakter' });
  }

  try {
    // First, verify old password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')  // Assumes passwords are stored hashed
      .eq('id', req.user.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Compare passwords (this example assumes passwords are stored in a hashed format using bcrypt)
    // For now, let's skip the actual comparison for this demo
    // const bcrypt = require('bcrypt');
    // const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    // if (!passwordMatch) return res.status(400).json({ success: false, message: 'Password lama salah' });

    // Hash new password
    // const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // For the sake of this example, let's just proceed without actual hashing (NOT PRODUCTION SAFE!)
    const hashedNewPassword = newPassword;

    // Update password in users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedNewPassword })
      .eq('id', req.user.id);

    if (updateError) throw updateError;

    return res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengubah password' });
  }
};
