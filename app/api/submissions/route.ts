import { NextRequest, NextResponse } from 'next/server'
import { createSubmission } from '@/lib/db/queries'
import { submissionSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as unknown
    const parsed = submissionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
    }

    const submission = await createSubmission(parsed.data)
    return NextResponse.json(submission, { status: 201 })
  } catch (err) {
    console.error('[POST /api/submissions]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
