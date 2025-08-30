import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import DatabaseService, { User, Status } from '../database/DatabaseService';
import StatusService from '../services/StatusService';
import StatusCreationModal from '../components/StatusCreationModal';
import StatusViewerModal from '../components/StatusViewerModal';

interface StatusWithUser extends Status {
  user: User;
}

interface StatusScreenProps {
  currentUser: User;
  onBack?: () => void;
}

const StatusScreen: React.FC<StatusScreenProps> = ({ currentUser, onBack }) => {
  const [statuses, setStatuses] = useState<StatusWithUser[]>([]);
  const [myStatuses, setMyStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreationModal, setShowCreationModal] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);

  useEffect(() => {
    loadStatuses();
    // Set up interval to clean up expired statuses and refresh
    const interval = setInterval(() => {
      cleanupExpiredStatuses();
      loadStatuses();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      
      // Get active statuses from friends only
      const activeStatuses = await StatusService.getInstance().getActiveStatuses(currentUser.id);
      
      // Get current user's statuses
      const userStatuses = await StatusService.getInstance().getUserStatuses(currentUser.id);
      
      setStatuses(activeStatuses);
      setMyStatuses(userStatuses);
    } catch (error) {
      console.error('Error loading statuses:', error);
      Alert.alert('Error', 'Failed to load statuses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cleanupExpiredStatuses = async () => {
    try {
      await StatusService.getInstance().cleanupExpiredStatuses();
    } catch (error) {
      console.error('Error cleaning up expired statuses:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cleanupExpiredStatuses();
    await loadStatuses();
    setRefreshing(false);
  };

  const handleAddStatus = () => {
    setShowCreationModal(true);
  };

  const handleStatusCreated = () => {
    loadStatuses();
  };

  const handleStatusPress = (status: StatusWithUser, index: number) => {
    setSelectedStatusIndex(index);
    setShowViewerModal(true);
  };

  const handleMyStatusPress = () => {
    if (myStatuses.length > 0) {
      // Show options: View statuses or add new
      Alert.alert(
        'My Status',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View My Statuses', onPress: () => handleViewMyStatuses() },
          { text: 'Add New Status', onPress: handleAddStatus }
        ]
      );
    } else {
      handleAddStatus();
    }
  };

  const handleViewMyStatuses = () => {
    if (myStatuses.length > 0) {
      // Find the index of my status in the main statuses array
      const myStatusIndex = statuses.findIndex(s => s.userId === currentUser.id);
      if (myStatusIndex >= 0) {
        setSelectedStatusIndex(myStatusIndex);
        setShowViewerModal(true);
      }
    }
  };

  const handleDeleteStatus = async (statusId: number) => {
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
              await StatusService.getInstance().deleteStatus(statusId);
              Alert.alert('Success', 'Status deleted successfully!');
              loadStatuses(); // Refresh the list
            } catch (error) {
              console.error('Error deleting status:', error);
              Alert.alert('Error', 'Failed to delete status. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleStatusLongPress = (status: StatusWithUser) => {
    // Only allow deletion of own statuses
    if (status.userId === currentUser.id) {
      Alert.alert(
        'Status Options',
        'What would you like to do?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Status', style: 'destructive', onPress: () => handleDeleteStatus(status.id) },
          { text: 'View Status', onPress: () => handleStatusPress(status, statuses.indexOf(status)) }
        ]
      );
    } else {
      handleStatusPress(status, statuses.indexOf(status));
    }
  };

  const handleStatusDeleted = () => {
    loadStatuses();
  };

  const handleReplyToStatus = async (statusOwner: User, message: string) => {
    try {
      // Send the message to the status owner
      await DatabaseService.saveMessage(currentUser.id, statusOwner.id, message);
      
      // Show success message
      Alert.alert('Success', `Reply sent to ${statusOwner.username}`);
      
      // Optionally navigate to chat with the status owner
      // You can implement navigation logic here if needed
      
    } catch (error) {
      console.error('Error sending reply:', error);
      Alert.alert('Error', 'Failed to send reply. Please try again.');
    }
  };

  const renderMyStatus = () => {
    const hasActiveStatus = myStatuses.length > 0;
    const latestStatus = hasActiveStatus ? myStatuses[0] : null;

    return (
      <TouchableOpacity
        style={styles.myStatusItem}
        onPress={handleMyStatusPress}
        onLongPress={() => hasActiveStatus ? handleStatusLongPress({ ...latestStatus!, user: currentUser }) : null}
        activeOpacity={0.7}
      >
        <View style={styles.statusAvatar}>
          {currentUser.profilePicture ? (
            <Text style={styles.statusAvatarEmoji}>{currentUser.profilePicture}</Text>
          ) : (
            <Text style={styles.statusAvatarText}>
              {currentUser.username.charAt(0).toUpperCase()}
            </Text>
          )}
          <View style={styles.addStatusIcon}>
            <Text style={styles.addStatusIconText}>+</Text>
          </View>
          {hasActiveStatus && myStatuses.length > 1 && (
            <View style={styles.statusCountBadge}>
              <Text style={styles.statusCountText}>{myStatuses.length}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.statusItemContent}>
          <Text style={styles.statusUsername}>My Status</Text>
          <Text style={styles.statusText} numberOfLines={1}>
            {hasActiveStatus 
              ? myStatuses.length > 1 
                ? `${myStatuses.length} statuses` 
                : latestStatus?.type === 'text' 
                  ? latestStatus.content 
                  : latestStatus?.type === 'image' 
                    ? '📷 Photo' 
                    : '🎥 Video'
              : 'Tap to add status update'
            }
          </Text>
          <Text style={styles.statusTimestamp}>
            {hasActiveStatus 
              ? StatusService.getInstance().formatStatusTime(latestStatus!.timestamp)
              : 'Just now'
            }
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatusItem = ({ item, index }: { item: StatusWithUser; index: number }) => {
    // Skip if this is the current user's status (we show it separately)
    if (item.userId === currentUser.id) {
      return null;
    }

    return (
      <TouchableOpacity
        style={styles.statusItem}
        onPress={() => handleStatusPress(item, index)}
        onLongPress={() => handleStatusLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.statusAvatar}>
          {item.user.profilePicture ? (
            <Text style={styles.statusAvatarEmoji}>{item.user.profilePicture}</Text>
          ) : (
            <Text style={styles.statusAvatarText}>
              {item.user.username.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        
        <View style={styles.statusItemContent}>
          <Text style={styles.statusUsername}>{item.user.username}</Text>
          <Text style={styles.statusText} numberOfLines={1}>
            {item.type === 'text' 
              ? item.content 
              : item.type === 'image' 
                ? '📷 Photo' 
                : '🎥 Video'
            }
          </Text>
          <Text style={styles.statusTimestamp}>
            {StatusService.getInstance().formatStatusTime(item.timestamp)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📱</Text>
      <Text style={styles.emptyStateTitle}>No Status Updates</Text>
      <Text style={styles.emptyStateSubtitle}>
        {statuses.length === 0 && myStatuses.length === 0 
          ? 'Add friends to see their status updates, or create your own!'
          : 'Be the first to share what\'s on your mind!'
        }
      </Text>
      <TouchableOpacity style={styles.addStatusButton} onPress={handleAddStatus}>
        <Text style={styles.addStatusButtonText}>Add Status</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatusList = () => {
    const allStatuses = [renderMyStatus(), ...statuses.map((status, index) => 
      status.userId !== currentUser.id ? renderStatusItem({ item: status, index }) : null
    ).filter(Boolean)];

    if (allStatuses.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={statuses}
        renderItem={renderStatusItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.statusList}
        contentContainerStyle={styles.statusContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#25D366']}
            tintColor="#25D366"
          />
        }
        ListHeaderComponent={renderMyStatus}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status</Text>
        <Text style={styles.headerSubtitle}>Recent updates</Text>
      </View>

      {/* Status List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading statuses...</Text>
          </View>
        ) : (
          renderStatusList()
        )}
      </View>

      {/* Status Creation Modal */}
      <StatusCreationModal
        visible={showCreationModal}
        onClose={() => setShowCreationModal(false)}
        onStatusCreated={handleStatusCreated}
        currentUser={currentUser}
      />

      {/* Status Viewer Modal */}
      <StatusViewerModal
        visible={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        statuses={statuses}
        initialIndex={selectedStatusIndex}
        currentUser={currentUser}
        onStatusDeleted={loadStatuses}
        onReplyToStatus={handleReplyToStatus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    margin: 20,
    marginBottom: 10,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  statusList: {
    flex: 1,
  },
  statusContent: {
    padding: 20,
    paddingTop: 10,
  },
  myStatusItem: {
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
  statusItem: {
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
  statusAvatar: {
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
  statusAvatarEmoji: {
    fontSize: 30,
  },
  statusAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
  },
  addStatusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  addStatusIconText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusCountBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  statusCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusItemContent: {
    flex: 1,
  },
  statusUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  statusTimestamp: {
    fontSize: 12,
    color: '#999',
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
  addStatusButton: {
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
  addStatusButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
});

export default StatusScreen; 