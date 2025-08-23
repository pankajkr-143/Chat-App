// Clear App Data Script
// This script will clear all app data on Android device/emulator
// Usage: node clear-app-data.js

const { execSync } = require('child_process');

console.log('🧹 Clear App Data Tool');
console.log('=====================');

try {
  console.log('📱 Clearing ChatApp data on Android device/emulator...');
  
  // Clear app data (this will remove the database completely)
  execSync('adb shell pm clear com.capp', { stdio: 'inherit' });
  
  console.log('✅ App data cleared successfully!');
  console.log('📱 The app will start fresh with a new database schema.');
  console.log('🚀 You can now run the app and create new accounts with all features!');
  
} catch (error) {
  console.error('❌ Error clearing app data:', error.message);
  console.log('\n💡 Alternative: Clear app data manually:');
  console.log('   1. Go to Android Settings > Apps > ChatApp');
  console.log('   2. Tap "Storage" > "Clear Data"');
  console.log('   3. Restart the app');
  console.log('\n   Or uninstall and reinstall the app');
}

console.log('\n🎉 Ready for a fresh start!'); 