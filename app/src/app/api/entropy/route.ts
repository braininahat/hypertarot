import { NextResponse } from 'next/server';

// LfD QRNG (ID Quantique hardware)
// API docs: https://lfdr.de/QRNG/
const LFD_API_URL = 'https://lfdr.de/qrng_api/qrng';

interface LfdResponse {
  length: number;
  qrn: string;
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  const cleanHex = hex.replace(/\s/g, '');
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substr(i, 2), 16));
  }
  return bytes;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get('count') || '50'), 1024);

  try {
    const response = await fetch(
      `${LFD_API_URL}?length=${count}&format=HEX`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!response.ok) {
      throw new Error(`LfD QRNG error: ${response.status}`);
    }

    const data: LfdResponse = await response.json();

    if (!data.qrn || data.qrn.length < 2) {
      throw new Error('LfD QRNG returned empty response');
    }

    return NextResponse.json({
      success: true,
      source: 'LfD QRNG',
      type: 'quantum',
      data: hexToBytes(data.qrn),
    });
  } catch (error) {
    console.error('LfD QRNG error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Quantum entropy source unavailable',
      },
      { status: 503 }
    );
  }
}
