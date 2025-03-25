
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

// Cache to prevent multiple unnecessary token fetches
let cachedToken: string | null = null;

export const getMapboxToken = async (): Promise<string> => {
  try {
    // Return cached token if available
    if (cachedToken) {
      console.log("Using cached Mapbox token");
      return cachedToken;
    }

    console.log("Fetching new Mapbox token");
    
    // This is our hardcoded token for development - in production this would come from a secure source
    const token = "pk.eyJ1IjoibWFwaGFueWFuZSIsImEiOiJjbTdtMHp1OHUwaDhxMmlxdG5za3QzNTNzIn0.naTWJv5M3LuvUvB18-5RSQ";
    
    if (!token) {
      throw new Error("No Mapbox token available");
    }
    
    // Set the token in the global context if mapboxgl is available
    if (window.mapboxgl) {
      window.mapboxgl.accessToken = token;
    }
    
    // Cache the token
    cachedToken = token;
    
    console.log("Mapbox token retrieved successfully");
    return token;
  } catch (error) {
    console.error("Error getting Mapbox token:", error);
    return "";
  }
};
