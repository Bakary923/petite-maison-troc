import { createClient } from '@supabase/supabase-js';

// Récupération sécurisée via le process d'environnement (injecté au build)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_KEY;

// Sécurité : Vérification sans afficher les clés entières
if (!supabaseUrl) {
  console.warn("⚠️ Attention : REACT_APP_SUPABASE_URL n'est pas définie !");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);