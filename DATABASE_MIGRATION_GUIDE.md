# Database Migration Guide - Fix "No such column: username" Error 🔧

## 🚨 **Problem Solved!**

The error "signup failed due to no such column : username" occurs because the existing database has the old schema without the new columns we added for the enhanced features.

## ✅ **Solution Implemented**

I've added an **automatic database migration system** that will:

1. **Detect** if your database has the old schema
2. **Migrate** existing data to the new schema
3. **Preserve** all your existing users and messages
4. **Add** the new columns automatically

## 🔄 **What the Migration Does**

### **For Existing Users:**
- ✅ **Preserves** all existing user accounts
- ✅ **Generates** usernames from email addresses (e.g., `john@email.com` → `john`)
- ✅ **Assigns** default profile pictures (`😀`)
- ✅ **Sets** online status to offline initially
- ✅ **Updates** last seen timestamps

### **New Database Schema:**
```sql
-- Enhanced Users Table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,        -- NEW
  password TEXT NOT NULL,
  profilePicture TEXT,                  -- NEW
  isOnline BOOLEAN DEFAULT 0,           -- NEW
  lastSeen TEXT DEFAULT CURRENT_TIMESTAMP, -- NEW
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Friend Requests Table
CREATE TABLE friend_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fromUserId INTEGER NOT NULL,
  toUserId INTEGER NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Friendships Table
CREATE TABLE friendships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId1 INTEGER NOT NULL,
  userId2 INTEGER NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 **How to Fix the Issue**

### **Option 1: Automatic Migration (Recommended)**
The app will automatically migrate your database when you restart it:

1. **Stop** the app if it's running
2. **Restart** the app: `npm run android` or `npm run ios`
3. **Wait** for the migration to complete (check console logs)
4. **Sign up** with the new enhanced features!

### **Option 2: Fresh Start (If you want to start over)**
If you prefer to start with a completely fresh database:

1. **Run the reset script:**
   ```bash
   node reset-database.js
   ```

2. **Or manually delete the database file:**
   ```bash
   # For Android
   rm android/app/src/main/assets/ChatApp.db
   
   # For iOS (if exists)
   rm ios/ChatApp/ChatApp.db
   ```

3. **Restart the app** and create new accounts

## 📱 **What You'll See After Migration**

### **For Existing Users:**
- Your existing account will have a **username** (derived from your email)
- You'll have a **default profile picture** (`😀`)
- You can **update your profile** in the Profile screen
- All your **existing messages** will be preserved

### **For New Signups:**
- **Choose your own username** (3-20 characters)
- **Select a profile picture** from emoji options
- **Enhanced validation** for all fields
- **Immediate access** to all new features

## 🔍 **Migration Logs**

When you restart the app, you'll see these logs in the console:

```
Database initialized successfully
Tables created successfully
Migrating database schema...
Database migration completed successfully
```

## 🎯 **Testing the Fix**

### **1. Test Existing Account:**
- **Login** with your existing email/password
- **Check** that you have a username (email prefix)
- **Verify** you have a default profile picture
- **Try** the new features (Find Friends, etc.)

### **2. Test New Signup:**
- **Create** a new account with username and profile picture
- **Verify** all new fields work correctly
- **Test** friend request functionality
- **Check** online status features

### **3. Test Friend System:**
- **Find** other users by username
- **Send** friend requests
- **Accept/decline** requests
- **Chat** with accepted friends

## 🛠️ **Troubleshooting**

### **If Migration Fails:**
1. **Check console logs** for specific error messages
2. **Try the fresh start option** (delete database file)
3. **Restart the app** and try again

### **If Username Conflicts:**
- The migration uses email prefixes as usernames
- If conflicts occur, you can **update your username** in the Profile screen
- **New signups** will get unique username validation

### **If Profile Picture Issues:**
- All existing users get the default `😀` emoji
- You can **change your profile picture** in the Profile screen
- **New signups** can select from various emoji options

## 🎉 **Expected Results**

After the migration, you should be able to:

✅ **Sign up** with username and profile picture  
✅ **Find friends** by username search  
✅ **Send friend requests** with messages  
✅ **Accept/decline** friend requests  
✅ **Chat** with verified friends only  
✅ **See real-time** online status  
✅ **Use all** the new enhanced features  

## 📞 **Need Help?**

If you encounter any issues:

1. **Check the console logs** for error messages
2. **Try the fresh start option** if migration fails
3. **Restart the app** and try again
4. **Check** that all database files are accessible

The migration system is designed to be **safe and reliable**, preserving all your existing data while adding the new features seamlessly! 🚀✨ 