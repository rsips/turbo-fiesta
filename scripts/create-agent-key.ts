#!/usr/bin/env ts-node
/**
 * CLI tool to create agent API keys
 * Usage: npm run create-agent-key
 */

import * as readline from 'readline';
import { agentKeyStore } from '../src/services/agentKeyStore';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🔐 Agent API Key Generator\n');

  try {
    // Get agent name
    const name = await question('Agent name (e.g., openclaw-agent-1): ');
    if (!name || name.trim().length < 3) {
      console.error('❌ Agent name must be at least 3 characters');
      process.exit(1);
    }

    // Get expiration
    const expiresInDaysStr = await question('Expires in days (default: 365): ');
    const expiresInDays = expiresInDaysStr ? parseInt(expiresInDaysStr, 10) : 365;
    
    if (isNaN(expiresInDays) || expiresInDays < 1 || expiresInDays > 3650) {
      console.error('❌ Expiration must be between 1 and 3650 days');
      process.exit(1);
    }

    // Optional metadata
    const addMetadata = await question('Add metadata? (y/N): ');
    let metadata: Record<string, any> | undefined;
    
    if (addMetadata.toLowerCase() === 'y') {
      const nodeId = await question('  Node ID (optional): ');
      const location = await question('  Location (optional): ');
      const environment = await question('  Environment (optional): ');
      
      metadata = {};
      if (nodeId) metadata.nodeId = nodeId;
      if (location) metadata.location = location;
      if (environment) metadata.environment = environment;
    }

    console.log('\n⏳ Generating API key...\n');

    // Create the key
    const { key, plainKey } = await agentKeyStore.createKey({
      name: name.trim(),
      expiresInDays,
      metadata,
    });

    // Display results
    console.log('✅ Agent API key created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Key Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ID:         ${key.id}`);
    console.log(`  Name:       ${key.name}`);
    console.log(`  Created:    ${key.createdAt.toISOString()}`);
    if (key.expiresAt) {
      console.log(`  Expires:    ${key.expiresAt.toISOString()}`);
    }
    if (key.metadata) {
      console.log(`  Metadata:   ${JSON.stringify(key.metadata, null, 2)}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🔑 API Key (save this now, it won\'t be shown again!):\n');
    console.log(`  ${plainKey}\n`);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next Steps:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  1. Save the API key in a secure location');
    console.log('  2. Configure your agent:');
    console.log(`     export MISSION_CONTROL_API_KEY="${plainKey}"`);
    console.log('  3. Test the connection:');
    console.log('     curl http://localhost:8080/api/health \\');
    console.log(`       -H "X-Agent-Key: ${plainKey}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('⚠️  WARNING: This key will never be displayed again!');
    console.log('    If lost, you must create a new key and revoke this one.\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
