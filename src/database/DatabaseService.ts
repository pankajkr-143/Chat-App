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
}

export interface ChatMessage {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  timestamp: string;
  isRead: boolean;
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
          
          for (let i = 0; i < result[0].rows.length; i++) {
            const col = result[0].rows.item(i);
            if (col.name === 'username') hasUsername = true;
            if (col.name === 'profilePicture') hasProfilePicture = true;
            if (col.name === 'isOnline') hasIsOnline = true;
            if (col.name === 'lastSeen') hasLastSeen = true;
          }
          
          needsMigration = !hasUsername || !hasProfilePicture || !hasIsOnline || !hasLastSeen;
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
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
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

    console.log('All tables created successfully');
  }

  async createUser(email: string, username: string, password: string, profilePicture?: string): Promise<User> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'INSERT INTO users (email, username, password, profilePicture, isOnline) VALUES (?, ?, ?, ?, ?)',
        [email, username, password, profilePicture || null, 1]
      );

      const userId = result[0].insertId;
      const user: User = {
        id: userId,
        email,
        username,
        password,
        profilePicture,
        isOnline: true,
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

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

  async validateUser(email: string, password: string): Promise<User | null> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE email = ? AND password = ?',
        [email, password]
      );

      if (result[0].rows.length > 0) {
        const row = result[0].rows.item(0);
        
        // Update user online status
        await this.updateUserOnlineStatus(row.id, true);
        
        return {
          id: row.id,
          email: row.email,
          username: row.username,
          password: row.password,
          profilePicture: row.profilePicture,
          isOnline: true,
          lastSeen: new Date().toISOString(),
          createdAt: row.createdAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error validating user:', error);
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
}

export default new DatabaseService(); 