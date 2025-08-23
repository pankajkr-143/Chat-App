# ChatApp - React Native Chat Application

A modern chat application built with React Native and SQLite3 database, featuring user authentication, real-time messaging, and a beautiful UI.

## Features

### 🔐 Authentication System
- **User Registration**: Create new accounts with email and password
- **User Login**: Secure authentication with existing credentials
- **Password Validation**: Minimum 6 characters required
- **Email Validation**: Proper email format verification

### 📱 User Interface
- **Splash Screen**: Animated welcome screen with app branding
- **Terms & Conditions**: Scrollable terms with agreement requirement
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Responsive Layout**: Optimized for both iOS and Android

### 💬 Chat Functionality
- **Real-time Messaging**: Send and receive messages instantly
- **User Selection**: Choose from available users to chat with
- **Message History**: Persistent chat history stored locally
- **Message Status**: Read/unread message indicators
- **Timestamp Display**: Message timing information

### 🗄️ Database
- **SQLite3 Integration**: Local database for data persistence
- **User Management**: Secure user account storage
- **Message Storage**: Persistent chat message storage
- **Data Integrity**: Foreign key constraints and validation

## Screenshots

The app includes:
1. **Splash Screen** - Animated logo and app name
2. **Terms & Conditions** - Scrollable terms with agree button
3. **Login/Signup** - Combined authentication screen
4. **Chat Interface** - Main messaging interface

## Installation

### Prerequisites
- Node.js (v18 or higher)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional dependencies**
   ```bash
   npm install react-native-sqlite-storage @react-navigation/native @react-navigation/stack react-native-screens react-native-gesture-handler react-native-vector-icons
   npm install --save-dev @types/react-native-sqlite-storage
   ```

4. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

5. **Run the application**
   ```bash
   # For Android
   npm run android
   
   # For iOS
   npm run ios
   ```

## Project Structure

```
CApp/
├── src/
│   ├── components/
│   │   └── ChatInterface.tsx      # Main chat interface
│   ├── database/
│   │   └── DatabaseService.ts     # SQLite database operations
│   ├── screens/
│   │   ├── SplashScreen.tsx       # App splash screen
│   │   ├── TermsScreen.tsx        # Terms and conditions
│   │   └── AuthScreen.tsx         # Login/signup screen
│   └── navigation/                 # Navigation components
├── App.tsx                         # Main app component
├── package.json                    # Dependencies and scripts
└── README.md                       # This file
```

## Database Schema

### Users Table
- `id`: Primary key (auto-increment)
- `email`: Unique email address
- `password`: User password (stored as plain text for demo)
- `createdAt`: Account creation timestamp

### Chat Messages Table
- `id`: Primary key (auto-increment)
- `senderId`: Foreign key to users table
- `receiverId`: Foreign key to users table
- `message`: Message content
- `timestamp`: Message timestamp
- `isRead`: Read status boolean

## Usage

### First Time Setup
1. Launch the app
2. Wait for splash screen animation
3. Read and agree to terms & conditions
4. Create a new account or sign in

### Using the Chat
1. After authentication, you'll see available users
2. Select a user to start chatting
3. Type your message and tap send
4. View chat history and send/receive messages

### Creating Multiple Users
To test the chat functionality:
1. Create multiple accounts with different email addresses
2. Sign in with different accounts on different devices/emulators
3. Start chatting between users

## Security Notes

⚠️ **Important**: This is a demo application with basic security:
- Passwords are stored as plain text (not recommended for production)
- No encryption for messages
- Local database only (no cloud sync)

For production use, implement:
- Password hashing (bcrypt, Argon2)
- End-to-end encryption
- Secure API endpoints
- JWT or OAuth authentication

## Troubleshooting

### Common Issues

1. **Database initialization fails**
   - Ensure SQLite is properly linked
   - Check device/emulator permissions

2. **Build errors**
   - Clean and rebuild: `cd android && ./gradlew clean && cd ..`
   - Reset Metro cache: `npx react-native start --reset-cache`

3. **Navigation issues**
   - Ensure all navigation dependencies are installed
   - Check iOS pod installation

### Performance Tips

- Messages are loaded on-demand
- Database operations are asynchronous
- UI updates are optimized with React Native best practices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review React Native documentation

---

Built with ❤️ using React Native and SQLite3
# Chat-App
