import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

export interface User {
  id: number;
  email: string;
  password: string;
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

class DatabaseService {
  private database: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.database = await SQLite.openDatabase({
        name: 'ChatApp.db',
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      // Create users table
      await this.database.executeSql(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);

      // Create chat_messages table
      await this.database.executeSql(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          senderId INTEGER NOT NULL,
          receiverId INTEGER NOT NULL,
          message TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          isRead BOOLEAN DEFAULT 0,
          FOREIGN KEY (senderId) REFERENCES users (id),
          FOREIGN KEY (receiverId) REFERENCES users (id)
        );
      `);

      console.log('Tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // User authentication methods
  async createUser(email: string, password: string): Promise<User> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const timestamp = new Date().toISOString();
      const result = await this.database.executeSql(
        'INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)',
        [email, password, timestamp]
      );

      const userId = result[0].insertId;
      return {
        id: userId,
        email,
        password,
        createdAt: timestamp,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (result[0].rows.length > 0) {
        const user = result[0].rows.item(0);
        return {
          id: user.id,
          email: user.email,
          password: user.password,
          createdAt: user.createdAt,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (user && user.password === password) {
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error validating user:', error);
      throw error;
    }
  }

  // Chat message methods
  async saveMessage(senderId: number, receiverId: number, message: string): Promise<ChatMessage> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const timestamp = new Date().toISOString();
      const result = await this.database.executeSql(
        'INSERT INTO chat_messages (senderId, receiverId, message, timestamp, isRead) VALUES (?, ?, ?, ?, ?)',
        [senderId, receiverId, message, timestamp, false]
      );

      const messageId = result[0].insertId;
      return {
        id: messageId,
        senderId,
        receiverId,
        message,
        timestamp,
        isRead: false,
      };
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  async getChatHistory(userId1: number, userId2: number): Promise<ChatMessage[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.database.executeSql(
        `SELECT * FROM chat_messages 
         WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
         ORDER BY timestamp ASC`,
        [userId1, userId2, userId2, userId1]
      );

      const messages: ChatMessage[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        messages.push({
          id: row.id,
          senderId: row.senderId,
          receiverId: row.receiverId,
          message: row.message,
          timestamp: row.timestamp,
          isRead: row.isRead === 1,
        });
      }

      return messages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      await this.database.executeSql(
        'UPDATE chat_messages SET isRead = 1 WHERE id = ?',
        [messageId]
      );
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.database.executeSql(
        'SELECT * FROM users ORDER BY createdAt DESC'
      );

      const users: User[] = [];
      for (let i = 0; i < result[0].rows.length; i++) {
        const row = result[0].rows.item(i);
        users.push({
          id: row.id,
          email: row.email,
          password: row.password,
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
    }
  }
}

export default new DatabaseService(); 