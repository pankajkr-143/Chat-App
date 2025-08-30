# 🧪 Notification System Testing Guide

## 🎯 **Testing Overview**
This guide provides step-by-step instructions to test the complete notification system implementation.

## 📱 **Prerequisites**
- Android device/emulator or iOS device/simulator
- Two test accounts (for testing friend requests and messages)
- App installed and running

## 🚀 **Test Scenarios**

### **1. Permission Request Testing**

#### **First Launch Test:**
1. **Clear app data** or install fresh
2. **Launch app** and complete signup/login
3. **Verify** permission request modal appears after 1 second
4. **Test "Enable"** button - should show success message
5. **Test "Not Now"** button - should dismiss modal
6. **Test "Settings"** link - should show settings instructions

#### **Permission Status Test:**
1. **Check device settings** for notification permissions
2. **Verify** app has notification permission
3. **Test** notifications appear in device notification bar

### **2. Friend Request Notification Testing**

#### **Send Request Test:**
1. **Login as User A**
2. **Go to Find Friends** tab
3. **Search for User B** by username
4. **Click "Send Request"** button
5. **Verify** loading spinner appears
6. **Verify** success message: "Request Sent! Friend request sent to [username] successfully!"
7. **Verify** button changes to "Pending"

#### **Receive Request Test:**
1. **Login as User B** (different device/account)
2. **Verify** in-app notification banner slides down from top
3. **Verify** native mobile notification appears in device bar
4. **Test** quick accept from notification banner (✓ button)
5. **Test** quick decline from notification banner (✕ button)
6. **Verify** notification disappears after action

#### **Multiple Requests Test:**
1. **Send multiple requests** to User B
2. **Verify** notification shows count: "3 Friend Requests"
3. **Verify** "View" button appears for multiple requests
4. **Test** "View" button opens Requests screen

### **3. Message Notification Testing**

#### **Send Message Test:**
1. **Login as User A** (must be friends with User B)
2. **Open chat** with User B
3. **Send a message**
4. **Verify** message appears immediately in chat
5. **Verify** message is saved to database

#### **Receive Message Test:**
1. **Login as User B** (different device/account)
2. **Verify** native mobile notification appears
3. **Verify** notification shows: "Message from [username] - [message preview]"
4. **Test** tapping notification opens chat
5. **Verify** message appears in chat

#### **Long Message Test:**
1. **Send a long message** (>50 characters)
2. **Verify** notification shows truncated version with "..."
3. **Verify** full message appears in chat

### **4. Friend Acceptance Notification Testing**

#### **Accept Request Test:**
1. **Login as User B**
2. **Go to Requests screen**
3. **Accept** User A's friend request
4. **Verify** success message: "Friend Added! You are now friends with [username]!"
5. **Verify** request disappears from list

#### **Acceptance Notification Test:**
1. **Login as User A** (different device/account)
2. **Verify** native mobile notification appears
3. **Verify** notification shows: "Friend Request Accepted - [username] accepted your friend request"
4. **Verify** friend status updates to "Friends ✓"

### **5. In-App Notification Banner Testing**

#### **Banner Visibility Test:**
1. **Ensure** User B has pending friend requests
2. **Navigate** through different screens (Chat, Find Friends, Calls, etc.)
3. **Verify** notification banner appears on all screens
4. **Verify** banner is positioned correctly at top

#### **Banner Actions Test:**
1. **Test** quick accept button (✓)
2. **Test** quick decline button (✕)
3. **Test** "View" button for multiple requests
4. **Verify** banner disappears after actions
5. **Verify** banner slides down/up smoothly

### **6. Real-time Updates Testing**

#### **Auto-refresh Test:**
1. **Send friend request** from User A to User B
2. **Wait** up to 10 seconds for notification banner to appear
3. **Verify** banner appears automatically
4. **Test** multiple requests to verify real-time updates

#### **Status Updates Test:**
1. **Send request** and verify "Pending" status
2. **Accept request** and verify "Friends ✓" status
3. **Verify** status updates immediately in UI

### **7. Error Handling Testing**

#### **Network Error Test:**
1. **Disconnect** internet connection
2. **Try** to send friend request
3. **Verify** error message appears
4. **Verify** app doesn't crash

#### **Permission Denied Test:**
1. **Deny** notification permission
2. **Try** to send friend request
3. **Verify** app continues to work
4. **Verify** graceful fallback behavior

## 🔧 **Troubleshooting**

### **Notifications Not Appearing:**
1. **Check** device notification settings
2. **Verify** app has notification permission
3. **Check** notification channel settings (Android)
4. **Restart** app and try again

### **Permission Request Not Showing:**
1. **Clear** app data
2. **Reinstall** app
3. **Check** if permission was already granted
4. **Verify** app initialization

### **In-App Banner Not Showing:**
1. **Check** if user has pending requests
2. **Verify** notification service is initialized
3. **Check** console for errors
4. **Restart** app

### **Native Notifications Not Working:**
1. **Check** device notification settings
2. **Verify** notification channel exists (Android)
3. **Check** app permissions
4. **Test** on different device/emulator

## 📊 **Success Criteria**

### **✅ All Tests Pass:**
- [ ] Permission request appears on first launch
- [ ] Friend request notifications work (in-app + native)
- [ ] Message notifications work (native)
- [ ] Friend acceptance notifications work (native)
- [ ] In-app banner appears on all screens
- [ ] Quick actions work from notifications
- [ ] Real-time updates work
- [ ] Error handling works gracefully
- [ ] UI is responsive and professional
- [ ] No crashes or major bugs

### **✅ Performance Criteria:**
- [ ] Notifications appear within 10 seconds
- [ ] UI animations are smooth
- [ ] App doesn't lag or freeze
- [ ] Memory usage is reasonable
- [ ] Battery usage is acceptable

## 🎉 **Testing Complete!**

Once all tests pass, the notification system is **production-ready** and provides a professional chat experience with:

- ✅ **Real-time notifications** (in-app + native)
- ✅ **Beautiful UI** and smooth animations
- ✅ **Professional permission management**
- ✅ **Robust error handling**
- ✅ **Cross-platform compatibility**

**The notification system is ready for production use!** 🚀✨ 