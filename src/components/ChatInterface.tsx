import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SearchBar from './SearchBar';
import BottomNavigation from './BottomNavigation';
import HeaderMenu from './HeaderMenu';
import NotificationBanner from './NotificationBanner';
import FriendsListScreen from '../screens/FriendsListScreen';
import ChatScreen from '../screens/ChatScreen';
import FindFriendsScreen from '../screens/FindFriendsScreen';
import CallsScreen from '../screens/CallsScreen';
import StatusScreen from '../screens/StatusScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupsScreen from '../screens/GroupsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import RequestsScreen from '../screens/RequestsScreen';
import CallScreen from '../screens/CallScreen';
import DatabaseService, { User } from '../database/DatabaseService';
import CallService, { CallSession } from '../services/CallService';
import FriendOptionsModal from './FriendOptionsModal';

interface ChatInterfaceProps {
  currentUser: User;
  onLogout: () => void;
}

type ActiveTab = 'chat' | 'find' | 'status' | 'call';
type ChatView = 'friends-list' | 'individual-chat';
type MenuScreen = 'profile' | 'groups' | 'settings' | 'about' | 'requests' | null;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser, onLogout }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [chatView, setChatView] = useState<ChatView>('friends-list');
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuScreen, setMenuScreen] = useState<MenuScreen>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Call state
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);

  // Friend options modal state
  const [showFriendOptions, setShowFriendOptions] = useState(false);
  const [selectedFriendForOptions, setSelectedFriendForOptions] = useState<User | null>(null);

  // Initialize CallService
  useEffect(() => {
    const callService = CallService.getInstance();
    callService.initialize();
    
    // Listen for call events
    callService.addCallListener((call) => {
      setActiveCall(call);
    });

    return () => {
      callService.removeCallListener(() => {});
    };
  }, []);

  // Load unread message count
  useEffect(() => {
    loadUnreadCount();
    
    // Set up interval to refresh unread count every 5 seconds
    const interval = setInterval(loadUnreadCount, 5000);
    
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const loadUnreadCount = async () => {
    try {
      const count = await DatabaseService.getUnreadMessageCount(currentUser.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleTabPress = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMenuScreen(null);
    if (tab === 'chat') {
      setChatView('friends-list');
      setSelectedFriend(null);
      // Clear unread count when user taps on chat tab
      setUnreadCount(0);
    }
  };

  const handleNavigateToScreen = (screen: string) => {
    setMenuScreen(screen as MenuScreen);
  };

  const handleBackFromMenu = () => {
    setMenuScreen(null);
  };

  const handleFriendSelect = (friend: User) => {
    setSelectedFriend(friend);
    setChatView('individual-chat');
  };

  const handleBackToChat = async () => {
    setChatView('friends-list');
    setSelectedFriend(null);
    // Refresh unread count when returning from chat
    await loadUnreadCount();
  };

  const handleMenuPress = () => {
    // Menu is handled by individual menu items
  };

  const handleLogout = async () => {
    try {
      // Update user online status to offline
      await DatabaseService.updateUserOnlineStatus(currentUser.id, false);
      
      // Call the logout callback to return to auth screen
      onLogout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Still logout even if there's an error
      onLogout();
    }
  };

  const handleNavigateToRequests = () => {
    setMenuScreen('requests');
  };

  // Call handlers
  const handleStartCall = async (receiver: User, type: 'voice' | 'video') => {
    try {
      const callService = CallService.getInstance();
      const callSession = await callService.startCall(currentUser, receiver, type);
      setActiveCall(callSession);
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Call Error', error instanceof Error ? error.message : 'Failed to start call');
    }
  };

  const handleAnswerCall = async () => {
    try {
      if (incomingCall) {
        const callService = CallService.getInstance();
        const callSession = await callService.answerCall(incomingCall.callId, currentUser);
        setActiveCall(callSession);
        setIncomingCall(null);
      }
    } catch (error) {
      console.error('Error answering call:', error);
      Alert.alert('Call Error', 'Failed to answer call');
    }
  };

  const handleDeclineCall = async () => {
    try {
      if (incomingCall) {
        const callService = CallService.getInstance();
        await callService.declineCall(incomingCall.callId, currentUser);
        setIncomingCall(null);
      }
    } catch (error) {
      console.error('Error declining call:', error);
      setIncomingCall(null);
    }
  };

  const handleEndCall = async () => {
    try {
      if (activeCall) {
        const callService = CallService.getInstance();
        const duration = callService.getCurrentCallDuration();
        await callService.endCall(activeCall.callId, duration);
        setActiveCall(null);
      }
    } catch (error) {
      console.error('Error ending call:', error);
      setActiveCall(null);
    }
  };

  const handleIncomingCall = (callSession: CallSession) => {
    setIncomingCall(callSession);
  };

  // Friend options handlers
  const handleShowFriendOptions = (friend: User) => {
    setSelectedFriendForOptions(friend);
    setShowFriendOptions(true);
  };

  const handleCloseFriendOptions = () => {
    setShowFriendOptions(false);
    setSelectedFriendForOptions(null);
  };

  const handleFriendshipRemoved = () => {
    // Refresh friends list and go back to friends list
    setChatView('friends-list');
    setSelectedFriend(null);
    setShowFriendOptions(false);
    setSelectedFriendForOptions(null);
  };

  const handleUserBlocked = () => {
    // Refresh friends list and go back to friends list
    setChatView('friends-list');
    setSelectedFriend(null);
  };

  const handleUserUnblocked = () => {
    // Refresh friends list
    setChatView('friends-list');
    setSelectedFriend(null);
  };

  // Listen for incoming calls
  useEffect(() => {
    const callService = CallService.getInstance();
    
    const handleCallUpdate = (call: CallSession | null) => {
      if (call && call.receiver.id === currentUser.id && call.caller.id !== currentUser.id) {
        // This is an incoming call for the current user
        setIncomingCall(call);
      } else if (call && call.caller.id === currentUser.id) {
        // This is an outgoing call from the current user
        setActiveCall(call);
      } else if (!call) {
        // Call ended
        setActiveCall(null);
        setIncomingCall(null);
      }
    };

    callService.addCallListener(handleCallUpdate);

    return () => {
      callService.removeCallListener(handleCallUpdate);
    };
  }, [currentUser.id]);

  const renderMenuScreen = () => {
    switch (menuScreen) {
      case 'profile': return <ProfileScreen currentUser={currentUser} onBack={handleBackFromMenu} onLogout={handleLogout} />;
      case 'groups': return <GroupsScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'settings': return <SettingsScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'about': return <AboutScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'requests': return <RequestsScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      default: return null;
    }
  };

  const renderCurrentScreen = () => {
    if (menuScreen) {
      return renderMenuScreen();
    }

    switch (activeTab) {
      case 'chat':
        if (chatView === 'individual-chat' && selectedFriend) {
          return (
            <ChatScreen
              currentUser={currentUser}
              selectedFriend={selectedFriend}
              onBack={handleBackToChat}
              onMessageSent={loadUnreadCount}
            />
          );
        } else {
          return (
            <FriendsListScreen
              currentUser={currentUser}
              searchQuery={searchQuery}
              onFriendSelect={handleFriendSelect}
              onUnreadCountChange={loadUnreadCount}
            />
          );
        }
      case 'find':
        return <FindFriendsScreen currentUser={currentUser} />;
      case 'status':
        return <StatusScreen currentUser={currentUser} />;
      case 'call':
        return (
          <CallsScreen 
            currentUser={currentUser} 
            onStartCall={handleStartCall}
          />
        );
      default:
        return null;
    }
  };

  const getNotificationTopOffset = () => {
    return Math.max(insets.top + 10, 20);
  };

  return (
    <>
      {/* Friend Options Modal - Outside main container */}
      <FriendOptionsModal
        visible={showFriendOptions}
        onClose={handleCloseFriendOptions}
        currentUser={currentUser}
        friend={selectedFriendForOptions || currentUser} // Fallback to prevent null
        onFriendshipRemoved={handleFriendshipRemoved}
        onUserBlocked={handleUserBlocked}
        onUserUnblocked={handleUserUnblocked}
      />

      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Active Call Screen - Full Screen */}
        {activeCall && (
          <View style={styles.fullScreenCall}>
            <CallScreen
              callSession={activeCall}
              onEndCall={handleEndCall}
            />
          </View>
        )}

        {/* Incoming Call Screen - Full Screen */}
        {incomingCall && (
          <View style={styles.fullScreenCall}>
            <CallScreen
              callSession={incomingCall}
              onEndCall={handleDeclineCall}
              onAnswerCall={handleAnswerCall}
              onDeclineCall={handleDeclineCall}
            />
          </View>
        )}

        {/* Main App Interface - Only show when no active calls */}
        {!activeCall && !incomingCall && (
          <>
            {/* Notification Banner */}
            <View style={styles.notificationContainer}>
              <NotificationBanner 
                currentUser={currentUser} 
                onNavigateToRequests={handleNavigateToRequests}
              />
            </View>

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
              <View style={styles.headerContent}>
                {chatView === 'individual-chat' && selectedFriend ? (
                  <>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackToChat}>
                      <Text style={styles.backButtonText}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerLogo}>
                      <Text style={styles.headerLogoText}>
                        {selectedFriend.profilePicture || '👤'}
                      </Text>
                    </View>
                    <View style={styles.headerText}>
                      <Text style={styles.headerTitle}>{selectedFriend.username}</Text>
                      <Text style={styles.headerSubtitle}>
                        {selectedFriend.isOnline ? 'Online' : 'Offline'}
                      </Text>
                    </View>
                    <View style={styles.chatActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => selectedFriend && handleStartCall(selectedFriend, 'voice')}
                      >
                        <Text style={styles.actionButtonText}>📞</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => selectedFriend && handleStartCall(selectedFriend, 'video')}
                      >
                        <Text style={styles.actionButtonText}>📹</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => selectedFriend && handleShowFriendOptions(selectedFriend)}
                      >
                        <Text style={styles.actionButtonText}>⋮</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.headerLogo}>
                      <Text style={styles.headerLogoText}>💬</Text>
                    </View>
                    <View style={styles.headerText}>
                      <Text style={styles.headerTitle}>Chats</Text>
                      <Text style={styles.headerSubtitle}>Your conversations</Text>
                    </View>
                    <HeaderMenu
                      currentUser={currentUser}
                      onNavigateToScreen={handleNavigateToScreen}
                      onLogout={handleLogout}
                    />
                  </>
                )}
              </View>
            </View>

            {/* Search Bar - Only show on friends list */}
            {activeTab === 'chat' && chatView === 'friends-list' && !menuScreen && (
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search friends..."
              />
            )}

            {/* Content Area */}
            <View style={styles.content}>
              {renderCurrentScreen()}
            </View>

            {/* Bottom Navigation */}
            <BottomNavigation
              activeTab={activeTab}
              onTabPress={handleTabPress}
              unreadCount={unreadCount}
            />
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  fullScreenCall: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: '#000',
  },
  notificationContainer: {
    position: 'absolute',
    top: 80, // Position below header
    left: 16,
    right: 16,
    zIndex: 1000,
    borderRadius: 12,
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
    backgroundColor: '#075E54',
    paddingBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerLogoText: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    opacity: 0.9,
  },
  chatActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#ffffff',
  },
  content: {
    flex: 1,
  },
  friendsScreenContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
});

export default ChatInterface; 