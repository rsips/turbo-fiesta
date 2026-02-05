#!/usr/bin/env ts-node

/**
 * Create Admin User Script
 * Creates a default admin user for Mission Control
 */

import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: string;
  lastLogin?: string;
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const USER_STORE_PATH = path.join(DATA_DIR, 'users.json');
const BCRYPT_ROUNDS = 10;

function generateId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function loadUsers(): Promise<User[]> {
  try {
    if (fs.existsSync(USER_STORE_PATH)) {
      const data = fs.readFileSync(USER_STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return [];
}

async function saveUsers(users: User[]): Promise<void> {
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  fs.writeFileSync(USER_STORE_PATH, JSON.stringify(users, null, 2));
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function promptInput(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createAdmin() {
  console.log('🔐 Mission Control - Admin User Creation\n');

  const users = await loadUsers();

  // Check if admin already exists
  const existingAdmin = users.find(u => u.role === 'admin');
  if (existingAdmin) {
    console.log(`⚠️  Admin user already exists: ${existingAdmin.username}`);
    const overwrite = await promptInput('Create another admin? (yes/no): ');
    if (overwrite.toLowerCase() !== 'yes' && overwrite.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // Get username
  const username = await promptInput('Admin username (default: admin): ') || 'admin';

  // Check if username already exists
  if (users.find(u => u.username === username)) {
    console.error(`❌ User '${username}' already exists!`);
    process.exit(1);
  }

  // Get password
  const password = await promptInput('Admin password (min 8 chars): ');
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters!');
    process.exit(1);
  }

  const confirmPassword = await promptInput('Confirm password: ');
  if (password !== confirmPassword) {
    console.error('❌ Passwords do not match!');
    process.exit(1);
  }

  // Hash password
  console.log('\n⏳ Creating admin user...');
  const hashedPassword = await hashPassword(password);

  // Create user object
  const newAdmin: User = {
    id: generateId(),
    username,
    password: hashedPassword,
    role: 'admin',
    createdAt: new Date().toISOString(),
  };

  // Save user
  users.push(newAdmin);
  await saveUsers(users);

  console.log('\n✅ Admin user created successfully!');
  console.log(`   Username: ${username}`);
  console.log(`   Role: admin`);
  console.log(`   ID: ${newAdmin.id}`);
  console.log('\n🔗 Login at: https://localhost:8080/login');
}

// Run the script
createAdmin().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
