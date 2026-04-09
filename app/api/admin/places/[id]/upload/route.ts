import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import pool from '@/lib/db/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Only images allowed' }, { status: 400 })

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `places/${id}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('place-photos')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage
      .from('place-photos')
      .getPublicUrl(path)

    await pool.query('UPDATE places SET cover_image_url = $1 WHERE id = $2', [publicUrl, id])

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Upload error' }, { status: 500 })
  }
}
