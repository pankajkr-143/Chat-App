import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from 'react-native';
import { User } from '../database/DatabaseService';

interface Group {
  id: string;
  name: string;
  avatar: string;
  memberCount: number;
  lastMessage: string;
  lastMessageTime: string;
  isAdmin: boolean;
  isActive: boolean;
}

interface GroupsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ currentUser, onBack }) => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Work Team',
      avatar: '💼',
      memberCount: 8,
      lastMessage: 'Meeting at 3 PM today',
      lastMessageTime: '2 hours ago',
      isAdmin: true,
      isActive: true,
    },
    {
      id: '2',
      name: 'Family Group',
      avatar: '👨‍👩‍👧‍👦',
      memberCount: 12,
      lastMessage: 'Dinner plans for Sunday',
      lastMessageTime: '1 day ago',
      isAdmin: false,
      isActive: true,
    },
    {
      id: '3',
      name: 'Study Group',
      avatar: '📚',
      memberCount: 5,
      lastMessage: 'Assignment due tomorrow',
      lastMessageTime: '3 hours ago',
      isAdmin: true,
      isActive: true,
    },
  ]);

  const handleCreateGroup = () => {
    Alert.prompt(
      'Create New Group',
      'Enter group name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (groupName?: string) => {
            if (groupName && groupName.trim()) {
              const newGroup: Group = {
                id: Date.now().toString(),
                name: groupName.trim(),
                avatar: getRandomGroupAvatar(),
                memberCount: 1,
                lastMessage: 'Group created',
                lastMessageTime: 'Just now',
                isAdmin: true,
                isActive: true,
              };
              setGroups([newGroup, ...groups]);
              Alert.alert('Success', `Group "${groupName.trim()}" created successfully!`);
            }
          }
        }
      ],
      'plain-text',
      '',
      'Enter group name...'
    );
  };

  const handleJoinGroup = () => {
    Alert.prompt(
      'Join Group',
      'Enter group invite code:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Join',
          onPress: (inviteCode?: string) => {
            if (inviteCode && inviteCode.trim()) {
              // In a real app, you would validate the invite code
              Alert.alert('Success', 'You have joined the group successfully!');
            }
          }
        }
      ],
      'plain-text',
      '',
      'Enter invite code...'
    );
  };

  const handleGroupPress = (group: Group) => {
    Alert.alert(
      group.name,
      `Members: ${group.memberCount}\nLast message: ${group.lastMessage}`,
      [
        { text: 'View Group', onPress: () => handleViewGroup(group) },
        { text: 'Group Info', onPress: () => handleGroupInfo(group) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleViewGroup = (group: Group) => {
    Alert.alert('View Group', `Opening ${group.name} chat...`);
  };

  const handleGroupInfo = (group: Group) => {
    Alert.alert(
      'Group Info',
      `Name: ${group.name}\nMembers: ${group.memberCount}\nRole: ${group.isAdmin ? 'Admin' : 'Member'}\nStatus: ${group.isActive ? 'Active' : 'Inactive'}`,
      [
        { text: 'Edit Group', onPress: () => handleEditGroup(group) },
        { text: 'Leave Group', style: 'destructive', onPress: () => handleLeaveGroup(group) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleEditGroup = (group: Group) => {
    if (!group.isAdmin) {
      Alert.alert('Permission Denied', 'Only admins can edit group settings.');
      return;
    }

    Alert.prompt(
      'Edit Group',
      'Enter new group name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (newName?: string) => {
            if (newName && newName.trim()) {
              setGroups(groups.map(g => 
                g.id === group.id ? { ...g, name: newName.trim() } : g
              ));
              Alert.alert('Success', 'Group name updated successfully!');
            }
          }
        }
      ],
      'plain-text',
      group.name,
      'Enter new name...'
    );
  };

  const handleLeaveGroup = (group: Group) => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            setGroups(groups.filter(g => g.id !== group.id));
            Alert.alert('Left Group', `You have left "${group.name}"`);
          }
        }
      ]
    );
  };

  const getRandomGroupAvatar = (): string => {
    const avatars = ['💼', '👨‍👩‍👧‍👦', '📚', '🎮', '🏠', '🎵', '🏃‍♂️', '🍕', '🌍', '🎨'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupItem}
      onPress={() => handleGroupPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupAvatar}>
        <Text style={styles.groupAvatarEmoji}>{item.avatar}</Text>
        {item.isAdmin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>👑</Text>
          </View>
        )}
      </View>
      
      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupTime}>{item.lastMessageTime}</Text>
        </View>
        
        <View style={styles.groupDetails}>
          <Text style={styles.groupMembers}>{item.memberCount} members</Text>
          <Text style={styles.groupLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👥</Text>
      <Text style={styles.emptyStateTitle}>No Groups Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create a group or join existing ones to start group conversations
      </Text>
      <View style={styles.emptyStateActions}>
        <TouchableOpacity style={styles.createGroupButton} onPress={handleCreateGroup}>
          <Text style={styles.createGroupButtonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.joinGroupButton} onPress={handleJoinGroup}>
          <Text style={styles.joinGroupButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCreateGroup}>
          <Text style={styles.actionButtonIcon}>➕</Text>
          <Text style={styles.actionButtonText}>Create Group</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleJoinGroup}>
          <Text style={styles.actionButtonIcon}>🔗</Text>
          <Text style={styles.actionButtonText}>Join Group</Text>
        </TouchableOpacity>
      </View>

      {/* Groups List */}
      <View style={styles.content}>
        {groups.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={groups}
            renderItem={renderGroupItem}
            keyExtractor={(item) => item.id}
            style={styles.groupsList}
            contentContainerStyle={styles.groupsContent}
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
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  groupsList: {
    flex: 1,
  },
  groupsContent: {
    padding: 20,
    paddingTop: 0,
  },
  groupItem: {
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
  groupAvatar: {
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
  groupAvatarEmoji: {
    fontSize: 30,
  },
  adminBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  adminBadgeText: {
    fontSize: 10,
  },
  groupInfo: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  groupTime: {
    fontSize: 12,
    color: '#999',
  },
  groupDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupMembers: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '500',
    marginRight: 12,
  },
  groupLastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
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
    paddingHorizontal: 20,
  },
  emptyStateActions: {
    flexDirection: 'row',
    gap: 12,
  },
  createGroupButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
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
  createGroupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  joinGroupButton: {
    backgroundColor: '#128C7E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#128C7E',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  joinGroupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GroupsScreen; 