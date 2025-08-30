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
import NotificationService from '../services/NotificationService';

interface RequestsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const RequestsScreen: React.FC<RequestsScreenProps> = ({ currentUser, onBack }) => {
  const [requests, setRequests] = useState<Array<FriendRequest & { fromUser: User }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const friendRequests = await DatabaseService.getFriendRequests(currentUser.id);
      setRequests(friendRequests);
    } catch (error) {
      console.error('Error loading friend requests:', error);
      Alert.alert('Error', 'Failed to load friend requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (request: FriendRequest & { fromUser: User }) => {
    try {
      await DatabaseService.respondToFriendRequest(request.id, 'accepted');
      
      // Send notification to the user who sent the request
      try {
        await NotificationService.getInstance().showFriendAcceptedNotification({
          id: currentUser.id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture,
        });
      } catch (notificationError) {
        console.log('Could not send notification:', notificationError);
      }
      
      // Remove the accepted request from the list
      setRequests(prev => prev.filter(r => r.id !== request.id));
      
      Alert.alert('Friend Added', `You are now friends with ${request.fromUser.username}!`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  const handleDeclineRequest = async (request: FriendRequest & { fromUser: User }) => {
    try {
      await DatabaseService.respondToFriendRequest(request.id, 'declined');
      
      // Remove the declined request from the list
      setRequests(prev => prev.filter(r => r.id !== request.id));
      
      Alert.alert('Request Declined', 'Friend request declined.');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request. Please try again.');
    }
  };

  const handleBlockUser = async (request: FriendRequest & { fromUser: User }) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${request.fromUser.username}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.respondToFriendRequest(request.id, 'blocked');
              
              // Remove the blocked request from the list
              setRequests(prev => prev.filter(r => r.id !== request.id));
              
              Alert.alert('User Blocked', `${request.fromUser.username} has been blocked.`);
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  const renderRequestItem = ({ item }: { item: FriendRequest & { fromUser: User } }) => (
    <View style={styles.requestCard}>
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
          {item.message && (
            <Text style={styles.requestMessage}>{item.message}</Text>
          )}
          <Text style={styles.timestamp}>{formatTimestamp(item.createdAt)}</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptRequest(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={() => handleDeclineRequest(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.blockButton]}
          onPress={() => handleBlockUser(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.blockButtonText}>Block</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📭</Text>
      <Text style={styles.emptyStateTitle}>No Friend Requests</Text>
      <Text style={styles.emptyStateSubtitle}>
        You don't have any pending friend requests at the moment.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Friend Requests ({requests.length})
        </Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.requestsList}
          contentContainerStyle={styles.requestsContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
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
  requestsList: {
    flex: 1,
  },
  requestsContent: {
    padding: 20,
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 15,
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
  requestMessage: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
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
    backgroundColor: '#FF4757',
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
    paddingHorizontal: 20,
  },
});

export default RequestsScreen; 