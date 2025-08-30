const SQLite = require('react-native-sqlite-storage');

// Enable debugging
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const database_name = "ChatApp.db";
const database_version = "1.0";
const database_displayname = "ChatApp SQLite Database";
const database_size = 200000;

let db;

const initDB = () => {
  return new Promise((resolve, reject) => {
    SQLite.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size
    )
    .then(DB => {
      db = DB;
      console.log('Database initialized successfully');
      resolve(db);
    })
    .catch(error => {
      console.log('Error opening database:', error);
      reject(error);
    });
  });
};

const createTables = async () => {
  try {
    // Users table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profilePicture TEXT,
        isOnline BOOLEAN DEFAULT 0,
        lastSeen TEXT DEFAULT CURRENT_TIMESTAMP,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Messages table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        senderId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        isRead BOOLEAN DEFAULT 0,
        FOREIGN KEY (senderId) REFERENCES users (id),
        FOREIGN KEY (receiverId) REFERENCES users (id)
      )
    `);

    // Friend requests table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fromUserId INTEGER NOT NULL,
        toUserId INTEGER NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fromUserId) REFERENCES users (id),
        FOREIGN KEY (toUserId) REFERENCES users (id),
        UNIQUE(fromUserId, toUserId)
      )
    `);

    // Friendships table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId1 INTEGER NOT NULL,
        userId2 INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId1) REFERENCES users (id),
        FOREIGN KEY (userId2) REFERENCES users (id),
        UNIQUE(userId1, userId2)
      )
    `);

    // Statuses table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video')),
        content TEXT NOT NULL,
        caption TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        expiresAt TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const createTestUsers = async () => {
  try {
    const testUsers = [
      {
        email: 'alice@test.com',
        username: 'alice',
        password: 'password123',
        profilePicture: '👩‍💼'
      },
      {
        email: 'bob@test.com',
        username: 'bob',
        password: 'password123',
        profilePicture: '👨‍💻'
      },
      {
        email: 'charlie@test.com',
        username: 'charlie',
        password: 'password123',
        profilePicture: '👨‍🎨'
      },
      {
        email: 'diana@test.com',
        username: 'diana',
        password: 'password123',
        profilePicture: '👩‍🎤'
      },
      {
        email: 'edward@test.com',
        username: 'edward',
        password: 'password123',
        profilePicture: '👨‍⚕️'
      }
    ];

    for (const user of testUsers) {
      await db.executeSql(
        'INSERT OR IGNORE INTO users (email, username, password, profilePicture, isOnline) VALUES (?, ?, ?, ?, ?)',
        [user.email, user.username, user.password, user.profilePicture, 0]
      );
    }

    console.log('Test users created successfully');

    // Create some friendships
    const friendships = [
      [1, 2], // alice - bob
      [1, 3], // alice - charlie
      [2, 3], // bob - charlie
      [2, 4], // bob - diana
      [3, 4], // charlie - diana
      [4, 5], // diana - edward
    ];

    for (const [userId1, userId2] of friendships) {
      await db.executeSql(
        'INSERT OR IGNORE INTO friendships (userId1, userId2) VALUES (?, ?)',
        [userId1, userId2]
      );
    }

    console.log('Test friendships created successfully');

    // Create some test messages
    const messages = [
      { senderId: 1, receiverId: 2, message: 'Hey Bob! How are you doing?' },
      { senderId: 2, receiverId: 1, message: 'Hi Alice! I\'m doing great, thanks!' },
      { senderId: 1, receiverId: 3, message: 'Charlie, did you finish the project?' },
      { senderId: 3, receiverId: 1, message: 'Yes, just completed it!' },
      { senderId: 2, receiverId: 3, message: 'Great work, Charlie!' },
      { senderId: 4, receiverId: 2, message: 'Bob, are you free for lunch?' },
    ];

    for (const msg of messages) {
      await db.executeSql(
        'INSERT INTO messages (senderId, receiverId, message) VALUES (?, ?, ?)',
        [msg.senderId, msg.receiverId, msg.message]
      );
    }

    console.log('Test messages created successfully');

    // Create some test statuses
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
    
    const statuses = [
      { userId: 1, type: 'text', content: 'Having a great day! 😊' },
      { userId: 2, type: 'text', content: 'Working on something exciting 💻' },
      { userId: 3, type: 'text', content: 'Coffee time ☕' },
      { userId: 4, type: 'text', content: 'Beautiful weather today 🌤️' },
    ];

    for (const status of statuses) {
      await db.executeSql(
        'INSERT INTO statuses (userId, type, content, expiresAt) VALUES (?, ?, ?, ?)',
        [status.userId, status.type, status.content, expiresAt]
      );
    }

    console.log('Test statuses created successfully');

  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Creating test users for ChatApp...');
    
    await initDB();
    await createTables();
    await createTestUsers();
    
    console.log('\n✅ Test data created successfully!');
    console.log('\n📱 Test Users:');
    console.log('Email: alice@test.com | Password: password123 | Username: alice');
    console.log('Email: bob@test.com | Password: password123 | Username: bob');
    console.log('Email: charlie@test.com | Password: password123 | Username: charlie');
    console.log('Email: diana@test.com | Password: password123 | Username: diana');
    console.log('Email: edward@test.com | Password: password123 | Username: edward');
    console.log('\n🎉 You can now login with any of these accounts!');
    
    await db.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

main(); 