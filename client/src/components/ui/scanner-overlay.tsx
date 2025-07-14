import { X, Camera, Zap } from "lucide-react";

interface ScannerOverlayProps {
  onClose: () => void;
  onCapture?: () => void;
  onToggleFlash?: () => void;
}

export function ScannerOverlay({ onClose, onCapture, onToggleFlash }: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 bg-black">
      {/* Viewfinder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-80 h-48 border-2 border-white rounded-lg relative">
          {/* Corner markers */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
          
          {/* Scanning line animation */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-primary animate-pulse"></div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-6">
        <button
          onClick={onClose}
          className="bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <button
          onClick={onCapture}
          className="bg-primary text-white p-4 rounded-full hover:bg-green-600 transition-colors"
        >
          <Camera className="h-6 w-6" />
        </button>
        <button
          onClick={onToggleFlash}
          className="bg-gray-800 text-white p-4 rounded-full hover:bg-gray-700 transition-colors"
        >
          <Zap className="h-6 w-6" />
        </button>
      </div>
      
      {/* Instructions */}
      <div className="absolute top-16 left-0 right-0 text-center text-white px-4">
        <p className="text-lg font-medium">Position barcode within the frame</p>
        <p className="text-sm text-gray-300 mt-1">Tap to focus</p>
      </div>
    </div>
  );
}
