import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState as RNAppState, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './src/screens/SplashScreen';
import TermsScreen from './src/screens/TermsScreen';
import AuthScreen from './src/screens/AuthScreen';
import ChatInterface from './src/components/ChatInterface';
import NotificationPermissionRequest from './src/components/NotificationPermissionRequest';
import NotificationHandler from './src/components/NotificationHandler';
import DatabaseService, { User } from './src/database/DatabaseService';
import NotificationService from './src/services/NotificationService';

type AppState = 'splash' | 'terms' | 'auth' | 'main';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showNotificationPermission, setShowNotificationPermission] = useState(false);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    // Listen for app state changes to update user online status
    const subscription = RNAppState.addEventListener('change', (nextAppState) => {
      if (currentUser) {
        if (nextAppState === 'active') {
          // App came to foreground
          DatabaseService.updateUserOnlineStatus(currentUser.id, true);
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
          // App went to background
          DatabaseService.updateUserOnlineStatus(currentUser.id, false);
        }
      }
    });

    return () => subscription?.remove();
  }, [currentUser]);

  const initializeApp = async () => {
    try {
      await DatabaseService.initDatabase();
      
      // Initialize notification service
      await NotificationService.getInstance().initialize();
      
      // Check if notification permission is granted
      const isGranted = await NotificationService.getInstance().isPermissionGranted();
      setNotificationPermissionGranted(isGranted);
      
      console.log('App initialized successfully');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  const checkUserNotificationPermissionStatus = async (userId: number): Promise<boolean> => {
    try {
      return await NotificationService.getInstance().hasUserBeenAskedForPermission(userId);
    } catch (error) {
      console.error('Error checking notification permission status:', error);
      return false;
    }
  };

  const markUserNotificationPermissionAsked = async (userId: number): Promise<void> => {
    try {
      await NotificationService.getInstance().markUserAskedForPermission(userId);
    } catch (error) {
      console.error('Error marking notification permission as asked:', error);
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
        
        // Check if this user has already been asked for notification permission
        const hasBeenAsked = await checkUserNotificationPermissionStatus(user.id);
        
        // Show notification permission request only if:
        // 1. Permission is not granted AND
        // 2. User hasn't been asked before
        if (!notificationPermissionGranted && !hasBeenAsked) {
          setTimeout(() => {
            setShowNotificationPermission(true);
          }, 1000); // Show after 1 second
        }
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
      
      // For new users, always show notification permission request if not granted
      if (!notificationPermissionGranted) {
        setTimeout(() => {
          setShowNotificationPermission(true);
        }, 1000); // Show after 1 second
      }
      
      Alert.alert('Success', `Welcome to ChatApp, ${username}!`);
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('auth');
  };

  // Notification navigation handlers
  const handleNavigateToChat = (userId: number, username: string) => {
    // This will be handled by ChatInterface when it receives the navigation
    console.log('Navigate to chat with:', username, 'ID:', userId);
  };

  const handleNavigateToRequests = () => {
    // This will be handled by ChatInterface when it receives the navigation
    console.log('Navigate to friend requests');
  };

  const handleNavigateToCalls = () => {
    // This will be handled by ChatInterface when it receives the navigation
    console.log('Navigate to calls screen');
  };

  const handleNavigateToFriends = () => {
    // This will be handled by ChatInterface when it receives the navigation
    console.log('Navigate to friends list');
  };

  const handleIncomingCall = (userId: number, username: string, callId: string) => {
    // Handle incoming call notification
    console.log('Incoming call from:', username, 'ID:', userId, 'Call ID:', callId);
    // You can implement call handling logic here
  };

  const handleNotificationPermissionGranted = async () => {
    setNotificationPermissionGranted(true);
    setShowNotificationPermission(false);
    
    // Mark that this user has been asked for notification permission
    if (currentUser) {
      await markUserNotificationPermissionAsked(currentUser.id);
    }
  };

  const handleNotificationPermissionDenied = async () => {
    setShowNotificationPermission(false);
    
    // Mark that this user has been asked for notification permission (even if denied)
    if (currentUser) {
      await markUserNotificationPermissionAsked(currentUser.id);
    }
  };

  const renderCurrentScreen = () => {
    switch (appState) {
      case 'splash':
        return <SplashScreen onFinish={handleSplashFinish} />;
      case 'terms':
        return <TermsScreen onAgree={handleTermsAgree} />;
      case 'auth':
        return (
          <AuthScreen
            onLogin={handleLogin}
            onSignup={handleSignup}
          />
        );
      case 'main':
        return currentUser ? (
          <ChatInterface
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      {renderCurrentScreen()}
      
      {/* Notification Handler - handles notification taps and navigation */}
      <NotificationHandler
        onNavigateToChat={handleNavigateToChat}
        onNavigateToRequests={handleNavigateToRequests}
        onNavigateToCalls={handleNavigateToCalls}
        onNavigateToFriends={handleNavigateToFriends}
        onIncomingCall={handleIncomingCall}
      />
      
      <NotificationPermissionRequest
        visible={showNotificationPermission}
        onPermissionGranted={handleNotificationPermissionGranted}
        onPermissionDenied={handleNotificationPermissionDenied}
      />
    </SafeAreaProvider>
  );
};

export default App;
