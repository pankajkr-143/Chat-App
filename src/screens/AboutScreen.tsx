import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { User } from '../database/DatabaseService';

interface AboutScreenProps {
  currentUser: User;
  onBack: () => void;
}

const AboutScreen: React.FC<AboutScreenProps> = ({ currentUser, onBack }) => {
  const handleContactUs = () => {
    Alert.alert('Contact Us', 'Contact us feature coming soon!');
  };

  const handleRateApp = () => {
    Alert.alert('Rate App', 'Rate app feature coming soon!');
  };

  const handleShareApp = () => {
    Alert.alert('Share App', 'Share app feature coming soon!');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy feature coming soon!');
  };

  const handleTermsOfService = () => {
    Alert.alert('Terms of Service', 'Terms of service feature coming soon!');
  };

  const handleOpenWebsite = () => {
    Alert.alert('Website', 'Website link feature coming soon!');
  };

  const renderAppInfo = () => (
    <View style={styles.appInfoSection}>
      <View style={styles.appLogo}>
        <Text style={styles.appLogoText}>💬</Text>
      </View>
      <Text style={styles.appName}>ChatApp</Text>
      <Text style={styles.appVersion}>Version 1.0.0</Text>
      <Text style={styles.appDescription}>
        A modern messaging app that connects people around the world with secure, 
        fast, and reliable communication.
      </Text>
    </View>
  );

  const renderFeatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Features</Text>
      
      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>🔒</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Secure Messaging</Text>
          <Text style={styles.featureDescription}>
            End-to-end encryption for your conversations
          </Text>
        </View>
      </View>

      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>⚡</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Fast & Reliable</Text>
          <Text style={styles.featureDescription}>
            Instant message delivery with high reliability
          </Text>
        </View>
      </View>

      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>👥</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Group Chats</Text>
          <Text style={styles.featureDescription}>
            Create and manage group conversations
          </Text>
        </View>
      </View>

      <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>📱</Text>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>Cross Platform</Text>
          <Text style={styles.featureDescription}>
            Available on iOS and Android devices
          </Text>
        </View>
      </View>
    </View>
  );

  const renderTeam = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Development Team</Text>
      
      <View style={styles.teamMember}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>D</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>Development Team</Text>
          <Text style={styles.memberRole}>Full Stack Development</Text>
        </View>
      </View>

      <View style={styles.teamMember}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>D</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>Design Team</Text>
          <Text style={styles.memberRole}>UI/UX Design</Text>
        </View>
      </View>

      <View style={styles.teamMember}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberInitial}>Q</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>QA Team</Text>
          <Text style={styles.memberRole}>Quality Assurance</Text>
        </View>
      </View>
    </View>
  );

  const renderActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Support</Text>
      
      <TouchableOpacity style={styles.actionItem} onPress={handleContactUs}>
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>📧</Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Contact Us</Text>
          <Text style={styles.actionSubtitle}>Get in touch with our team</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem} onPress={handleRateApp}>
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>⭐</Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Rate App</Text>
          <Text style={styles.actionSubtitle}>Rate us on app store</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem} onPress={handleShareApp}>
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>📤</Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Share App</Text>
          <Text style={styles.actionSubtitle}>Share with friends</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem} onPress={handleOpenWebsite}>
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>🌐</Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Visit Website</Text>
          <Text style={styles.actionSubtitle}>Learn more about us</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLegal = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Legal</Text>
      
      <TouchableOpacity style={styles.actionItem} onPress={handlePrivacyPolicy}>
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>🔒</Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Privacy Policy</Text>
          <Text style={styles.actionSubtitle}>How we protect your data</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.actionItem} onPress={handleTermsOfService}>
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>📄</Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>Terms of Service</Text>
          <Text style={styles.actionSubtitle}>Our terms and conditions</Text>
        </View>
        <Text style={styles.actionArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderAppInfo()}
        {renderFeatures()}
        {renderTeam()}
        {renderActions()}
        {renderLegal()}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 ChatApp. All rights reserved.
          </Text>
          <Text style={styles.footerText}>
            Made with ❤️ for better communication
          </Text>
        </View>
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
  appInfoSection: {
    backgroundColor: '#ffffff',
    padding: 30,
    margin: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appLogoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#075E54',
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  appDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
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
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIconText: {
    fontSize: 18,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  actionArrow: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default AboutScreen; 