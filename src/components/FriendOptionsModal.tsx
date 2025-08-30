import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import DatabaseService, { User } from '../database/DatabaseService';

interface FriendOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: User;
  friend: User;
  onFriendshipRemoved: () => void;
  onUserBlocked: () => void;
  onUserUnblocked: () => void;
}

const FriendOptionsModal: React.FC<FriendOptionsModalProps> = ({
  visible,
  onClose,
  currentUser,
  friend,
  onFriendshipRemoved,
  onUserBlocked,
  onUserUnblocked,
}) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      checkBlockStatus();
    }
  }, [visible, friend.id]);

  const checkBlockStatus = async () => {
    try {
      const blocked = await DatabaseService.isUserBlocked(currentUser.id, friend.id);
      setIsBlocked(blocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const handleBlockUser = async () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${friend.username}? You won't be able to see their messages or status updates.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await DatabaseService.blockUser(currentUser.id, friend.id);
              setIsBlocked(true);
              onUserBlocked();
              onClose();
              Alert.alert('User Blocked', `${friend.username} has been blocked.`);
            } catch (error) {
              console.error('Error blocking user:', error);
              Alert.alert('Error', 'Failed to block user. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleUnblockUser = async () => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${friend.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              setLoading(true);
              await DatabaseService.unblockUser(currentUser.id, friend.id);
              setIsBlocked(false);
              onUserUnblocked();
              onClose();
              Alert.alert('User Unblocked', `${friend.username} has been unblocked.`);
            } catch (error) {
              console.error('Error unblocking user:', error);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveFriendship = async () => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friend.username} from your friends? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await DatabaseService.removeFriendship(currentUser.id, friend.id);
              onFriendshipRemoved();
              onClose();
              Alert.alert('Friend Removed', `${friend.username} has been removed from your friends.`);
            } catch (error) {
              console.error('Error removing friendship:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Friend Options</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.friendInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {friend?.profilePicture || friend?.username?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.friendName}>{friend?.username || 'Unknown User'}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#25D366" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            ) : (
              <>
                {isBlocked ? (
                  <TouchableOpacity
                    style={[styles.optionButton, styles.unblockButton]}
                    onPress={handleUnblockUser}
                  >
                    <Text style={styles.unblockButtonText}>🔓 Unblock User</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.optionButton, styles.blockButton]}
                    onPress={handleBlockUser}
                  >
                    <Text style={styles.blockButtonText}>🚫 Block User</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.optionButton, styles.removeButton]}
                  onPress={handleRemoveFriendship}
                >
                  <Text style={styles.removeButtonText}>❌ Remove Friend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionButton, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  friendInfo: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  blockButton: {
    backgroundColor: '#FFE5E5',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32F2F',
  },
  unblockButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  unblockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  removeButton: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default FriendOptionsModal; 