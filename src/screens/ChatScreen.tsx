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
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Video, ResizeMode } from 'react-native-video';
import RNFS from 'react-native-fs';
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>('image');
  const [savingImage, setSavingImage] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChatHistory();
    loadFriendInfo();
    
    // Set up interval to refresh friend's online status and clean expired media
    const interval = setInterval(() => {
      loadFriendInfo();
      cleanupExpiredMedia();
    }, 30000); // Every 30 seconds
    
    // Listen for app state changes to mark messages as read when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && messages.length > 0) {
        markMessagesAsRead();
        cleanupExpiredMedia();
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
      
      // Check if user is blocked
      const isBlocked = await DatabaseService.isUserBlocked(currentUser.id, selectedFriend.id);
      if (isBlocked) {
        setIsBlocked(true);
        setMessages([]);
        setLoading(false);
        return;
      }

      setIsBlocked(false);
      const chatHistory = await DatabaseService.getChatHistory(currentUser.id, selectedFriend.id);
      setMessages(chatHistory);
    } catch (error) {
      console.error('Error loading chat history:', error);
      Alert.alert('Error', 'Failed to load chat history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredMedia = async () => {
    try {
      await DatabaseService.cleanupExpiredMediaMessages();
      // Reload chat history to reflect changes
      loadChatHistory();
    } catch (error) {
      console.error('Error cleaning up expired media:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isBlocked) return;

    try {
      const message = await DatabaseService.saveMessage(
        currentUser.id,
        selectedFriend.id,
        newMessage.trim()
      );
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Send notification to friend (commented out until NotificationService is implemented)
      // NotificationService.sendMessageNotification(selectedFriend.id, currentUser.username, newMessage.trim());
      
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const sendMediaMessage = async (mediaPath: string, messageType: 'image' | 'video') => {
    try {
      setSendingMedia(true);
      
      // Copy file to app's documents directory
      const fileName = `media_${Date.now()}.${messageType === 'video' ? 'mp4' : 'jpg'}`;
      const documentsPath = RNFS.DocumentDirectoryPath;
      const destinationPath = `${documentsPath}/${fileName}`;
      
      await RNFS.copyFile(mediaPath, destinationPath);
      
      // Auto-save the media file
      await autoSaveMedia(destinationPath, messageType);
      
      // Save message to database with file:// prefix
      const dbPath = `file://${destinationPath}`;
      
      await DatabaseService.saveMessage(
        currentUser.id,
        selectedFriend.id,
        `Sent ${messageType}`,
        messageType,
        dbPath
      );
      
      // Refresh messages
      loadChatHistory();
      
    } catch (error) {
      console.error('Error sending media message:', error);
      Alert.alert('Error', 'Failed to send media message');
    } finally {
      setSendingMedia(false);
    }
  };

  // Auto-save media files when they're received
  const autoSaveMedia = async (mediaPath: string, messageType: 'image' | 'video') => {
    try {
      const sourcePath = mediaPath.replace('file://', '');
      const timestamp = Date.now();
      const fileExtension = messageType === 'video' ? 'mp4' : 'jpg';
      const fileName = `ChatApp_Auto_${timestamp}.${fileExtension}`;

      if (Platform.OS === 'android') {
        // Save to Downloads folder automatically
        const downloadsPath = RNFS.DownloadDirectoryPath;
        const autoSavePath = `${downloadsPath}/${fileName}`;

        // Ensure Downloads directory exists
        const downloadsExists = await RNFS.exists(downloadsPath);
        if (!downloadsExists) {
          await RNFS.mkdir(downloadsPath);
        }

        // Use copyFile instead of moveFile to keep the original in app's internal storage
        await RNFS.copyFile(sourcePath, autoSavePath);

        console.log('Auto-saved media to Downloads:', autoSavePath);
      }
    } catch (error) {
      console.error('Error auto-saving media:', error);
    }
  };

  // Save file directly from database path
  const saveFileFromDatabase = async (mediaPath: string, messageType: 'image' | 'video') => {
    try {
      const sourcePath = mediaPath.replace('file://', '');
      
      // Check if source file exists
      const sourceExists = await RNFS.exists(sourcePath);
      if (!sourceExists) {
        console.log('Source file not found:', sourcePath);
        return false;
      }
      
      const timestamp = Date.now();
      const fileExtension = messageType === 'video' ? 'mp4' : 'jpg';
      const fileName = `ChatApp_${timestamp}.${fileExtension}`;
      
      if (Platform.OS === 'android') {
        const downloadsPath = RNFS.DownloadDirectoryPath;
        const finalPath = `${downloadsPath}/${fileName}`;
        
        // Ensure Downloads directory exists
        const downloadsExists = await RNFS.exists(downloadsPath);
        if (!downloadsExists) {
          await RNFS.mkdir(downloadsPath);
        }
        
        await RNFS.copyFile(sourcePath, finalPath);
        console.log('File saved from database:', finalPath);
        return true;
      }
    } catch (error) {
      console.error('Error saving from database:', error);
      return false;
    }
    return false;
  };

  const handleSaveMediaToGallery = async () => {
    if (!selectedImage) return;

    try {
      setSavingImage(true);
      
      // Remove file:// prefix for RNFS operations
      const sourcePath = selectedImage.replace('file://', '');
      
      // Check if source file exists before trying to copy
      const sourceExists = await RNFS.exists(sourcePath);
      if (!sourceExists) {
        Alert.alert('Error', 'Source file not found. The file may have been moved or deleted.');
        return;
      }
      
      const timestamp = Date.now();
      const fileExtension = selectedMediaType === 'video' ? 'mp4' : 'jpg';
      const fileName = `ChatApp_${timestamp}.${fileExtension}`;
      
      if (Platform.OS === 'android') {
        // Use RNFS's built-in methods for better compatibility
        const downloadsPath = RNFS.DownloadDirectoryPath;
        const finalPath = `${downloadsPath}/${fileName}`;
        
        // Ensure Downloads directory exists
        const downloadsExists = await RNFS.exists(downloadsPath);
        if (!downloadsExists) {
          await RNFS.mkdir(downloadsPath);
        }
        
        // Use copyFile instead of moveFile to keep the original in app's internal storage
        await RNFS.copyFile(sourcePath, finalPath);
        
        console.log('File copied to Downloads:', finalPath);
        Alert.alert('Saved!', `Media saved to Downloads: ${fileName}`);
      } else {
        // For iOS, save to Documents directory
        const documentsPath = RNFS.DocumentDirectoryPath;
        const finalPath = `${documentsPath}/${fileName}`;
        await RNFS.copyFile(sourcePath, finalPath);
        
        Alert.alert('Saved!', `Media saved to Documents: ${fileName}`);
      }
      
    } catch (error) {
      console.error('Error saving media:', error);
      Alert.alert('Error', `Failed to save file: ${error}`);
    } finally {
      setSavingImage(false);
    }
  };

  const handleOpenCamera = async () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 1920,
      maxWidth: 1080,
      quality: 0.8 as const,
      videoQuality: 'medium' as const,
    };

    try {
      const result: ImagePickerResponse = await launchCamera(options);
      
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const asset = result.assets[0];
        const messageType = asset.type?.startsWith('video/') ? 'video' : 'image';
        console.log('Camera media path:', asset.uri);
        await sendMediaMessage(asset.uri!, messageType as 'image' | 'video');
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleOpenGallery = async () => {
    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 1920,
      maxWidth: 1080,
      quality: 0.8 as const,
      videoQuality: 'medium' as const,
    };

    try {
      const result: ImagePickerResponse = await launchImageLibrary(options);
      
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const asset = result.assets[0];
        const messageType = asset.type?.startsWith('video/') ? 'video' : 'image';
        console.log('Gallery media path:', asset.uri);
        await sendMediaMessage(asset.uri!, messageType as 'image' | 'video');
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleImagePress = (imagePath: string) => {
    setSelectedImage(imagePath);
    setSelectedMediaType('image');
    setShowFullScreenImage(true);
  };

  const handleVideoPress = (videoPath: string) => {
    setSelectedImage(videoPath);
    setSelectedMediaType('video');
    setShowFullScreenImage(true);
  };

  const handleCloseFullScreen = () => {
    setShowFullScreenImage(false);
    setSelectedImage('');
    setSelectedMediaType('image');
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
    const isMyMessage = item.senderId === currentUser.id;
    const isMediaMessage = item.messageType === 'image' || item.messageType === 'video';
    
    // Check if media is expired
    const isExpired = item.mediaExpiresAt && new Date(item.mediaExpiresAt) <= new Date();

    return (
      <View style={[styles.messageContainer, isMyMessage ? styles.myMessage : styles.friendMessage]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.friendMessageBubble]}>
          {isMediaMessage && item.mediaPath && !isExpired ? (
            <View style={styles.mediaContainer}>
              {item.messageType === 'image' ? (
                <TouchableOpacity onPress={() => handleImagePress(item.mediaPath!)}>
                  <Image 
                    source={{ uri: item.mediaPath }} 
                    style={styles.mediaImage}
                    resizeMode="cover"
                    onError={(error) => console.error('Image loading error:', error)}
                  />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => handleVideoPress(item.mediaPath!)}>
                  <Video
                    source={{ uri: item.mediaPath }}
                    style={styles.mediaVideo}
                    resizeMode={ResizeMode.CONTAIN}
                    repeat={true}
                    paused={false}
                    onError={(error) => console.error('Video loading error:', error)}
                  />
                </TouchableOpacity>
              )}
              {item.message && item.message !== `${item.messageType === 'image' ? '📷' : '🎥'} ${item.messageType}` && (
                <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.friendMessageText]}>
                  {item.message}
                </Text>
              )}
              <View style={styles.mediaExpiryInfo}>
                <Text style={styles.expiryText}>
                  ⏰ Auto-deletes in {getTimeUntilExpiry(item.mediaExpiresAt!)}
                </Text>
              </View>
            </View>
          ) : isExpired ? (
            <View style={styles.expiredMediaContainer}>
              <Text style={styles.expiredText}>📷 Media expired</Text>
            </View>
          ) : (
            <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.friendMessageText]}>
              {item.message}
            </Text>
          )}
          <Text style={[styles.timestamp, isMyMessage ? styles.myTimestamp : styles.friendTimestamp]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {item.isRead && isMyMessage && <Text style={styles.readIndicator}> ✓</Text>}
          </Text>
        </View>
      </View>
    );
  };

  const getTimeUntilExpiry = (expiresAt: string): string => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    } else {
      return 'Less than 1m';
    }
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
        {isBlocked 
          ? `You have blocked ${friend.username}. You cannot send or receive messages.`
          : `Start a conversation with ${friend.username}!`
        }
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

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.mediaButton} onPress={handleOpenGallery}>
          <Text style={styles.mediaButtonText}>📷</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mediaButton} onPress={handleOpenCamera}>
          <Text style={styles.mediaButtonText}>📹</Text>
        </TouchableOpacity>
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
          style={[styles.sendButton, (!newMessage.trim() && !sendingMedia) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || isBlocked || sendingMedia}
        >
          {sendingMedia ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Full Screen Media Modal */}
      <Modal visible={showFullScreenImage} transparent animationType="fade">
        <View style={styles.fullScreenModal}>
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseFullScreen}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveMediaToGallery}
              disabled={savingImage}
            >
              {savingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>💾 Save</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.fullScreenImageContainer}>
            {selectedMediaType === 'image' ? (
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            ) : (
              <Video
                source={{ uri: selectedImage }}
                style={styles.fullScreenVideo}
                resizeMode={ResizeMode.CONTAIN}
                repeat={true}
                paused={false}
              />
            )}
          </View>
        </View>
      </Modal>
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
  myMessage: {
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
  myMessageBubble: {
    backgroundColor: '#25D366',
    borderBottomRightRadius: 4,
  },
  friendMessageBubble: {
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
  myMessageText: {
    color: '#ffffff',
  },
  friendMessageText: {
    color: '#1A1A1A',
  },
  mediaContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  mediaVideo: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  mediaExpiryInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  expiryText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  expiredMediaContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
  },
  expiredText: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    color: '#999',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  friendTimestamp: {
    color: '#999',
  },
  readIndicator: {
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
  textInputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
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
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  mediaButton: {
    padding: 8,
    marginRight: 8,
  },
  mediaButtonText: {
    fontSize: 20,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fullScreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  fullScreenVideo: {
    width: '100%',
    height: '100%',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveAllButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#007AFF',
    borderRadius: 20,
  },
  saveAllButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  callButton: {
    padding: 8,
    backgroundColor: '#34C759',
    borderRadius: 20,
  },
  callButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  testButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: '#FF9500',
    borderRadius: 20,
  },
  testButtonText: {
    fontSize: 18,
    color: '#fff',
  },
});

export default ChatScreen; 