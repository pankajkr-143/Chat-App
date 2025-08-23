import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface BottomNavigationProps {
  activeTab: 'chat' | 'find' | 'call';
  onTabPress: (tab: 'chat' | 'find' | 'call') => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const tabs = [
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: '💬',
      activeIcon: '💬',
    },
    {
      id: 'find' as const,
      label: 'Find Friends',
      icon: '👥',
      activeIcon: '👥',
    },
    {
      id: 'call' as const,
      label: 'Calls',
      icon: '📞',
      activeIcon: '📞',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && styles.activeTab,
            ]}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Text style={[
                styles.icon,
                activeTab === tab.id && styles.activeIcon,
              ]}>
                {activeTab === tab.id ? tab.activeIcon : tab.icon}
              </Text>
              {activeTab === tab.id && <View style={styles.activeIndicator} />}
            </View>
            <Text style={[
              styles.label,
              activeTab === tab.id && styles.activeLabel,
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 15,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#F0F9FF',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  activeIcon: {
    fontSize: 24,
    opacity: 1,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#25D366',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  activeLabel: {
    color: '#25D366',
    fontWeight: '600',
  },
});

export default BottomNavigation; 