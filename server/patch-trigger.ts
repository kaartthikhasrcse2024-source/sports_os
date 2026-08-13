import pool from './src/db';

async function fixTrigger() {
    console.log('Patching schema triggers...');
    const sql = `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
            INSERT INTO public.profiles (id, name, role)
            VALUES (
                new.id, 
                new.raw_user_meta_data->>'full_name', 
                COALESCE((new.raw_user_meta_data->>'role')::user_role, 'player')
            );
            RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    try {
        await pool.query(sql);
        console.log('✅ Trigger fixed up!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}
fixTrigger();
