import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import DatabaseService from '../database/DatabaseService';

interface UserNotificationBannerProps {
  currentUser: { id: number };
  onMarkAsRead?: (notificationId: number) => void;
}

const UserNotificationBanner: React.FC<UserNotificationBannerProps> = ({ currentUser, onMarkAsRead }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [slideAnim] = useState(new Animated.Value(-100));
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (notifications.length > 0 && !isVisible) {
      showNotification();
    }
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const userNotifications = await DatabaseService.getNotificationsForUser(currentUser.id);
      const unreadNotifications = userNotifications.filter(n => !n.isRead);
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const showNotification = () => {
    if (notifications.length === 0) return;

    setIsVisible(true);
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(8000), // Show for 8 seconds
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Move to next notification or hide
      if (currentNotificationIndex < notifications.length - 1) {
        setCurrentNotificationIndex(prev => prev + 1);
        slideAnim.setValue(-100);
        setTimeout(showNotification, 500);
      } else {
        setCurrentNotificationIndex(0);
        setIsVisible(false);
        setNotifications([]);
      }
    });
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await DatabaseService.markNotificationAsRead(notificationId);
      if (onMarkAsRead) {
        onMarkAsRead(notificationId);
      }
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      setNotifications([]);
      setCurrentNotificationIndex(0);
    });
  };

  if (notifications.length === 0 || !isVisible) {
    return null;
  }

  const currentNotification = notifications[currentNotificationIndex];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.notificationInfo}>
          <Text style={styles.title}>📢 {currentNotification.title}</Text>
          <Text style={styles.message}>{currentNotification.message}</Text>
          <Text style={styles.type}>
            {currentNotification.type === 'global' ? 'Global Message' : 'Personal Message'}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleMarkAsRead(currentNotification.id)}
          >
            <Text style={styles.actionButtonText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDismiss}
          >
            <Text style={styles.actionButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: '#25D366',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  content: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  notificationInfo: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#E8F5E8',
    marginBottom: 4,
  },
  type: {
    fontSize: 12,
    color: '#C8E6C9',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserNotificationBanner; 