import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import CallService, { Call } from '../services/CallService';
import DatabaseService, { User } from '../database/DatabaseService';

interface CallsScreenProps {
  currentUser: User;
  onBack?: () => void;
  onStartCall?: (receiver: User, type: 'voice' | 'video') => void;
}

const CallsScreen: React.FC<CallsScreenProps> = ({ 
  currentUser, 
  onBack, 
  onStartCall 
}) => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, [currentUser.id]);

  const loadCallHistory = async () => {
    try {
      setLoading(true);
      const callHistory = await CallService.getInstance().getCallHistory(currentUser.id);
      setCalls(callHistory);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = async (call: Call) => {
    try {
      // Get the other user from the call
      const otherUserId = call.callerId === currentUser.id ? call.receiverId : call.callerId;
      const otherUser = await DatabaseService.getUserById(otherUserId);
      
      if (!otherUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (onStartCall) {
        onStartCall(otherUser, 'voice');
      }
    } catch (error) {
      console.error('Error starting call:', error);
      Alert.alert('Error', 'Failed to start call');
    }
  };

  const handleVideoCall = async (call: Call) => {
    try {
      // Get the other user from the call
      const otherUserId = call.callerId === currentUser.id ? call.receiverId : call.callerId;
      const otherUser = await DatabaseService.getUserById(otherUserId);
      
      if (!otherUser) {
        Alert.alert('Error', 'User not found');
        return;
      }

      if (onStartCall) {
        onStartCall(otherUser, 'video');
      }
    } catch (error) {
      console.error('Error starting video call:', error);
      Alert.alert('Error', 'Failed to start video call');
    }
  };

  const getCallIcon = (call: Call) => {
    if (call.status === 'missed') return '📞';
    if (call.type === 'video') return '📹';
    return '📞';
  };

  const getCallColor = (call: Call) => {
    switch (call.status) {
      case 'missed':
        return '#FF6B6B';
      case 'ended':
        return '#25D366';
      case 'declined':
        return '#FF9500';
      default:
        return '#666';
    }
  };

  const getCallStatusText = (call: Call) => {
    switch (call.status) {
      case 'missed':
        return 'Missed';
      case 'ended':
        return call.callerId === currentUser.id ? 'Outgoing' : 'Incoming';
      case 'declined':
        return 'Declined';
      default:
        return call.status.charAt(0).toUpperCase() + call.status.slice(1);
    }
  };

  const getCallDuration = (call: Call) => {
    if (call.duration === 0) return '';
    return CallService.getInstance().formatDuration(call.duration);
  };

  const getCallTimestamp = (call: Call) => {
    return CallService.getInstance().formatTimestamp(call.timestamp);
  };

  const renderCallItem = ({ item }: { item: Call }) => (
    <View style={styles.callCard}>
      <View style={styles.callInfo}>
        <View style={styles.callIcon}>
          <Text style={styles.callIconText}>{getCallIcon(item)}</Text>
        </View>
        <View style={styles.callDetails}>
          <Text style={styles.callEmail}>
            {item.callerId === currentUser.id ? 'You' : 'Friend'}
          </Text>
          <View style={styles.callMeta}>
            <Text style={[styles.callType, { color: getCallColor(item) }]}>
              {getCallStatusText(item)}
            </Text>
            {getCallDuration(item) && (
              <Text style={styles.callDuration}> • {getCallDuration(item)}</Text>
            )}
            <Text style={styles.callTimestamp}> • {getCallTimestamp(item)}</Text>
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
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>⏳</Text>
            <Text style={styles.emptyStateTitle}>Loading calls...</Text>
          </View>
        ) : calls.length === 0 ? (
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
            refreshing={loading}
            onRefresh={loadCallHistory}
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