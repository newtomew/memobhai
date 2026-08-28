#!/usr/bin/env node
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

if (!existsSync(envPath)) {
  console.error('Missing .env.local');
  process.exit(1);
}

const raw = readFileSync(envPath, 'utf8');
const vars = {};

for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  let val = trimmed.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (val.includes('YOUR_')) {
    console.warn(`Skipping ${key} (placeholder)`);
    continue;
  }
  vars[key] = val;
}

vars.FRONTEND_URL = 'https://memobhai.vercel.app';
vars.VITE_API_URL = vars.VITE_API_URL || '/api';

const envs = ['production', 'preview', 'development'];

const vercelBin = join(root, 'node_modules', '.bin', 'vercel');

function envType(key) {
  if (key.startsWith('VITE_')) return 'config';
  return 'secret';
}

function run(args) {
  const r = spawnSync(vercelBin, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  return r.status === 0;
}

for (const [key, value] of Object.entries(vars)) {
  const type = envType(key);
  for (const env of envs) {
    run(['env', 'rm', key, env, '--yes']);
    const ok = run(['env', 'add', key, env, '--type', type, '--value', value, '--yes']);
    console.log(ok ? `✓ ${key} (${env})` : `✗ ${key} (${env}) failed`);
  }
}

console.log('Env sync complete.');
