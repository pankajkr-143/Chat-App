import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';

interface Call {
  id: string;
  userEmail: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: string;
  timestamp: string;
  isVideo: boolean;
}

interface CallsScreenProps {
  currentUser: any;
  onBack?: () => void;
}

const CallsScreen: React.FC<CallsScreenProps> = ({ currentUser, onBack }) => {
  const [calls, setCalls] = useState<Call[]>([
    {
      id: '1',
      userEmail: 'john@example.com',
      type: 'outgoing',
      duration: '5:23',
      timestamp: '2 hours ago',
      isVideo: true,
    },
    {
      id: '2',
      userEmail: 'sarah@example.com',
      type: 'incoming',
      duration: '12:45',
      timestamp: 'Yesterday',
      isVideo: false,
    },
    {
      id: '3',
      userEmail: 'mike@example.com',
      type: 'missed',
      duration: '0:00',
      timestamp: '2 days ago',
      isVideo: true,
    },
  ]);

  const handleCall = (call: Call) => {
    // TODO: Implement actual call functionality
    console.log('Calling:', call.userEmail);
  };

  const handleVideoCall = (call: Call) => {
    // TODO: Implement video call functionality
    console.log('Video calling:', call.userEmail);
  };

  const getCallIcon = (call: Call) => {
    if (call.type === 'missed') return '📞';
    if (call.isVideo) return '📹';
    return '📞';
  };

  const getCallColor = (call: Call) => {
    switch (call.type) {
      case 'missed':
        return '#FF6B6B';
      case 'incoming':
        return '#25D366';
      case 'outgoing':
        return '#25D366';
      default:
        return '#666';
    }
  };

  const renderCallItem = ({ item }: { item: Call }) => (
    <View style={styles.callCard}>
      <View style={styles.callInfo}>
        <View style={styles.callIcon}>
          <Text style={styles.callIconText}>{getCallIcon(item)}</Text>
        </View>
        <View style={styles.callDetails}>
          <Text style={styles.callEmail}>{item.userEmail}</Text>
          <View style={styles.callMeta}>
            <Text style={[styles.callType, { color: getCallColor(item) }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
            <Text style={styles.callDuration}> • {item.duration}</Text>
            <Text style={styles.callTimestamp}> • {item.timestamp}</Text>
          </View>
        </View>
      </View>
      <View style={styles.callActions}>
        <TouchableOpacity
          style={[styles.callButton, styles.audioCallButton]}
          onPress={() => handleCall(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButton, styles.videoCallButton]}
          onPress={() => handleVideoCall(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.callButtonText}>📹</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Calls List */}
      <View style={styles.content}>
        {calls.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📞</Text>
            <Text style={styles.emptyStateTitle}>No calls yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start calling your friends to see your call history here
            </Text>
          </View>
        ) : (
          <FlatList
            data={calls}
            renderItem={renderCallItem}
            keyExtractor={(item) => item.id}
            style={styles.callsList}
            contentContainerStyle={styles.callsContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  content: {
    flex: 1,
  },
  callsList: {
    flex: 1,
  },
  callsContent: {
    padding: 20,
  },
  callCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
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
  callInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  callIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  callIconText: {
    fontSize: 20,
  },
  callDetails: {
    flex: 1,
  },
  callEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callType: {
    fontSize: 14,
    fontWeight: '500',
  },
  callDuration: {
    fontSize: 14,
    color: '#666',
  },
  callTimestamp: {
    fontSize: 14,
    color: '#666',
  },
  callActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  audioCallButton: {
    backgroundColor: '#25D366',
  },
  videoCallButton: {
    backgroundColor: '#128C7E',
  },
  callButtonText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default CallsScreen; 