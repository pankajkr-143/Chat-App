import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { Status, User } from '../database/DatabaseService';
import DatabaseService from '../database/DatabaseService';
import StatusService from '../services/StatusService';

interface StatusViewerModalProps {
  visible: boolean;
  onClose: () => void;
  statuses: (Status & { user: User })[];
  initialIndex: number;
  currentUser: User;
  onStatusDeleted?: () => void;
  onReplyToStatus?: (statusOwner: User, message: string) => void;
}

const { width, height } = Dimensions.get('window');

const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  visible,
  onClose,
  statuses,
  initialIndex,
  currentUser,
  onStatusDeleted,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentStatus, setCurrentStatus] = useState<(Status & { user: User }) | null>(null);

  useEffect(() => {
    if (statuses.length > 0 && initialIndex >= 0 && initialIndex < statuses.length) {
      setCurrentIndex(initialIndex);
      setCurrentStatus(statuses[initialIndex]);
      
      // Record the view when status is opened
      if (statuses[initialIndex] && statuses[initialIndex].userId !== currentUser.id) {
        recordStatusView(statuses[initialIndex].id, currentUser.id);
      }
    }
  }, [statuses, initialIndex]);

  const recordStatusView = async (statusId: number, viewerId: number) => {
    try {
      await StatusService.getInstance().recordStatusView(statusId, viewerId);
    } catch (error) {
      console.error('Error recording status view:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentStatus(statuses[nextIndex]);
      
      // Record view for the new status
      if (statuses[nextIndex] && statuses[nextIndex].userId !== currentUser.id) {
        recordStatusView(statuses[nextIndex].id, currentUser.id);
      }
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentStatus(statuses[prevIndex]);
      
      // Record view for the previous status
      if (statuses[prevIndex] && statuses[prevIndex].userId !== currentUser.id) {
        recordStatusView(statuses[prevIndex].id, currentUser.id);
      }
    }
  };

  const handleDeleteStatus = async () => {
    if (!currentStatus) return;

    Alert.alert(
      'Delete Status',
      'Are you sure you want to delete this status?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StatusService.getInstance().deleteStatus(currentStatus.id);
              Alert.alert('Success', 'Status deleted successfully!');
              if (onStatusDeleted) {
                onStatusDeleted();
              }
              onClose();
            } catch (error) {
              console.error('Error deleting status:', error);
              Alert.alert('Error', 'Failed to delete status. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleReply = () => {
    if (currentStatus) {
      Alert.prompt(
        `Reply to ${currentStatus.user.username}`,
        'Send a message',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async (message?: string) => {
              if (message && message.trim()) {
                try {
                  // Send the message to the status owner
                  await DatabaseService.saveMessage(
                    currentUser.id,
                    currentStatus.user.id,
                    message.trim()
                  );
                  
                  Alert.alert(
                    'Message Sent', 
                    `Reply sent to ${currentStatus.user.username}`,
                    [
                      {
                        text: 'OK',
                        onPress: () => {
                          // Close the status viewer and navigate to chat
                          onClose();
                          // You can add navigation logic here if needed
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('Error sending reply:', error);
                  Alert.alert('Error', 'Failed to send reply. Please try again.');
                }
              }
            }
          }
        ],
        'plain-text',
        '',
        'Type your reply...'
      );
    }
  };

  const handleShowViews = async () => {
    if (!currentStatus) return;

    try {
      const views = await StatusService.getInstance().getStatusViews(currentStatus.id);
      const viewCount = await StatusService.getInstance().getStatusViewCount(currentStatus.id);
      
      if (views.length === 0) {
        Alert.alert('Status Views', 'No one has viewed this status yet.');
        return;
      }

      const viewList = views.map(view => 
        `${view.viewer.username} - ${StatusService.getInstance().formatViewTime(view.viewedAt)}`
      ).join('\n');

      Alert.alert(
        `Status Views (${viewCount})`,
        viewList,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error getting status views:', error);
      Alert.alert('Error', 'Failed to load status views.');
    }
  };

  const formatTime = (timestamp: string) => {
    return StatusService.getInstance().formatStatusTime(timestamp);
  };

  const getExpirationTime = (expiresAt: string) => {
    return StatusService.getInstance().getStatusExpirationTime(expiresAt);
  };

  if (!currentStatus) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {currentStatus.user.profilePicture ? (
                <Text style={styles.avatarEmoji}>{currentStatus.user.profilePicture}</Text>
              ) : (
                <Text style={styles.avatarText}>
                  {currentStatus.user.username.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentStatus.user.username}</Text>
              <Text style={styles.timestamp}>{formatTime(currentStatus.timestamp)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Status Content */}
        <View style={styles.content}>
          {currentStatus.type === 'text' && (
            <View style={styles.textContainer}>
              <Text style={styles.statusText}>{currentStatus.content}</Text>
            </View>
          )}

          {currentStatus.type === 'image' && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${currentStatus.content}` }}
                style={styles.statusImage}
                resizeMode="contain"
              />
              {currentStatus.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.captionText}>{currentStatus.caption}</Text>
                </View>
              )}
            </View>
          )}

          {currentStatus.type === 'video' && (
            <View style={styles.videoContainer}>
              <Text style={styles.videoPlaceholder}>Video Status</Text>
              <Text style={styles.videoText}>Video playback not implemented yet</Text>
              {currentStatus.caption && (
                <View style={styles.captionContainer}>
                  <Text style={styles.captionText}>{currentStatus.caption}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.statusInfo}>
            <Text style={styles.expirationText}>
              {getExpirationTime(currentStatus.expiresAt)}
            </Text>
            <Text style={styles.statusCount}>
              {currentIndex + 1} of {statuses.length}
            </Text>
          </View>
          
          <View style={styles.actions}>
            {currentStatus.userId === currentUser.id && (
              <>
                <TouchableOpacity onPress={handleShowViews} style={styles.viewsButton}>
                  <Text style={styles.viewsButtonText}>Views</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteStatus} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={handleReply} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Navigation */}
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navButtonText}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={handleNext}
        >
          <Text style={styles.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#075E54',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#cccccc',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    margin: 20,
  },
  statusText: {
    fontSize: 24,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusImage: {
    width: width,
    height: height * 0.6,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  videoPlaceholder: {
    fontSize: 24,
    color: '#ffffff',
    marginBottom: 16,
  },
  videoText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    padding: 16,
  },
  captionText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusInfo: {
    flex: 1,
  },
  expirationText: {
    fontSize: 12,
    color: '#cccccc',
    marginBottom: 4,
  },
  statusCount: {
    fontSize: 12,
    color: '#cccccc',
  },
  actions: {
    flexDirection: 'row',
  },
  viewsButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  viewsButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButton: {
    left: 20,
  },
  nextButton: {
    right: 20,
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default StatusViewerModal; 