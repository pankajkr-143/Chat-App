import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DatabaseService, { User } from '../database/DatabaseService';

interface Group {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  createdBy: number;
  createdAt: string;
  isActive: boolean;
  memberCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  role: 'admin' | 'member';
  joinedAt: string;
  user: User;
}

// Add a simpler interface for the data we get from DatabaseService
interface GroupMemberData extends User {
  role: string;
}

interface CallParticipant {
  userId: number;
  username: string;
  isJoined: boolean;
  isMuted: boolean;
  isVideoOn: boolean;
  joinedAt?: string;
  isCaller: boolean;
}

interface GroupCallScreenProps {
  currentUser: User;
  group: Group;
  onEndCall: () => void;
  callType: 'voice' | 'video';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GroupCallScreen: React.FC<GroupCallScreenProps> = ({ 
  currentUser, 
  group, 
  onEndCall,
  callType 
}) => {
  const insets = useSafeAreaInsets();
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(callType === 'video');
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMemberData[]>([]);
  const [loading, setLoading] = useState(true);

  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initializeCall();
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, []);

  const initializeCall = async () => {
    try {
      setLoading(true);
      
      // Load group members
      const members = await DatabaseService.getGroupMembers(group.id);
      setGroupMembers(members);
      
      // Initialize participants list
      const initialParticipants: CallParticipant[] = members.map(member => ({
        userId: member.id,
        username: member.username,
        isJoined: member.id === currentUser.id, // Only current user is initially joined
        isMuted: false,
        isVideoOn: callType === 'video',
        isCaller: member.id === currentUser.id,
      }));
      
      setParticipants(initialParticipants);
      
      // Start the call
      setIsCallActive(true);
      startCallTimer();
      
      // Simulate other members joining gradually
      simulateMembersJoining(initialParticipants);
      
    } catch (error) {
      console.error('Error initializing group call:', error);
      Alert.alert('Error', 'Failed to start group call');
    } finally {
      setLoading(false);
    }
  };

  const simulateMembersJoining = (initialParticipants: CallParticipant[]) => {
    // Simulate other members joining the call over time
    const otherMembers = initialParticipants.filter(p => !p.isCaller);
    
    otherMembers.forEach((member, index) => {
      setTimeout(() => {
        setParticipants(prev => 
          prev.map(p => 
            p.userId === member.userId 
              ? { ...p, isJoined: true, joinedAt: new Date().toISOString() }
              : p
          )
        );
      }, (index + 1) * 2000); // Each member joins 2 seconds apart
    });
  };

