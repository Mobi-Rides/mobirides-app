
import { createContext } from "react";
import { HandoverStatus } from "@/services/handoverService";

export interface HandoverContextType {
  updateLocation(arg0: {
    latitude: number;
    longitude: number;
    address: string;
  }): unknown;
  handoverStatus: HandoverStatus | null;
  handoverId: string | null;
  isLoading: boolean;
  isHandoverSessionLoading: boolean;
  isHost: boolean;
  bookingDetails: Record<string, unknown> | null;
  debugMode: boolean;
  toggleDebugMode: () => void;
  destination: { latitude: number; longitude: number } | null;
  ownerId: string | null;
  currentUserId: string | null;
}

export const HandoverContext = createContext<HandoverContextType | undefined>(
  undefined
);
