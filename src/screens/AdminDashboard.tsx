import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService, { User } from '../database/DatabaseService';
import AdminNotificationBanner from '../components/AdminNotificationBanner';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'global' | 'individual';
  targetUserId?: number;
  isRead: boolean;
  createdAt: string;
  targetUsername?: string; // Added for individual notifications
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout }) => {
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'notifications' | 'settings'>('users');
  
  // Modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showUserEditModal, setShowUserEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotificationEditModal, setShowNotificationEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  // Form states
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'global' | 'individual'>('global');
  const [selectedTargetUser, setSelectedTargetUser] = useState<number | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adminNewUsername, setAdminNewUsername] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [editNotificationTitle, setEditNotificationTitle] = useState('');
  const [editNotificationMessage, setEditNotificationMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const allUsers = await DatabaseService.getAllUsers();
      setUsers(allUsers);
      
      // Load notifications with details (for admin view)
      const allNotifications = await DatabaseService.getAllNotificationsWithDetails();
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationDetails = async () => {
    try {
      // Load all notifications with target user details
      const allNotifications = await DatabaseService.getAllNotificationsWithDetails();
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Error loading notification details:', error);
    }
  };

  const handleDeleteUser = async (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.username}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteUser(user.id);
              Alert.alert('Success', 'User deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (user: User) => {
    try {
      if (user.isBlocked) {
        await DatabaseService.unblockUserByAdmin(user.id);
        Alert.alert('Success', 'User unblocked successfully');
      } else {
        await DatabaseService.blockUserByAdmin(user.id);
        Alert.alert('Success', 'User blocked successfully');
      }
      loadData();
    } catch (error) {
      console.error('Error blocking/unblocking user:', error);
      Alert.alert('Error', 'Failed to update user status');
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setNewUsername(user.username);
    setNewPassword('');
    setShowUserEditModal(true);
  };

  const handleSaveUserChanges = async () => {
    if (!selectedUser) return;

    try {
      if (newUsername.trim() && newUsername !== selectedUser.username) {
        await DatabaseService.updateUserUsername(selectedUser.id, newUsername.trim());
      }
      
      if (newPassword.trim()) {
        await DatabaseService.updateUserPassword(selectedUser.id, newPassword);
      }
      
      Alert.alert('Success', 'User updated successfully');
      setShowUserEditModal(false);
      loadData();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const handleCreateNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (notificationType === 'global') {
        await DatabaseService.createGlobalNotification(notificationTitle.trim(), notificationMessage.trim());
      } else {
        if (!selectedTargetUser) {
          Alert.alert('Error', 'Please select a target user');
          return;
        }
        await DatabaseService.createIndividualNotification(notificationTitle.trim(), notificationMessage.trim(), selectedTargetUser);
      }
      
      Alert.alert('Success', 'Notification created successfully');
      setShowNotificationModal(false);
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationType('global');
      setSelectedTargetUser(null);
      loadData();
    } catch (error) {
      console.error('Error creating notification:', error);
      Alert.alert('Error', 'Failed to create notification');
    }
  };

  const handleUpdateAdminCredentials = async () => {
    if (!adminNewUsername.trim() || !adminNewPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await DatabaseService.updateAdminCredentials(currentUser.id, adminNewUsername.trim(), adminNewPassword);
      Alert.alert('Success', 'Admin credentials updated successfully');
      setShowSettingsModal(false);
      setAdminNewUsername('');
      setAdminNewPassword('');
      onLogout(); // Logout to use new credentials
    } catch (error) {
      console.error('Error updating admin credentials:', error);
      Alert.alert('Error', 'Failed to update admin credentials');
    }
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setEditNotificationTitle(notification.title);
    setEditNotificationMessage(notification.message);
    setShowNotificationEditModal(true);
  };

  const handleDeleteNotification = async (notification: Notification) => {
    Alert.alert(
      'Delete Notification',
      `Are you sure you want to delete "${notification.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteNotification(notification.id);
              Alert.alert('Success', 'Notification deleted successfully');
              loadData();
            } catch (error) {
              console.error('Error deleting notification:', error);
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleUpdateNotification = async () => {
    if (!selectedNotification || !editNotificationTitle.trim() || !editNotificationMessage.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await DatabaseService.updateNotification(
        selectedNotification.id,
        editNotificationTitle.trim(),
        editNotificationMessage.trim()
      );
      
      Alert.alert('Success', 'Notification updated successfully');
      setShowNotificationEditModal(false);
      setSelectedNotification(null);
      setEditNotificationTitle('');
      setEditNotificationMessage('');
      loadData();
    } catch (error) {
      console.error('Error updating notification:', error);
      Alert.alert('Error', 'Failed to update notification');
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userStatus}>
          <Text style={[styles.statusDot, item.isOnline && styles.onlineDot]} />
          <Text style={styles.statusText}>
            {item.isBlocked ? 'Blocked' : item.isOnline ? 'Online' : 'Offline'}
          </Text>
          {item.isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(item)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, item.isBlocked ? styles.unblockButton : styles.blockButton]}
          onPress={() => handleBlockUser(item)}
        >
          <Text style={styles.actionButtonText}>
            {item.isBlocked ? 'Unblock' : 'Block'}
          </Text>
        </TouchableOpacity>
        {!item.isAdmin && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <View style={styles.notificationActions}>
          <TouchableOpacity
            style={[styles.notificationActionButton, styles.editActionButton]}
            onPress={() => handleEditNotification(item)}
          >
            <Text style={styles.notificationActionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.notificationActionButton, styles.deleteActionButton]}
            onPress={() => handleDeleteNotification(item)}
          >
            <Text style={styles.notificationActionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <View style={styles.notificationFooter}>
        <View style={styles.notificationDetails}>
          <View style={styles.notificationInfo}>
            <Text style={styles.notificationType}>
              📢 {item.type === 'global' ? 'Global' : 'Individual'}
            </Text>
            <Text style={styles.infoText}>
              📅 Created: {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={styles.notificationStatus}>
            <Text style={[styles.statusBadge, item.isRead ? styles.readStatus : styles.unreadStatus]}>
              {item.isRead ? '✅ Read' : '⏳ Unread'}
            </Text>
          </View>
        </View>
        {item.type === 'individual' && item.targetUserId && (
          <View style={styles.targetUserInfo}>
            <Text style={styles.targetUserLabel}>🎯 Sent to:</Text>
            <Text style={styles.targetUserName}>
              {users.find(u => u.id === item.targetUserId)?.username || `User ID: ${item.targetUserId}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Admin Notification Banner */}
      <AdminNotificationBanner currentUser={currentUser} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>
            Users ({users.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Notifications
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'users' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Manage Users</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowNotificationModal(true)}
              >
                <Text style={styles.createButtonText}>Create Notification</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'notifications' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowNotificationModal(true)}
              >
                <Text style={styles.createButtonText}>Create New</Text>
              </TouchableOpacity>
            </View>
            
            {/* Notification Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{notifications.length}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {notifications.filter(n => n.type === 'global').length}
                </Text>
                <Text style={styles.statLabel}>Global</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {notifications.filter(n => n.type === 'individual').length}
                </Text>
                <Text style={styles.statLabel}>Individual</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {notifications.filter(n => !n.isRead).length}
                </Text>
                <Text style={styles.statLabel}>Unread</Text>
              </View>
            </View>
            
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Admin Settings</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettingsModal(true)}
            >
              <Text style={styles.settingsButtonText}>Change Admin Credentials</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Notification Modal */}
      <Modal visible={showNotificationModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create Notification</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              value={notificationTitle}
              onChangeText={setNotificationTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notification Message"
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              multiline
              numberOfLines={3}
            />

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, notificationType === 'global' && styles.activeTypeButton]}
                onPress={() => setNotificationType('global')}
              >
                <Text style={[styles.typeButtonText, notificationType === 'global' && styles.activeTypeButtonText]}>
                  Global
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, notificationType === 'individual' && styles.activeTypeButton]}
                onPress={() => setNotificationType('individual')}
              >
                <Text style={[styles.typeButtonText, notificationType === 'individual' && styles.activeTypeButtonText]}>
                  Individual
                </Text>
              </TouchableOpacity>
            </View>

            {notificationType === 'individual' && (
              <View style={styles.userSelector}>
                <Text style={styles.selectorLabel}>Select User:</Text>
                <ScrollView style={styles.userList}>
                  {users.filter(u => !u.isAdmin).map(user => (
                    <TouchableOpacity
                      key={user.id}
                      style={[styles.userOption, selectedTargetUser === user.id && styles.selectedUserOption]}
                      onPress={() => setSelectedTargetUser(user.id)}
                    >
                      <Text style={[styles.userOptionText, selectedTargetUser === user.id && styles.selectedUserOptionText]}>
                        {user.username}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNotificationModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateNotification}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* User Edit Modal */}
      <Modal visible={showUserEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit User</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={newUsername}
              onChangeText={setNewUsername}
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password (leave blank to keep current)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUserEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveUserChanges}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Change Admin Credentials</Text>
            
            <TextInput
              style={styles.input}
              placeholder="New Username"
              value={adminNewUsername}
              onChangeText={setAdminNewUsername}
            />
            
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={adminNewPassword}
              onChangeText={setAdminNewPassword}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateAdminCredentials}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Edit Modal */}
      <Modal visible={showNotificationEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Notification</Text>
            
            <Text style={styles.modalSubtitle}>
              {selectedNotification?.type === 'global' ? '📢 Global Notification' : '👤 Individual Notification'}
              {selectedNotification?.targetUsername && ` - To: ${selectedNotification.targetUsername}`}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              value={editNotificationTitle}
              onChangeText={setEditNotificationTitle}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notification Message"
              value={editNotificationMessage}
              onChangeText={setEditNotificationMessage}
              multiline
              numberOfLines={4}
            />

            <View style={styles.notificationInfo}>
              <Text style={styles.infoText}>
                📅 Created: {selectedNotification ? new Date(selectedNotification.createdAt).toLocaleString() : ''}
              </Text>
              <Text style={styles.infoText}>
                📊 Status: {selectedNotification?.isRead ? '✅ Read' : '⏳ Unread'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowNotificationEditModal(false);
                  setSelectedNotification(null);
                  setEditNotificationTitle('');
                  setEditNotificationMessage('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateNotification}
              >
                <Text style={styles.saveButtonText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#075E54',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#D32F2F',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#25D366',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#25D366',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  createButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  userItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#25D366',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  adminBadge: {
    backgroundColor: '#FF9800',
    color: '#ffffff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 10,
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  blockButton: {
    backgroundColor: '#FF9800',
  },
  unblockButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  notificationItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  notificationActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editActionButton: {
    backgroundColor: '#2196F3',
  },
  deleteActionButton: {
    backgroundColor: '#F44336',
  },
  notificationActionButtonText: {
    fontSize: 14,
    color: '#ffffff',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  notificationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationStatus: {
    marginLeft: 10,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readStatus: {
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
  },
  unreadStatus: {
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
  },
  targetUserInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetUserLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 5,
  },
  targetUserName: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25D366',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsButton: {
    backgroundColor: '#25D366',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  settingsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeTypeButton: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeTypeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  userSelector: {
    marginBottom: 15,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  userList: {
    maxHeight: 150,
  },
  userOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 5,
    borderRadius: 6,
  },
  selectedUserOption: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  userOptionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  selectedUserOptionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#25D366',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  notificationType: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

export default AdminDashboard; 