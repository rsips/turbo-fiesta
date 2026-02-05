// User Storage Service
// JSON file-based storage for now (database later per roadmap)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, UserPublic, UserRole } from '../types/auth';
import { logger } from '../utils/logger';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../data');
const USERS_FILE = process.env.USER_STORE_PATH || path.join(DATA_DIR, 'users.json');

export class UserStore {
  private users: Map<string, User> = new Map();
  private filePath: string;
  private inMemory: boolean;

  constructor(filePath: string = USERS_FILE) {
    this.inMemory = filePath === ':memory:';
    this.filePath = filePath;
    
    if (!this.inMemory) {
      this.ensureDataDir();
      this.loadFromFile();
    }
  }

  private ensureDataDir(): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info('Created data directory', { dir });
    }
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const users: User[] = JSON.parse(data);
        this.users = new Map(users.map(u => [u.id, u]));
        logger.info('Loaded users from file', { count: this.users.size });
      }
    } catch (error: any) {
      logger.warn('Failed to load users file, starting fresh', { error: error.message });
      this.users = new Map();
    }
  }

  private saveToFile(): void {
    if (this.inMemory) return;
    
    try {
      const users = Array.from(this.users.values());
      fs.writeFileSync(this.filePath, JSON.stringify(users, null, 2));
      logger.debug('Saved users to file', { count: users.length });
    } catch (error: any) {
      logger.error('Failed to save users file', { error: error.message });
      throw new Error('Failed to persist user data');
    }
  }

  /**
   * Create a new user
   */
  async createUser(data: {
    username: string;
    email: string;
    password: string; // Already hashed
    role: UserRole;
  }): Promise<UserPublic> {
    const now = new Date().toISOString();
    
    const user: User = {
      id: crypto.randomUUID(),
      username: data.username.toLowerCase(),
      email: data.email.toLowerCase(),
      password: data.password,
      role: data.role,
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    this.saveToFile();

    logger.info('Created new user', { id: user.id, username: user.username, role: user.role });

    return this.toPublic(user);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    const lowerUsername = username.toLowerCase();
    for (const user of this.users.values()) {
      if (user.username === lowerUsername) {
        return user;
      }
    }
    return null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const lowerEmail = email.toLowerCase();
    for (const user of this.users.values()) {
      if (user.email === lowerEmail) {
        return user;
      }
    }
    return null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  /**
   * List all users (public data only)
   */
  async listUsers(): Promise<UserPublic[]> {
    return Array.from(this.users.values()).map(u => this.toPublic(u));
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<UserPublic | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: User = {
      ...user,
      ...updates,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updated);
    this.saveToFile();

    logger.info('Updated user', { id });

    return this.toPublic(updated);
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const deleted = this.users.delete(id);
    if (deleted) {
      this.saveToFile();
      logger.info('Deleted user', { id });
    }
    return deleted;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Clear all users (for testing)
   */
  async clear(): Promise<void> {
    this.users.clear();
    this.saveToFile();
  }

  /**
   * Convert full user to public user (excludes password)
   */
  private toPublic(user: User): UserPublic {
    const { password, updatedAt, ...publicUser } = user;
    return publicUser;
  }
}

// Singleton instance for the application
export const userStore = new UserStore();
