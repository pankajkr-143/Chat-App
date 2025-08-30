import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import StatusService from '../services/StatusService';
import { Status } from '../database/DatabaseService';

interface StatusCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onStatusCreated: (status: Status) => void;
  currentUser: any;
}

const { width: screenWidth } = Dimensions.get('window');

const StatusCreationModal: React.FC<StatusCreationModalProps> = ({
  visible,
  onClose,
  onStatusCreated,
  currentUser,
}) => {
  const [statusType, setStatusType] = useState<'text' | 'image' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<{ uri: string; type: 'image' | 'video' } | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const statusService = useRef(StatusService.getInstance());

  const handleCreateTextStatus = async () => {
    if (!textContent.trim()) {
      Alert.alert('Error', 'Please enter some text for your status');
      return;
    }

    try {
      setLoading(true);
      const status = await statusService.current.createTextStatus(currentUser.id, textContent.trim());
      onStatusCreated(status);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating text status:', error);
      Alert.alert('Error', 'Failed to create text status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateImageStatus = async () => {
    if (!selectedMedia || selectedMedia.type !== 'image') {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    try {
      setLoading(true);
      const status = await statusService.current.createImageStatus(currentUser.id, selectedMedia.uri, caption.trim());
      onStatusCreated(status);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating image status:', error);
      Alert.alert('Error', 'Failed to create image status');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideoStatus = async () => {
    if (!selectedMedia || selectedMedia.type !== 'video') {
      Alert.alert('Error', 'Please select a video first');
      return;
    }

    if (!selectedMedia.uri) {
      Alert.alert('Error', 'Invalid video file');
      return;
    }

    try {
      setLoading(true);
      const status = await statusService.current.createVideoStatus(currentUser.id, selectedMedia.uri, caption.trim());
      onStatusCreated(status);
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating video status:', error);
      Alert.alert('Error', 'Failed to create video status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = async () => {
    const options = {
      mediaType: statusType === 'video' ? 'video' as MediaType : 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
      videoQuality: 'medium' as const,
    };

    try {
      const result: ImagePickerResponse = await launchCamera(options);
      
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri!,
          type: statusType === 'video' ? 'video' : 'image',
        });
      } else if (result.didCancel) {
        // User cancelled, do nothing
        return;
      } else {
        Alert.alert('Error', 'Failed to capture media');
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const handleOpenGallery = async () => {
    const options = {
      mediaType: statusType === 'video' ? 'video' as MediaType : 'photo' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8 as const,
      videoQuality: 'medium' as const,
    };

    try {
      const result: ImagePickerResponse = await launchImageLibrary(options);
      
      if (result.assets && result.assets[0] && result.assets[0].uri) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri!,
          type: statusType === 'video' ? 'video' : 'image',
        });
      } else if (result.didCancel) {
        // User cancelled, do nothing
        return;
      } else {
        Alert.alert('Error', 'Failed to select media');
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const resetForm = () => {
    setStatusType('text');
    setTextContent('');
    setSelectedMedia(null);
    setCaption('');
  };

  const renderMediaPreview = () => {
    if (!selectedMedia) return null;

    return (
      <View style={styles.mediaPreview}>
        <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
        <Text style={styles.mediaTypeText}>
          {selectedMedia.type === 'video' ? '📹 Video' : '📷 Image'}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Status</Text>
            <View style={styles.headerActions}>
              {statusType === 'text' && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.sendButton]}
                  onPress={handleCreateTextStatus}
                  disabled={loading}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              )}
              {statusType === 'image' && selectedMedia && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.sendButton]}
                  onPress={handleCreateImageStatus}
                  disabled={loading}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              )}
              {statusType === 'video' && selectedMedia && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.sendButton]}
                  onPress={handleCreateVideoStatus}
                  disabled={loading}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.content}>
            {/* Status Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, statusType === 'text' && styles.activeTypeButton]}
                onPress={() => setStatusType('text')}
              >
                <Text style={[styles.typeButtonText, statusType === 'text' && styles.activeTypeButtonText]}>
                  📝 Text
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, statusType === 'image' && styles.activeTypeButton]}
                onPress={() => setStatusType('image')}
              >
                <Text style={[styles.typeButtonText, statusType === 'image' && styles.activeTypeButtonText]}>
                  📷 Image
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, statusType === 'video' && styles.activeTypeButton]}
                onPress={() => setStatusType('video')}
              >
                <Text style={[styles.typeButtonText, statusType === 'video' && styles.activeTypeButtonText]}>
                  📹 Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* Text Status */}
            {statusType === 'text' && (
              <View style={styles.textSection}>
                <TextInput
                  style={styles.textInput}
                  placeholder="What's on your mind?"
                  value={textContent}
                  onChangeText={setTextContent}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>{textContent.length}/500</Text>
              </View>
            )}

            {/* Image/Video Status */}
            {(statusType === 'image' || statusType === 'video') && (
              <View style={styles.mediaSection}>
                {selectedMedia ? (
                  <View style={styles.selectedMediaContainer}>
                    {renderMediaPreview()}
                    <TextInput
                      style={styles.captionInput}
                      placeholder="Add a caption..."
                      value={caption}
                      onChangeText={setCaption}
                      multiline
                      maxLength={200}
                    />
                    <TouchableOpacity
                      style={styles.changeMediaButton}
                      onPress={() => setSelectedMedia(null)}
                    >
                      <Text style={styles.changeMediaButtonText}>Change {statusType}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.mediaOptions}>
                    <TouchableOpacity style={styles.mediaOption} onPress={handleOpenCamera}>
                      <Text style={styles.mediaOptionIcon}>📷</Text>
                      <Text style={styles.mediaOptionText}>Camera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mediaOption} onPress={handleOpenGallery}>
                      <Text style={styles.mediaOptionIcon}>🖼️</Text>
                      <Text style={styles.mediaOptionText}>Gallery</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Status Info */}
            <View style={styles.statusInfo}>
              <Text style={styles.statusInfoText}>
                ⏰ Status will expire in 12 hours
              </Text>
              {statusType === 'video' && (
                <Text style={styles.videoInfoText}>
                  📹 Video status supports up to 30 seconds
                </Text>
              )}
            </View>
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#25D366" />
              <Text style={styles.loadingText}>Creating status...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    backgroundColor: '#25D366',
  },
  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  typeButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTypeButton: {
    backgroundColor: '#25D366',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activeTypeButtonText: {
    color: '#ffffff',
  },
  textSection: {
    marginBottom: 20,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
    minHeight: 200,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  mediaSection: {
    marginBottom: 20,
  },
  selectedMediaContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  mediaTypeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  mediaOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  mediaOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
  },
  mediaOptionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  mediaOptionText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  captionInput: {
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  changeMediaButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  changeMediaButtonText: {
    fontSize: 14,
    color: '#25D366',
    fontWeight: '600',
  },
  statusInfo: {
    marginTop: 10,
    alignItems: 'center',
  },
  statusInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  videoInfoText: {
    fontSize: 14,
    color: '#666',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default StatusCreationModal; 