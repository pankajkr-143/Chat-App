import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import DatabaseService, { User, FriendRequest } from '../database/DatabaseService';

interface RequestsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const RequestsScreen: React.FC<RequestsScreenProps> = ({ currentUser, onBack }) => {
  const [requests, setRequests] = useState<Array<FriendRequest & { fromUser: User }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriendRequests();
  }, []);

  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      const friendRequests = await DatabaseService.getFriendRequests(currentUser.id);
      setRequests(friendRequests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = (request: FriendRequest & { fromUser: User }) => {
    Alert.alert(
      'Accept Friend Request',
      `Accept friend request from ${request.fromUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: async () => {
            try {
              await DatabaseService.respondToFriendRequest(request.id, 'accepted');
              setRequests(prev => prev.filter(r => r.id !== request.id));
              Alert.alert('Success', `You are now friends with ${request.fromUser.username}!`);
            } catch (error) {
              console.error('Error accepting friend request:', error);
              Alert.alert('Error', 'Failed to accept friend request. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeclineRequest = (request: FriendRequest & { fromUser: User }) => {
    Alert.alert(
      'Decline Friend Request',
      `Decline friend request from ${request.fromUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.respondToFriendRequest(request.id, 'declined');
              setRequests(prev => prev.filter(r => r.id !== request.id));
              Alert.alert('Declined', 'Friend request declined.');
            } catch (error) {
              console.error('Error declining friend request:', error);
              Alert.alert('Error', 'Failed to decline friend request. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleBlockUser = (request: FriendRequest & { fromUser: User }) => {
    Alert.alert(
      'Block User',
      `Block ${request.fromUser.username}? This will prevent them from sending you requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.respondToFriendRequest(request.id, 'blocked');
              setRequests(prev => prev.filter(r => r.id !== request.id));
              Alert.alert('Blocked', `${request.fromUser.username} has been blocked.`);
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return '👤';
      case 'group_invite':
        return '👥';
      case 'message_request':
        return '💬';
      default:
        return '📨';
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'friend_request':
        return 'Friend Request';
      case 'group_invite':
        return 'Group Invite';
      case 'message_request':
        return 'Message Request';
      default:
        return 'Request';
    }
  };

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'friend_request':
        return '#25D366';
      case 'group_invite':
        return '#128C7E';
      case 'message_request':
        return '#075E54';
      default:
        return '#666';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderRequestItem = ({ item }: { item: FriendRequest & { fromUser: User } }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            {item.fromUser.profilePicture ? (
              <Text style={styles.userAvatarEmoji}>{item.fromUser.profilePicture}</Text>
            ) : (
              <Text style={styles.userInitial}>
                {item.fromUser.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.fromUser.username}</Text>
            <Text style={styles.userEmail}>{item.fromUser.email}</Text>
            <View style={styles.requestTypeContainer}>
              <Text style={styles.requestTypeIcon}>
                {getRequestTypeIcon('friend_request')}
              </Text>
              <Text style={[
                styles.requestTypeText,
                { color: getRequestTypeColor('friend_request') }
              ]}>
                {getRequestTypeText('friend_request')}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      
      {item.message && (
        <Text style={styles.requestMessage}>"{item.message}"</Text>
      )}
      
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item)}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.blockButton]}
          onPress={() => handleBlockUser(item)}
        >
          <Text style={styles.blockButtonText}>Block</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📨</Text>
      <Text style={styles.emptyStateTitle}>No requests</Text>
      <Text style={styles.emptyStateSubtitle}>
        You don't have any pending friend requests at the moment
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>⏳</Text>
      <Text style={styles.emptyStateTitle}>Loading...</Text>
      <Text style={styles.emptyStateSubtitle}>
        Loading your friend requests
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>
          {requests.length} Request{requests.length !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.headerSubtitle}>
          Manage your friend requests and invitations
        </Text>
      </View>

      {/* Requests List */}
      <View style={styles.content}>
        {loading ? (
          renderLoadingState()
        ) : requests.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.requestsList}
            contentContainerStyle={styles.requestsContent}
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
  headerInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 20,
    marginBottom: 10,
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  requestsList: {
    flex: 1,
  },
  requestsContent: {
    padding: 20,
    paddingTop: 10,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestTypeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  requestTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  requestMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#25D366',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  acceptButton: {
    backgroundColor: '#25D366',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#FF6B6B',
  },
  declineButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  blockButton: {
    backgroundColor: '#6C757D',
  },
  blockButtonText: {
    color: '#ffffff',
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
  },
});

export default RequestsScreen; 