// test/setup-test-env.ts
import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables before anything else
const result = config({ path: join(__dirname, '..', '.env.test') });

if (result.error) {
  console.warn('⚠️  Warning: .env.test file not found, using default .env');
  config();
} else {
  console.log('🧪 Test Environment Loaded from .env.test');
}

// Set NODE_ENV to test if not already set
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

// Log environment info (helpful for debugging)
console.log('📊 Test Configuration:');
console.log(`   - Database: ${process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@')}`);
console.log(`   - MongoDB: ${process.env.MONGODB_URI}`);
console.log(`   - Redis: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
console.log(`   - Port: ${process.env.PORT}`);
console.log(`   - Environment: ${process.env.NODE_ENV}`);
console.log('');