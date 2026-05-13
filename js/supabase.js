import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Replace these with your Supabase project values.
const SUPABASE_URL = "https://bajikgxhyryugzcfcsue.supabase.co"
const SUPABASE_ANON_KEY = "sb_publishable_frhyfFDKrE6zsN_vv3LlQA_kU4wejDM"

export const supabaseReady =
  SUPABASE_URL && SUPABASE_ANON_KEY &&
  SUPABASE_URL !== "YOUR_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY";

export const supabase = supabaseReady
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
