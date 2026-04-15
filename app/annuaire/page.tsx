import { redirect } from 'next/navigation'

// /annuaire redirige vers /lieux
export default function AnnuairePage({
  searchParams,
}: {
  searchParams?: Record<string, string>
}) {
  const sp = new URLSearchParams(searchParams ?? {})
  const qs = sp.toString()
  redirect(`/lieux${qs ? `?${qs}` : ''}`)
}
