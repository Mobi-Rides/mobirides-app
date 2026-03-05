
import React, { useState, useRef } from "react";
import { PenTool, RotateCcw, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DualPartyStepCard } from "../DualPartyStepCard";
import { toast } from "@/utils/toast-utils";

interface InteractiveSignatureStepProps {
  hostCompleted: boolean;
  renterCompleted: boolean;
  onComplete: (data: { signature: string }) => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const InteractiveSignatureStep: React.FC<InteractiveSignatureStepProps> = ({
  hostCompleted,
  renterCompleted,
  onComplete,
  isSubmitting,
  userRole
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const isMyPartDone = userRole === "host" ? hostCompleted : renterCompleted;

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    const dataURL = canvas.toDataURL('image/png');
    onComplete({ signature: dataURL });
  };

  return (
    <DualPartyStepCard
      title="Digital Signature"
      description="Both parties must sign to finalize the handover agreement."
      hostCompleted={hostCompleted}
      renterCompleted={renterCompleted}
    >
      {!isMyPartDone ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg bg-white overflow-hidden">
            <canvas
              ref={canvasRef}
              width={350}
              height={180}
              className="w-full h-44 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={() => setIsDrawing(false)}
              onMouseLeave={() => setIsDrawing(false)}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={() => setIsDrawing(false)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={handleSave} disabled={!hasSignature || isSubmitting} className="flex-1">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Confirm Signature
            </Button>
          </div>
          
          <div className="bg-muted/50 p-3 rounded text-[10px] text-muted-foreground italic text-center">
            By signing, you agree that the vehicle condition documentation is accurate and you accept the handover terms.
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-green-100 p-4 rounded-full">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <p className="font-medium text-green-800">Your signature has been recorded</p>
          <p className="text-sm text-muted-foreground">Waiting for the other party to sign.</p>
        </div>
      )}
    </DualPartyStepCard>
  );
};
