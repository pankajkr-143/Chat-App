import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import TermsScreen from './src/screens/TermsScreen';
import AuthScreen from './src/screens/AuthScreen';
import ChatInterface from './src/components/ChatInterface';
import DatabaseService from './src/database/DatabaseService';

type AppState = 'splash' | 'terms' | 'auth' | 'main';

export default function App() {
  const [currentState, setCurrentState] = useState<AppState>('splash');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await DatabaseService.initDatabase();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      Alert.alert('Error', 'Failed to initialize database');
    }
  };

  const handleSplashFinish = () => {
    setCurrentState('terms');
  };

  const handleTermsAgree = () => {
    setCurrentState('auth');
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const user = await DatabaseService.validateUser(email, password);
      if (user) {
        setCurrentUser(user);
        setCurrentState('main');
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Error', 'Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Login failed. Please try again.');
    }
  };

  const handleSignup = async (email: string, password: string) => {
    try {
      const user = await DatabaseService.createUser(email, password);
      setCurrentUser(user);
      setCurrentState('main');
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        Alert.alert('Error', 'User with this email already exists');
      } else {
        Alert.alert('Error', 'Signup failed. Please try again.');
      }
    }
  };

  const renderCurrentScreen = () => {
    switch (currentState) {
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
        return (
          <ChatInterface currentUser={currentUser} />
        );
      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
});
