import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => void;
  onSignup: (email: string, username: string, password: string, profilePicture?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onSignup }) => {
  const insets = useSafeAreaInsets();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSelectProfilePicture = () => {
    // For now, we'll use emoji avatars. In a real app, you'd use an image picker
    const avatars = ['😀', '😎', '🤔', '😍', '🤗', '🙂', '😊', '🤩', '😄', '🥳', '🤓', '😇'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setProfilePicture(randomAvatar);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username: string): boolean => {
    // Username should be 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const handleAuth = () => {
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    if (isLogin) {
      onLogin(email, password);
    } else {
      if (!validateUsername(username)) {
        Alert.alert('Invalid Username', 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match.');
        return;
      }

      if (!profilePicture) {
        Alert.alert('Profile Picture Required', 'Please select a profile picture.');
        return;
      }

      onSignup(email, username, password, profilePicture);
    }
  };

  const renderProfilePictureSection = () => {
    if (isLogin) return null;

    return (
      <View style={styles.profilePictureSection}>
        <Text style={styles.profilePictureLabel}>Profile Picture</Text>
        <TouchableOpacity 
          style={styles.profilePictureContainer}
          onPress={handleSelectProfilePicture}
        >
          {profilePicture ? (
            <Text style={styles.profilePictureEmoji}>{profilePicture}</Text>
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Text style={styles.profilePicturePlaceholderText}>📷</Text>
              <Text style={styles.profilePictureHint}>Tap to select</Text>
            </View>
          )}
        </TouchableOpacity>
        {profilePicture && (
          <TouchableOpacity onPress={handleSelectProfilePicture}>
            <Text style={styles.changeProfilePicture}>Change Picture</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 20, 40) }]}>
        <View style={styles.headerLogo}>
          <Text style={styles.headerLogoText}>💬</Text>
        </View>
        <Text style={styles.headerTitle}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isLogin ? 'Sign in to continue' : 'Join the conversation'}
        </Text>
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.toggleButtonText, isLogin && styles.toggleButtonTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.toggleButtonText, !isLogin && styles.toggleButtonTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {renderProfilePictureSection()}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.inputHint}>3-20 characters, letters, numbers, and underscores only</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
            <Text style={styles.authButtonText}>
              {isLogin ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
            </Text>
            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#075E54',
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLogoText: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E8F5E8',
    opacity: 0.9,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  formContainer: {
    padding: 30,
    paddingBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    padding: 4,
    marginBottom: 30,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#25D366',
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleButtonTextActive: {
    color: '#ffffff',
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075E54',
    marginBottom: 10,
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#25D366',
    marginBottom: 10,
  },
  profilePictureEmoji: {
    fontSize: 50,
  },
  profilePicturePlaceholder: {
    alignItems: 'center',
  },
  profilePicturePlaceholderText: {
    fontSize: 30,
    marginBottom: 5,
  },
  profilePictureHint: {
    fontSize: 12,
    color: '#666',
  },
  changeProfilePicture: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginLeft: 10,
  },
  eyeButton: {
    padding: 5,
  },
  eyeIcon: {
    fontSize: 18,
  },
  authButton: {
    backgroundColor: '#25D366',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  switchText: {
    fontSize: 16,
    color: '#666',
  },
  switchLink: {
    fontSize: 16,
    color: '#25D366',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AuthScreen; 