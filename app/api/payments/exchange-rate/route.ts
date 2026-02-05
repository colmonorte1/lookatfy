import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600; // Cache for 1 hour

/**
 * Get exchange rate to convert from source currency to COP
 * Uses exchangerate-api.com (free tier: 1,500 requests/month)
 * Alternative: currencyapi.com, fixer.io, openexchangerates.org
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || 'USD';

    if (from === 'COP') {
      return NextResponse.json({ rate: 1, from: 'COP', to: 'COP' });
    }

    // Option 1: Use exchangerate-api.com (recommended for production)
    // Sign up at https://www.exchangerate-api.com/ for API key
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!apiKey) {
      // Fallback to static rates if no API key
      console.warn('EXCHANGE_RATE_API_KEY not set, using fallback rates');
      const fallbackRates: Record<string, number> = {
        'USD': 4300,
        'EUR': 4700,
      };
      const rate = fallbackRates[from];
      if (!rate) {
        return NextResponse.json({ error: 'Currency not supported' }, { status: 400 });
      }
      return NextResponse.json({
        rate,
        from,
        to: 'COP',
        source: 'fallback',
        warning: 'Using static rate - configure EXCHANGE_RATE_API_KEY for live rates'
      });
    }

    // Fetch live rate
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${from}/COP`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rate');
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error(data['error-type'] || 'Invalid response from exchange API');
    }

    return NextResponse.json({
      rate: data.conversion_rate,
      from,
      to: 'COP',
      source: 'live',
      lastUpdate: data.time_last_update_utc,
      nextUpdate: data.time_next_update_utc,
    });

  } catch (error: any) {
    console.error('Error fetching exchange rate:', error);

    // Return fallback rates on error
    const from = new URL(request.url).searchParams.get('from') || 'USD';
    const fallbackRates: Record<string, number> = {
      'USD': 4300,
      'EUR': 4700,
    };

    return NextResponse.json({
      rate: fallbackRates[from] || 4300,
      from,
      to: 'COP',
      source: 'fallback-error',
      error: error.message,
    }, { status: 200 }); // Still return 200 with fallback
  }
}
