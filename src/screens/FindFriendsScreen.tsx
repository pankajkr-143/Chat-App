import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import DatabaseService, { User } from '../database/DatabaseService';

interface FindFriendsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const FindFriendsScreen: React.FC<FindFriendsScreenProps> = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [requestStatuses, setRequestStatuses] = useState<{[key: number]: string}>({});

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setFilteredUsers([]);
    }
  }, [searchQuery]);

  const loadUsers = async () => {
    try {
      const allUsers = await DatabaseService.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
      setUsers(otherUsers);
      
      // Load request statuses for all users
      const statuses: {[key: number]: string} = {};
      for (const user of otherUsers) {
        const status = await DatabaseService.getFriendRequestStatus(currentUser.id, user.id);
        const isFriend = await DatabaseService.areFriends(currentUser.id, user.id);
        
        if (isFriend) {
          statuses[user.id] = 'friends';
        } else if (status) {
          statuses[user.id] = status;
        } else {
          statuses[user.id] = 'none';
        }
      }
      setRequestStatuses(statuses);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setFilteredUsers([]);
      return;
    }

    try {
      const searchResults = await DatabaseService.searchUsersByUsername(searchQuery, currentUser.id);
      setFilteredUsers(searchResults);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSendFriendRequest = async (user: User) => {
    Alert.prompt(
      'Send Friend Request',
      `Send a friend request to ${user.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (message?: string) => {
            try {
              await DatabaseService.sendFriendRequest(currentUser.id, user.id, message);
              setRequestStatuses(prev => ({
                ...prev,
                [user.id]: 'pending'
              }));
              Alert.alert('Success', `Friend request sent to ${user.username}!`);
            } catch (error) {
              console.error('Error sending friend request:', error);
              Alert.alert('Error', 'Failed to send friend request. Please try again.');
            }
          }
        }
      ],
      'plain-text',
      '',
      'Add a message (optional)'
    );
  };

  const getActionButton = (user: User) => {
    const status = requestStatuses[user.id] || 'none';

    switch (status) {
      case 'friends':
        return (
          <View style={[styles.actionButton, styles.friendsButton]}>
            <Text style={styles.friendsButtonText}>Friends ✓</Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.actionButton, styles.pendingButton]}>
            <Text style={styles.pendingButtonText}>Request Sent</Text>
          </View>
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

  const renderUserItem = ({ item }: { item: User }) => (
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

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🔍</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No users found' : 'Search for friends'}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searchQuery 
          ? `No users found matching "${searchQuery}"`
          : 'Enter a username to find new friends to connect with'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search by username..."
      />

      {/* Users List */}
      <View style={styles.content}>
        {filteredUsers.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.usersList}
            contentContainerStyle={styles.usersContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
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
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  userAvatarEmoji: {
    fontSize: 30,
  },
  userInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
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
    fontWeight: '500',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: '#FFC107',
  },
  pendingButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  friendsButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  friendsButtonText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '600',
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