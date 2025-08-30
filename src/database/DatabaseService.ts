import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

export interface User {
  id: number;
  email: string;
  username: string;
  password: string;
  profilePicture?: string;
  isOnline: boolean;
  lastSeen: string;
  createdAt: string;
  isAdmin?: boolean;
  isBlocked?: boolean;
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Status {
  id: number;
  userId: number;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string;
  timestamp: string;
  expiresAt: string;
  isActive: boolean;
}

export interface StatusView {
  id: number;
  statusId: number;
  viewerId: number;
  viewedAt: string;
}

export interface FriendRequest {
  id: number;
  fromUserId: number;
  toUserId: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
}

export interface Friendship {
  id: number;
  userId1: number;
  userId2: number;
  createdAt: string;
}

export interface Call {
  id: string;
  callerId: number;
  receiverId: number;
  type: 'voice' | 'video';
  status: 'incoming' | 'outgoing' | 'missed' | 'ended' | 'declined';
  duration: number; // in seconds
  timestamp: string;
  startTime?: string;
  endTime?: string;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: number;
  createdAt: string;
  isActive: boolean;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'admin' | 'member';
  joinedAt: string;
}

export interface GroupMessage {
  id: number;
  groupId: number;
  senderId: number;
  message: string;
  timestamp: string;
  isRead: boolean;
}

class DatabaseService {
  private database: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.database = await SQLite.openDatabase({
        name: 'ChatApp.db',
        location: 'default',
      });
      
      await this.handleDatabaseMigration();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private async handleDatabaseMigration(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Check if users table exists and get its structure
      let tableExists = false;
      let needsMigration = false;
      
      try {
        const result = await this.database.executeSql(`PRAGMA table_info(users)`);
        tableExists = result[0].rows.length > 0;
        
        if (tableExists) {
          // Check if new columns exist
          let hasUsername = false;
          let hasProfilePicture = false;
          let hasIsOnline = false;
          let hasLastSeen = false;
          let hasIsAdmin = false;
          let hasIsBlocked = false;
          
          for (let i = 0; i < result[0].rows.length; i++) {
            const col = result[0].rows.item(i);
            if (col.name === 'username') hasUsername = true;
            if (col.name === 'profilePicture') hasProfilePicture = true;
            if (col.name === 'isOnline') hasIsOnline = true;
            if (col.name === 'lastSeen') hasLastSeen = true;
            if (col.name === 'isAdmin') hasIsAdmin = true;
            if (col.name === 'isBlocked') hasIsBlocked = true;
          }
          
          needsMigration = !hasUsername || !hasProfilePicture || !hasIsOnline || !hasLastSeen || !hasIsAdmin || !hasIsBlocked;
        }
      } catch (error) {
        // Table doesn't exist, will be created fresh
        tableExists = false;
      }

      if (needsMigration) {
        console.log('Migration needed - recreating database with new schema...');
        await this.recreateDatabaseWithNewSchema();
      } else {
        console.log('Creating fresh database with new schema...');
        await this.createAllTables();
      }
      
    } catch (error) {
      console.error('Database migration failed:', error);
      // If migration fails, recreate the entire database
      console.log('Migration failed, creating fresh database...');
      await this.recreateDatabaseWithNewSchema();
    }
  }

