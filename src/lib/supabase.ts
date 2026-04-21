import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rbiskypizusqrlrkfzpc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiaXNreXBpenVzcXJscmtmenBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjAxNzMsImV4cCI6MjA5MTkzNjE3M30.VsY0hVK1TOjwd9XLmvm-3okXSKU4SkuGqA8A7f8DSWw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
