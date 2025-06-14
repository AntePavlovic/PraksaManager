import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://emnhomcsaeoejmviyyps.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbmhvbWNzYWVvZWptdml5eXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3OTQ0ODEsImV4cCI6MjA2NDM3MDQ4MX0.B0fvn_PfxCuH-hQs26gm1TBS4_lFcwvuzy_bWURe-oo';

export const supabase = createClient(supabaseUrl, supabaseKey);