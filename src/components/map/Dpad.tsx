import {
  Feather,
  FeatherIcon,
  ArrowLeft,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  RotateCcw,
} from "lucide-react";
import React from "react";
import { Button } from "../ui/button";

export type DpadProps = {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onReset?: () => void;
};
export default function Dpad({
  onUp,
  onDown,
  onLeft,
  onRight,
  onReset,
}: DpadProps) {
  return (
    <div className="flex flex-col items-center justify-center absolute bottom-20 right-4 z-10 gap-2">
      <div className="flex gap-1">
        <Button variant="default" onClick={onUp} style={{ height: 40 }}>
          <ArrowUp name="arrow-up" size={24} color="white" />
        </Button>
      </div>
      <div className="flex gap-1">
        <Button variant="default" onClick={onLeft} style={{ width: 20 }}>
          <ArrowLeft name="arrow-left" size={24} color="white" />
        </Button>
        <Button variant="default" onClick={onReset}>
          <RotateCcw name="arrow-left" size={24} color="white" />
        </Button>
        <Button variant="default" onClick={onRight} style={{ width: 20 }}>
          <ArrowRight name="arrow-right" size={24} color="white" />
        </Button>
      </div>
      <div className="flex gap-1">
        <Button variant="default" onClick={onDown} style={{ height: 40 }}>
          <ArrowDown name="arrow-down" size={24} color="white" />
        </Button>
      </div>
    </div>
  );
}
