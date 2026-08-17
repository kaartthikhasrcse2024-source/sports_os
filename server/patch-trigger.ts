import pool from './src/db';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

async function fixTrigger() {
    try {
        console.log("Applying fixed Postgres Trigger...");
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
    COALESCE(NEW.raw_user_meta_data->>'role', NEW.raw_user_meta_data->>'user_role', 'PLAYER')::user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    user_role = EXCLUDED.user_role;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Print the exception to logs but don't trap the user
  RAISE WARNING 'Profile Creation Failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
        `);
        console.log("Trigger Successfully Replaced.");

        console.log("Healing orphaned production user e2adeba0-afff-423a-9369-1edb653ad019");
        await pool.query(`
            INSERT INTO public.profiles (id, full_name, name, user_role, role)
            VALUES (
                'e2adeba0-afff-423a-9369-1edb653ad019',
                'jane',
                'jane',
                'TOURNAMENT_ORGANIZER',
                'TOURNAMENT_ORGANIZER'::user_role
            )
            ON CONFLICT (id) DO NOTHING;
        `);
        console.log("Orphan user healed.");


    } catch (e) {
        console.error("Patching FAILED:");
        console.error(e);
    }
    process.exit(0);
}
fixTrigger();
