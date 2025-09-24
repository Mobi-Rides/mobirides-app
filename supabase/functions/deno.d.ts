// Deno global type definitions for Supabase Edge Functions

declare namespace Deno {
  export namespace env {
    export function get(key: string): string | undefined;
  }

  export interface Addr {
    transport: string;
    hostname: string;
    port: number;
  }

  export interface ListenOptions {
    port?: number;
    hostname?: string;
    transport?: "tcp";
  }

  export interface Listener {
    addr: Addr;
    rid: number;
    [Symbol.asyncIterator](): AsyncIterableIterator<Conn>;
  }

  export interface Conn {
    rid: number;
    remoteAddr: Addr;
    localAddr: Addr;
  }

  export interface HttpConn {
    rid: number;
  }

  export namespace errors {
    export class Http extends Error {
      constructor(message: string);
    }
  }

  export function listen(options: ListenOptions): Listener;
}

// Module declarations for Deno standard library
declare module "https://deno.land/std@0.190.0/http/server.ts" {
  export interface ConnInfo {
    readonly localAddr: Deno.Addr;
    readonly remoteAddr: Deno.Addr;
  }

  export type Handler = (
    request: Request,
    connInfo: ConnInfo,
  ) => Response | Promise<Response>;

  export function serve(handler: Handler): Promise<void>;
}

// Module declarations for Supabase
declare module "https://esm.sh/@supabase/supabase-js@2.47.10" {
  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    realtime?: {
      params?: Record<string, string>;
    };
    global?: {
      headers?: Record<string, string>;
    };
    db?: {
      schema?: string;
    };
  }

  export interface User {
    id: string;
    email?: string;
    raw_user_meta_data?: Record<string, unknown>;
  }

  export interface PostgrestError {
    message: string;
    details: string;
    hint: string;
    code: string;
  }

  export interface SupabaseClient {
    auth: {
      getUser(): Promise<{ data: { user: User | null } | null; error: PostgrestError | null }>;
      signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: unknown; error: PostgrestError | null }>;
      signOut(): Promise<{ error: PostgrestError | null }>;
      admin: {
        listUsers(): Promise<{ data: { users: User[] }; error: PostgrestError | null }>;
      };
    };
    from(table: string): {
      select(columns?: string): {
        eq(column: string, value: unknown): Promise<{ data: unknown[] | null; error: PostgrestError | null }> & {
          single<T>(): Promise<{ data: T | null; error: PostgrestError | null }>;
        };
        insert(values: Record<string, unknown>): Promise<{ data: unknown[] | null; error: PostgrestError | null }>;
        update(values: Record<string, unknown>): Promise<{ data: unknown[] | null; error: PostgrestError | null }>;
        delete(): Promise<{ data: unknown[] | null; error: PostgrestError | null }>;
      };
      upsert(values: Record<string, unknown>): Promise<{ data: unknown[] | null; error: PostgrestError | null }>;
    };
  }

  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient;
}