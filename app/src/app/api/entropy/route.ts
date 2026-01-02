import { NextResponse } from 'next/server';

const ANU_API_URL = 'https://qrng.anu.edu.au/API/jsonI.php';

interface ANUResponse {
  type: string;
  length: number;
  data: number[];
  success: boolean;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get('count') || '50'), 1024);

  try {
    const response = await fetch(
      `${ANU_API_URL}?length=${count}&type=uint8`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Cache for a very short time to reduce API load but still get fresh entropy
        next: { revalidate: 0 },
      }
    );

    if (!response.ok) {
      throw new Error(`ANU QRNG responded with status: ${response.status}`);
    }

    const data: ANUResponse = await response.json();

    if (!data.success || !data.data) {
      throw new Error('ANU QRNG returned invalid data');
    }

    return NextResponse.json({
      success: true,
      source: 'ANU QRNG',
      type: 'quantum',
      data: data.data,
    });
  } catch (error) {
    console.error('ANU QRNG error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quantum entropy from ANU',
        fallbackAvailable: true,
      },
      { status: 503 }
    );
  }
}
