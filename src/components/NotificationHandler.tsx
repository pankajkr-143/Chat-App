import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import PushNotification from 'react-native-push-notification';
import NotificationService from '../services/NotificationService';

interface NotificationHandlerProps {
  onNavigateToChat?: (userId: number, username: string) => void;
  onNavigateToRequests?: () => void;
  onNavigateToCalls?: () => void;
  onNavigateToFriends?: () => void;
  onIncomingCall?: (userId: number, username: string, callId: string) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  onNavigateToChat,
  onNavigateToRequests,
  onNavigateToCalls,
  onNavigateToFriends,
  onIncomingCall,
}) => {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Configure notification handlers
    PushNotification.configure({
      onRegister: function (token: { os: string; token: string }) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification: any) {
        console.log('NOTIFICATION RECEIVED:', notification);
        
        // Handle notification tap based on type
        if (notification.userInfo) {
          const { type, userId, username, callId } = notification.userInfo;
          
          switch (type) {
            case 'friend_request':
              console.log('Navigate to friend requests');
              onNavigateToRequests?.();
              break;
            case 'message':
              console.log('Navigate to chat with:', username);
              if (userId && username) {
                onNavigateToChat?.(userId, username);
              }
              break;
            case 'call':
              console.log('Handle incoming call from:', username);
              if (userId && username && callId) {
                onIncomingCall?.(userId, username, callId);
              }
              break;
            case 'missed_call':
              console.log('Navigate to calls screen');
              onNavigateToCalls?.();
              break;
            case 'friend_accepted':
              console.log('Navigate to friends list');
              onNavigateToFriends?.();
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
      requestPermissions: true,
    });

    // Handle app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!');
        // Clear badge count when app comes to foreground
        NotificationService.getInstance().setBadgeCount(0);
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [onNavigateToChat, onNavigateToRequests, onNavigateToCalls, onNavigateToFriends, onIncomingCall]);

  // This component doesn't render anything
  return null;
};

export default NotificationHandler; 