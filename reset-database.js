// Database Reset Script
// Run this script to delete the existing database and start fresh
// Usage: node reset-database.js

const fs = require('fs');
const path = require('path');

const databasePath = path.join(__dirname, 'android/app/src/main/assets/ChatApp.db');

console.log('🔧 Database Reset Tool');
console.log('=====================');

try {
  if (fs.existsSync(databasePath)) {
    fs.unlinkSync(databasePath);
    console.log('✅ Database file deleted successfully!');
    console.log('📱 Next time you run the app, it will create a fresh database with the new schema.');
  } else {
    console.log('ℹ️  No existing database file found.');
    console.log('📱 The app will create a new database when you run it.');
  }
} catch (error) {
  console.error('❌ Error deleting database:', error.message);
  console.log('💡 You can manually delete the database file from:');
  console.log('   android/app/src/main/assets/ChatApp.db');
}

console.log('\n🚀 Ready to run the app with the new schema!'); 