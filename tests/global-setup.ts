import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('🎬 Setting up recording environment...');
  
  // Create recordings directory structure
  const recordingsDir = path.join(process.cwd(), 'recordings');
  const directories = [
    'videos',
    'screenshots', 
    'traces',
    'logs',
    'reports',
    'test-output'
  ];
  
  for (const dir of directories) {
    const fullPath = path.join(recordingsDir, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 Created directory: ${fullPath}`);
    }
  }
  
  // Start browser for recording
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--window-size=1920,1080'
    ]
  });
  
  // Store browser for cleanup
  (global as any).__BROWSER__ = browser;
  
  console.log('✅ Recording environment ready');
}

export default globalSetup;