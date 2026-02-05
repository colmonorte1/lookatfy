import { NextResponse } from 'next/server';

/**
 * Endpoint de prueba para simular un webhook de Wompi
 * Accede a: http://localhost:3000/api/payments/wompi/webhook/test
 */
export async function GET() {
  // Simular el payload de Wompi
  const mockPayload = {
    event: 'transaction.updated',
    data: {
      transaction: {
        id: 'test-12345',
        reference: '25ce63f3-2a99-4413-842e-9c2687e0b786', // Cambia esto por un booking_id real de tu DB
        status: 'APPROVED',
        amount_in_cents: 100000,
        customer_email: 'test@example.com',
        status_message: 'Aprobada',
      },
    },
    timestamp: Date.now(),
    environment: 'test',
  };

  const webhookUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/payments/wompi/webhook`
    : 'http://localhost:3000/api/payments/wompi/webhook';

  try {
    // Simular llamada sin signature (para probar que el webhook rechaza sin firma)
    console.log('Testing webhook WITHOUT signature (should fail)...');
    const responseNoSig = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPayload),
    });

    const resultNoSig = await responseNoSig.json();
    console.log('Response without signature:', resultNoSig);

    // Ahora probar CON signature (necesitarás configurar WOMPI_WEBHOOK_SECRET)
    const secret = process.env.WOMPI_WEBHOOK_SECRET;
    let signatureTest = null;

    if (secret) {
      const crypto = require('crypto');
      const payload = JSON.stringify(mockPayload);
      const checksum = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');

      console.log('\nTesting webhook WITH signature (should succeed)...');
      const responseWithSig = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Event-Checksum': checksum,
        },
        body: payload,
      });

      signatureTest = await responseWithSig.json();
      console.log('Response with signature:', signatureTest);
    }

    return NextResponse.json({
      message: 'Webhook test completed',
      webhookUrl,
      tests: {
        withoutSignature: {
          status: responseNoSig.status,
          result: resultNoSig,
          expected: 'Should fail with "Firma inválida"',
        },
        withSignature: secret
          ? {
              status: 200,
              result: signatureTest,
              expected: 'Should succeed',
            }
          : {
              status: 'skipped',
              reason: 'WOMPI_WEBHOOK_SECRET not configured',
            },
      },
      instructions: [
        '1. Replace "TU_BOOKING_ID_AQUI" with a real booking ID from your database',
        '2. Make sure WOMPI_WEBHOOK_SECRET is configured in .env.local',
        '3. Check the console logs for detailed output',
        '4. Verify that the booking status was updated in the database',
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        webhookUrl,
        suggestion: 'Make sure your dev server is running on the correct port',
      },
      { status: 500 }
    );
  }
}
