import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface HeaderMenuProps {
  onMenuPress: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ onMenuPress }) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const menuItems: MenuItem[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: '👤',
      onPress: () => {
        console.log('Profile pressed');
        closeMenu();
      },
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: '👥',
      onPress: () => {
        console.log('Groups pressed');
        closeMenu();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onPress: () => {
        console.log('Settings pressed');
        closeMenu();
      },
    },
    {
      id: 'about',
      label: 'About',
      icon: 'ℹ️',
      onPress: () => {
        console.log('About pressed');
        closeMenu();
      },
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: '📨',
      onPress: () => {
        console.log('Requests pressed');
        closeMenu();
      },
    },
    {
      id: 'pages',
      label: 'Pages',
      icon: '📄',
      onPress: () => {
        console.log('Pages pressed');
        closeMenu();
      },
    },
  ];

  const openMenu = () => {
    setIsMenuVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsMenuVisible(false);
    });
  };

  const handleMenuPress = () => {
    if (isMenuVisible) {
      closeMenu();
    } else {
      openMenu();
    }
    onMenuPress();
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleMenuPress}
        activeOpacity={0.7}
      >
        <View style={styles.hamburgerContainer}>
          <View style={[styles.hamburgerLine, isMenuVisible && styles.hamburgerLineActive]} />
          <View style={[styles.hamburgerLine, isMenuVisible && styles.hamburgerLineActive]} />
          <View style={[styles.hamburgerLine, isMenuVisible && styles.hamburgerLineActive]} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <Animated.View
            style={[
              styles.menuContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.menuItems}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemIcon}>
                    <Text style={styles.menuItemIconText}>{item.icon}</Text>
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  hamburgerContainer: {
    width: 24,
    height: 18,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  hamburgerLineActive: {
    backgroundColor: '#25D366',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: width * 0.8,
    maxWidth: 320,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginTop: 100,
    marginRight: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  menuItems: {
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemIconText: {
    fontSize: 18,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
});

export default HeaderMenu; 