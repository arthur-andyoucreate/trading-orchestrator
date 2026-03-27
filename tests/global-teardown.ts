import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🎬 Cleaning up recording environment...');
  
  // Close browser if exists
  const browser = (global as any).__BROWSER__;
  if (browser) {
    await browser.close();
    console.log('🔒 Browser closed');
  }
  
  // Log recording summary
  console.log('📊 Recording session completed');
  console.log('📁 Recordings saved to: ./recordings/');
  console.log('🎥 Videos: ./recordings/videos/');
  console.log('📸 Screenshots: ./recordings/screenshots/');
  console.log('📋 Reports: ./recordings/reports/');
  
  console.log('✅ Cleanup completed');
}

export default globalTeardown;