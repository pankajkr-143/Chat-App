import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import DatabaseService, { User, FriendRequest } from '../database/DatabaseService';

interface NotificationBannerProps {
  currentUser: User;
  onNavigateToRequests: () => void;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({ 
  currentUser, 
  onNavigateToRequests 
}) => {
  const [pendingRequests, setPendingRequests] = useState<Array<FriendRequest & { fromUser: User }>>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (currentUser && currentUser.id) {
      loadPendingRequests();
      const interval = setInterval(loadPendingRequests, 10000); // Check every 10 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  useEffect(() => {
    if (pendingRequests.length > 0) {
      setShowBanner(true);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start(() => setShowBanner(false));
    }
  }, [pendingRequests]);

  const loadPendingRequests = async () => {
    try {
      if (!currentUser || !currentUser.id) {
        console.log('currentUser is not available yet');
        return;
      }
      const requests = await DatabaseService.getFriendRequests(currentUser.id);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Error loading pending requests:', error);
    }
  };

  const handleQuickAccept = async (request: FriendRequest & { fromUser: User }) => {
    try {
      await DatabaseService.respondToFriendRequest(request.id, 'accepted');
      
      // Remove the accepted request from the list
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      
      Alert.alert('Friend Added', `You are now friends with ${request.fromUser.username}!`);
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request. Please try again.');
    }
  };

  const handleQuickDecline = async (request: FriendRequest & { fromUser: User }) => {
    try {
      await DatabaseService.respondToFriendRequest(request.id, 'declined');
      
      // Remove the declined request from the list
      setPendingRequests(prev => prev.filter(r => r.id !== request.id));
      
      Alert.alert('Request Declined', 'Friend request declined.');
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'Failed to decline friend request. Please try again.');
    }
  };

  const handleViewAllRequests = () => {
    onNavigateToRequests();
  };

  if (!showBanner || pendingRequests.length === 0) {
    return null;
  }

  const firstRequest = pendingRequests[0];
  const hasMultipleRequests = pendingRequests.length > 1;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.leftContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {firstRequest.fromUser.profilePicture ? (
                <Text style={styles.avatarEmoji}>{firstRequest.fromUser.profilePicture}</Text>
              ) : (
                <Text style={styles.avatarText}>
                  {firstRequest.fromUser.username.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.textInfo}>
              <Text style={styles.title}>
                {hasMultipleRequests 
                  ? `${pendingRequests.length} Friend Requests`
                  : 'Friend Request'
                }
              </Text>
              <Text style={styles.subtitle}>
                {hasMultipleRequests
                  ? `From ${firstRequest.fromUser.username} and ${pendingRequests.length - 1} others`
                  : `From ${firstRequest.fromUser.username}`
                }
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          {!hasMultipleRequests ? (
            <>
              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleQuickAccept(firstRequest)}
              >
                <Text style={styles.acceptButtonText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleQuickDecline(firstRequest)}
              >
                <Text style={styles.declineButtonText}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, styles.viewAllButton]}
              onPress={handleViewAllRequests}
            >
              <Text style={styles.viewAllButtonText}>View</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarEmoji: {
    fontSize: 18,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  textInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#ffffff',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#25D366',
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewAllButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    width: 'auto',
    minWidth: 50,
  },
  viewAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#25D366',
  },
});

export default NotificationBanner; 