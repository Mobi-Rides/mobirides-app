import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const signupApi = read("api/auth/signup.js");
  const loginApi = read("api/auth/login.js");
  const forgotPasswordApi = read("api/auth/forgot-password.js");
  const legacyResetApi = read("api/auth/reset-password.js");
  const adminResetFn = read("supabase/functions/send-password-reset/index.ts");

  assert(
    signupApi.includes("auth.signUp"),
    "Expected api/auth/signup.js to create credentials through Supabase auth.signUp()."
  );
  assert(
    !signupApi.includes("auth.admin.createUser"),
    "api/auth/signup.js must not bypass Supabase Auth defaults with auth.admin.createUser()."
  );
  assert(
    loginApi.includes("signInWithPassword"),
    "Expected api/auth/login.js to authenticate through Supabase signInWithPassword()."
  );
  assert(
    forgotPasswordApi.includes("auth.admin.generateLink") || forgotPasswordApi.includes("resetPasswordForEmail"),
    "Expected api/auth/forgot-password.js to rely on Supabase recovery APIs."
  );
  assert(
    legacyResetApi.includes("resetPasswordForEmail"),
    "Expected api/auth/reset-password.js to use Supabase resetPasswordForEmail()."
  );
  assert(
    !legacyResetApi.includes("resend-service"),
    "api/auth/reset-password.js should not send a parallel custom password-reset email flow."
  );
  assert(
    adminResetFn.includes("auth.admin.generateLink"),
    "Expected send-password-reset edge function to generate recovery links through Supabase."
  );

  const authFiles = [
    "api/auth/login.js",
    "api/auth/signup.js",
    "api/auth/forgot-password.js",
    "api/auth/reset-password.js",
    "supabase/functions/send-password-reset/index.ts",
  ];

  const directPasswordStorageHits = authFiles.filter((relPath) => {
    const contents = read(relPath);
    return /from\(['"`][^'"`]+['"`]\)\s*\.(?:insert|update|upsert)\([\s\S]{0,400}password\s*:/.test(contents);
  });

  assert(
    directPasswordStorageHits.length === 0,
    `Found direct password persistence outside Supabase Auth in: ${directPasswordStorageHits.join(", ")}`
  );

  console.log("MOB-45 password auth checks passed.");
}

run();
