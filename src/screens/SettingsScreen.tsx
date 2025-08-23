import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { User } from '../database/DatabaseService';

interface SettingsScreenProps {
  currentUser: User;
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ currentUser, onBack }) => {
  const [notifications, setNotifications] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);

  const handlePrivacySettings = () => {
    Alert.alert('Privacy Settings', 'Privacy settings feature coming soon!');
  };

  const handleSecuritySettings = () => {
    Alert.alert('Security Settings', 'Security settings feature coming soon!');
  };

  const handleDataUsage = () => {
    Alert.alert('Data Usage', 'Data usage settings feature coming soon!');
  };

  const handleBackupSettings = () => {
    Alert.alert('Backup Settings', 'Backup settings feature coming soon!');
  };

  const handleLanguageSettings = () => {
    Alert.alert('Language Settings', 'Language settings feature coming soon!');
  };

  const handleThemeSettings = () => {
    Alert.alert('Theme Settings', 'Theme settings feature coming soon!');
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear Data',
      'This will clear all your chat data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => console.log('Clear data') }
      ]
    );
  };

  const renderNotificationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notifications</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Push Notifications</Text>
          <Text style={styles.settingSubtitle}>Receive notifications for new messages</Text>
        </View>
        <Switch
          value={notifications}
          onValueChange={setNotifications}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={notifications ? '#ffffff' : '#ffffff'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Sound</Text>
          <Text style={styles.settingSubtitle}>Play sound for notifications</Text>
        </View>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={soundEnabled ? '#ffffff' : '#ffffff'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Vibration</Text>
          <Text style={styles.settingSubtitle}>Vibrate for notifications</Text>
        </View>
        <Switch
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={vibrationEnabled ? '#ffffff' : '#ffffff'}
        />
      </View>
    </View>
  );

  const renderPrivacySection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Privacy & Security</Text>
      
      <TouchableOpacity style={styles.settingItem} onPress={handlePrivacySettings}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Privacy Settings</Text>
          <Text style={styles.settingSubtitle}>Manage your privacy preferences</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleSecuritySettings}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Security</Text>
          <Text style={styles.settingSubtitle}>Two-factor authentication, etc.</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Read Receipts</Text>
          <Text style={styles.settingSubtitle}>Show when messages are read</Text>
        </View>
        <Switch
          value={readReceipts}
          onValueChange={setReadReceipts}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={readReceipts ? '#ffffff' : '#ffffff'}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Typing Indicators</Text>
          <Text style={styles.settingSubtitle}>Show when someone is typing</Text>
        </View>
        <Switch
          value={typingIndicators}
          onValueChange={setTypingIndicators}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={typingIndicators ? '#ffffff' : '#ffffff'}
        />
      </View>
    </View>
  );

  const renderAppearanceSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Dark Mode</Text>
          <Text style={styles.settingSubtitle}>Use dark theme</Text>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={darkMode ? '#ffffff' : '#ffffff'}
        />
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={handleThemeSettings}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Theme</Text>
          <Text style={styles.settingSubtitle}>Choose app theme</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleLanguageSettings}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Language</Text>
          <Text style={styles.settingSubtitle}>English</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderDataSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Data & Storage</Text>
      
      <TouchableOpacity style={styles.settingItem} onPress={handleDataUsage}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Data Usage</Text>
          <Text style={styles.settingSubtitle}>Manage data consumption</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={handleBackupSettings}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Backup</Text>
          <Text style={styles.settingSubtitle}>Backup your chats</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Auto Backup</Text>
          <Text style={styles.settingSubtitle}>Automatically backup chats</Text>
        </View>
        <Switch
          value={autoBackup}
          onValueChange={setAutoBackup}
          trackColor={{ false: '#E9ECEF', true: '#25D366' }}
          thumbColor={autoBackup ? '#ffffff' : '#ffffff'}
        />
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={handleClearData}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Clear Data</Text>
          <Text style={styles.settingSubtitle}>Clear all chat data</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAboutSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Version</Text>
          <Text style={styles.settingSubtitle}>1.0.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Terms of Service</Text>
          <Text style={styles.settingSubtitle}>Read our terms</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Privacy Policy</Text>
          <Text style={styles.settingSubtitle}>Read our privacy policy</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderNotificationSection()}
        {renderPrivacySection()}
        {renderAppearanceSection()}
        {renderDataSection()}
        {renderAboutSection()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#075E54',
    padding: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingArrow: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
});

export default SettingsScreen; 