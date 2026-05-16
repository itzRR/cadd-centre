-- Upgrade multiple admins to super_admin AND grant the 11 extra access permissions manually so it shows in the UI badge
DO $$
DECLARE
  v_user_email TEXT;
  v_user_id UUID;
  target_emails TEXT[] := ARRAY['admin@campus.lk', 'admin@caddcentre.lk'];
BEGIN
  FOREACH v_user_email IN ARRAY target_emails
  LOOP
    -- 1. Find the user in Supabase auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
      -- 2. If they logged in previously, they might be stuck in the "students" table. Remove them.
      DELETE FROM public.students WHERE id = v_user_id;

      -- 3. Insert or Update them into the "profiles" table as a super_admin WITH all permissions
      INSERT INTO public.profiles (id, email, full_name, role, is_active, disabled, permissions, task_delete_permission)
      VALUES (
        v_user_id, 
        v_user_email, 
        'Super Admin', 
        'super_admin', 
        true, 
        false,
        '["ims_overview","ims_marketing","ims_academic","ims_finance","ims_hr","ims_users","ims_tasks","ims_roster","ims_control_panel","asms_full","task_delete"]'::jsonb,
        true
      )
      ON CONFLICT (id) DO UPDATE 
      SET role = 'super_admin',
          is_active = true,
          disabled = false,
          permissions = '["ims_overview","ims_marketing","ims_academic","ims_finance","ims_hr","ims_users","ims_tasks","ims_roster","ims_control_panel","asms_full","task_delete"]'::jsonb,
          task_delete_permission = true;

      RAISE NOTICE 'Successfully upgraded % to super_admin', v_user_email;
    ELSE
      RAISE NOTICE 'User % not found in Authentication!', v_user_email;
    END IF;
  END LOOP;
END
$$;
