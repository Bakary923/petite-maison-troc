const { createClient } = require('@supabase/supabase-js');

// On récupère les clés
// Pendant les tests, on met des valeurs par défaut pour éviter que Jest ne plante
const supabaseUrl = process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'placeholder-key';

// On affiche un warning si on est en production et que c'est vide
if (!process.env.SUPABASE_URL && process.env.NODE_ENV === 'production') {
  console.error("❌ ERREUR : SUPABASE_URL est manquante !");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;