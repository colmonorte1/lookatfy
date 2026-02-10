import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const getBaseUrl = () => {
  const isProd = process.env.NODE_ENV === 'production'
  return isProd ? 'https://api.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
}

export async function GET() {
  try {
    const isProd = process.env.NODE_ENV === 'production'

    // En sandbox, usar bancos de prueba específicos que funcionan
    if (!isProd) {
      const testBanks = [
        { code: '1', name: 'Banco que aprueba' },
        { code: '2', name: 'Banco que rechaza' },
      ]
      return NextResponse.json({ data: testBanks })
    }

    // En producción, obtener la lista real de Wompi
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
    if (!list.length) list = [{ code: '1022', name: 'BANCO UNION COLOMBIANO' }]
    return NextResponse.json({ data: list })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error obteniendo bancos PSE' }, { status: 400 })
  }
}
