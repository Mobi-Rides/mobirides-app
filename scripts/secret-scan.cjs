#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();

const INCLUDED_ROOTS = [
  'src',
  'supabase/functions',
  'api',
  'scripts',
  '.github/workflows',
  'server.js',
  'vite.config.ts',
  'package.json',
];

const ALLOWED_PATH_SEGMENTS = [
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}dist${path.sep}`,
  `${path.sep}.git${path.sep}`,
  `${path.sep}backup_untracked_20260420${path.sep}`,
  `${path.sep}docs${path.sep}`,
  `${path.sep}_bmad${path.sep}`,
  `${path.sep}data${path.sep}`,
  `${path.sep}checklists${path.sep}`,
  `${path.sep}android${path.sep}`,
  `${path.sep}supabase${path.sep}migrations${path.sep}`,
];

const ALLOWED_FILE_NAMES = new Set([
  'package-lock.json',
  'deno.lock',
  'schema_remote_latest.sql',
  'schema_dump.sql',
  'storage_dump.sql',
  'production_schema_backup.sql',
  'temp_schema.sql',
]);

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.cjs',
  '.mjs',
  '.json',
  '.yml',
  '.yaml',
  '.toml',
  '.env',
  '.md',
  '.txt',
]);

const SECRET_PATTERNS = [
  {
    name: 'Supabase publishable key literal',
    regex: /\bsb_publishable_[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    name: 'Resend API key literal',
    regex: /\bre_[A-Za-z0-9]{20,}\b/g,
  },
  {
    name: 'Bearer token hardcoded in source',
    regex: /Bearer\s+[A-Za-z0-9._-]{20,}/g,
  },
  {
    name: 'Twilio credential assignment',
    regex: /\b(TWILIO_AUTH_TOKEN|TWILIO_ACCOUNT_SID)\s*[:=]\s*['"`][^'"`\n]{8,}['"`]/g,
  },
  {
    name: 'Service role or secret-like key assignment',
    regex: /\b(SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|VAPID_PRIVATE_KEY|PAYU_WEBHOOK_SECRET)\s*[:=]\s*['"`][^'"`\n]{8,}['"`]/g,
  },
];

function shouldSkipPath(filePath) {
  const normalized = path.normalize(filePath);
  return ALLOWED_PATH_SEGMENTS.some((segment) => normalized.includes(segment));
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath)) || path.basename(filePath).startsWith('.');
}

function walk(targetPath, files = []) {
  const absolutePath = path.resolve(ROOT, targetPath);

  if (!fs.existsSync(absolutePath)) {
    return files;
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    if (!shouldSkipPath(absolutePath) && !ALLOWED_FILE_NAMES.has(path.basename(absolutePath)) && isTextFile(absolutePath)) {
      files.push(absolutePath);
    }
    return files;
  }

  for (const entry of fs.readdirSync(absolutePath)) {
    walk(path.join(targetPath, entry), files);
  }

  return files;
}

function getLineNumber(content, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content[i] === '\n') {
      line += 1;
    }
  }
  return line;
}

const files = INCLUDED_ROOTS.flatMap((target) => walk(target));
const findings = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');

  for (const pattern of SECRET_PATTERNS) {
    for (const match of content.matchAll(pattern.regex)) {
      findings.push({
        filePath: path.relative(ROOT, filePath),
        line: getLineNumber(content, match.index ?? 0),
        name: pattern.name,
        sample: match[0].slice(0, 80),
      });
    }
  }
}

if (findings.length > 0) {
  console.error('Potential hardcoded secrets found:');
  for (const finding of findings) {
    console.error(`- ${finding.filePath}:${finding.line} ${finding.name} -> ${finding.sample}`);
  }
  process.exit(1);
}

console.log('Secret scan passed.');