  const startCallTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    setParticipants(prev => 
      prev.map(p => 
        p.userId === currentUser.id ? { ...p, isMuted: !isMuted } : p
      )
    );
  };

  const handleToggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    setParticipants(prev => 
      prev.map(p => 
        p.userId === currentUser.id ? { ...p, isVideoOn: !isVideoOn } : p
      )
    );
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end the group call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            if (durationInterval.current) {
              clearInterval(durationInterval.current);
            }
            onEndCall();
          },
        },
      ]
    );
  };

  const handleJoinCall = (participant: CallParticipant) => {
    setParticipants(prev => 
      prev.map(p => 
        p.userId === participant.userId 
          ? { ...p, isJoined: true, joinedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const handleLeaveCall = (participant: CallParticipant) => {
    setParticipants(prev => 
      prev.map(p => 
        p.userId === participant.userId 
          ? { ...p, isJoined: false, joinedAt: undefined }
          : p
      )
    );
  };

  const renderParticipant = ({ item }: { item: CallParticipant }) => (
    <View style={styles.participantItem}>
      <View style={styles.participantInfo}>
        <View style={styles.participantAvatar}>
          <Text style={styles.participantAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.participantDetails}>
          <Text style={styles.participantName}>{item.username}</Text>
          <Text style={styles.participantStatus}>
            {item.isJoined ? '🟢 In call' : '⚪ Not joined'}
            {item.isMuted && item.isJoined && ' 🔇'}
            {!item.isVideoOn && item.isJoined && ' 📷'}
          </Text>
        </View>
      </View>
      {item.isJoined ? (
        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => handleLeaveCall(item)}
        >
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinCall(item)}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const joinedParticipants = participants.filter(p => p.isJoined);
  const notJoinedParticipants = participants.filter(p => !p.isJoined);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Starting group call...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.callInfo}>
            {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'} • {formatDuration(callDuration)}
          </Text>
          <Text style={styles.participantsCount}>
            {joinedParticipants.length} of {participants.length} participants
          </Text>
        </View>
        <TouchableOpacity
          style={styles.participantsButton}
          onPress={() => setShowParticipantsModal(true)}
        >
          <Text style={styles.participantsButtonText}>👥</Text>
        </TouchableOpacity>
      </View>

      {/* Main Call View */}
      <View style={styles.mainCallView}>
        {callType === 'video' ? (
          <View style={styles.videoContainer}>
            {joinedParticipants.length > 0 ? (
              <FlatList
                data={joinedParticipants}
                renderItem={({ item }) => (
                  <View style={styles.videoParticipant}>
                    <View style={styles.videoPlaceholder}>
                      <Text style={styles.videoPlaceholderText}>
                        {item.isVideoOn ? '📹' : '📷'}
                      </Text>
                      <Text style={styles.videoParticipantName}>{item.username}</Text>
                      {item.isMuted && <Text style={styles.mutedIndicator}>🔇</Text>}
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.userId.toString()}
                numColumns={2}
                contentContainerStyle={styles.videoGrid}
              />
            ) : (
              <View style={styles.noParticipants}>
                <Text style={styles.noParticipantsText}>Waiting for participants to join...</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.voiceContainer}>
            <View style={styles.voiceParticipants}>
              {joinedParticipants.map(participant => (
                <View key={participant.userId} style={styles.voiceParticipant}>
                  <View style={styles.voiceAvatar}>
                    <Text style={styles.voiceAvatarText}>
                      {participant.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.voiceParticipantName}>{participant.username}</Text>
                  {participant.isMuted && <Text style={styles.mutedIndicator}>🔇</Text>}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={handleToggleMute}
          >
            <Text style={styles.controlButtonText}>
              {isMuted ? '🔇' : '🎤'}
            </Text>
          </TouchableOpacity>

          {callType === 'video' && (
            <TouchableOpacity
              style={[styles.controlButton, !isVideoOn && styles.controlButtonActive]}
              onPress={handleToggleVideo}
            >
              <Text style={styles.controlButtonText}>
                {isVideoOn ? '📹' : '📷'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
            onPress={handleToggleSpeaker}
          >
            <Text style={styles.controlButtonText}>
              {isSpeakerOn ? '🔊' : '🔈'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Text style={styles.endCallButtonText}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Participants Modal */}
      <Modal visible={showParticipantsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Call Participants</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowParticipantsModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.participantsSection}>
              <Text style={styles.sectionTitle}>In Call ({joinedParticipants.length})</Text>
              <FlatList
                data={joinedParticipants}
                renderItem={renderParticipant}
                keyExtractor={(item) => item.userId.toString()}
                style={styles.participantsList}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {notJoinedParticipants.length > 0 && (
              <View style={styles.participantsSection}>
                <Text style={styles.sectionTitle}>Not Joined ({notJoinedParticipants.length})</Text>
                <FlatList
                  data={notJoinedParticipants}
                  renderItem={renderParticipant}
                  keyExtractor={(item) => item.userId.toString()}
                  style={styles.participantsList}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 10,
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  callInfo: {
    fontSize: 14,
    color: '#E0E0E0',
    marginTop: 2,
  },
  participantsCount: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  participantsButton: {
    padding: 10,
  },
  participantsButtonText: {
    fontSize: 24,
  },
  mainCallView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    width: '100%',
  },
  videoGrid: {
    padding: 10,
  },
  videoParticipant: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
    maxWidth: (screenWidth - 40) / 2,
  },
  videoPlaceholder: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333333',
  },
  videoPlaceholderText: {
    fontSize: 48,
    marginBottom: 10,
  },
  videoParticipantName: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  voiceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  voiceParticipants: {
    alignItems: 'center',
  },
  voiceParticipant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
  },
  voiceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  voiceAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  voiceParticipantName: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  mutedIndicator: {
    fontSize: 16,
    marginLeft: 10,
  },
  noParticipants: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noParticipantsText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  controlsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#FF4444',
  },
  controlButtonText: {
    fontSize: 20,
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButtonText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
  },
  participantsSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  participantsList: {
    maxHeight: 200,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 8,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  participantAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  participantStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  joinButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default GroupCallScreen; 