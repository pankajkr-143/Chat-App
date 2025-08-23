import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput } from 'react-native';
import { User } from '../database/DatabaseService';

interface ProfileScreenProps {
  currentUser: User;
  onBack: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ currentUser, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(currentUser.username);
  const [editedProfilePicture, setEditedProfilePicture] = useState(currentUser.profilePicture || '😀');

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    if (!editedUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (editedUsername.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return;
    }

    // In a real app, you would save this to the database
    Alert.alert('Success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedUsername(currentUser.username);
    setEditedProfilePicture(currentUser.profilePicture || '😀');
    setIsEditing(false);
  };

  const handleChangeProfilePicture = () => {
    const avatars = ['😀', '😎', '🤔', '😍', '🤗', '🙂', '😊', '🤩', '😄', '🥳', '🤓', '😇'];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setEditedProfilePicture(randomAvatar);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // In a real app, you would handle logout here
          Alert.alert('Logged Out', 'You have been logged out successfully');
        }}
      ]
    );
  };

  const handleMenuAction = (action: string) => {
    Alert.alert('Action', `${action} feature will be implemented soon!`);
  };

  const renderProfileSection = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarEmoji}>
            {isEditing ? editedProfilePicture : (currentUser.profilePicture || '😀')}
          </Text>
          {isEditing && (
            <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeProfilePicture}>
              <Text style={styles.changeAvatarText}>📷</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          {isEditing ? (
            <TextInput
              style={styles.usernameInput}
              value={editedUsername}
              onChangeText={setEditedUsername}
              placeholder="Enter username"
              placeholderTextColor="#999"
              maxLength={20}
            />
          ) : (
            <Text style={styles.profileName}>{currentUser.username}</Text>
          )}
          <Text style={styles.profileEmail}>{currentUser.email}</Text>
          <Text style={styles.profileStatus}>
            {currentUser.isOnline ? '🟢 Online' : '⚫ Offline'}
          </Text>
        </View>
      </View>

      <View style={styles.profileActions}>
        {isEditing ? (
          <>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderMenuSection = (title: string, items: Array<{icon: string, label: string, action: string}>) => (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          onPress={() => handleMenuAction(item.action)}
        >
          <Text style={styles.menuItemIcon}>{item.icon}</Text>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          <Text style={styles.menuItemArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderProfileSection()}

        {renderMenuSection('Account', [
          { icon: '🔒', label: 'Privacy', action: 'Privacy Settings' },
          { icon: '⚙️', label: 'Settings', action: 'App Settings' },
          { icon: '🔔', label: 'Notifications', action: 'Notification Preferences' },
          { icon: '💾', label: 'Storage', action: 'Storage Management' },
        ])}

        {renderMenuSection('Support', [
          { icon: '❓', label: 'Help', action: 'Help Center' },
          { icon: '📧', label: 'Contact Us', action: 'Contact Support' },
          { icon: '⭐', label: 'Rate App', action: 'Rate on Store' },
        ])}

        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
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
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#25D366',
    position: 'relative',
  },
  profileAvatarEmoji: {
    fontSize: 40,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  changeAvatarText: {
    fontSize: 14,
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  usernameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#25D366',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileStatus: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '600',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  menuSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#999',
  },
  logoutSection: {
    margin: 20,
    marginTop: 0,
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
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
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileScreen; 