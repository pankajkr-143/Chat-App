import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { User } from '../database/DatabaseService';

interface FriendRequest {
  id: string;
  fromUser: User;
  message?: string;
  timestamp: string;
  type: 'friend_request' | 'group_invite' | 'message_request';
}

interface RequestsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const RequestsScreen: React.FC<RequestsScreenProps> = ({ currentUser, onBack }) => {
  const [requests, setRequests] = useState<FriendRequest[]>([
    {
      id: '1',
      fromUser: { id: 2, email: 'alice@example.com', password: '', createdAt: new Date().toISOString() },
      message: 'Hi! I\'d like to be your friend.',
      timestamp: '2 hours ago',
      type: 'friend_request',
    },
    {
      id: '2',
      fromUser: { id: 3, email: 'bob@example.com', password: '', createdAt: new Date().toISOString() },
      message: 'Join our work group!',
      timestamp: '1 day ago',
      type: 'group_invite',
    },
    {
      id: '3',
      fromUser: { id: 4, email: 'charlie@example.com', password: '', createdAt: new Date().toISOString() },
      message: 'Can I send you a message?',
      timestamp: '3 days ago',
      type: 'message_request',
    },
  ]);

  const handleAcceptRequest = (request: FriendRequest) => {
    Alert.alert(
      'Accept Request',
      `Accept ${request.fromUser.email}'s ${request.type.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Accept', 
          onPress: () => {
            setRequests(prev => prev.filter(r => r.id !== request.id));
            Alert.alert('Success', 'Request accepted!');
          }
        }
      ]
    );
  };

  const handleDeclineRequest = (request: FriendRequest) => {
    Alert.alert(
      'Decline Request',
      `Decline ${request.fromUser.email}'s ${request.type.replace('_', ' ')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Decline', 
          style: 'destructive',
          onPress: () => {
            setRequests(prev => prev.filter(r => r.id !== request.id));
            Alert.alert('Declined', 'Request declined.');
          }
        }
      ]
    );
  };

  const handleBlockUser = (request: FriendRequest) => {
    Alert.alert(
      'Block User',
      `Block ${request.fromUser.email}? This will prevent them from sending you requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Block', 
          style: 'destructive',
          onPress: () => {
            setRequests(prev => prev.filter(r => r.id !== request.id));
            Alert.alert('Blocked', 'User has been blocked.');
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

  const renderRequestItem = ({ item }: { item: FriendRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {item.fromUser.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.fromUser.email}</Text>
            <View style={styles.requestTypeContainer}>
              <Text style={styles.requestTypeIcon}>
                {getRequestTypeIcon(item.type)}
              </Text>
              <Text style={[
                styles.requestTypeText,
                { color: getRequestTypeColor(item.type) }
              ]}>
                {getRequestTypeText(item.type)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      
      {item.message && (
        <Text style={styles.requestMessage}>{item.message}</Text>
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
        You don't have any pending requests at the moment
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
        {requests.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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