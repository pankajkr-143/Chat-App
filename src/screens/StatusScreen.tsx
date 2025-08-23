import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import DatabaseService, { User } from '../database/DatabaseService';

interface Status {
  id: string;
  userId: number;
  username: string;
  profilePicture?: string;
  statusText: string;
  timestamp: string;
  isMyStatus: boolean;
}

interface StatusScreenProps {
  currentUser: User;
  onBack: () => void;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ currentUser, onBack }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [myStatus, setMyStatus] = useState<Status | null>(null);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      // Get friends list
      const friends = await DatabaseService.getFriends(currentUser.id);
      
      // Create mock statuses for friends (in a real app, these would come from database)
      const friendStatuses: Status[] = friends.map((friend, index) => ({
        id: `friend-${friend.id}`,
        userId: friend.id,
        username: friend.username,
        profilePicture: friend.profilePicture,
        statusText: getRandomStatusText(),
        timestamp: getRandomTimestamp(),
        isMyStatus: false,
      }));

      // Create my status
      const myStatusItem: Status = {
        id: 'my-status',
        userId: currentUser.id,
        username: currentUser.username,
        profilePicture: currentUser.profilePicture,
        statusText: 'Tap to add status update',
        timestamp: 'Just now',
        isMyStatus: true,
      };

      setStatuses([myStatusItem, ...friendStatuses]);
      setMyStatus(myStatusItem);
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const getRandomStatusText = (): string => {
    const statuses = [
      'Having a great day! 😊',
      'Working on something exciting 💻',
      'Coffee time ☕',
      'Beautiful weather today 🌤️',
      'Just finished a workout 💪',
      'Reading a good book 📚',
      'Cooking dinner 🍳',
      'Watching a movie 🎬',
      'On vacation! 🏖️',
      'Busy with work 📊',
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  const getRandomTimestamp = (): string => {
    const timestamps = [
      'Just now',
      '2 minutes ago',
      '5 minutes ago',
      '10 minutes ago',
      '1 hour ago',
      '2 hours ago',
      'Today',
      'Yesterday',
    ];
    return timestamps[Math.floor(Math.random() * timestamps.length)];
  };

  const handleAddStatus = () => {
    Alert.prompt(
      'Add Status',
      'What\'s on your mind?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: (statusText?: string) => {
            if (statusText && statusText.trim()) {
              const newStatus: Status = {
                id: 'my-status',
                userId: currentUser.id,
                username: currentUser.username,
                profilePicture: currentUser.profilePicture,
                statusText: statusText.trim(),
                timestamp: 'Just now',
                isMyStatus: true,
              };
              setMyStatus(newStatus);
              setStatuses(prev => [newStatus, ...prev.filter(s => !s.isMyStatus)]);
            }
          }
        }
      ],
      'plain-text',
      '',
      'Type your status...'
    );
  };

  const handleStatusPress = (status: Status) => {
    if (status.isMyStatus) {
      handleAddStatus();
    } else {
      Alert.alert(
        status.username,
        status.statusText,
        [
          { text: 'Reply', onPress: () => handleReplyToStatus(status) },
          { text: 'Close', style: 'cancel' }
        ]
      );
    }
  };

  const handleReplyToStatus = (status: Status) => {
    Alert.prompt(
      `Reply to ${status.username}`,
      'Send a message',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: (message?: string) => {
            if (message && message.trim()) {
              Alert.alert('Message Sent', `Reply sent to ${status.username}`);
            }
          }
        }
      ],
      'plain-text',
      '',
      'Type your reply...'
    );
  };

  const renderStatusItem = ({ item }: { item: Status }) => (
    <TouchableOpacity
      style={styles.statusItem}
      onPress={() => handleStatusPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.statusAvatar}>
        {item.profilePicture ? (
          <Text style={styles.statusAvatarEmoji}>{item.profilePicture}</Text>
        ) : (
          <Text style={styles.statusAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        )}
        {item.isMyStatus && (
          <View style={styles.addStatusIcon}>
            <Text style={styles.addStatusIconText}>+</Text>
          </View>
        )}
      </View>
      
      <View style={styles.statusItemContent}>
        <Text style={styles.statusUsername}>
          {item.isMyStatus ? 'My Status' : item.username}
        </Text>
        <Text style={styles.statusText} numberOfLines={1}>
          {item.statusText}
        </Text>
        <Text style={styles.statusTimestamp}>{item.timestamp}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📱</Text>
      <Text style={styles.emptyStateTitle}>No Status Updates</Text>
      <Text style={styles.emptyStateSubtitle}>
        Be the first to share what's on your mind!
      </Text>
      <TouchableOpacity style={styles.addStatusButton} onPress={handleAddStatus}>
        <Text style={styles.addStatusButtonText}>Add Status</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status</Text>
        <Text style={styles.headerSubtitle}>Recent updates</Text>
      </View>

      {/* Status List */}
      <View style={styles.content}>
        {statuses.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={statuses}
            renderItem={renderStatusItem}
            keyExtractor={(item) => item.id}
            style={styles.statusList}
            contentContainerStyle={styles.statusContent}
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
  header: {
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
  statusList: {
    flex: 1,
  },
  statusContent: {
    padding: 20,
    paddingTop: 10,
  },
  statusItem: {
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
  statusAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#25D366',
    position: 'relative',
  },
  statusAvatarEmoji: {
    fontSize: 30,
  },
  statusAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  addStatusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  addStatusIconText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusItemContent: {
    flex: 1,
  },
  statusUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  statusTimestamp: {
    fontSize: 12,
    color: '#999',
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
    marginBottom: 30,
  },
  addStatusButton: {
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
  addStatusButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StatusScreen; 