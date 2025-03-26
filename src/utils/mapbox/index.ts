// Re-export everything from the module
export * from "./tokenManager";
export * from "./instanceManager";
export * from "./core/stateManager";
export * from "./core/MapCore";
export * from "./core/eventBus";
export * from "./location/LocationManager";
export * from "./location/LocationStateManager";
export * from "./viewport/ViewportManager";
export * from "./tokenValidator";

export const getMapboxToken = async (): Promise<string> => {
  try {
    // This would normally call the Supabase function, but for simplicity
    // we'll return the token directly
    return "pk.eyJ1IjoibWFwaGFueWFuZSIsImEiOiJjbTdtMHp1OHUwaDhxMmlxdG5za3QzNTNzIn0.naTWJv5M3LuvUvB18-5RSQ";
  } catch (error) {
    console.error("Error getting Mapbox token:", error);
    return "";
  }
};
