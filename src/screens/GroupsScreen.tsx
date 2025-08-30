import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService, { User } from '../database/DatabaseService';

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

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'admin' | 'member';
  joinedAt: string;
  user: User;
}

interface GroupMemberWithUser extends User {
  role: string;
}

interface GroupsScreenProps {
  currentUser: User;
  onBack: () => void;
  showCreateButton?: boolean;
  compact?: boolean;
  onGroupSelect?: (group: Group) => void; // Added for navigation
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ 
  currentUser, 
  onBack, 
  showCreateButton = false,
  compact = false,
  onGroupSelect // Destructure new prop
}) => {
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberWithUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const userGroups = await DatabaseService.getUserGroups(currentUser.id);
      setGroups(userGroups);
    } catch (error) {
      console.error('Error loading groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadGroups();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    try {
      await DatabaseService.createGroup(
        groupName.trim(),
        groupDescription.trim(),
        currentUser.id,
        getRandomGroupAvatar()
      );
      
      Alert.alert('Success', `Group "${groupName.trim()}" created successfully!`);
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      loadGroups(); // Refresh the list
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  const handleGroupPress = async (group: Group) => {
    // Navigate to group chat instead of showing details modal
    if (onGroupSelect) {
      onGroupSelect(group);
    }
  };

  const handleRemoveMember = async (member: GroupMemberWithUser) => {
    if (!selectedGroup) return;

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
              await DatabaseService.removeMemberFromGroup(selectedGroup.id, member.id);
              Alert.alert('Success', `${member.username} removed from group`);
              // Refresh group members
              const members = await DatabaseService.getGroupMembers(selectedGroup.id);
              setGroupMembers(members);
              // Refresh groups list
              loadGroups();
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const handleAddMember = async () => {
    if (!selectedGroup) return;

    Alert.prompt(
      'Add Member',
      'Enter username to add:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (username?: string) => {
            if (username && username.trim()) {
              try {
                const user = await DatabaseService.getUserByUsername(username.trim());
                if (!user) {
                  Alert.alert('Error', 'User not found');
                  return;
                }

                // Check if user is already a member
                const isAlreadyMember = groupMembers.some(m => m.id === user.id);
                if (isAlreadyMember) {
                  Alert.alert('Error', 'User is already a member of this group');
                  return;
                }

                await DatabaseService.addMemberToGroup(selectedGroup.id, user.id);
                Alert.alert('Success', `${user.username} added to group`);
                
                // Refresh group members
                const members = await DatabaseService.getGroupMembers(selectedGroup.id);
                setGroupMembers(members);
                // Refresh groups list
                loadGroups();
              } catch (error) {
                console.error('Error adding member:', error);
                Alert.alert('Error', 'Failed to add member');
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'Enter username...'
    );
  };

  const getRandomGroupAvatar = () => {
    const avatars = ['💼', '👨‍👩‍👧‍👦', '📚', '🎮', '🏠', '🎵', '🎨', '⚽', '🍕', '🚗'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleGroupPress(item)}
    >
      <View style={styles.groupInfo}>
        <View style={styles.groupAvatarContainer}>
          <View style={styles.groupAvatar}>
            <Text style={styles.avatarText}>{item.avatar || '👥'}</Text>
          </View>
        </View>
        <View style={styles.groupDetails}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{item.name}</Text>
            <Text style={styles.groupMembers}>{item.memberCount} members</Text>
          </View>
          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
            {item.lastMessageTime && (
              <Text style={styles.lastMessageTime}>
                {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </View>
      </View>
      {item.createdBy === currentUser.id && (
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderGroupMember = ({ item }: { item: GroupMemberWithUser }) => (
    <View style={styles.memberItem}>
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
      {selectedGroup?.createdBy === currentUser.id && item.id !== currentUser.id && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveMember(item)}
        >
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.emptyStateTitle}>Loading groups...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateIcon}>👥</Text>
        <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
        <Text style={styles.emptyStateSubtitle}>
          {showCreateButton 
            ? 'Create your first group to start chatting with multiple people!'
            : 'You haven\'t joined any groups yet.'
          }
        </Text>
        {showCreateButton && (
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createFirstButtonText}>Create Group</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {!compact && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Groups</Text>
          <View style={styles.headerActions}>
            {showCreateButton && (
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.headerCreateButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.content}>
        {groups.length > 0 ? (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.groupsList}
            contentContainerStyle={styles.groupsContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Create Group Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={groupName}
              onChangeText={setGroupName}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Group Description (optional)"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowCreateModal(false);
                  setGroupName('');
                  setGroupDescription('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateGroup}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Group Details Modal */}
      <Modal visible={showGroupDetailsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.groupDetailsModal]}>
            <View style={styles.groupDetailsHeader}>
              <Text style={styles.groupDetailsTitle}>{selectedGroup?.name}</Text>
              <Text style={styles.groupDetailsSubtitle}>
                {selectedGroup?.memberCount} members • Created by you
              </Text>
            </View>

            <View style={styles.membersSection}>
              <View style={styles.membersHeader}>
                <Text style={styles.membersTitle}>Members</Text>
                {selectedGroup?.createdBy === currentUser.id && (
                  <TouchableOpacity
                    style={styles.addMemberButton}
                    onPress={handleAddMember}
                  >
                    <Text style={styles.addMemberButtonText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <FlatList
                data={groupMembers}
                renderItem={renderGroupMember}
                keyExtractor={(item) => item.id.toString()}
                style={styles.membersList}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowGroupDetailsModal(false);
                setSelectedGroup(null);
                setGroupMembers([]);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
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
  header: {
    backgroundColor: '#075E54',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  createButton: {
    backgroundColor: '#25D366',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCreateButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  groupsList: {
    // No specific styles needed here, FlatList handles its own
  },
  groupsContent: {
    paddingBottom: 20, // Add some padding at the bottom for the modal
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  groupDetails: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  groupMembers: {
    fontSize: 14,
    color: '#666',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  adminBadge: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  createFirstButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createFirstButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
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
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  groupDetailsModal: {
    maxHeight: '80%', // Limit modal height
  },
  groupDetailsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  groupDetailsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  groupDetailsSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  membersSection: {
    marginBottom: 20,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  addMemberButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addMemberButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  membersList: {
    // No specific styles needed here, FlatList handles its own
  },
  closeButton: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen; 