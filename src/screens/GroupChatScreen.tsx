import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService, { User } from '../database/DatabaseService';
import GroupCallScreen from './GroupCallScreen';

interface Group {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: number;
  createdAt: string;
  isActive: boolean;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface GroupMessage {
  id: number;
  groupId: number;
  senderId: number;
  message: string;
  timestamp: string;
  isRead: boolean;
  sender: User;
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'admin' | 'member';
  joinedAt: string;
  user: User;
}

// Add a simpler interface for the data we get from DatabaseService
interface GroupMemberData extends User {
  role: string;
}

interface GroupChatScreenProps {
  currentUser: User;
  group: Group;
  onBack: () => void;
}

const GroupChatScreen: React.FC<GroupChatScreenProps> = ({ 
  currentUser, 
  group, 
  onBack 
}) => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [groupMembers, setGroupMembers] = useState<GroupMemberData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal states
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showCallTypeModal, setShowCallTypeModal] = useState(false);
  const [isInGroupCall, setIsInGroupCall] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [newGroupName, setNewGroupName] = useState(group.name);
  const [newMemberUsername, setNewMemberUsername] = useState('');
  const [friends, setFriends] = useState<User[]>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadGroupData();
    loadFriends();
  }, []);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // Load group messages
      const groupMessages = await DatabaseService.getGroupMessages(group.id);
      setMessages(groupMessages);
      
      // Load group members
      const members = await DatabaseService.getGroupMembers(group.id);
      setGroupMembers(members);
      
      // Check if current user is admin
      const currentUserMember = members.find(m => m.id === currentUser.id);
      setIsAdmin(currentUserMember?.role === 'admin' || group.createdBy === currentUser.id);
      
    } catch (error) {
      console.error('Error loading group data:', error);
      Alert.alert('Error', 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    try {
      const friendsList = await DatabaseService.getFriends(currentUser.id);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const message = await DatabaseService.saveGroupMessage(
        group.id,
        currentUser.id,
        newMessage.trim()
      );
      
      // Add the new message to the list
      const newMessageWithSender: GroupMessage = {
        ...message,
        sender: currentUser,
      };
      
      setMessages(prev => [...prev, newMessageWithSender]);
      setNewMessage('');
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleEditGroupName = async () => {
    if (!newGroupName.trim() || newGroupName.trim() === group.name) {
      setShowEditGroupModal(false);
      return;
    }

    try {
      await DatabaseService.updateGroupName(group.id, newGroupName.trim());
      Alert.alert('Success', 'Group name updated successfully!');
      setShowEditGroupModal(false);
      // Update the group name in the header
      group.name = newGroupName.trim();
    } catch (error) {
      console.error('Error updating group name:', error);
      Alert.alert('Error', 'Failed to update group name');
    }
  };

  const handleAddMember = async (friend: User) => {
    try {
      // Check if user is already a member
      const isAlreadyMember = groupMembers.some(m => m.id === friend.id);
      if (isAlreadyMember) {
        Alert.alert('Error', 'User is already a member of this group');
        return;
      }

      await DatabaseService.addMemberToGroup(group.id, friend.id);
      Alert.alert('Success', `${friend.username} added to group`);
      
      // Refresh group members
      const members = await DatabaseService.getGroupMembers(group.id);
      setGroupMembers(members);
      setShowAddMemberModal(false);
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member');
    }
  };

  const handleRemoveMember = async (member: GroupMemberData) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.username} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.removeMemberFromGroup(group.id, member.id);
              Alert.alert('Success', `${member.username} removed from group`);
              
              // Refresh group members
              const members = await DatabaseService.getGroupMembers(group.id);
              setGroupMembers(members);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleStartGroupCall = () => {
    setShowCallTypeModal(true);
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setShowCallTypeModal(false);
    setIsInGroupCall(true);
  };

  const handleEndGroupCall = () => {
    setIsInGroupCall(false);
  };

  const renderMessage = ({ item }: { item: GroupMessage }) => {
    const isOwnMessage = item.senderId === currentUser.id;
    
    return (
      <View style={[styles.messageContainer, isOwnMessage && styles.ownMessageContainer]}>
        {!isOwnMessage && (
          <Text style={styles.senderName}>{item.sender.username}</Text>
        )}
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble]}>
          <Text style={[styles.messageText, isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
            {item.message}
          </Text>
          <Text style={[styles.messageTime, isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderFriendItem = ({ item }: { item: User }) => {
    const isAlreadyMember = groupMembers.some(m => m.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.friendItem, isAlreadyMember && styles.friendItemDisabled]}
        onPress={() => !isAlreadyMember && handleAddMember(item)}
        disabled={isAlreadyMember}
      >
        <View style={styles.friendAvatar}>
          <Text style={styles.friendAvatarText}>
            {item.profilePicture ? '👤' : item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.username}</Text>
          {isAlreadyMember && (
            <Text style={styles.alreadyMemberText}>Already in group</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroupMember = ({ item }: { item: GroupMemberData }) => (
    <View style={styles.memberItem}>
      {isAdmin && item.id !== currentUser.id && (
        <View style={styles.removeContainer}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveMember(item)}
          >
            <Text style={styles.removeButtonText}>🗑️</Text>
          </TouchableOpacity>
          <Text style={styles.removeLabel}>Remove</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {item.profilePicture ? '👤' : item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.memberDetails}>
          <Text style={styles.memberName}>{item.username}</Text>
          <Text style={styles.memberRole}>{item.role}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Loading group chat...</Text>
      </View>
    );
  }

  if (isInGroupCall) {
    return (
      <GroupCallScreen
        currentUser={currentUser}
        group={group}
        onEndCall={handleEndGroupCall}
        callType={callType}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.groupInfo}
          onPress={() => setShowGroupInfoModal(true)}
        >
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.memberCount}>{groupMembers.length} members</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.callButton} onPress={handleStartGroupCall}>
            <Text style={styles.callButtonText}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={() => setShowGroupInfoModal(true)}
          >
            <Text style={styles.menuButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Group Info Modal */}
      <Modal visible={showGroupInfoModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Info</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowGroupInfoModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.groupDetails}>
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>{group.avatar || '👥'}</Text>
              </View>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>
                {group.description || 'No description'}
              </Text>
              <Text style={styles.groupStats}>
                {groupMembers.length} members • Created {new Date(group.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {isAdmin && (
              <View style={styles.adminActions}>
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => {
                    setShowGroupInfoModal(false);
                    setShowEditGroupModal(true);
                  }}
                >
                  <Text style={styles.adminButtonText}>Edit Group Name</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.adminButton}
                  onPress={() => {
                    setShowGroupInfoModal(false);
                    setShowAddMemberModal(true);
                  }}
                >
                  <Text style={styles.adminButtonText}>Add Members</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.membersSection}>
              <Text style={styles.membersTitle}>Members ({groupMembers.length})</Text>
              <FlatList
                data={groupMembers}
                renderItem={renderGroupMember}
                keyExtractor={(item) => item.id.toString()}
                style={styles.membersList}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Group Name Modal */}
      <Modal visible={showEditGroupModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Group Name</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={newGroupName}
              onChangeText={setNewGroupName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditGroupModal(false);
                  setNewGroupName(group.name);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleEditGroupName}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Member Modal */}
      <Modal visible={showAddMemberModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Members</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddMemberModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={friends}
              renderItem={renderFriendItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.friendsList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Call Type Selection Modal */}
      <Modal visible={showCallTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Start Group Call</Text>
            <Text style={styles.modalSubtitle}>
              Choose call type for {group.name}
            </Text>

            <TouchableOpacity
              style={styles.callTypeButton}
              onPress={() => handleStartCall('voice')}
            >
              <Text style={styles.callTypeIcon}>📞</Text>
              <Text style={styles.callTypeText}>Voice Call</Text>
              <Text style={styles.callTypeDescription}>Audio only</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callTypeButton}
              onPress={() => handleStartCall('video')}
            >
              <Text style={styles.callTypeIcon}>📹</Text>
              <Text style={styles.callTypeText}>Video Call</Text>
              <Text style={styles.callTypeDescription}>Audio and video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowCallTypeModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    marginTop: 10,
  },
  header: {
    backgroundColor: '#075E54',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  memberCount: {
    fontSize: 14,
    color: '#E0E0E0',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  callButton: {
    padding: 8,
  },
  callButtonText: {
    fontSize: 20,
  },
  menuButton: {
    padding: 8,
  },
  menuButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 10,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    marginLeft: 10,
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownMessageBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#000000',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  ownMessageTime: {
    color: '#666',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendButtonText: {
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  groupDetails: {
    alignItems: 'center',
    padding: 20,
  },
  groupAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupAvatarText: {
    fontSize: 40,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  groupStats: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  adminActions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  adminButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  adminButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  membersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  membersList: {
    maxHeight: 200,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    fontSize: 16,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  memberRole: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    backgroundColor: '#FF4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeContainer: {
    alignItems: 'center',
    marginRight: 10,
  },
  removeLabel: {
    fontSize: 10,
    color: '#FF4444',
    fontWeight: '600',
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#25D366',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsList: {
    maxHeight: 400,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  friendItemDisabled: {
    opacity: 0.5,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  friendAvatarText: {
    fontSize: 18,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  alreadyMemberText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  callTypeButton: {
    backgroundColor: '#F5F5F5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  callTypeIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  callTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  callTypeDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default GroupChatScreen; 