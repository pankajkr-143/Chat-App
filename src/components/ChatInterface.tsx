import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
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
import DatabaseService, { User } from '../database/DatabaseService';

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
        return <CallsScreen currentUser={currentUser} />;
      default:
        return null;
    }
  };

  const getNotificationTopOffset = () => {
    return Math.max(insets.top + 10, 20);
  };

  return (
    <View style={styles.container}>
      {/* Notification Banner - Always on top */}
      <View style={[styles.notificationContainer, { paddingTop: getNotificationTopOffset() }]}>
        <NotificationBanner
          currentUser={currentUser}
          onNavigateToRequests={handleNavigateToRequests}
        />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <View style={styles.headerContent}>
          {chatView === 'individual-chat' && selectedFriend ? (
            <>
              <TouchableOpacity style={styles.backButton} onPress={handleBackToChat}>
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <View style={styles.headerLogo}>
                <Text style={styles.headerLogoText}>{selectedFriend.profilePicture}</Text>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>{selectedFriend.username}</Text>
                <Text style={styles.headerSubtitle}>
                  {selectedFriend.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
              <View style={styles.chatActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>📹</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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