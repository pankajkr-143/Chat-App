import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import SearchBar from '../components/SearchBar';
import DatabaseService, { User, ChatMessage } from '../database/DatabaseService';

interface FriendsListScreenProps {
  currentUser: User;
  onFriendSelect: (friend: User) => void;
}

interface FriendWithLastMessage {
  friend: User;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

const FriendsListScreen: React.FC<FriendsListScreenProps> = ({ 
  currentUser, 
  onFriendSelect 
}) => {
  const [friends, setFriends] = useState<FriendWithLastMessage[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<FriendWithLastMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    filterFriends();
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    try {
      const allUsers = await DatabaseService.getAllUsers();
      const otherUsers = allUsers.filter(user => user.id !== currentUser.id);
      
      // Load last message and unread count for each friend
      const friendsWithMessages = await Promise.all(
        otherUsers.map(async (friend) => {
          try {
            const chatHistory = await DatabaseService.getChatHistory(
              currentUser.id,
              friend.id
            );
            
            const lastMessage = chatHistory.length > 0 
              ? chatHistory[chatHistory.length - 1] 
              : undefined;
            
            const unreadCount = chatHistory.filter(
              msg => msg.senderId === friend.id && !msg.isRead
            ).length;
            
            return {
              friend,
              lastMessage,
              unreadCount
            };
          } catch (error) {
            console.error('Error loading chat history for friend:', error);
            return {
              friend,
              lastMessage: undefined,
              unreadCount: 0
            };
          }
        })
      );
      
      // Sort by last message time (most recent first)
      friendsWithMessages.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp).getTime() - 
               new Date(a.lastMessage.timestamp).getTime();
      });
      
      setFriends(friendsWithMessages);
      setFilteredFriends(friendsWithMessages);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const filterFriends = () => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const filtered = friends.filter(friendWithMsg =>
      friendWithMsg.friend.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFriends(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFriendPress = (friend: User) => {
    onFriendSelect(friend);
  };

  const formatLastMessage = (message?: ChatMessage) => {
    if (!message) return 'No messages yet';
    
    const now = new Date();
    const messageTime = new Date(message.timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageTime.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const renderFriendItem = ({ item }: { item: FriendWithLastMessage }) => (
    <TouchableOpacity
      style={styles.friendCard}
      onPress={() => handleFriendPress(item.friend)}
      activeOpacity={0.7}
    >
      <View style={styles.friendInfo}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.friend.email.charAt(0).toUpperCase()}
            </Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.friendDetails}>
          <View style={styles.friendHeader}>
            <Text style={styles.friendName}>{item.friend.email}</Text>
            <Text style={styles.lastMessageTime}>
              {formatLastMessage(item.lastMessage)}
            </Text>
          </View>
          
          <Text style={styles.lastMessageText} numberOfLines={1}>
            {item.lastMessage 
              ? (item.lastMessage.senderId === currentUser.id ? 'You: ' : '') + 
                item.lastMessage.message
              : 'Start a conversation'
            }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search chats..."
      />

      {/* Friends List */}
      <View style={styles.content}>
        {filteredFriends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>💬</Text>
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery 
                ? 'Try searching with a different name'
                : 'Start chatting with your friends to see conversations here'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.friend.id.toString()}
            style={styles.friendsList}
            contentContainerStyle={styles.friendsContent}
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
  friendsList: {
    flex: 1,
  },
  friendsContent: {
    padding: 20,
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
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#25D366',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  friendDetails: {
    flex: 1,
  },
  friendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  lastMessageText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
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

export default FriendsListScreen; 