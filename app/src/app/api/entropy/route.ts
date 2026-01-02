import { NextResponse } from 'next/server';

// Primary: German LfD QRNG (ID Quantique hardware)
// API docs: https://lfdr.de/QRNG/
const LFD_API_URL = 'https://lfdr.de/qrng_api';

// Backup: ANU QRNG (cert currently expired as of Jan 2026)
const ANU_API_URL = 'https://qrng.anu.edu.au/API/jsonI.php';

interface ANUResponse {
  type: string;
  length: number;
  data: number[];
  success: boolean;
}

function hexToBytes(hex: string): number[] {
  const bytes: number[] = [];
  // Remove any whitespace and process hex pairs
  const cleanHex = hex.replace(/\s/g, '');
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes.push(parseInt(cleanHex.substr(i, 2), 16));
  }
  return bytes;
}

async function fetchLfdEntropy(count: number): Promise<number[]> {
  // Request bytes in HEX format - each byte is 2 hex chars
  const response = await fetch(
    `${LFD_API_URL}?length=${count}&format=HEX`,
    {
      method: 'GET',
      headers: { 'Accept': 'text/plain' },
    }
  );

  if (!response.ok) {
    throw new Error(`LfD QRNG error: ${response.status}`);
  }

  const hexString = await response.text();

  if (!hexString || hexString.length < 2) {
    throw new Error('LfD QRNG returned empty response');
  }

  return hexToBytes(hexString);
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
  const count = Math.min(parseInt(searchParams.get('count') || '50'), 1024);

  // Try LfD QRNG first (Germany - working, uses ID Quantique hardware)
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

  // All server-side sources failed - client should try CamRNG
  return NextResponse.json(
    {
      success: false,
      error: 'All quantum entropy sources unavailable',
      fallbackAvailable: true,
    },
    { status: 503 }
  );
}
