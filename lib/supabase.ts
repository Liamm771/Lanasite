import { createClient } from '@supabase/supabase-js';

// L'URL de base UNIQUEMENT (sans le /rest/v1/)
const supabaseUrl = "https://ffztwedqqbizezrsorym.supabase.co";

// Ta clé publique
const supabaseKey = "sb_publishable_CKGpGWcIvPQbhHBkCJaQpQ_84_Iswsc"; 

export const supabase = createClient(supabaseUrl, supabaseKey);