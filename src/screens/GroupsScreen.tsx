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

interface Group {
  id: string;
  name: string;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  isAdmin: boolean;
}

interface GroupsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ currentUser, onBack }) => {
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Family Group',
      memberCount: 8,
      lastMessage: 'Happy birthday everyone! 🎉',
      lastMessageTime: '2 hours ago',
      isAdmin: true,
    },
    {
      id: '2',
      name: 'Work Team',
      memberCount: 12,
      lastMessage: 'Meeting at 3 PM today',
      lastMessageTime: '1 day ago',
      isAdmin: false,
    },
    {
      id: '3',
      name: 'College Friends',
      memberCount: 15,
      lastMessage: 'Who\'s up for coffee? ☕',
      lastMessageTime: '3 days ago',
      isAdmin: true,
    },
  ]);

  const handleCreateGroup = () => {
    Alert.alert('Create Group', 'Group creation feature coming soon!');
  };

  const handleJoinGroup = () => {
    Alert.alert('Join Group', 'Group joining feature coming soon!');
  };

  const handleGroupPress = (group: Group) => {
    Alert.alert('Open Group', `Opening ${group.name}...`);
  };

  const handleGroupSettings = (group: Group) => {
    Alert.alert('Group Settings', `Settings for ${group.name} coming soon!`);
  };

  const renderGroupItem = ({ item }: { item: Group }) => (
    <TouchableOpacity
      style={styles.groupCard}
      onPress={() => handleGroupPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.groupInfo}>
        <View style={styles.groupAvatar}>
          <Text style={styles.groupAvatarText}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.groupDetails}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupName}>{item.name}</Text>
            {item.isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Admin</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.memberCount}>
            {item.memberCount} member{item.memberCount !== 1 ? 's' : ''}
          </Text>
          
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
          
          {item.lastMessageTime && (
            <Text style={styles.lastMessageTime}>
              {item.lastMessageTime}
            </Text>
          )}
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => handleGroupSettings(item)}
      >
        <Text style={styles.settingsButtonText}>⋮</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👥</Text>
      <Text style={styles.emptyStateTitle}>No groups yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Create or join groups to start group conversations
      </Text>
      
      <View style={styles.emptyStateButtons}>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
          <Text style={styles.createButtonText}>Create Group</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.joinButton} onPress={handleJoinGroup}>
          <Text style={styles.joinButtonText}>Join Group</Text>
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
    paddingBottom: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 5,
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
    fontSize: 20,
    marginBottom: 4,
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
    paddingTop: 10,
  },
  groupCard: {
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
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  groupDetails: {
    flex: 1,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  adminText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  memberCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#999',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  settingsButtonText: {
    fontSize: 18,
    color: '#666',
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
    marginBottom: 30,
  },
  emptyStateButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  createButton: {
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
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#128C7E',
    paddingHorizontal: 24,
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
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroupsScreen; 