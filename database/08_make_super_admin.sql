-- Upgrade admin@campus.lk to super_admin securely
-- This handles the case where the user was created manually in the Supabase Auth UI
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 1. Find the user in Supabase auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@campus.lk' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User admin@campus.lk not found in Authentication!';
  END IF;

  -- 2. If they logged in previously, they might be stuck in the "students" table. Remove them.
  DELETE FROM public.students WHERE id = v_user_id;

  -- 3. Insert or Update them into the "profiles" table as a super_admin
  INSERT INTO public.profiles (id, email, full_name, role, is_active, disabled)
  VALUES (v_user_id, 'admin@campus.lk', 'Super Admin', 'super_admin', true, false)
  ON CONFLICT (id) DO UPDATE 
  SET role = 'super_admin',
      is_active = true,
      disabled = false;

END
$$;
