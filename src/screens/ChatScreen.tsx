import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import DatabaseService, { User, ChatMessage } from '../database/DatabaseService';
import NotificationService from '../services/NotificationService';

interface ChatScreenProps {
  currentUser: User;
  selectedFriend: User;
  onBack: () => void;
  onMessageSent?: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ currentUser, selectedFriend, onBack, onMessageSent }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [friend, setFriend] = useState<User>(selectedFriend);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
    loadFriendInfo();
    
    // Set up interval to refresh friend's online status
    const interval = setInterval(loadFriendInfo, 30000); // Every 30 seconds
    
    // Listen for app state changes to mark messages as read when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && messages.length > 0) {
        markMessagesAsRead();
      }
    });
    
    return () => {
      clearInterval(interval);
      subscription?.remove();
    };
  }, []);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages]);

  const markMessagesAsRead = async () => {
    try {
      // Get all unread messages sent by the friend to the current user
      const unreadMessages = messages.filter(
        msg => msg.senderId === selectedFriend.id && 
               msg.receiverId === currentUser.id && 
               !msg.isRead
      );

      // If there are unread messages, mark them all as read
      if (unreadMessages.length > 0) {
        // Use bulk update for efficiency
        await DatabaseService.markAllMessagesAsRead(selectedFriend.id, currentUser.id);
        
        // Update local state to reflect read status
        setMessages(prev => prev.map(msg => 
          msg.senderId === selectedFriend.id && 
          msg.receiverId === currentUser.id && 
          !msg.isRead
            ? { ...msg, isRead: true }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const loadFriendInfo = async () => {
    try {
      const updatedFriend = await DatabaseService.getUserByEmail(selectedFriend.email);
      if (updatedFriend) {
        setFriend(updatedFriend);
      }
    } catch (error) {
      console.error('Error loading friend info:', error);
    }
  };

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      
      // Check if users are friends before loading chat
      const areFriends = await DatabaseService.areFriends(currentUser.id, selectedFriend.id);
      if (!areFriends) {
        Alert.alert('Not Friends', 'You can only chat with your friends. Send them a friend request first.');
        onBack();
        return;
      }
      
      const chatHistory = await DatabaseService.getChatHistory(currentUser.id, selectedFriend.id);
      setMessages(chatHistory);
    } catch (error) {
      console.error('Error loading chat history:', error);
      Alert.alert('Error', 'Failed to load chat history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      // Check if users are friends before sending message
      const areFriends = await DatabaseService.areFriends(currentUser.id, selectedFriend.id);
      if (!areFriends) {
        Alert.alert('Not Friends', 'You can only chat with your friends.');
        return;
      }

      // Save message to database
      const savedMessage = await DatabaseService.saveMessage(currentUser.id, selectedFriend.id, messageText);

      // Add message to local state
      setMessages(prev => [...prev, savedMessage]);

      // Send notification to the friend
      try {
        await NotificationService.getInstance().showMessageNotification(
          {
            id: currentUser.id,
            username: currentUser.username,
            profilePicture: currentUser.profilePicture,
          },
          messageText
        );
      } catch (notificationError) {
        console.log('Could not send notification:', notificationError);
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Call onMessageSent callback if provided
      if (onMessageSent) {
        onMessageSent();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (lastSeen: string): string => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwnMessage = item.senderId === currentUser.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.friendMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.friendBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.friendMessageText
          ]}>
            {item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.friendMessageTime
            ]}>
              {formatMessageTime(item.timestamp)}
            </Text>
            {isOwnMessage && (
              <Text style={styles.readStatus}>
                {item.isRead ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.friendInfo}>
        <View style={styles.friendAvatar}>
          {friend.profilePicture ? (
            <Text style={styles.friendAvatarEmoji}>{friend.profilePicture}</Text>
          ) : (
            <Text style={styles.friendInitial}>
              {friend.username.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.username}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, friend.isOnline && styles.onlineDot]} />
            <Text style={styles.statusText}>
              {friend.isOnline ? 'Online' : `Last seen ${formatLastSeen(friend.lastSeen)}`}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.emptyStateText}>
        Start a conversation with {friend.username}!
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.messagesContainer}>
        {messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim()}
          activeOpacity={0.7}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  friendMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  ownBubble: {
    backgroundColor: '#25D366',
    borderBottomRightRadius: 4,
  },
  friendBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#ffffff',
  },
  friendMessageText: {
    color: '#1A1A1A',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    marginRight: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  friendMessageTime: {
    color: '#999',
  },
  readStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  friendAvatar: {
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
  friendAvatarEmoji: {
    fontSize: 30,
  },
  friendInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
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
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChatScreen; 