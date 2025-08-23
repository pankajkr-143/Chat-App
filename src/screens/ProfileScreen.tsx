import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { User } from '../database/DatabaseService';

interface ProfileScreenProps {
  currentUser: User;
  onBack: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ currentUser, onBack }) => {
  const [isOnline, setIsOnline] = useState(true);

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing feature coming soon!');
  };

  const handleChangeAvatar = () => {
    Alert.alert('Change Avatar', 'Avatar change feature coming soon!');
  };

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Privacy settings feature coming soon!');
  };

  const handleAccountSettings = () => {
    Alert.alert('Account Settings', 'Account settings feature coming soon!');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') }
      ]
    );
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser.email.charAt(0).toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={styles.editAvatarButton} onPress={handleChangeAvatar}>
          <Text style={styles.editAvatarText}>📷</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.userName}>{currentUser.email}</Text>
      <View style={styles.statusContainer}>
        <View style={[styles.statusIndicator, isOnline && styles.onlineIndicator]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMenuSection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>Account</Text>
      
      <TouchableOpacity style={styles.menuItem} onPress={handlePrivacySettings}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>🔒</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Privacy & Security</Text>
          <Text style={styles.menuSubtitle}>Manage your privacy settings</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleAccountSettings}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>⚙️</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Account Settings</Text>
          <Text style={styles.menuSubtitle}>Manage your account</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>📱</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Notifications</Text>
          <Text style={styles.menuSubtitle}>Manage notification preferences</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>💾</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Storage & Data</Text>
          <Text style={styles.menuSubtitle}>Manage storage and data usage</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSupportSection = () => (
    <View style={styles.menuSection}>
      <Text style={styles.sectionTitle}>Support</Text>
      
      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>❓</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Help Center</Text>
          <Text style={styles.menuSubtitle}>Get help and support</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>📧</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Contact Us</Text>
          <Text style={styles.menuSubtitle}>Reach out to our team</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <View style={styles.menuIcon}>
          <Text style={styles.menuIconText}>⭐</Text>
        </View>
        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>Rate App</Text>
          <Text style={styles.menuSubtitle}>Rate us on app store</Text>
        </View>
        <Text style={styles.menuArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLogoutSection = () => (
    <View style={styles.menuSection}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileSection()}
        {renderMenuSection()}
        {renderSupportSection()}
        {renderLogoutSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#25D366',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#075E54',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  editAvatarText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#999',
    marginRight: 8,
  },
  onlineIndicator: {
    backgroundColor: '#25D366',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  editProfileButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  editProfileText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075E54',
    padding: 20,
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuArrow: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    margin: 20,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 