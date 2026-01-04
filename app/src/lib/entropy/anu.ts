import { EntropyProvider } from './types';

const ANU_API_URL = 'https://qrng.anu.edu.au/API/jsonI.php';

interface ANUResponse {
  type: string;
  length: number;
  data: number[];
  success: boolean;
}

export const anuProvider: EntropyProvider = {
  name: 'ANU QRNG',
  type: 'quantum',

  async getEntropy(count: number): Promise<number[]> {
    // Request extra values to ensure we get enough unique card indices
    const requestCount = Math.min(count * 2, 1024);

    const response = await fetch(
      `${ANU_API_URL}?length=${requestCount}&type=uint8`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ANU QRNG request failed: ${response.status}`);
    }

    const data: ANUResponse = await response.json();

    if (!data.success || !data.data || data.data.length === 0) {
      throw new Error('ANU QRNG returned invalid data');
    }

    return data.data;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${ANU_API_URL}?length=1&type=uint8`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const data: ANUResponse = await response.json();
      return data.success === true;
    } catch {
      return false;
    }
  },
};
