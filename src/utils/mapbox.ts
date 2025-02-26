
export { 
  MapboxTokenManager,
  mapboxTokenManager,
  getMapboxToken,
  TokenValidator,
  MapboxInstanceManager
} from './mapbox/index';

export type { TokenState, ValidationResult } from './mapbox/types';

export const getMapboxToken = async () => {
  try {
    console.log('Invoking get-mapbox-token function...');
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    
    if (error) {
      console.error('Error fetching Mapbox token:', error);
      throw error;
    }
    
    if (!data?.token) {
      console.warn('No Mapbox token found in response');
      return null;
    }
    
    console.log('Successfully retrieved Mapbox token');
    return data.token;
  } catch (error) {
    console.error('Error in getMapboxToken:', error);
    throw error;
  }
};
