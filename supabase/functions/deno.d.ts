// Deno type definitions for Supabase Edge Functions
// This file provides TypeScript types for the Deno runtime used by Supabase

/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />
/// <reference lib="esnext" />
/// <reference lib="dom" />

declare global {
    namespace Deno {
        export function serve(
            handler: (request: Request) => Response | Promise<Response>
        ): void;
    }
}

export { };
