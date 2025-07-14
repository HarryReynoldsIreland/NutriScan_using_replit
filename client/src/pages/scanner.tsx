import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { MobileHeader } from "@/components/ui/mobile-header";
import { ScannerOverlay } from "@/components/ui/scanner-overlay";
import { BarcodeScanner, type BarcodeResult } from "@/lib/barcode";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Scanner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanner, setScanner] = useState<BarcodeScanner | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCameraSupport();
    
    return () => {
      if (scanner) {
        scanner.stopScanning();
      }
    };
  }, []);

  const checkCameraSupport = async () => {
    const isSupported = await BarcodeScanner.isSupported();
    if (!isSupported) {
      setError("Camera not supported on this device");
      return;
    }
    
    const hasPermission = await BarcodeScanner.requestPermissions();
    setHasPermission(hasPermission);
    
    if (hasPermission) {
      startScanning();
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;
    
    try {
      const barcodeScanner = new BarcodeScanner();
      setScanner(barcodeScanner);
      
      await barcodeScanner.startScanning(videoRef.current, handleBarcodeResult);
      setIsScanning(true);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to start camera");
      toast({
        title: "Camera Error",
        description: error instanceof Error ? error.message : "Failed to start camera",
        variant: "destructive",
      });
    }
  };

  const handleBarcodeResult = (result: BarcodeResult) => {
    if (scanner) {
      scanner.stopScanning();
    }
    
    toast({
      title: "Barcode Detected",
      description: `Found barcode: ${result.text}`,
    });
    
    // Navigate to product detail
    setLocation(`/product/barcode/${result.text}`);
  };

  const handleClose = () => {
    if (scanner) {
      scanner.stopScanning();
    }
    setLocation("/");
  };

  const handleCapture = () => {
    // Manual capture - in a real implementation, this would trigger the scanner
    toast({
      title: "Scanning...",
      description: "Looking for barcodes in the frame",
    });
  };

  const handleToggleFlash = () => {
    // Flash toggle - implementation depends on device capabilities
    toast({
      title: "Flash",
      description: "Flash toggle not available on this device",
    });
  };

  const requestPermissions = async () => {
    const permission = await BarcodeScanner.requestPermissions();
    setHasPermission(permission);
    if (permission) {
      startScanning();
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Scanner" showBackButton onBack={handleClose} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-900">Scanner Error</h1>
              </div>
              <p className="mt-4 text-sm text-gray-600 mb-4">{error}</p>
              <Button onClick={handleClose} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader title="Scanner" showBackButton onBack={handleClose} />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6">
              <div className="flex mb-4 gap-2">
                <Camera className="h-8 w-8 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900">Camera Permission</h1>
              </div>
              <p className="mt-4 text-sm text-gray-600 mb-4">
                Camera access is required to scan barcodes. Please grant permission to continue.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={requestPermissions} className="flex-1">
                  Grant Permission
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      <MobileHeader title="Scanner" showBackButton onBack={handleClose} />
      
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
      
      {/* Scanner overlay */}
      <ScannerOverlay
        onClose={handleClose}
        onCapture={handleCapture}
        onToggleFlash={handleToggleFlash}
      />
    </div>
  );
}
