const { createClient } = require('@supabase/supabase-js');

// On récupère les clés depuis les variables d'environnement (injectées via Secrets Helm)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Sécurité : on vérifie que les clés sont présentes
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERREUR : Les variables SUPABASE_URL et SUPABASE_KEY sont manquantes !");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;