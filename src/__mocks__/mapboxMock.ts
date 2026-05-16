export const reverseGeocode = jest.fn().mockResolvedValue('Mock Address');
export const getDirections = jest.fn().mockResolvedValue([]);
export const getMapboxToken = jest.fn().mockResolvedValue('mock-mapbox-token');

export const mapboxTokenManager = {
    getToken: jest.fn().mockResolvedValue('mock-mapbox-token'),
    getTokenState: jest.fn(() => ({ token: 'mock-mapbox-token', valid: true })),
    validateAndSetToken: jest.fn().mockResolvedValue(true),
    getInstanceManager: jest.fn(() => ({
        isReady: jest.fn(() => true),
        getMapboxModule: jest.fn().mockResolvedValue({}),
    })),
};

export const stateManager = {
    getCurrentState: jest.fn(() => 'ready'),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    transition: jest.fn().mockResolvedValue(undefined),
    updateResourceState: jest.fn(),
};

export const eventBus = {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    emit: jest.fn(),
};

export default {
    reverseGeocode,
    getDirections,
    getMapboxToken,
    mapboxTokenManager,
    stateManager,
    eventBus
};
