#!/usr/bin/env node
/**
 * generate-secrets.js — Gera segredos criptograficamente seguros
 */

const crypto = require('crypto');

const arg = process.argv[2] || '';

const MCP_TOKEN            = crypto.randomBytes(48).toString('hex');
const BRIDGE_SECRET        = crypto.randomBytes(32).toString('hex');
const CODE_SERVER_PASSWORD = crypto.randomBytes(12).toString('base64url');

switch (arg) {
  case '--token':
    process.stdout.write(MCP_TOKEN);
    break;
  case '--bridge':
    process.stdout.write(BRIDGE_SECRET);
    break;
  case '--pass':
    process.stdout.write(CODE_SERVER_PASSWORD);
    break;
  case '--env':
    console.log(`MCP_TOKEN=${MCP_TOKEN}`);
    console.log(`BRIDGE_SECRET=${BRIDGE_SECRET}`);
    console.log(`CODE_SERVER_PASSWORD=${CODE_SERVER_PASSWORD}`);
    break;
  default:
    console.log('MCP_TOKEN:', MCP_TOKEN);
    console.log('BRIDGE_SECRET:', BRIDGE_SECRET);
    console.log('CODE_SERVER_PASSWORD:', CODE_SERVER_PASSWORD);
    console.log('\nURL: https://SEU_DOMINIO/mcp/' + MCP_TOKEN);
    break;
}
