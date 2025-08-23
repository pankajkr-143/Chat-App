import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService, { ChatMessage, User } from '../database/DatabaseService';
import SearchBar from './SearchBar';
import HeaderMenu from './HeaderMenu';
import BottomNavigation from './BottomNavigation';
import FriendsListScreen from '../screens/FriendsListScreen';
import FindFriendsScreen from '../screens/FindFriendsScreen';
import CallsScreen from '../screens/CallsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import GroupsScreen from '../screens/GroupsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import RequestsScreen from '../screens/RequestsScreen';

interface ChatInterfaceProps {
  currentUser: User;
}

type ActiveTab = 'chat' | 'find' | 'call';
type ChatView = 'friends-list' | 'individual-chat';
type MenuScreen = 'profile' | 'groups' | 'settings' | 'about' | 'requests' | null;

const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentUser }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [chatView, setChatView] = useState<ChatView>('friends-list');
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuScreen, setMenuScreen] = useState<MenuScreen>(null);

  const handleTabPress = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMenuScreen(null);
    if (tab === 'chat') {
      setChatView('friends-list');
      setSelectedFriend(null);
    }
  };

  const handleMenuPress = () => {
    console.log('Menu pressed');
  };

  const handleNavigateToScreen = (screen: string) => {
    setMenuScreen(screen as MenuScreen);
  };

  const handleFriendSelect = (friend: User) => {
    setSelectedFriend(friend);
    setChatView('individual-chat');
  };

  const handleBackToFriendsList = () => {
    setChatView('friends-list');
    setSelectedFriend(null);
  };

  const handleBackToChat = () => {
    setActiveTab('chat');
    setMenuScreen(null);
  };

  const handleBackFromMenu = () => {
    setMenuScreen(null);
  };

  const renderChatScreen = () => {
    if (chatView === 'individual-chat' && selectedFriend) {
      return (
        <ChatScreen
          currentUser={currentUser}
          selectedFriend={selectedFriend}
          onBack={handleBackToFriendsList}
        />
      );
    }

    return (
      <View style={styles.friendsScreenContainer}>
        <FriendsListScreen
          currentUser={currentUser}
          onFriendSelect={handleFriendSelect}
        />
      </View>
    );
  };

  const renderMenuScreen = () => {
    switch (menuScreen) {
      case 'profile':
        return <ProfileScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'groups':
        return <GroupsScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'settings':
        return <SettingsScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'about':
        return <AboutScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      case 'requests':
        return <RequestsScreen currentUser={currentUser} onBack={handleBackFromMenu} />;
      default:
        return null;
    }
  };

  const renderCurrentScreen = () => {
    // If a menu screen is active, show it
    if (menuScreen) {
      return renderMenuScreen();
    }

    // Otherwise show the regular tab screens
    switch (activeTab) {
      case 'chat':
        return renderChatScreen();
      case 'find':
        return (
          <FindFriendsScreen 
            currentUser={currentUser} 
            onBack={handleBackToChat} 
          />
        );
      case 'call':
        return (
          <CallsScreen 
            currentUser={currentUser} 
            onBack={handleBackToChat} 
          />
        );
      default:
        return renderChatScreen();
    }
  };

  const getHeaderTitle = () => {
    if (menuScreen) {
      switch (menuScreen) {
        case 'profile':
          return 'Profile';
        case 'groups':
          return 'Groups';
        case 'settings':
          return 'Settings';
        case 'about':
          return 'About';
        case 'requests':
          return 'Requests';
        default:
          return 'Menu';
      }
    }

    if (activeTab === 'chat') {
      if (chatView === 'individual-chat' && selectedFriend) {
        return selectedFriend.email;
      }
      return 'Chats';
    } else if (activeTab === 'find') {
      return 'Find Friends';
    } else if (activeTab === 'call') {
      return 'Calls';
    }
    return 'Chats';
  };

  const getHeaderSubtitle = () => {
    if (menuScreen) {
      switch (menuScreen) {
        case 'profile':
          return 'Manage your profile';
        case 'groups':
          return 'Create and manage groups';
        case 'settings':
          return 'App preferences and settings';
        case 'about':
          return 'App information and support';
        case 'requests':
          return 'Friend requests and invitations';
        default:
          return '';
      }
    }

    if (activeTab === 'chat') {
      if (chatView === 'individual-chat' && selectedFriend) {
        return 'Online';
      }
      return 'Your conversations';
    } else if (activeTab === 'find') {
      return 'Discover new people to chat with';
    } else if (activeTab === 'call') {
      return 'Your call history';
    }
    return '';
  };

  const shouldShowBackButton = () => {
    return menuScreen !== null || 
           (activeTab === 'find' || activeTab === 'call') || 
           (activeTab === 'chat' && chatView === 'individual-chat');
  };

  const handleBackPress = () => {
    if (menuScreen) {
      setMenuScreen(null);
    } else if (activeTab === 'find' || activeTab === 'call') {
      setActiveTab('chat');
    } else if (activeTab === 'chat' && chatView === 'individual-chat') {
      setChatView('friends-list');
      setSelectedFriend(null);
    }
  };

  const isIndividualChat = () => {
    return activeTab === 'chat' && chatView === 'individual-chat';
  };

  const shouldShowMenu = () => {
    return !menuScreen && !isIndividualChat();
  };

  const shouldShowBottomNav = () => {
    return !menuScreen;
  };

  return (
    <View style={styles.container}>
      {/* Header - Always visible */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 20) }]}>
        <View style={styles.headerContent}>
          {shouldShowBackButton() ? (
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <Text style={styles.backButtonText}>‹</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerLogo}>
              <Text style={styles.headerLogoText}>💬</Text>
            </View>
          )}
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{getHeaderTitle()}</Text>
            <Text style={styles.headerSubtitle}>{getHeaderSubtitle()}</Text>
          </View>
          
          {isIndividualChat() ? (
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
          ) : shouldShowMenu() ? (
            <HeaderMenu 
              onMenuPress={handleMenuPress} 
              onNavigateToScreen={handleNavigateToScreen}
            />
          ) : null}
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>

      {/* Bottom Navigation - Only show when not in menu screens */}
      {shouldShowBottomNav() && (
        <BottomNavigation 
          activeTab={activeTab} 
          onTabPress={handleTabPress} 
        />
      )}

      {/* Bottom Safe Area */}
      <View style={{ height: insets.bottom }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  header: {
    backgroundColor: '#075E54',
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#128C7E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerLogoText: {
    fontSize: 24,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 18,
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