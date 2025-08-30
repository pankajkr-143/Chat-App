import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CallService, { CallSession } from '../services/CallService';
import DatabaseService, { User } from '../database/DatabaseService';

interface CallScreenProps {
  callSession: CallSession;
  onEndCall: () => void;
  onAnswerCall?: () => void;
  onDeclineCall?: () => void;
}

const { width, height } = Dimensions.get('window');

const CallScreen: React.FC<CallScreenProps> = ({ 
  callSession, 
  onEndCall, 
  onAnswerCall, 
  onDeclineCall 
}) => {
  const insets = useSafeAreaInsets();
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callSession.type === 'video');
  const [isIncoming, setIsIncoming] = useState(false);
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);
  
  const durationInterval = useRef<number | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start call duration timer
    if (callSession.isActive) {
      durationInterval.current = setInterval(() => {
        const currentDuration = CallService.getInstance().getCurrentCallDuration();
        setCallDuration(currentDuration);
      }, 1000);
    }

    // Start pulse animation for incoming calls
    if (onAnswerCall) {
      setIsIncoming(true);
      startPulseAnimation();
      
      // Show timeout message after 25 seconds
      const timeoutTimer = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 25000);

      return () => {
        clearTimeout(timeoutTimer);
      };
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [callSession.isActive, onAnswerCall]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    try {
      await CallService.getInstance().endCall(callSession.callId, callDuration);
      onEndCall();
    } catch (error) {
      console.error('Error ending call:', error);
      onEndCall();
    }
  };

  const handleAnswerCall = async () => {
    try {
      if (onAnswerCall) {
        onAnswerCall();
      }
    } catch (error) {
      console.error('Error answering call:', error);
    }
  };

  const handleDeclineCall = async () => {
    try {
      if (onDeclineCall) {
        onDeclineCall();
      }
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // TODO: Implement actual speaker functionality
  };

  const toggleVideo = () => {
    if (callSession.type === 'video') {
      setIsVideoEnabled(!isVideoEnabled);
      // TODO: Implement actual video toggle functionality
    }
  };

  const getCallStatus = () => {
    if (isIncoming) {
      return 'Incoming call...';
    }
    if (callSession.isActive) {
      return formatDuration(callDuration);
    }
    return 'Connecting...';
  };

  const getCallTypeText = () => {
    return callSession.type === 'video' ? 'Video Call' : 'Voice Call';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background */}
      <View style={styles.background} />
      
      {/* Video Preview (for video calls) */}
      {callSession.type === 'video' && isVideoEnabled && (
        <View style={styles.videoContainer}>
          <View style={styles.videoPreview}>
            <Text style={styles.videoPlaceholder}>📹</Text>
            <Text style={styles.videoText}>Video Call</Text>
          </View>
        </View>
      )}

      {/* Call Info */}
      <View style={styles.callInfo}>
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.avatar}>
            {callSession.receiver.profilePicture || '👤'}
          </Text>
        </Animated.View>
        
        <Text style={styles.userName}>{callSession.receiver.username}</Text>
        <Text style={styles.callType}>{getCallTypeText()}</Text>
        <Text style={styles.callStatus}>{getCallStatus()}</Text>
        
        {/* Timeout Message */}
        {showTimeoutMessage && isIncoming && (
          <View style={styles.timeoutMessage}>
            <Text style={styles.timeoutText}>No response. Try again later.</Text>
          </View>
        )}
      </View>

      {/* Call Controls */}
      <View style={styles.controls}>
        {/* Mute Button */}
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Text style={styles.controlIcon}>
            {isMuted ? '🔇' : '🎤'}
          </Text>
        </TouchableOpacity>

        {/* Speaker Button */}
        <TouchableOpacity
          style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]}
          onPress={toggleSpeaker}
        >
          <Text style={styles.controlIcon}>
            {isSpeakerOn ? '🔊' : '🔈'}
          </Text>
        </TouchableOpacity>

        {/* Video Toggle (only for video calls) */}
        {callSession.type === 'video' && (
          <TouchableOpacity
            style={[styles.controlButton, isVideoEnabled && styles.controlButtonActive]}
            onPress={toggleVideo}
          >
            <Text style={styles.controlIcon}>
              {isVideoEnabled ? '📹' : '📷'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Call Actions */}
      <View style={styles.actions}>
        {isIncoming ? (
          <>
            {/* Decline Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDeclineCall}
            >
              <Text style={styles.declineIcon}>📞</Text>
            </TouchableOpacity>

            {/* Answer Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.answerButton]}
              onPress={handleAnswerCall}
            >
              <Text style={styles.answerIcon}>📞</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* End Call Button */
          <TouchableOpacity
            style={[styles.actionButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <Text style={styles.endCallIcon}>📞</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  videoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPreview: {
    width: width * 0.8,
    height: height * 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    fontSize: 60,
    marginBottom: 20,
  },
  videoText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  callInfo: {
    alignItems: 'center',
    paddingTop: 60,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    fontSize: 50,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  callType: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#999',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  controlButtonActive: {
    backgroundColor: '#25D366',
  },
  controlIcon: {
    fontSize: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  answerButton: {
    backgroundColor: '#25D366',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
  },
  answerIcon: {
    fontSize: 30,
    color: '#fff',
  },
  declineIcon: {
    fontSize: 30,
    color: '#fff',
  },
  endCallIcon: {
    fontSize: 30,
    color: '#fff',
  },
  timeoutMessage: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  timeoutText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CallScreen; 