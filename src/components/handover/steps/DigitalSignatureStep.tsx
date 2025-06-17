
import { useState, useRef } from "react";
import { PenTool, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/utils/toast-utils";

interface DigitalSignatureStepProps {
  handoverSessionId: string;
  onSignatureComplete: (signature: string) => void;
  initialSignature?: string;
}

export const DigitalSignatureStep = ({
  handoverSessionId,
  onSignatureComplete,
  initialSignature
}: DigitalSignatureStepProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignature);
  const [signatureData, setSignatureData] = useState<string | null>(initialSignature || null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasEvent>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureData(null);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataURL = canvas.toDataURL('image/png');
    setSignatureData(dataURL);
    onSignatureComplete(dataURL);
    toast.success("Digital signature captured successfully");
  };

  // Initialize canvas if there's an initial signature
  useState(() => {
    if (initialSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
      };
      img.src = initialSignature;
    }
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Digital Signature
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Please sign below to acknowledge the handover agreement
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature Canvas */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full h-48 border border-gray-200 rounded cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Sign above using your mouse or finger
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearSignature}
            disabled={!hasSignature}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button
            onClick={saveSignature}
            disabled={!hasSignature}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Confirm Signature
          </Button>
        </div>

        {/* Agreement Text */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm">
          <h4 className="font-medium mb-2">Handover Agreement</h4>
          <p className="text-muted-foreground">
            By signing above, I acknowledge that:
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• I have completed the vehicle inspection process</li>
            <li>• All documented conditions are accurate</li>
            <li>• I understand my responsibilities during the rental period</li>
            <li>• I agree to the terms and conditions of this handover</li>
          </ul>
        </div>

        {signatureData && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm">
              ✅ Digital signature captured and ready for submission
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
