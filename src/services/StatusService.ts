import { launchCamera, launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import DatabaseService, { Status } from '../database/DatabaseService';

class StatusService {
  private static instance: StatusService;

  private constructor() {}

  static getInstance(): StatusService {
    if (!StatusService.instance) {
      StatusService.instance = new StatusService();
    }
    return StatusService.instance;
  }

  async requestCameraPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // Check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        
        if (hasPermission) {
          return true;
        }

        // Request permission
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to take photos for status updates.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Camera permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  async requestStoragePermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        // For Android 13+ (API 33+), use READ_MEDIA_IMAGES
        if (Platform.Version >= 33) {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
          );
          
          if (hasPermission) {
            return true;
          }

          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Media Permission',
              message: 'This app needs access to your photos to select images for status updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          // For older Android versions, use READ_EXTERNAL_STORAGE
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
          
          if (hasPermission) {
            return true;
          }

          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'This app needs access to your storage to select photos for status updates.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
      } catch (err) {
        console.warn('Storage permission error:', err);
        return false;
      }
    }
    return true; // iOS handles permissions differently
  }

  async openCamera(): Promise<string | null> {
    const hasPermission = await this.requestCameraPermission();
    if (!hasPermission) {
      // Show a more helpful error message with guidance
      throw new Error('Camera permission denied. Please go to Settings > Apps > ChatApp > Permissions and enable Camera access.');
    }

    const options = {
      mediaType: 'photo' as MediaType,
      includeBase64: true,
      maxHeight: 1920,
      maxWidth: 1080,
      quality: 0.8 as const,
    };

    try {
      const response: ImagePickerResponse = await launchCamera(options);
      
      if (response.didCancel) {
        return null;
      }

      if (response.errorCode) {
        throw new Error(response.errorMessage || 'Camera error');
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          return asset.base64;
        }
      }

      return null;
    } catch (error) {
      console.error('Camera error:', error);
      throw error;
    }
  }

  async openGallery(): Promise<string | null> {
    const hasPermission = await this.requestStoragePermission();
    if (!hasPermission) {
      // Show a more helpful error message with guidance
      throw new Error('Storage permission denied. Please go to Settings > Apps > ChatApp > Permissions and enable Storage access.');
    }

    const options = {
      mediaType: 'mixed' as MediaType,
      includeBase64: true,
      maxHeight: 1920,
      maxWidth: 1080,
      quality: 0.8 as const,
    };

    try {
      const response: ImagePickerResponse = await launchImageLibrary(options);
      
      if (response.didCancel) {
        return null;
      }

      if (response.errorCode) {
        throw new Error(response.errorMessage || 'Gallery error');
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        if (asset.base64) {
          return asset.base64;
        }
      }

      return null;
    } catch (error) {
      console.error('Gallery error:', error);
      throw error;
    }
  }

  async createTextStatus(userId: number, text: string): Promise<Status> {
    return await DatabaseService.createStatus(userId, 'text', text);
  }

  async createImageStatus(userId: number, imageBase64: string, caption?: string): Promise<Status> {
    return await DatabaseService.createStatus(userId, 'image', imageBase64, caption);
  }

  async createVideoStatus(userId: number, videoBase64: string, caption?: string): Promise<Status> {
    return await DatabaseService.createStatus(userId, 'video', videoBase64, caption);
  }

  async getActiveStatuses(userId: number): Promise<(Status & { user: any })[]> {
    return await DatabaseService.getActiveStatuses(userId);
  }

  async getUserStatuses(userId: number): Promise<Status[]> {
    return await DatabaseService.getUserStatuses(userId);
  }

  async deleteStatus(statusId: number): Promise<void> {
    return await DatabaseService.deleteStatus(statusId);
  }

  async cleanupExpiredStatuses(): Promise<void> {
    return await DatabaseService.deleteExpiredStatuses();
  }

  // Status view methods
  async recordStatusView(statusId: number, viewerId: number): Promise<void> {
    return await DatabaseService.recordStatusView(statusId, viewerId);
  }

  async getStatusViews(statusId: number): Promise<(any & { viewer: any })[]> {
    return await DatabaseService.getStatusViews(statusId);
  }

  async getStatusViewCount(statusId: number): Promise<number> {
    return await DatabaseService.getStatusViewCount(statusId);
  }

  async hasUserViewedStatus(statusId: number, userId: number): Promise<boolean> {
    return await DatabaseService.hasUserViewedStatus(statusId, userId);
  }

  formatStatusTime(timestamp: string): string {
    const now = new Date();
    const statusTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - statusTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) {
        return 'Yesterday';
      } else if (days < 7) {
        return `${days} days ago`;
      } else {
        return statusTime.toLocaleDateString();
      }
    }
  }

  formatViewTime(timestamp: string): string {
    const now = new Date();
    const viewTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - viewTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return viewTime.toLocaleDateString();
    }
  }

  getStatusExpirationTime(expiresAt: string): string {
    const now = new Date();
    const expirationTime = new Date(expiresAt);
    const diffInMinutes = Math.floor((expirationTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m left`;
    } else {
      return `${Math.floor(diffInMinutes / 60)}h left`;
    }
  }
}

export default StatusService; 