  private async recreateDatabaseWithNewSchema(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Drop all existing tables
      await this.database.executeSql(`DROP TABLE IF EXISTS users`);
      await this.database.executeSql(`DROP TABLE IF EXISTS messages`);
      await this.database.executeSql(`DROP TABLE IF EXISTS friend_requests`);
      await this.database.executeSql(`DROP TABLE IF EXISTS friendships`);
      await this.database.executeSql(`DROP TABLE IF EXISTS statuses`);
      await this.database.executeSql(`DROP TABLE IF EXISTS status_views`); // Add this line
      await this.database.executeSql(`DROP TABLE IF EXISTS calls`); // Add this line
      await this.database.executeSql(`DROP TABLE IF EXISTS blocked_users`); // Add this line
      await this.database.executeSql(`DROP TABLE IF EXISTS notifications`); // Add this line
      await this.database.executeSql(`DROP TABLE IF EXISTS groups`); // Add this line
      await this.database.executeSql(`DROP TABLE IF EXISTS group_members`); // Add this line
      await this.database.executeSql(`DROP TABLE IF EXISTS group_messages`); // Add this line
      
      // Create all tables with new schema
      await this.createAllTables();
      
      console.log('Database recreated with new schema successfully');
    } catch (error) {
      console.error('Error recreating database:', error);
      throw error;
    }
  }

  private async createAllTables(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    // Users table with all new columns
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        profilePicture TEXT,
        isOnline BOOLEAN DEFAULT 0,
        lastSeen TEXT DEFAULT CURRENT_TIMESTAMP,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        isAdmin BOOLEAN DEFAULT 0,
        isBlocked BOOLEAN DEFAULT 0
      )
    `);

    // Messages table
    await this.database.executeSql(`
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
    await this.database.executeSql(`
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
    await this.database.executeSql(`
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
    await this.database.executeSql(`
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

    // Status views table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS status_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        statusId INTEGER NOT NULL,
        viewerId INTEGER NOT NULL,
        viewedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (statusId) REFERENCES statuses (id),
        FOREIGN KEY (viewerId) REFERENCES users (id),
        UNIQUE(statusId, viewerId)
      )
    `);

    // Create calls table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        callerId INTEGER NOT NULL,
        receiverId INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('voice', 'video')),
        status TEXT NOT NULL CHECK (status IN ('incoming', 'outgoing', 'missed', 'ended', 'declined')),
        duration INTEGER DEFAULT 0,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        startTime TEXT,
        endTime TEXT,
        FOREIGN KEY (callerId) REFERENCES users (id),
        FOREIGN KEY (receiverId) REFERENCES users (id)
      )
    `);

    // Create blocked_users table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        blockedUserId INTEGER NOT NULL,
        blockedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users (id),
        FOREIGN KEY (blockedUserId) REFERENCES users (id),
        UNIQUE(userId, blockedUserId)
      )
    `);

    // Create notifications table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('global', 'individual')),
        targetUserId INTEGER,
        isRead BOOLEAN DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (targetUserId) REFERENCES users (id)
      )
    `);

    // Create groups table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        avatar TEXT,
        createdBy INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        isActive BOOLEAN DEFAULT 1,
        FOREIGN KEY (createdBy) REFERENCES users (id)
      )
    `);

    // Create group_members table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'member')) DEFAULT 'member',
        joinedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (groupId) REFERENCES groups (id),
        FOREIGN KEY (userId) REFERENCES users (id),
        UNIQUE(groupId, userId)
      )
    `);

    // Create group_messages table
    await this.database.executeSql(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        groupId INTEGER NOT NULL,
        senderId INTEGER NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        isRead BOOLEAN DEFAULT 0,
        FOREIGN KEY (groupId) REFERENCES groups (id),
        FOREIGN KEY (senderId) REFERENCES users (id)
      )
    `);

    console.log('All tables created successfully');
  }

  async createUser(email: string, username: string, password: string, profilePicture?: string): Promise<User> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'INSERT INTO users (email, username, password, profilePicture, isOnline) VALUES (?, ?, ?, ?, ?)',
        [email, username, password, profilePicture || undefined, 1]
      );

      const userId = result[0].insertId;
      const user: User = {
        id: userId,
        email,
        username,
        password,
        profilePicture: profilePicture || undefined,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isAdmin: false,
        isBlocked: false,
      };

      // Create welcome notification for new user
      await this.createWelcomeNotification(userId);

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        return {
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        return {
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw error;
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        return {
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  }

  async loginUser(emailOrUsername: string, password: string): Promise<User | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Try to find user by email or username
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE (email = ? OR username = ?) AND password = ?',
        [emailOrUsername, emailOrUsername, password]
      );

      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        
        // Update user's online status
        await this.updateUserOnlineStatus(row.id, true);
        
        return {
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: true,
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
          isAdmin: Boolean(row.isAdmin),
          isBlocked: Boolean(row.isBlocked),
        };
      }

      return null;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE users SET isOnline = ?, lastSeen = ? WHERE id = ?',
        [isOnline ? 1 : 0, new Date().toISOString(), userId]
      );
    } catch (error) {
      console.error('Error updating user online status:', error);
      throw error;
    }
  }

  async searchUsersByUsername(searchTerm: string, currentUserId: number): Promise<User[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE username LIKE ? AND id != ? ORDER BY username',
        [`%${searchTerm}%`, currentUserId]
      );

      const users: User[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        users.push({
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
        });
      }

      return users;
    } catch (error) {
      console.error('Error searching users by username:', error);
      throw error;
    }
  }

  async sendFriendRequest(fromUserId: number, toUserId: number, message?: string): Promise<FriendRequest> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'INSERT INTO friend_requests (fromUserId, toUserId, message, status) VALUES (?, ?, ?, ?)',
        [fromUserId, toUserId, message || null, 'pending']
      );

      const requestId = result[0].insertId;
      return {
        id: requestId,
        fromUserId,
        toUserId,
        message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  async getFriendRequests(userId: number): Promise<Array<FriendRequest & { fromUser: User }>> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT fr.*, u.email, u.username, u.profilePicture, u.isOnline, u.lastSeen, u.createdAt as userCreatedAt
        FROM friend_requests fr
        JOIN users u ON fr.fromUserId = u.id
        WHERE fr.toUserId = ? AND fr.status = 'pending'
        ORDER BY fr.createdAt DESC
      `, [userId]);

      const requests: Array<FriendRequest & { fromUser: User }> = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        requests.push({
          id: row.id,
          fromUserId: row.fromUserId,
          toUserId: row.toUserId,
          message: row.message,
          status: row.status,
          createdAt: row.createdAt,
          fromUser: {
            id: row.fromUserId,
            email: row.email,
            username: row.username,
            password: '',
            profilePicture: row.profilePicture,
            isOnline: Boolean(row.isOnline),
            lastSeen: row.lastSeen,
            createdAt: row.userCreatedAt,
          },
        });
      }

      return requests;
    } catch (error) {
      console.error('Error getting friend requests:', error);
      throw error;
    }
  }

  async respondToFriendRequest(requestId: number, response: 'accepted' | 'declined' | 'blocked'): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Update the request status
      await this.database.executeSql(
        'UPDATE friend_requests SET status = ? WHERE id = ?',
        [response, requestId]
      );

      // If accepted, create friendship
      if (response === 'accepted') {
        const requestResult = await this.database.executeSql(
          'SELECT fromUserId, toUserId FROM friend_requests WHERE id = ?',
          [requestId]
        );

        if (requestResult[0].rows.length > 0) {
          const { fromUserId, toUserId } = requestResult[0].rows.item(0);
          
          // Create friendship (both directions for easier querying)
          await this.database.executeSql(
            'INSERT OR IGNORE INTO friendships (userId1, userId2) VALUES (?, ?)',
            [Math.min(fromUserId, toUserId), Math.max(fromUserId, toUserId)]
          );
        }
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      throw error;
    }
  }

  async getFriends(userId: number): Promise<User[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT u.* FROM users u
        JOIN friendships f ON (f.userId1 = u.id OR f.userId2 = u.id)
        WHERE (f.userId1 = ? OR f.userId2 = ?) AND u.id != ?
        ORDER BY u.isOnline DESC, u.lastSeen DESC
      `, [userId, userId, userId]);

      const friends: User[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        friends.push({
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
        });
      }

      return friends;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  }

  async areFriends(userId1: number, userId2: number): Promise<boolean> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT id FROM friendships WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)',
        [Math.min(userId1, userId2), Math.max(userId1, userId2), Math.min(userId1, userId2), Math.max(userId1, userId2)]
      );

      return result[0].rows.length > 0;
    } catch (error) {
      console.error('Error checking friendship:', error);
      throw error;
    }
  }

  async getFriendRequestStatus(fromUserId: number, toUserId: number): Promise<string | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT status FROM friend_requests WHERE fromUserId = ? AND toUserId = ? ORDER BY createdAt DESC LIMIT 1',
        [fromUserId, toUserId]
      );

      if (result[0].rows.length > 0) {
        return result[0].rows.item(0).status;
      }

      return null;
    } catch (error) {
      console.error('Error getting friend request status:', error);
      throw error;
    }
  }

  // Existing message methods
  async saveMessage(senderId: number, receiverId: number, message: string): Promise<ChatMessage> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'INSERT INTO messages (senderId, receiverId, message, timestamp) VALUES (?, ?, ?, ?)',
        [senderId, receiverId, message, new Date().toISOString()]
      );

      const messageId = result[0].insertId;
      return {
        id: messageId,
        senderId,
        receiverId,
        message,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getChatHistory(userId1: number, userId2: number): Promise<ChatMessage[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT * FROM messages 
        WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
        ORDER BY timestamp ASC
      `, [userId1, userId2, userId2, userId1]);

      const messages: ChatMessage[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        messages.push({
          id: row.id,
          senderId: row.senderId,
          receiverId: row.receiverId,
          message: row.message,
          timestamp: row.timestamp,
          isRead: Boolean(row.isRead),
        });
      }

      return messages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE messages SET isRead = 1 WHERE id = ?',
        [messageId]
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async markAllMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE messages SET isRead = 1 WHERE senderId = ? AND receiverId = ? AND isRead = 0',
        [senderId, receiverId]
      );
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT COUNT(*) as count FROM messages 
        WHERE receiverId = ? AND isRead = 0
      `, [userId]);

      return result[0].rows.item(0).count;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      return 0;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql('SELECT * FROM users ORDER BY username');

      const users: User[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        users.push({
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
        });
      }

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
      console.log('Database closed');
    }
  }

  // Status methods
  async createStatus(userId: number, type: 'text' | 'image' | 'video', content: string, caption?: string): Promise<Status> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Set expiration time to 12 hours from now
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

      const result = await this.database.executeSql(
        'INSERT INTO statuses (userId, type, content, caption, expiresAt) VALUES (?, ?, ?, ?, ?)',
        [userId, type, content, caption || null, expiresAt]
      );

      const statusId = result[0].insertId;
      const status: Status = {
        id: statusId,
        userId,
        type,
        content,
        caption,
        timestamp: new Date().toISOString(),
        expiresAt,
        isActive: true,
      };

      return status;
    } catch (error) {
      console.error('Error creating status:', error);
      throw error;
    }
  }

  async getActiveStatuses(userId: number): Promise<(Status & { user: User })[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const result = await this.database.executeSql(`
        SELECT s.*, u.username, u.profilePicture 
        FROM statuses s 
        JOIN users u ON s.userId = u.id 
        WHERE s.isActive = 1 
        AND s.expiresAt > ? 
        AND (
          s.userId = ? 
          OR s.userId IN (
            SELECT CASE 
              WHEN userId1 = ? THEN userId2 
              WHEN userId2 = ? THEN userId1 
            END 
            FROM friendships 
            WHERE userId1 = ? OR userId2 = ?
          )
        )
        ORDER BY s.timestamp DESC
      `, [now, userId, userId, userId, userId, userId]);

      const statuses: (Status & { user: User })[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        statuses.push({
          id: row.id,
          userId: row.userId,
          type: row.type,
          content: row.content,
          caption: row.caption,
          timestamp: row.timestamp,
          expiresAt: row.expiresAt,
          isActive: Boolean(row.isActive),
          user: {
            id: row.userId,
            email: '', // Not needed for status display
            username: row.username,
            password: '', // Not needed for status display
            profilePicture: row.profilePicture,
            isOnline: false, // Not needed for status display
            lastSeen: '', // Not needed for status display
            createdAt: '', // Not needed for status display
          },
        });
      }

      return statuses;
    } catch (error) {
      console.error('Error getting active statuses:', error);
      throw error;
    }
  }

  async getUserStatuses(userId: number): Promise<Status[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      const result = await this.database.executeSql(`
        SELECT * FROM statuses 
        WHERE userId = ? AND isActive = 1 AND expiresAt > ? 
        ORDER BY timestamp DESC
      `, [userId, now]);

      const statuses: Status[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        statuses.push({
          id: row.id,
          userId: row.userId,
          type: row.type,
          content: row.content,
          caption: row.caption,
          timestamp: row.timestamp,
          expiresAt: row.expiresAt,
          isActive: Boolean(row.isActive),
        });
      }

      return statuses;
    } catch (error) {
      console.error('Error getting user statuses:', error);
      throw error;
    }
  }

  async deleteExpiredStatuses(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const now = new Date().toISOString();
      await this.database.executeSql(
        'UPDATE statuses SET isActive = 0 WHERE expiresAt <= ?',
        [now]
      );
    } catch (error) {
      console.error('Error deleting expired statuses:', error);
      throw error;
    }
  }

  async deleteStatus(statusId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE statuses SET isActive = 0 WHERE id = ?',
        [statusId]
      );
    } catch (error) {
      console.error('Error deleting status:', error);
      throw error;
    }
  }

  // Status view methods
  async recordStatusView(statusId: number, viewerId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'INSERT OR IGNORE INTO status_views (statusId, viewerId) VALUES (?, ?)',
        [statusId, viewerId]
      );
    } catch (error) {
      console.error('Error recording status view:', error);
      throw error;
    }
  }

  async getStatusViews(statusId: number): Promise<(StatusView & { viewer: User })[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT sv.*, u.username, u.profilePicture 
        FROM status_views sv 
        JOIN users u ON sv.viewerId = u.id 
        WHERE sv.statusId = ? 
        ORDER BY sv.viewedAt DESC
      `, [statusId]);

      const views: (StatusView & { viewer: User })[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        views.push({
          id: row.id,
          statusId: row.statusId,
          viewerId: row.viewerId,
          viewedAt: row.viewedAt,
          viewer: {
            id: row.viewerId,
            email: '', // Not needed for display
            username: row.username,
            password: '', // Not needed for display
            profilePicture: row.profilePicture,
            isOnline: false, // Not needed for display
            lastSeen: '', // Not needed for display
            createdAt: '', // Not needed for display
          },
        });
      }

      return views;
    } catch (error) {
      console.error('Error getting status views:', error);
      throw error;
    }
  }

  async getStatusViewCount(statusId: number): Promise<number> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT COUNT(*) as count FROM status_views WHERE statusId = ?',
        [statusId]
      );

      return result[0].rows.item(0).count;
    } catch (error) {
      console.error('Error getting status view count:', error);
      return 0;
    }
  }

  async hasUserViewedStatus(statusId: number, userId: number): Promise<boolean> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT COUNT(*) as count FROM status_views WHERE statusId = ? AND viewerId = ?',
        [statusId, userId]
      );

      return result[0].rows.item(0).count > 0;
    } catch (error) {
      console.error('Error checking if user viewed status:', error);
      return false;
    }
  }

  // Block and friendship management methods
  async blockUser(userId: number, blockedUserId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // First, remove friendship if it exists
      await this.database.executeSql(
        'DELETE FROM friendships WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)',
        [userId, blockedUserId, blockedUserId, userId]
      );

      // Remove any pending friend requests
      await this.database.executeSql(
        'DELETE FROM friend_requests WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)',
        [userId, blockedUserId, blockedUserId, userId]
      );

      // Add to blocked users table (create if doesn't exist)
      await this.database.executeSql(`
        CREATE TABLE IF NOT EXISTS blocked_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          blockedUserId INTEGER NOT NULL,
          blockedAt TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users (id),
          FOREIGN KEY (blockedUserId) REFERENCES users (id),
          UNIQUE(userId, blockedUserId)
        )
      `);

      await this.database.executeSql(
        'INSERT OR REPLACE INTO blocked_users (userId, blockedUserId) VALUES (?, ?)',
        [userId, blockedUserId]
      );
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  async unblockUser(userId: number, blockedUserId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'DELETE FROM blocked_users WHERE userId = ? AND blockedUserId = ?',
        [userId, blockedUserId]
      );
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  async isUserBlocked(userId: number, blockedUserId: number): Promise<boolean> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT COUNT(*) as count FROM blocked_users WHERE userId = ? AND blockedUserId = ?',
        [userId, blockedUserId]
      );

      return result[0].rows.item(0).count > 0;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  }

  async removeFriendship(userId1: number, userId2: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Remove friendship
      await this.database.executeSql(
        'DELETE FROM friendships WHERE (userId1 = ? AND userId2 = ?) OR (userId1 = ? AND userId2 = ?)',
        [userId1, userId2, userId2, userId1]
      );

      // Remove any pending friend requests
      await this.database.executeSql(
        'DELETE FROM friend_requests WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)',
        [userId1, userId2, userId2, userId1]
      );
    } catch (error) {
      console.error('Error removing friendship:', error);
      throw error;
    }
  }

  async getBlockedUsers(userId: number): Promise<User[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT u.* FROM users u
        JOIN blocked_users bu ON u.id = bu.blockedUserId
        WHERE bu.userId = ?
        ORDER BY bu.blockedAt DESC
      `, [userId]);

      const blockedUsers: User[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        blockedUsers.push({
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
          isAdmin: Boolean(row.isAdmin),
          isBlocked: Boolean(row.isBlocked),
        });
      }

      return blockedUsers;
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  // Admin methods
  async createAdminUser(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Check if admin already exists
      const existingAdmin = await this.database.executeSql(
        'SELECT id FROM users WHERE email = ? OR username = ?',
        ['admin@capp.com', 'Admin']
      );

      if (existingAdmin[0].rows.length === 0) {
        // Create admin user with proper email
        await this.database.executeSql(
          'INSERT INTO users (email, username, password, isAdmin, isOnline) VALUES (?, ?, ?, ?, ?)',
          ['admin@capp.com', 'Admin', 'Radhikamaa', 1, 1]
        );
        console.log('Admin user created successfully');
      }
    } catch (error) {
      console.error('Error creating admin user:', error);
    }
  }

  async isAdminUser(emailOrUsername: string, password: string): Promise<boolean> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT id FROM users WHERE (email = ? OR username = ?) AND password = ? AND isAdmin = 1',
        [emailOrUsername, emailOrUsername, password]
      );
      return result[0].rows.length > 0;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  async updateAdminCredentials(adminId: number, newUsername: string, newPassword: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE users SET username = ?, password = ? WHERE id = ? AND isAdmin = 1',
        [newUsername, newPassword, adminId]
      );
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      throw error;
    }
  }

  // Notification methods
  async createGlobalNotification(title: string, message: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)',
        [title, message, 'global']
      );
    } catch (error) {
      console.error('Error creating global notification:', error);
      throw error;
    }
  }

  async createIndividualNotification(title: string, message: string, targetUserId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'INSERT INTO notifications (title, message, type, targetUserId) VALUES (?, ?, ?, ?)',
        [title, message, 'individual', targetUserId]
      );
    } catch (error) {
      console.error('Error creating individual notification:', error);
      throw error;
    }
  }

  async getNotificationsForUser(userId: number): Promise<any[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT * FROM notifications 
        WHERE type = 'global' OR (type = 'individual' AND targetUserId = ?)
        ORDER BY createdAt DESC
      `, [userId]);

      const notifications: any[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        notifications.push(result[0].rows.item(i));
      }

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async getAllNotificationsWithDetails(): Promise<any[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT n.*, u.username as targetUsername, u.email as targetEmail
        FROM notifications n
        LEFT JOIN users u ON n.targetUserId = u.id
        ORDER BY n.createdAt DESC
      `);

      const notifications: any[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        notifications.push({
          id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          targetUserId: row.targetUserId,
          targetUsername: row.targetUsername,
          targetEmail: row.targetEmail,
          isRead: Boolean(row.isRead),
          createdAt: row.createdAt,
        });
      }

      return notifications;
    } catch (error) {
      console.error('Error getting all notifications with details:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE notifications SET isRead = 1 WHERE id = ?',
        [notificationId]
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'DELETE FROM notifications WHERE id = ?',
        [notificationId]
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async updateNotification(notificationId: number, title: string, message: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE notifications SET title = ?, message = ? WHERE id = ?',
        [title, message, notificationId]
      );
    } catch (error) {
      console.error('Error updating notification:', error);
      throw error;
    }
  }

  async updateGroupName(groupId: number, newName: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE groups SET name = ? WHERE id = ?',
        [newName, groupId]
      );
    } catch (error) {
      console.error('Error updating group name:', error);
      throw error;
    }
  }

  // Call methods
  async saveCall(call: Call): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(`
        INSERT INTO calls (id, callerId, receiverId, type, status, duration, timestamp, startTime, endTime)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        call.id,
        call.callerId,
        call.receiverId,
        call.type,
        call.status,
        call.duration,
        call.timestamp,
        call.startTime || null,
        call.endTime || null,
      ]);
    } catch (error) {
      console.error('Error saving call:', error);
      throw error;
    }
  }

  async updateCall(call: Call): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(`
        UPDATE calls 
        SET status = ?, duration = ?, startTime = ?, endTime = ?
        WHERE id = ?
      `, [
        call.status,
        call.duration,
        call.startTime || null,
        call.endTime || null,
        call.id,
      ]);
    } catch (error) {
      console.error('Error updating call:', error);
      throw error;
    }
  }

  async getCallById(callId: string): Promise<Call | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM calls WHERE id = ?',
        [callId]
      );

      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        return {
          id: row.id,
          callerId: row.callerId,
          receiverId: row.receiverId,
          type: row.type,
          status: row.status,
          duration: row.duration,
          timestamp: row.timestamp,
          startTime: row.startTime,
          endTime: row.endTime,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting call by id:', error);
      throw error;
    }
  }

  async getCallHistory(userId: number): Promise<Call[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT * FROM calls 
        WHERE callerId = ? OR receiverId = ?
        ORDER BY timestamp DESC
        LIMIT 50
      `, [userId, userId]);

      const calls: Call[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        calls.push({
          id: row.id,
          callerId: row.callerId,
          receiverId: row.receiverId,
          type: row.type,
          status: row.status,
          duration: row.duration,
          timestamp: row.timestamp,
          startTime: row.startTime,
          endTime: row.endTime,
        });
      }

      return calls;
    } catch (error) {
      console.error('Error getting call history:', error);
      return [];
    }
  }

  // Admin user management methods
  async deleteUser(userId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Delete user's data from all related tables
      await this.database.executeSql('DELETE FROM messages WHERE senderId = ? OR receiverId = ?', [userId, userId]);
      await this.database.executeSql('DELETE FROM friend_requests WHERE fromUserId = ? OR toUserId = ?', [userId, userId]);
      await this.database.executeSql('DELETE FROM friendships WHERE userId1 = ? OR userId2 = ?', [userId, userId]);
      await this.database.executeSql('DELETE FROM statuses WHERE userId = ?', [userId]);
      await this.database.executeSql('DELETE FROM status_views WHERE viewerId = ?', [userId]);
      await this.database.executeSql('DELETE FROM calls WHERE callerId = ? OR receiverId = ?', [userId, userId]);
      await this.database.executeSql('DELETE FROM blocked_users WHERE userId = ? OR blockedUserId = ?', [userId, userId]);
      await this.database.executeSql('DELETE FROM group_members WHERE userId = ?', [userId]);
      await this.database.executeSql('DELETE FROM group_messages WHERE senderId = ?', [userId]);
      
      // Finally delete the user
      await this.database.executeSql('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  async blockUserByAdmin(userId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE users SET isBlocked = 1 WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error blocking user by admin:', error);
      throw error;
    }
  }

  async unblockUserByAdmin(userId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE users SET isBlocked = 0 WHERE id = ?',
        [userId]
      );
    } catch (error) {
      console.error('Error unblocking user by admin:', error);
      throw error;
    }
  }

  async updateUserUsername(userId: number, newUsername: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE users SET username = ? WHERE id = ?',
        [newUsername, userId]
      );
    } catch (error) {
      console.error('Error updating username:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE users SET password = ? WHERE id = ?',
        [newPassword, userId]
      );
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async createWelcomeNotification(userId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'INSERT INTO notifications (title, message, type, targetUserId) VALUES (?, ?, ?, ?)',
        ['Welcome to ChatApp!', 'Thank you for joining our community. Start chatting with friends and explore all the features!', 'individual', userId]
      );
    } catch (error) {
      console.error('Error creating welcome notification:', error);
    }
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT COUNT(*) as count FROM notifications 
        WHERE (type = 'global' OR (type = 'individual' AND targetUserId = ?))
        AND isRead = 0
      `, [userId]);

      return result[0].rows.item(0).count;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Group methods
  async createGroup(name: string, description: string, createdBy: number, avatar?: string): Promise<Group> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'INSERT INTO groups (name, description, avatar, createdBy) VALUES (?, ?, ?, ?)',
        [name, description, avatar || null, createdBy]
      );

      const groupId = result[0].insertId;
      
      // Add creator as admin member
      await this.database.executeSql(
        'INSERT INTO group_members (groupId, userId, role) VALUES (?, ?, ?)',
        [groupId, createdBy, 'admin']
      );

      const group: Group = {
        id: groupId,
        name,
        description,
        avatar,
        createdBy,
        createdAt: new Date().toISOString(),
        isActive: true,
      };

      return group;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async getUserGroups(userId: number): Promise<(Group & { memberCount: number; lastMessage?: string; lastMessageTime?: string })[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT g.*, 
               (SELECT COUNT(*) FROM group_members WHERE groupId = g.id) as memberCount,
               (SELECT message FROM group_messages WHERE groupId = g.id ORDER BY timestamp DESC LIMIT 1) as lastMessage,
               (SELECT timestamp FROM group_messages WHERE groupId = g.id ORDER BY timestamp DESC LIMIT 1) as lastMessageTime
        FROM groups g
        JOIN group_members gm ON g.id = gm.groupId
        WHERE gm.userId = ? AND g.isActive = 1
        ORDER BY g.createdAt DESC
      `, [userId]);

      const groups: (Group & { memberCount: number; lastMessage?: string; lastMessageTime?: string })[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        groups.push({
          id: row.id,
          name: row.name,
          description: row.description,
          avatar: row.avatar,
          createdBy: row.createdBy,
          createdAt: row.createdAt,
          isActive: Boolean(row.isActive),
          memberCount: row.memberCount,
          lastMessage: row.lastMessage,
          lastMessageTime: row.lastMessageTime,
        });
      }

      return groups;
    } catch (error) {
      console.error('Error getting user groups:', error);
      return [];
    }
  }

  async addMemberToGroup(groupId: number, userId: number, role: 'admin' | 'member' = 'member'): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'INSERT OR IGNORE INTO group_members (groupId, userId, role) VALUES (?, ?, ?)',
        [groupId, userId, role]
      );
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw error;
    }
  }

  async removeMemberFromGroup(groupId: number, userId: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'DELETE FROM group_members WHERE groupId = ? AND userId = ?',
        [groupId, userId]
      );
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw error;
    }
  }

  async getGroupMembers(groupId: number): Promise<(User & { role: string })[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT u.*, gm.role
        FROM users u
        JOIN group_members gm ON u.id = gm.userId
        WHERE gm.groupId = ?
        ORDER BY gm.role DESC, u.username
      `, [groupId]);

      const members: (User & { role: string })[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        members.push({
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: Boolean(row.isOnline),
          lastSeen: row.lastSeen,
          createdAt: row.createdAt,
          role: row.role,
        });
      }

      return members;
    } catch (error) {
      console.error('Error getting group members:', error);
      return [];
    }
  }

  async saveGroupMessage(groupId: number, senderId: number, message: string): Promise<GroupMessage> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'INSERT INTO group_messages (groupId, senderId, message, timestamp) VALUES (?, ?, ?, ?)',
        [groupId, senderId, message, new Date().toISOString()]
      );

      const messageId = result[0].insertId;
      return {
        id: messageId,
        groupId,
        senderId,
        message,
        timestamp: new Date().toISOString(),
        isRead: false,
      };
    } catch (error) {
      console.error('Error saving group message:', error);
      throw error;
    }
  }

  async saveGroupCall(groupId: number, callerId: number, callType: 'voice' | 'video'): Promise<string> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const callId = `group_${groupId}_${Date.now()}`;
      await this.database.executeSql(`
        INSERT INTO calls (id, callerId, receiverId, type, status, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [callId, callerId, groupId, callType, 'outgoing', new Date().toISOString()]);

      return callId;
    } catch (error) {
      console.error('Error saving group call:', error);
      throw error;
    }
  }

  async updateGroupCallStatus(callId: string, status: string): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      await this.database.executeSql(
        'UPDATE calls SET status = ? WHERE id = ?',
        [status, callId]
      );
    } catch (error) {
      console.error('Error updating group call status:', error);
      throw error;
    }
  }

  async getGroupMessages(groupId: number): Promise<(GroupMessage & { sender: User })[]> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(`
        SELECT gm.*, u.username, u.profilePicture
        FROM group_messages gm
        JOIN users u ON gm.senderId = u.id
        WHERE gm.groupId = ?
        ORDER BY gm.timestamp ASC
      `, [groupId]);

      const messages: (GroupMessage & { sender: User })[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        messages.push({
          id: row.id,
          groupId: row.groupId,
          senderId: row.senderId,
          message: row.message,
          timestamp: row.timestamp,
          isRead: Boolean(row.isRead),
          sender: {
            id: row.senderId,
            email: '', // Not needed for display
            username: row.username,
            password: '', // Not needed for display
            profilePicture: row.profilePicture,
            isOnline: false, // Not needed for display
            lastSeen: '', // Not needed for display
            createdAt: '', // Not needed for display
          },
        });
      }

      return messages;
    } catch (error) {
      console.error('Error getting group messages:', error);
      return [];
    }
  }
}

export default new DatabaseService(); 