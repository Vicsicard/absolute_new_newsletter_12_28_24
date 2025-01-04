"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = exports.getSupabaseAdmin = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var supabaseAdmin = null;
function getSupabaseAdmin() {
    if (!supabaseAdmin) {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing Supabase environment variables');
        }
        supabaseAdmin = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }
    return supabaseAdmin;
}
exports.getSupabaseAdmin = getSupabaseAdmin;
var _supabaseClient = null;
function getSupabaseClient() {
    if (!_supabaseClient) {
        _supabaseClient = (0, supabase_js_1.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
            },
        });
    }
    return _supabaseClient;
}
exports.getSupabaseClient = getSupabaseClient;
