import React, { useState, useRef } from "react";
import { PenTool, RotateCcw, Check, Loader2, CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DualPartyStepCard } from "../DualPartyStepCard";

interface SignAndCompleteStepProps {
  hostCompleted: boolean;
  renterCompleted: boolean;
  onComplete: (data: { signature: string }) => void;
  isSubmitting: boolean;
  userRole: "host" | "renter";
}

export const SignAndCompleteStep: React.FC<SignAndCompleteStepProps> = ({
  hostCompleted,
  renterCompleted,
  onComplete,
  isSubmitting,
  userRole,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const isMyPartDone = userRole === "host" ? hostCompleted : renterCompleted;

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;
    onComplete({ signature: canvas.toDataURL("image/png") });
  };

  return (
    <DualPartyStepCard
      title="Sign & Complete"
      description="Both parties must sign to finalize the handover."
      hostCompleted={hostCompleted}
      renterCompleted={renterCompleted}
    >
      {!isMyPartDone ? (
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg bg-background overflow-hidden">
            <canvas
              ref={canvasRef}
              width={350}
              height={180}
              className="w-full h-44 cursor-crosshair touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClear} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button
              onClick={handleSign}
              disabled={!hasSignature || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PenTool className="h-4 w-4 mr-2" />
              )}
              Sign & Complete
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground italic text-center">
            By signing, you confirm the vehicle condition documentation is accurate and you accept the handover.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center py-6 space-y-4">
          <div className="bg-green-100 dark:bg-green-950/30 p-4 rounded-full">
            <PartyPopper className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="font-medium text-green-700 dark:text-green-300">Your signature has been recorded</p>
          <p className="text-sm text-muted-foreground">Waiting for the other party to sign.</p>
        </div>
      )}
    </DualPartyStepCard>
  );
};
