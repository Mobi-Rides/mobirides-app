/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    setupFiles: ['<rootDir>/src/__mocks__/jest.setup.ts'],
    moduleNameMapper: {
        '^.*integrations/supabase/client(\\.ts)?$': '<rootDir>/src/__mocks__/supabaseClient.ts',
        '^.*utils/mapbox.*$': '<rootDir>/src/__mocks__/mapboxMock.ts',
        '^.*utils/logger.*$': '<rootDir>/src/__mocks__/loggerMock.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
            diagnostics: {
                warnOnly: true
            },
            tsconfig: {
                esModuleInterop: true,
                jsx: 'react-jsx',
                module: 'ESNext'
            }
        }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
