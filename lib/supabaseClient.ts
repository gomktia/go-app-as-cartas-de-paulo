import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dtpydjllcreeibrrtcna.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_Du4l7tg57DRue_GacJPOvw_tnZgrjAu';

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supplying default Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseKey);