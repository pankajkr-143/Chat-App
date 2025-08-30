import DatabaseService, { User } from '../database/DatabaseService';
import NotificationService from './NotificationService';

export interface Call {
  id: string;
  callerId: number;
  receiverId: number;
  type: 'voice' | 'video';
  status: 'incoming' | 'outgoing' | 'missed' | 'ended' | 'declined';
  duration: number; // in seconds
  timestamp: string;
  startTime?: string;
  endTime?: string;
}

export interface CallSession {
  callId: string;
  caller: User;
  receiver: User;
  type: 'voice' | 'video';
  startTime: Date;
  isActive: boolean;
}

class CallService {
  private static instance: CallService;
  private activeCall: CallSession | null = null;
  private callListeners: ((call: CallSession | null) => void)[] = [];
  private callTimeout: number | null = null;
  private callDurationInterval: number | null = null;
  private currentCallDuration = 0;

  static getInstance(): CallService {
    if (!CallService.instance) {
      CallService.instance = new CallService();
    }
    return CallService.instance;
  }

  // Initialize call service
  async initialize() {
    // Initialize any call-related services
    console.log('CallService initialized');
  }

  // Start a new call
  async startCall(caller: User, receiver: User, type: 'voice' | 'video'): Promise<CallSession> {
    try {
      // Check if users are friends
      const areFriends = await DatabaseService.areFriends(caller.id, receiver.id);
      if (!areFriends) {
        throw new Error('You can only call your friends');
      }

      // Get receiver user info (don't check online status for now)
      const receiverUser = await DatabaseService.getUserById(receiver.id);
      if (!receiverUser) {
        throw new Error('User not found');
      }

      // Create call record
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const call: Call = {
        id: callId,
        callerId: caller.id,
        receiverId: receiver.id,
        type,
        status: 'outgoing',
        duration: 0,
        timestamp: new Date().toISOString(),
        startTime: new Date().toISOString(),
      };

      // Save call to database
      await this.saveCall(call);

      // Create call session
      const callSession: CallSession = {
        callId,
        caller,
        receiver,
        type,
        startTime: new Date(),
        isActive: true,
      };

      this.activeCall = callSession;
      this.notifyCallListeners(callSession);

      // Send notification to receiver
      await NotificationService.getInstance().showIncomingCallNotification(receiver, caller, type);

      // Set call timeout (30 seconds)
      this.setCallTimeout(callId);

      return callSession;
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  // Answer incoming call
  async answerCall(callId: string, receiver: User): Promise<CallSession> {
    try {
      const call = await this.getCallById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      if (call.receiverId !== receiver.id) {
        throw new Error('You are not the intended receiver of this call');
      }

      // Clear timeout since call was answered
      this.clearCallTimeout();

      // Update call status
      call.status = 'outgoing';
      call.startTime = new Date().toISOString();
      await this.updateCall(call);

      // Get caller user
      const caller = await DatabaseService.getUserById(call.callerId);
      if (!caller) {
        throw new Error('Caller not found');
      }

      // Create call session
      const callSession: CallSession = {
        callId,
        caller,
        receiver,
        type: call.type,
        startTime: new Date(),
        isActive: true,
      };

      this.activeCall = callSession;
      this.notifyCallListeners(callSession);

      // Start call duration timer
      this.startCallDurationTimer();

      return callSession;
    } catch (error) {
      console.error('Error answering call:', error);
      throw error;
    }
  }

  // End active call
  async endCall(callId: string, duration: number = 0): Promise<void> {
    try {
      const call = await this.getCallById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Clear timers
      this.clearCallTimeout();
      this.stopCallDurationTimer();

      // Update call status and duration
      call.status = 'ended';
      call.duration = duration;
      call.endTime = new Date().toISOString();
      await this.updateCall(call);

      // Clear active call
      this.activeCall = null;
      this.notifyCallListeners(null);

      // Cancel notification
      await NotificationService.getInstance().cancelCallNotification();
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  // Decline incoming call
  async declineCall(callId: string, receiver: User): Promise<void> {
    try {
      const call = await this.getCallById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Clear timeout
      this.clearCallTimeout();

      // Update call status
      call.status = 'declined';
      call.endTime = new Date().toISOString();
      await this.updateCall(call);

      // Cancel notification
      await NotificationService.getInstance().cancelCallNotification();
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  // Miss call (when receiver doesn't answer)
  async missCall(callId: string): Promise<void> {
    try {
      const call = await this.getCallById(callId);
      if (!call) {
        throw new Error('Call not found');
      }

      // Clear timeout
      this.clearCallTimeout();

      // Update call status
      call.status = 'missed';
      call.endTime = new Date().toISOString();
      await this.updateCall(call);

      // Cancel notification
      await NotificationService.getInstance().cancelCallNotification();

      // Show missed call notification
      const caller = await DatabaseService.getUserById(call.callerId);
      const receiver = await DatabaseService.getUserById(call.receiverId);
      if (caller && receiver) {
        await NotificationService.getInstance().showMissedCallNotification(caller, receiver);
      }
    } catch (error) {
      console.error('Error missing call:', error);
      throw error;
    }
  }

  // Set call timeout (30 seconds)
  private setCallTimeout(callId: string): void {
    this.callTimeout = setTimeout(async () => {
      try {
        // Auto-end the call if not answered
        await this.missCall(callId);
        this.activeCall = null;
        this.notifyCallListeners(null);
      } catch (error) {
        console.error('Error in call timeout:', error);
      }
    }, 30000); // 30 seconds
  }

  // Clear call timeout
  private clearCallTimeout(): void {
    if (this.callTimeout) {
      clearTimeout(this.callTimeout);
      this.callTimeout = null;
    }
  }

  // Start call duration timer
  private startCallDurationTimer(): void {
    this.currentCallDuration = 0;
    this.callDurationInterval = setInterval(() => {
      this.currentCallDuration++;
    }, 1000);
  }

  // Stop call duration timer
  private stopCallDurationTimer(): void {
    if (this.callDurationInterval) {
      clearInterval(this.callDurationInterval);
      this.callDurationInterval = null;
    }
  }

  // Get current call duration
  getCurrentCallDuration(): number {
    return this.currentCallDuration;
  }

  // Get call history for a user
  async getCallHistory(userId: number): Promise<Call[]> {
    try {
      const calls = await DatabaseService.getCallHistory(userId);
      return calls;
    } catch (error) {
      console.error('Error getting call history:', error);
      return [];
    }
  }

  // Get active call
  getActiveCall(): CallSession | null {
    return this.activeCall;
  }

  // Add call listener
  addCallListener(listener: (call: CallSession | null) => void) {
    this.callListeners.push(listener);
  }

  // Remove call listener
  removeCallListener(listener: (call: CallSession | null) => void) {
    this.callListeners = this.callListeners.filter(l => l !== listener);
  }

  // Notify call listeners
  private notifyCallListeners(call: CallSession | null) {
    this.callListeners.forEach(listener => listener(call));
  }

  // Database operations
  private async saveCall(call: Call): Promise<void> {
    await DatabaseService.saveCall(call);
  }

  private async updateCall(call: Call): Promise<void> {
    await DatabaseService.updateCall(call);
  }

  private async getCallById(callId: string): Promise<Call | null> {
    return await DatabaseService.getCallById(callId);
  }

  // Format call duration
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Format call timestamp
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    }
  }
}

export default CallService; 