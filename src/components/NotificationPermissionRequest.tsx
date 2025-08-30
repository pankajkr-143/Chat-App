import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import NotificationService from '../services/NotificationService';

interface NotificationPermissionRequestProps {
  visible: boolean;
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

const NotificationPermissionRequest: React.FC<NotificationPermissionRequestProps> = ({
  visible,
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await NotificationService.getInstance().requestPermissionWithPrompt();
      if (granted) {
        onPermissionGranted();
      } else {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      onPermissionDenied();
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotNow = () => {
    onPermissionDenied();
  };

  const handleSettings = () => {
    Alert.alert(
      'Enable Notifications',
      'To receive notifications, please enable them in your device settings:\n\nSettings > Apps > ChatApp > Notifications',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => {
          // In a real app, you would open device settings
          console.log('Open device settings');
        }},
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleNotNow}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔔</Text>
          </View>
          
          <Text style={styles.title}>Stay Connected!</Text>
          
          <Text style={styles.description}>
            Enable notifications to receive friend requests and new messages instantly. Never miss important updates from your friends!
          </Text>

          <View style={styles.benefitsContainer}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>👥</Text>
              <Text style={styles.benefitText}>Friend requests</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💬</Text>
              <Text style={styles.benefitText}>New messages</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>✅</Text>
              <Text style={styles.benefitText}>Request updates</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.enableButton]}
              onPress={handleEnableNotifications}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.enableButtonText}>
                {isLoading ? 'Enabling...' : 'Enable Notifications'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.notNowButton]}
              onPress={handleNotNow}
              activeOpacity={0.8}
            >
              <Text style={styles.notNowButtonText}>Not Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Enable in Settings</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            You can change this later in your device settings
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#25D366',
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  enableButton: {
    backgroundColor: '#25D366',
  },
  enableButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  notNowButton: {
    backgroundColor: '#F0F0F0',
  },
  notNowButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  settingsButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  settingsButtonText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default NotificationPermissionRequest; 