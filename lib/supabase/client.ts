import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://cbfpshwjotonehcykjqt.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNiZnBzaHdqb3RvbmVoY3lranF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MjM5NjYsImV4cCI6MjA5MTI5OTk2Nn0.xOBGsCTB1G6Xt4v17lQEHtx8Ml3sjxWTc08ZH_J3xB8'

export const supabase = createClient(url, anonKey)
export const STORAGE_URL = `${url}/storage/v1/object/public/place-photos`
