const { createClient } = require('@supabase/supabase-js');

// Récupération des variables d'environnement
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Vérification minimale en production
if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERREUR : Variables Supabase manquantes !");
  }
}

// Création du client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
