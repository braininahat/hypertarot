import { EntropyProvider } from './types';

/**
 * CamRNG - Camera-based Quantum-Physical Random Number Generator
 *
 * Uses thermal noise (Johnson-Nyquist noise) and shot noise from the camera sensor.
 * Both phenomena have quantum mechanical origins:
 * - Shot noise: Poisson statistics of photon arrival times
 * - Thermal noise: Quantum fluctuations in electron movement
 *
 * Inspired by Randonautica's fallback when ANU went down during the 2019 Australian fires.
 */

function bitsToBytes(bits: number[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) {
      byte = (byte << 1) | (bits[i + j] & 1);
    }
    bytes.push(byte);
  }
  return bytes;
}

export const cameraProvider: EntropyProvider = {
  name: 'CamRNG',
  type: 'quantum-physical',

  async getEntropy(count: number): Promise<number[]> {
    // Request camera access
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 64 },
        height: { ideal: 64 },
      },
    });

    try {
      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      await video.play();

      // Wait a moment for sensor noise to accumulate
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      canvas.width = 64;
      canvas.height = 64;

      // Capture frame - ideally with lens covered for pure sensor noise
      // but ambient light variation also provides good entropy
      ctx.drawImage(video, 0, 0, 64, 64);
      const imageData = ctx.getImageData(0, 0, 64, 64);

      // Extract LSBs (Least Significant Bits) from pixel values
      // The LSB is where sensor noise is most prominent
      const bits: number[] = [];
      const bytesNeeded = count * 2; // Extra for safety

      for (let i = 0; i < imageData.data.length && bits.length < bytesNeeded * 8; i++) {
        // Skip alpha channel (every 4th value)
        if (i % 4 !== 3) {
          bits.push(imageData.data[i] & 1);
        }
      }

      // Take additional frames if needed for more entropy
      if (bits.length < bytesNeeded * 8) {
        await new Promise(resolve => setTimeout(resolve, 50));
        ctx.drawImage(video, 0, 0, 64, 64);
        const imageData2 = ctx.getImageData(0, 0, 64, 64);

        for (let i = 0; i < imageData2.data.length && bits.length < bytesNeeded * 8; i++) {
          if (i % 4 !== 3) {
            bits.push(imageData2.data[i] & 1);
          }
        }
      }

      return bitsToBytes(bits);
    } finally {
      // Always stop the camera stream
      stream.getTracks().forEach(track => track.stop());
    }
  },

  async healthCheck(): Promise<boolean> {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices?.getUserMedia) {
        return false;
      }

      // Try to enumerate devices to see if camera exists
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');

      return hasCamera;
    } catch {
      return false;
    }
  },
};
