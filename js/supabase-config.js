/**
 * Konfigurasi Supabase untuk HAZANA Dashboard
 * URL dan Key ini aman digunakan di client-side (public anon key)
 */
const SUPABASE_URL = "https://onnkafqpmkhyyinotjsg.supabase.co";
const SUPABASE_KEY = "sb_publishable_6x8RCMnZHkfhZCkT09gMfw_SvsDF2bV";

// Inisialisasi Supabase Client
let supabaseClient;

try {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }
} catch (e) {
    console.error("Gagal inisialisasi Supabase:", e);
}
