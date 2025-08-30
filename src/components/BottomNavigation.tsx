import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavigationProps {
  activeTab: 'chat' | 'find' | 'call' | 'status';
  onTabPress: (tab: 'chat' | 'find' | 'call' | 'status') => void;
  unreadCount?: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ 
  activeTab, 
  onTabPress, 
  unreadCount = 0 
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
        onPress={() => onTabPress('chat')}
      >
        <View style={[styles.iconContainer, activeTab === 'chat' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'chat' && styles.activeIcon]}>💬</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount.toString()}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.tabLabel, activeTab === 'chat' && styles.activeTabLabel]}>Chat</Text>
        {activeTab === 'chat' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'find' && styles.activeTab]}
        onPress={() => onTabPress('find')}
      >
        <View style={[styles.iconContainer, activeTab === 'find' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'find' && styles.activeIcon]}>👥</Text>
        </View>
        <Text style={[styles.tabLabel, activeTab === 'find' && styles.activeTabLabel]}>Find</Text>
        {activeTab === 'find' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'status' && styles.activeTab]}
        onPress={() => onTabPress('status')}
      >
        <View style={[styles.iconContainer, activeTab === 'status' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'status' && styles.activeIcon]}>📱</Text>
        </View>
        <Text style={[styles.tabLabel, activeTab === 'status' && styles.activeTabLabel]}>Status</Text>
        {activeTab === 'status' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'call' && styles.activeTab]}
        onPress={() => onTabPress('call')}
      >
        <View style={[styles.iconContainer, activeTab === 'call' && styles.activeIconContainer]}>
          <Text style={[styles.icon, activeTab === 'call' && styles.activeIcon]}>📞</Text>
        </View>
        <Text style={[styles.tabLabel, activeTab === 'call' && styles.activeTabLabel]}>Calls</Text>
        {activeTab === 'call' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTab: {
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  activeIconContainer: {
    backgroundColor: '#E8F5E8',
  },
  icon: {
    fontSize: 20,
    opacity: 0.7,
  },
  activeIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#25D366',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: '#25D366',
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BottomNavigation; 