import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert, PermissionsAndroid } from 'react-native';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'friend_request' | 'message' | 'friend_accepted' | 'call' | 'missed_call' | 'general';
  data?: any;
  userId?: number;
  username?: string;
  timestamp: number;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private notificationPermissionGranted = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Configure push notifications
      PushNotification.configure({
        onRegister: function (token: { os: string; token: string }) {
          console.log('TOKEN:', token);
        },
        onNotification: function (notification: any) {
          console.log('NOTIFICATION:', notification);
          
          // Handle notification tap based on type
          if (notification.userInfo) {
            const { type, userId, username, callId } = notification.userInfo;
            
            switch (type) {
              case 'friend_request':
                // Navigate to friend requests screen
                console.log('Navigate to friend requests');
                break;
              case 'message':
                // Navigate to chat with the user
                console.log('Navigate to chat with:', username);
                break;
              case 'call':
                // Handle incoming call
                console.log('Handle incoming call from:', username);
                break;
              case 'missed_call':
                // Navigate to calls screen
                console.log('Navigate to calls screen');
                break;
              case 'friend_accepted':
                // Navigate to chat or friends list
                console.log('Navigate to friends list');
                break;
            }
          }
          
          // Finish the notification
          notification.finish();
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: Platform.OS === 'ios',
      });

      // Create notification channel for Android
      if (Platform.OS === 'android') {
        PushNotification.createChannel(
          {
            channelId: 'chat-app-channel',
            channelName: 'Chat App Notifications',
            channelDescription: 'Notifications for friend requests, messages, and updates',
            playSound: true,
            soundName: 'default',
            importance: 4,
            vibrate: true,
          },
          (created: boolean) => console.log(`Channel created: ${created}`)
        );
      }

      // Request notification permissions
      await this.requestNotificationPermissions();
      
      this.isInitialized = true;
      console.log('NotificationService initialized successfully');
    } catch (error) {
      console.error('Error initializing NotificationService:', error);
    }
  }

  async requestNotificationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS permissions are handled by PushNotification.configure
        this.notificationPermissionGranted = true;
        return true;
      } else if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'ChatApp needs notification permission to send you friend requests and message notifications.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        this.notificationPermissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        return this.notificationPermissionGranted;
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async showNotification(notificationData: Omit<NotificationData, 'id' | 'timestamp'>): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.notificationPermissionGranted) {
      console.log('Notification permission not granted');
      return;
    }

    const id = Date.now().toString();
    const fullNotificationData: NotificationData = {
      ...notificationData,
      id,
      timestamp: Date.now(),
    };

    try {
      // Store notification in local storage for history
      await this.storeNotification(fullNotificationData);

      // Show native notification
      PushNotification.localNotification({
        channelId: 'chat-app-channel',
        title: notificationData.title,
        message: notificationData.message,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
        vibrate: true,
        vibration: 300,
        autoCancel: true,
        largeIcon: 'ic_launcher',
        smallIcon: 'ic_notification',
        bigText: notificationData.message,
        subText: notificationData.type,
        color: '#25D366',
        userInfo: {
          type: notificationData.type,
          userId: notificationData.userId,
          username: notificationData.username,
          ...notificationData.data,
        },
      });

      console.log('Notification sent:', fullNotificationData);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Friend request notification
  async showFriendRequestNotification(fromUser: { id: number; username: string; profilePicture?: string }): Promise<void> {
    await this.showNotification({
      title: 'New Friend Request',
      message: `${fromUser.username} sent you a friend request`,
      type: 'friend_request',
      userId: fromUser.id,
      username: fromUser.username,
      data: {
        profilePicture: fromUser.profilePicture,
      },
    });
  }

  // Message notification
  async showMessageNotification(fromUser: { id: number; username: string; profilePicture?: string }, message: string): Promise<void> {
    const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
    
    await this.showNotification({
      title: `Message from ${fromUser.username}`,
      message: truncatedMessage,
      type: 'message',
      userId: fromUser.id,
      username: fromUser.username,
      data: {
        profilePicture: fromUser.profilePicture,
        fullMessage: message,
      },
    });
  }

  // Friend request accepted notification
  async showFriendAcceptedNotification(fromUser: { id: number; username: string; profilePicture?: string }): Promise<void> {
    await this.showNotification({
      title: 'Friend Request Accepted',
      message: `${fromUser.username} accepted your friend request`,
      type: 'friend_accepted',
      userId: fromUser.id,
      username: fromUser.username,
      data: {
        profilePicture: fromUser.profilePicture,
      },
    });
  }

  // Incoming call notification
  async showIncomingCallNotification(fromUser: { id: number; username: string; profilePicture?: string }, callId: string): Promise<void> {
    await this.showNotification({
      title: 'Incoming Call',
      message: `${fromUser.username} is calling you`,
      type: 'call',
      userId: fromUser.id,
      username: fromUser.username,
      data: {
        profilePicture: fromUser.profilePicture,
        callId: callId,
        callType: 'incoming',
      },
    });
  }

  // Missed call notification
  async showMissedCallNotification(fromUser: { id: number; username: string; profilePicture?: string }): Promise<void> {
    await this.showNotification({
      title: 'Missed Call',
      message: `You missed a call from ${fromUser.username}`,
      type: 'missed_call',
      userId: fromUser.id,
      username: fromUser.username,
      data: {
        profilePicture: fromUser.profilePicture,
        callType: 'missed',
      },
    });
  }

  // Cancel call notification
  cancelCallNotification(callId: string): void {
    try {
      PushNotification.cancelLocalNotifications({ id: callId });
    } catch (error) {
      console.error('Error canceling call notification:', error);
    }
  }

  // General notification
  async showGeneralNotification(title: string, message: string, data?: any): Promise<void> {
    await this.showNotification({
      title,
      message,
      type: 'general',
      data,
    });
  }

  // Store notification in local storage
  private async storeNotification(notification: NotificationData): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      notifications.unshift(notification);
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      await AsyncStorage.setItem('app_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  // Get stored notifications
  async getStoredNotifications(): Promise<NotificationData[]> {
    try {
      const stored = await AsyncStorage.getItem('app_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('app_notifications');
      PushNotification.cancelAllLocalNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Clear specific notification
  async clearNotification(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getStoredNotifications();
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem('app_notifications', JSON.stringify(filteredNotifications));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  }

  // Check if notification permission is granted
  async isPermissionGranted(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // For iOS, we assume permission is granted if the service is initialized
        // In a real app, you might want to use a native module to check actual permission
        return this.notificationPermissionGranted;
      } else if (Platform.OS === 'android') {
        // For Android, check the actual permission status
        const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        this.notificationPermissionGranted = granted;
        return granted;
      }
      return false;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return this.notificationPermissionGranted;
    }
  }

  // Request permission with user prompt
  async requestPermissionWithPrompt(): Promise<boolean> {
    Alert.alert(
      'Enable Notifications',
      'ChatApp would like to send you notifications for friend requests and new messages. This helps you stay connected with your friends.',
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: () => console.log('User declined notification permission'),
        },
        {
          text: 'Enable',
          onPress: async () => {
            const granted = await this.requestNotificationPermissions();
            if (granted) {
              Alert.alert('Notifications Enabled', 'You will now receive notifications for friend requests and messages!');
            } else {
              Alert.alert('Permission Denied', 'You can enable notifications later in your device settings.');
            }
          },
        },
      ]
    );
    
    return this.notificationPermissionGranted;
  }

  // Schedule notification (for future use)
  scheduleNotification(notificationData: Omit<NotificationData, 'id' | 'timestamp'>, date: Date): void {
    if (!this.isInitialized) {
      console.error('NotificationService not initialized');
      return;
    }

    PushNotification.localNotificationSchedule({
      channelId: 'chat-app-channel',
      title: notificationData.title,
      message: notificationData.message,
      date,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      vibration: 300,
      autoCancel: true,
      largeIcon: 'ic_launcher',
      smallIcon: 'ic_notification',
      bigText: notificationData.message,
      subText: notificationData.type,
      color: '#25D366',
      userInfo: {
        type: notificationData.type,
        userId: notificationData.userId,
        username: notificationData.username,
        ...notificationData.data,
      },
    });
  }

  // Cancel all scheduled notifications
  cancelAllScheduledNotifications(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  // Get notification badge count
  async getBadgeCount(): Promise<number> {
    try {
      const notifications = await this.getStoredNotifications();
      return notifications.filter(n => n.type === 'friend_request' || n.type === 'message').length;
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  // Set badge count
  setBadgeCount(count: number): void {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  // Check if user has been asked for notification permission
  async hasUserBeenAskedForPermission(userId: number): Promise<boolean> {
    try {
      const key = `notification_permission_asked_${userId}`;
      const hasBeenAsked = await AsyncStorage.getItem(key);
      return hasBeenAsked === 'true';
    } catch (error) {
      console.error('Error checking if user has been asked for permission:', error);
      return false;
    }
  }

  // Mark that user has been asked for notification permission
  async markUserAskedForPermission(userId: number): Promise<void> {
    try {
      const key = `notification_permission_asked_${userId}`;
      await AsyncStorage.setItem(key, 'true');
    } catch (error) {
      console.error('Error marking user as asked for permission:', error);
    }
  }
}

export default NotificationService; 