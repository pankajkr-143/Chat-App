import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import DatabaseService, { User } from '../database/DatabaseService';
import SearchBar from '../components/SearchBar';

interface FindFriendsScreenProps {
  currentUser: User;
  onBack: () => void;
}

interface UserWithStatus extends User {
  requestStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'friends';
}

const FindFriendsScreen: React.FC<FindFriendsScreenProps> = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sendingRequest, setSendingRequest] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setFilteredUsers([]);
    }
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await DatabaseService.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
      
      // Load request statuses for all users
      const usersWithStatus: UserWithStatus[] = [];
      for (const user of otherUsers) {
        const status = await getFriendStatus(user.id);
        usersWithStatus.push({
          ...user,
          requestStatus: status,
        });
      }
      
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFriendStatus = async (userId: number): Promise<'none' | 'pending' | 'accepted' | 'declined' | 'friends'> => {
    try {
      // Check if already friends
      const areFriends = await DatabaseService.areFriends(currentUser.id, userId);
      if (areFriends) return 'friends';

      // Check friend request status (sent by current user)
      const sentRequestStatus = await DatabaseService.getFriendRequestStatus(currentUser.id, userId);
      if (sentRequestStatus) {
        return sentRequestStatus as 'pending' | 'accepted' | 'declined';
      }

      // Check if there's a received request (sent by other user)
      const receivedRequestStatus = await DatabaseService.getFriendRequestStatus(userId, currentUser.id);
      if (receivedRequestStatus === 'pending') {
        return 'pending'; // Show as pending if we received a request from them
      }

      return 'none';
    } catch (error) {
      console.error('Error getting friend status:', error);
      return 'none';
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }

    try {
      setSearching(true);
      Keyboard.dismiss();
      
      const searchResults = await DatabaseService.searchUsersByUsername(searchQuery, currentUser.id);
      
      // Load statuses for search results
      const usersWithStatus: UserWithStatus[] = [];
      for (const user of searchResults) {
        const status = await getFriendStatus(user.id);
        usersWithStatus.push({
          ...user,
          requestStatus: status,
        });
      }
      
      setFilteredUsers(usersWithStatus);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (user: UserWithStatus) => {
    setSendingRequest(user.id);
    
    try {
      // Send the friend request
      await DatabaseService.sendFriendRequest(currentUser.id, user.id, `Hi ${user.username}! I'd like to connect with you.`);
      
      // Update the user's status locally
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, requestStatus: 'pending' as const } : u
      );
      setUsers(updatedUsers);
      
      const updatedFilteredUsers = filteredUsers.map(u => 
        u.id === user.id ? { ...u, requestStatus: 'pending' as const } : u
      );
      setFilteredUsers(updatedFilteredUsers);
      
      // Show success message
      Alert.alert(
        'Request Sent!', 
        `Friend request sent to ${user.username} successfully!`,
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    } finally {
      setSendingRequest(null);
    }
  };

  const handleSendFriendRequestWithPrompt = (user: UserWithStatus) => {
    Alert.prompt(
      'Send Friend Request',
      `Send a friend request to ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message?: string) => {
            setSendingRequest(user.id);
            
            try {
              const requestMessage = message?.trim() || `Hi ${user.username}! I'd like to connect with you.`;
              await DatabaseService.sendFriendRequest(currentUser.id, user.id, requestMessage);
              
              // Update the user's status locally
              const updatedUsers = users.map(u => 
                u.id === user.id ? { ...u, requestStatus: 'pending' as const } : u
              );
              setUsers(updatedUsers);
              
              const updatedFilteredUsers = filteredUsers.map(u => 
                u.id === user.id ? { ...u, requestStatus: 'pending' as const } : u
              );
              setFilteredUsers(updatedFilteredUsers);
              
              Alert.alert('Request Sent!', `Friend request sent to ${user.username} successfully!`);
            } catch (error) {
              console.error('Error sending friend request:', error);
              Alert.alert('Error', 'Failed to send friend request. Please try again.');
            } finally {
              setSendingRequest(null);
            }
          }
        }
      ],
      'plain-text',
      '',
      'Add a message (optional)'
    );
  };

  const handleCancelRequest = async (user: UserWithStatus) => {
    Alert.alert(
      'Cancel Friend Request',
      `Cancel friend request to ${user.username}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real app, you would have a cancel request method
              // For now, we'll just update the local state
              const updatedUsers = users.map(u => 
                u.id === user.id ? { ...u, requestStatus: 'none' as const } : u
              );
              setUsers(updatedUsers);
              
              const updatedFilteredUsers = filteredUsers.map(u => 
                u.id === user.id ? { ...u, requestStatus: 'none' as const } : u
              );
              setFilteredUsers(updatedFilteredUsers);
              
              Alert.alert('Cancelled', 'Friend request cancelled.');
            } catch (error) {
              console.error('Error cancelling friend request:', error);
              Alert.alert('Error', 'Failed to cancel friend request. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getActionButton = (user: UserWithStatus) => {
    const isLoading = sendingRequest === user.id;
    
    if (isLoading) {
      return (
        <View style={[styles.actionButton, styles.loadingButton]}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      );
    }

    switch (user.requestStatus) {
      case 'friends':
        return (
          <View style={[styles.actionButton, styles.friendsButton]}>
            <Text style={styles.friendsButtonText}>Friends ✓</Text>
          </View>
        );
      case 'pending':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.pendingButton]} 
            onPress={() => handleCancelRequest(user)}
            activeOpacity={0.7}
          >
            <Text style={styles.pendingButtonText}>Pending</Text>
          </TouchableOpacity>
        );
      case 'accepted':
        return (
          <View style={[styles.actionButton, styles.friendsButton]}>
            <Text style={styles.friendsButtonText}>Friends ✓</Text>
          </View>
        );
      case 'declined':
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]} 
            onPress={() => handleSendFriendRequest(user)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Send Request</Text>
          </TouchableOpacity>
        );
      default:
        return (
          <TouchableOpacity 
            style={[styles.actionButton, styles.addButton]} 
            onPress={() => handleSendFriendRequest(user)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Send Request</Text>
          </TouchableOpacity>
        );
    }
  };

  const renderUserItem = ({ item }: { item: UserWithStatus }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          {item.profilePicture ? (
            <Text style={styles.userAvatarEmoji}>{item.profilePicture}</Text>
          ) : (
            <Text style={styles.userInitial}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.username}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, item.isOnline && styles.onlineDot]} />
            <Text style={styles.userStatus}>
              {item.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </View>
      {getActionButton(item)}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.emptyStateTitle}>Loading users...</Text>
        </View>
      );
    }

    if (searching) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.emptyStateTitle}>Searching...</Text>
        </View>
      );
    }

    if (searchQuery && filteredUsers.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>No users found</Text>
          <Text style={styles.emptyStateSubtitle}>
            No users found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>👥</Text>
        <Text style={styles.emptyStateTitle}>Search for friends</Text>
        <Text style={styles.emptyStateSubtitle}>
          Enter a username to find new friends to connect with
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <SearchBar
        onSearch={setSearchQuery}
        placeholder="Search by username..."
        autoFocus={false}
      />
      
      <View style={styles.content}>
        {filteredUsers.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.usersList}
            contentContainerStyle={styles.usersContent}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  content: {
    flex: 1,
  },
  usersList: {
    flex: 1,
  },
  usersContent: {
    padding: 20,
    paddingTop: 10,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  userAvatarEmoji: {
    fontSize: 24,
  },
  userInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userStatus: {
    fontSize: 12,
    color: '#666',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#25D366',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingButton: {
    backgroundColor: '#FFA500',
  },
  pendingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsButton: {
    backgroundColor: '#128C7E',
  },
  friendsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingButton: {
    backgroundColor: '#25D366',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default FindFriendsScreen; 