INSERT INTO public.profiles (id, lembaga_id, role, nama_lengkap, is_active)
SELECT 
    u.id, 
    m.lembaga_id, 
    'SUPER_ADMIN', 
    COALESCE(u.raw_user_meta_data->>'nama_lengkap', 'Super Admin'), 
    true 
FROM auth.users u
LEFT JOIN public.master_lembaga m ON m.nama_lembaga = 'Forum Zakat'
WHERE u.email = 'superadmin@forumzakat.org'
ON CONFLICT (id) DO UPDATE 
SET role = 'SUPER_ADMIN', lembaga_id = EXCLUDED.lembaga_id;
