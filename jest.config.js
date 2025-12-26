/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/integrations/supabase/client(\\.ts)?$': '<rootDir>/src/__mocks__/supabaseClient.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: true,
            diagnostics: {
                warnOnly: true
            },
            tsconfig: {
                esModuleInterop: true
            }
        }],
    },
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
