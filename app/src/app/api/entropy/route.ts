import { NextResponse } from 'next/server';

// Primary: German LfD QRNG (working, no auth required)
const LFD_API_URL = 'https://lfdr.de/qrng_api';

// Backup: ANU QRNG (cert currently expired)
const ANU_API_URL = 'https://qrng.anu.edu.au/API/jsonI.php';

interface ANUResponse {
  type: string;
  length: number;
  data: number[];
  success: boolean;
}

async function fetchLfdEntropy(count: number): Promise<number[]> {
  const results: number[] = [];

  // LfD returns one number per request, so we batch requests
  // Request more than needed to ensure uniqueness
  const promises = Array(count * 2).fill(null).map(async () => {
    const response = await fetch(LFD_API_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`LfD QRNG error: ${response.status}`);
    }

    const data = await response.json();
    // LfD returns a large integer, we take modulo 256 for uint8 equivalent
    return Math.abs(data) % 256;
  });

  const values = await Promise.all(promises);
  return values;
}

async function fetchAnuEntropy(count: number): Promise<number[]> {
  const response = await fetch(
    `${ANU_API_URL}?length=${count}&type=uint8`,
    {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`ANU QRNG responded with status: ${response.status}`);
  }

  const data: ANUResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error('ANU QRNG returned invalid data');
  }

  return data.data;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get('count') || '50'), 100);

  // Try LfD QRNG first (Germany - working)
  try {
    const data = await fetchLfdEntropy(count);
    return NextResponse.json({
      success: true,
      source: 'LfD QRNG',
      type: 'quantum',
      data,
    });
  } catch (error) {
    console.warn('LfD QRNG failed:', error);
  }

  // Try ANU QRNG as backup
  try {
    const data = await fetchAnuEntropy(count);
    return NextResponse.json({
      success: true,
      source: 'ANU QRNG',
      type: 'quantum',
      data,
    });
  } catch (error) {
    console.error('ANU QRNG error:', error);
  }

  // All server-side sources failed
  return NextResponse.json(
    {
      success: false,
      error: 'All quantum entropy sources unavailable',
      fallbackAvailable: true,
    },
    { status: 503 }
  );
}
