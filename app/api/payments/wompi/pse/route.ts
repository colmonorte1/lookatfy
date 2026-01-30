import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const getBaseUrl = () => {
  const isProd = process.env.NODE_ENV === 'production'
  return isProd ? 'https://api.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
}

export async function GET() {
  try {
    const url = `${getBaseUrl()}/pse/financial_institutions`
    const privateKey = process.env.WOMPI_PRIVATE_KEY || ''
    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || ''
    const authKey = privateKey || publicKey
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (authKey) headers.Authorization = `Bearer ${authKey}`
    const res = await fetch(url, { cache: 'no-store', headers })
    if (!res.ok) {
      let text = ''
      try { text = await res.text() } catch {}
      return NextResponse.json({ error: text || 'Error obteniendo bancos PSE' }, { status: 400 })
    }
    const data = await res.json()
    let list = Array.isArray(data?.data) ? data.data.map((b: any) => ({ code: String(b?.code || ''), name: String(b?.name || '') })).filter((b: any) => b.code && b.name) : []
    if (!list.length) list = [{ code: 'BANCOLOMBIA', name: 'Bancolombia' }]
    return NextResponse.json({ data: list })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error obteniendo bancos PSE' }, { status: 400 })
  }
}
