import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function fixTriggerNoCatch() {
    try {
        console.log("Applying fixed Postgres Trigger WITHOUT exception block...");
        await pool.query(`
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, name, user_role, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'user_role', 'PLAYER'),
    COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'user_role', 'PLAYER')::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    user_role = EXCLUDED.user_role;
  RETURN NEW;
END;
$function$;
        `);
        console.log("Trigger Successfully Replaced.");
    } catch (e) {
        console.error("Patching FAILED:");
        console.error(e);
    }
    process.exit(0);
}
fixTriggerNoCatch();
