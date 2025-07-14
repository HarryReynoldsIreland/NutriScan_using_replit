export interface BarcodeResult {
  text: string;
  format: string;
}

export class BarcodeScanner {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private scanning = false;
  private onResult: ((result: BarcodeResult) => void) | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
  }

  async startScanning(videoElement: HTMLVideoElement, onResult: (result: BarcodeResult) => void) {
    this.video = videoElement;
    this.onResult = onResult;

    try {
      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      this.video.srcObject = this.stream;
      this.video.play();

      this.scanning = true;
      this.scan();
    } catch (error) {
      console.error('Error accessing camera:', error);
      throw new Error('Unable to access camera. Please check permissions.');
    }
  }

  private async scan() {
    if (!this.scanning || !this.video || !this.canvas || !this.context) return;

    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.context.drawImage(this.video, 0, 0);

      const imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
      
      // Use ZXing library for barcode detection
      try {
        const result = await this.detectBarcode(imageData);
        if (result && this.onResult) {
          this.onResult(result);
          return;
        }
      } catch (error) {
        // Continue scanning if no barcode found
      }
    }

    // Continue scanning
    requestAnimationFrame(() => this.scan());
  }

  private async detectBarcode(imageData: ImageData): Promise<BarcodeResult | null> {
    // Simple barcode detection simulation
    // In a real implementation, you would use ZXing or another barcode library
    
    // For now, we'll simulate barcode detection after a delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate finding a barcode occasionally
        if (Math.random() < 0.1) {
          resolve({
            text: this.generateSampleBarcode(),
            format: 'CODE_128'
          });
        } else {
          resolve(null);
        }
      }, 100);
    });
  }

  private generateSampleBarcode(): string {
    // Generate sample barcodes for testing
    const sampleBarcodes = [
      '3017624010701', // Nutella
      '5449000000996', // Coca-Cola
      '3228857000906', // Evian
      '3017620429484', // Kinder Bueno
      '4902102072935', // Kit Kat
    ];
    return sampleBarcodes[Math.floor(Math.random() * sampleBarcodes.length)];
  }

  stopScanning() {
    this.scanning = false;
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // Check if device supports camera
  static async isSupported(): Promise<boolean> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  }

  // Request camera permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }
}
