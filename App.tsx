import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Alert, AppState as RNAppState } from 'react-native';

import SplashScreen from './src/screens/SplashScreen';
import TermsScreen from './src/screens/TermsScreen';
import AuthScreen from './src/screens/AuthScreen';
import ChatInterface from './src/components/ChatInterface';
import DatabaseService, { User } from './src/database/DatabaseService';

type AppState = 'splash' | 'terms' | 'auth' | 'main';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    initializeApp();

    // Handle app state changes for online status
    const subscription = RNAppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      // Set user offline when app is closed
      if (currentUser) {
        DatabaseService.updateUserOnlineStatus(currentUser.id, false);
      }
    };
  }, []);

  useEffect(() => {
    // Update online status when currentUser changes
    if (currentUser) {
      DatabaseService.updateUserOnlineStatus(currentUser.id, true);
    }
  }, [currentUser]);

  const handleAppStateChange = (nextAppState: string) => {
    if (currentUser) {
      if (nextAppState === 'active') {
        // App came to foreground, set user online
        DatabaseService.updateUserOnlineStatus(currentUser.id, true);
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App went to background, set user offline
        DatabaseService.updateUserOnlineStatus(currentUser.id, false);
      }
    }
  };

  const initializeApp = async () => {
    try {
      await DatabaseService.initDatabase();
      console.log('App initialized successfully');
    } catch (error) {
      console.error('App initialization failed:', error);
      Alert.alert('Error', 'Failed to initialize the app. Please restart.');
    }
  };

  const handleSplashFinish = () => {
    setAppState('terms');
  };

  const handleTermsAgree = () => {
    setAppState('auth');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await DatabaseService.validateUser(email, password);
      if (user) {
        setCurrentUser(user);
        setAppState('main');
      } else {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  const handleSignup = async (email: string, username: string, password: string, profilePicture?: string) => {
    try {
      // Check if email already exists
      const existingUserByEmail = await DatabaseService.getUserByEmail(email);
      if (existingUserByEmail) {
        Alert.alert('Signup Failed', 'An account with this email already exists.');
        return;
      }

      // Check if username already exists
      const existingUserByUsername = await DatabaseService.getUserByUsername(username);
      if (existingUserByUsername) {
        Alert.alert('Signup Failed', 'This username is already taken. Please choose another one.');
        return;
      }

      const user = await DatabaseService.createUser(email, username, password, profilePicture);
      setCurrentUser(user);
      setAppState('main');
      Alert.alert('Success', `Welcome to ChatApp, ${username}!`);
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  };

  const handleLogout = () => {
    // Clear current user and return to auth screen
    setCurrentUser(null);
    setAppState('auth');

    // Show logout confirmation
    Alert.alert('Logged Out', 'You have been logged out successfully. Please sign in again to continue.');
  };

  const renderCurrentScreen = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'terms':
        return <TermsScreen onAgree={handleTermsAgree} />;
      case 'auth':
        return <AuthScreen onLogin={handleLogin} onSignup={handleSignup} />;
      case 'main':
        return currentUser ? <ChatInterface currentUser={currentUser} onLogout={handleLogout} /> : null;
      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return (
    <SafeAreaProvider>
      {renderCurrentScreen()}
    </SafeAreaProvider>
  );
};

export default App;
