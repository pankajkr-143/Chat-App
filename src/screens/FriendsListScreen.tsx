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

interface FriendWithLastMessage extends User {
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface FriendsListScreenProps {
  currentUser: User;
  onFriendSelect: (friend: User) => void;
  searchQuery?: string;
  onUnreadCountChange?: () => void;
}

const FriendsListScreen: React.FC<FriendsListScreenProps> = ({ 
  currentUser, 
  onFriendSelect, 
  searchQuery = '', 
  onUnreadCountChange 
}) => {
  const [friends, setFriends] = useState<FriendWithLastMessage[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithLastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadFriends();
    const interval = setInterval(loadFriends, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      filterFriends();
    } else {
      setFilteredFriends(friends);
    }
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await DatabaseService.getFriends(currentUser.id);
      const friendsWithMessages: FriendWithLastMessage[] = [];

      for (const friend of friendsList) {
        const chatHistory = await DatabaseService.getChatHistory(currentUser.id, friend.id);
        const lastMessage = chatHistory[chatHistory.length - 1];
        const unreadMessages = chatHistory.filter(
          msg => msg.senderId === friend.id && !msg.isRead
        );

        friendsWithMessages.push({
          ...friend,
          lastMessage: lastMessage?.message,
          lastMessageTime: lastMessage?.timestamp,
          unreadCount: unreadMessages.length,
        });
      }

      friendsWithMessages.sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;

        if (a.lastMessageTime && b.lastMessageTime) {
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        }
        if (a.lastMessageTime && !b.lastMessageTime) return -1;
        if (!a.lastMessageTime && b.lastMessageTime) return 1;

        return a.username.localeCompare(b.username);
      });

      setFriends(friendsWithMessages);
      setFilteredFriends(friendsWithMessages);
      
      // Call onUnreadCountChange if provided
      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  };

  const filterFriends = () => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }
    const filtered = friends.filter(friend =>
      friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  };

  const formatLastMessageTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const handleFriendPress = (friend: FriendWithLastMessage) => {
    Keyboard.dismiss();
    onFriendSelect(friend);
  };

  const renderFriendItem = ({ item }: { item: FriendWithLastMessage }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => handleFriendPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatarContainer}>
          <View style={styles.friendAvatar}>
            {item.profilePicture ? (
              <Text style={styles.friendAvatarEmoji}>{item.profilePicture}</Text>
            ) : (
              <Text style={styles.friendInitial}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={[
            styles.onlineIndicator,
            item.isOnline ? styles.onlineIndicatorActive : styles.offlineIndicator
          ]} />
        </View>

        <View style={styles.friendDetails}>
          <View style={styles.friendHeader}>
            <Text style={styles.friendName}>{item.username}</Text>
            {item.lastMessageTime && (
              <Text style={styles.lastMessageTime}>
                {formatLastMessageTime(item.lastMessageTime)}
              </Text>
            )}
          </View>

          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.emptyStateTitle}>Loading friends...</Text>
        </View>
      );
    }

    if (searchQuery && filteredFriends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>No friends found</Text>
          <Text style={styles.emptyStateSubtitle}>
            No friends found matching "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>👥</Text>
        <Text style={styles.emptyStateTitle}>No friends yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          Find new friends to start chatting!
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {filteredFriends.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.friendsList}
            contentContainerStyle={styles.friendsContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          />
        ) : (
          renderEmptyState()
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
  friendsList: {
    flex: 1,
  },
  friendsContent: {
    padding: 20,
    paddingTop: 10,
  },
  friendCard: {
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
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#25D366',
  },
  friendAvatarEmoji: {
    fontSize: 24,
  },
  friendInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  onlineIndicatorActive: {
    backgroundColor: '#25D366',
  },
  offlineIndicator: {
    backgroundColor: '#999',
  },
  friendDetails: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
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

export default FriendsListScreen; 