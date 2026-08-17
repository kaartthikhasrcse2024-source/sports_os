require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

(async () => {
    const { data, error } = await s.auth.signUp({
        email: 'test_player_1@example.com',
        password: 'Password123'
    });
    console.log(error ? error : (data.session ? data.session.access_token : 'No session - requires email verification'));
})();
