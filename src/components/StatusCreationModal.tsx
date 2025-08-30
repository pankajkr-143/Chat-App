import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import StatusService from '../services/StatusService';
import { User } from '../database/DatabaseService';

interface StatusCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onStatusCreated: () => void;
  currentUser: User;
}

const StatusCreationModal: React.FC<StatusCreationModalProps> = ({
  visible,
  onClose,
  onStatusCreated,
  currentUser,
}) => {
  const [statusType, setStatusType] = useState<'text' | 'image' | 'video' | null>(null);
  const [textContent, setTextContent] = useState('');
  const [imageContent, setImageContent] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateTextStatus = async () => {
    if (!textContent.trim()) {
      Alert.alert('Error', 'Please enter some text for your status');
      return;
    }

    setLoading(true);
    try {
      await StatusService.getInstance().createTextStatus(currentUser.id, textContent.trim());
      Alert.alert('Success', 'Text status created successfully!');
      resetForm();
      onStatusCreated();
      onClose();
    } catch (error) {
      console.error('Error creating text status:', error);
      Alert.alert('Error', 'Failed to create text status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateImageStatus = async () => {
    if (!imageContent) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setLoading(true);
    try {
      await StatusService.getInstance().createImageStatus(currentUser.id, imageContent, caption.trim() || undefined);
      Alert.alert('Success', 'Image status created successfully!');
      resetForm();
      onStatusCreated();
      onClose();
    } catch (error) {
      console.error('Error creating image status:', error);
      Alert.alert('Error', 'Failed to create image status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCamera = async () => {
    try {
      const imageBase64 = await StatusService.getInstance().openCamera();
      if (imageBase64) {
        setImageContent(imageBase64);
        setStatusType('image');
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please check permissions.');
    }
  };

  const handleOpenGallery = async () => {
    try {
      const imageBase64 = await StatusService.getInstance().openGallery();
      if (imageBase64) {
        setImageContent(imageBase64);
        setStatusType('image');
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please check permissions.');
    }
  };

  const resetForm = () => {
    setStatusType(null);
    setTextContent('');
    setImageContent(null);
    setCaption('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderTypeSelection = () => (
    <View style={styles.typeSelection}>
      <Text style={styles.modalTitle}>Create New Status</Text>
      <Text style={styles.modalSubtitle}>Choose how you want to share your status</Text>
      
      <TouchableOpacity
        style={styles.typeButton}
        onPress={() => setStatusType('text')}
      >
        <Text style={styles.typeButtonIcon}>📝</Text>
        <Text style={styles.typeButtonText}>Text Status</Text>
        <Text style={styles.typeButtonSubtext}>Share your thoughts</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeButton}
        onPress={handleOpenCamera}
      >
        <Text style={styles.typeButtonIcon}>📷</Text>
        <Text style={styles.typeButtonText}>Camera</Text>
        <Text style={styles.typeButtonSubtext}>Take a photo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.typeButton}
        onPress={handleOpenGallery}
      >
        <Text style={styles.typeButtonIcon}>🖼️</Text>
        <Text style={styles.typeButtonText}>Gallery</Text>
        <Text style={styles.typeButtonSubtext}>Choose from photos</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTextStatus = () => (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStatusType(null)}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Text Status</Text>
        <TouchableOpacity onPress={handleCreateTextStatus} disabled={loading}>
          <Text style={[styles.postButton, loading && styles.postButtonDisabled]}>
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="What's on your mind?"
          value={textContent}
          onChangeText={setTextContent}
          multiline
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.characterCount}>{textContent.length}/500</Text>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Creating status...</Text>
        </View>
      )}
    </View>
  );

  const renderImageStatus = () => (
    <View style={styles.contentContainer}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setStatusType(null)}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Image Status</Text>
        <TouchableOpacity onPress={handleCreateImageStatus} disabled={loading}>
          <Text style={[styles.postButton, loading && styles.postButtonDisabled]}>
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {imageContent && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${imageContent}` }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.captionContainer}>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption (optional)"
          value={caption}
          onChangeText={setCaption}
          multiline
          maxLength={200}
        />
        <Text style={styles.characterCount}>{caption.length}/200</Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#25D366" />
          <Text style={styles.loadingText}>Creating status...</Text>
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {!statusType && renderTypeSelection()}
        {statusType === 'text' && renderTextStatus()}
        {statusType === 'image' && renderImageStatus()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  typeSelection: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#075E54',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  typeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
  typeButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  typeButtonSubtext: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#25D366',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  postButton: {
    fontSize: 16,
    color: '#25D366',
    fontWeight: '600',
  },
  postButtonDisabled: {
    color: '#999',
  },
  textInputContainer: {
    flex: 1,
    padding: 20,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
    minHeight: 200,
  },
  imageContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  captionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  captionInput: {
    fontSize: 16,
    color: '#1A1A1A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default StatusCreationModal; 