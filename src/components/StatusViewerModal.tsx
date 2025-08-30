import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'react-native-video';
import DatabaseService from '../database/DatabaseService';
import StatusService from '../services/StatusService';

interface Status {
  id: number;
  userId: number;
  type: 'text' | 'image' | 'video';
  content: string;
  caption?: string;
  timestamp: string;
  expiresAt: string;
  isActive: boolean;
  user: {
    id: number;
    username: string;
    profilePicture?: string;
  };
}

interface StatusViewerModalProps {
  visible: boolean;
  statuses: Status[];
  currentIndex: number;
  currentUser: any;
  onClose: () => void;
  onStatusDeleted?: (statusId: number) => void;
  onReplyToStatus?: (status: Status) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  visible,
  statuses,
  currentIndex,
  currentUser,
  onClose,
  onStatusDeleted,
  onReplyToStatus,
}) => {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(currentIndex);
  const [showViews, setShowViews] = useState(false);
  const [statusViews, setStatusViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoPaused, setVideoPaused] = useState(false);

  const statusService = useRef(StatusService.getInstance());
  const videoRef = useRef<any>(null);

  useEffect(() => {
    setCurrentStatusIndex(currentIndex);
    // Record view when modal opens
    if (visible && currentStatus) {
      recordStatusView();
    }
  }, [currentIndex, visible]);

  const currentStatus = statuses[currentStatusIndex];

  const handleNext = () => {
    if (currentStatusIndex < statuses.length - 1) {
      setCurrentStatusIndex(currentStatusIndex + 1);
      recordStatusView();
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStatusIndex > 0) {
      setCurrentStatusIndex(currentStatusIndex - 1);
      recordStatusView();
    }
  };

  const recordStatusView = async () => {
    if (!currentStatus) return;
    
    try {
      await statusService.current.recordStatusView(currentStatus.id, currentUser.id);
    } catch (error) {
      console.error('Error recording status view:', error);
    }
  };

  const handleShowViews = async () => {
    try {
      setLoading(true);
      const views = await statusService.current.getStatusViews(currentStatus.id);
      setStatusViews(views);
      setShowViews(true);
    } catch (error) {
      console.error('Error loading status views:', error);
      Alert.alert('Error', 'Failed to load status views');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async () => {
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
              await statusService.current.deleteStatus(currentStatus.id);
              onStatusDeleted?.(currentStatus.id);
              onClose();
            } catch (error) {
              console.error('Error deleting status:', error);
              Alert.alert('Error', 'Failed to delete status');
            }
          },
        },
      ]
    );
  };

  const handleReply = () => {
    onReplyToStatus?.(currentStatus);
    onClose();
  };

  const handleVideoPress = () => {
    setVideoPaused(!videoPaused);
  };

  const renderStatusContent = () => {
    switch (currentStatus.type) {
      case 'text':
        return (
          <View style={styles.textContainer}>
            <Text style={styles.statusText}>{currentStatus.content}</Text>
          </View>
        );
      case 'image':
        return (
          <View style={styles.imageContainer}>
            <Image source={{ uri: currentStatus.content }} style={styles.statusImage} />
          </View>
        );
      case 'video':
        return (
          <View style={styles.videoContainer}>
            <TouchableOpacity onPress={handleVideoPress} style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={{ uri: currentStatus.content }}
                style={styles.statusVideo}
                resizeMode={ResizeMode.CONTAIN}
                paused={videoPaused}
                repeat={true}
                onLoad={() => {
                  // Auto-play video when loaded
                  setVideoPaused(false);
                }}
              />
              {videoPaused && (
                <View style={styles.playButton}>
                  <Text style={styles.playButtonText}>▶️</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  if (!currentStatus) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        {/* Status Content */}
        <View style={styles.statusContent}>
          {renderStatusContent()}
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {currentStatus.user.profilePicture || currentStatus.user.username.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentStatus.user.username}</Text>
              <Text style={styles.timestamp}>
                {statusService.current.formatStatusTime(currentStatus.timestamp)}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShowViews}>
              <Text style={styles.actionButtonText}>👁️ Views</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
              <Text style={styles.actionButtonText}>💬 Reply</Text>
            </TouchableOpacity>
            {currentStatus.userId === currentUser.id && (
              <TouchableOpacity style={styles.actionButton} onPress={handleDeleteStatus}>
                <Text style={styles.actionButtonText}>🗑️ Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Navigation */}
        <TouchableOpacity style={styles.navLeft} onPress={handlePrevious}>
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navRight} onPress={handleNext}>
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>

        {/* Caption */}
        {currentStatus.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>{currentStatus.caption}</Text>
          </View>
        )}

        {/* Status Views Modal */}
        <Modal visible={showViews} transparent animationType="slide">
          <View style={styles.viewsModalOverlay}>
            <View style={styles.viewsModalContainer}>
              <View style={styles.viewsModalHeader}>
                <Text style={styles.viewsModalTitle}>Status Views</Text>
                <TouchableOpacity onPress={() => setShowViews(false)}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              {loading ? (
                <ActivityIndicator size="large" color="#25D366" />
              ) : (
                <View style={styles.viewsList}>
                  {statusViews.map((view, index) => (
                    <View key={index} style={styles.viewItem}>
                      <Text style={styles.viewerName}>{view.viewer.username}</Text>
                      <Text style={styles.viewTime}>
                        {statusService.current.formatViewTime(view.viewedAt)}
                      </Text>
                    </View>
                  ))}
                  {statusViews.length === 0 && (
                    <Text style={styles.noViewsText}>No views yet</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
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
    width: screenWidth,
    height: screenHeight * 0.6,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  videoWrapper: {
    width: screenWidth,
    height: screenHeight * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusVideo: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  playButtonText: {
    fontSize: 40,
    color: '#ffffff',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  navLeft: {
    position: 'absolute',
    left: 20,
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  viewsModalContainer: {
    width: '80%',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  viewsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  viewsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewsList: {
    width: '100%',
  },
  viewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  viewerName: {
    fontSize: 16,
    color: '#ffffff',
  },
  viewTime: {
    fontSize: 14,
    color: '#cccccc',
  },
  noViewsText: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default StatusViewerModal; 