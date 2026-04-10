export const reverseGeocode = jest.fn().mockResolvedValue('Mock Address');
export const getDirections = jest.fn().mockResolvedValue([]);
export default {
    reverseGeocode,
    getDirections
};
