import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Native Device Permissions Handler
 * Handles camera, GPS, and push notification permissions for mobile app
 */

export class NativePermissions {
  /**
   * Request camera permission for delivery photo capture
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      const result = await Camera.checkPermissions();
      
      if (result.camera === 'granted') {
        return true;
      }
      
      if (result.camera === 'prompt') {
        const permissionResult = await Camera.requestPermissions({ permissions: ['camera'] });
        return permissionResult.camera === 'granted';
      }
      
      if (result.camera === 'denied') {
        console.warn('Camera permission denied. User must enable in settings.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return false;
    }
  }

  /**
   * Capture photo for delivery proof
   */
  static async capturePhoto(): Promise<string | null> {
    try {
      const hasPermission = await this.requestCameraPermission();
      if (!hasPermission) {
        throw new Error('Camera permission not granted');
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        saveToGallery: false,
      });

      return image.webPath || null;
    } catch (error) {
      console.error('Error capturing photo:', error);
      return null;
    }
  }

  /**
   * Request GPS/location permission for partner tracking
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      const result = await Geolocation.checkPermissions();
      
      if (result.location === 'granted') {
        return true;
      }
      
      if (result.location === 'prompt') {
        const permissionResult = await Geolocation.requestPermissions({ permissions: ['location'] });
        return permissionResult.location === 'granted';
      }
      
      if (result.location === 'denied') {
        console.warn('Location permission denied. User must enable in settings.');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  /**
   * Get current GPS location
   */
  static async getCurrentLocation(): Promise<Position | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      return position;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }

  /**
   * Start GPS tracking for partner delivery
   */
  static async startLocationTracking(callback: (position: Position) => void): Promise<string | null> {
    try {
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission not granted');
      }

      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            console.error('Location tracking error:', err);
            return;
          }
          if (position) {
            callback(position);
          }
        }
      );

      return watchId;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return null;
    }
  }

  /**
   * Stop GPS tracking
   */
  static async stopLocationTracking(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  /**
   * Request local notification permission
   */
  static async requestNotificationPermission(): Promise<boolean> {
    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show local notification
   */
  static async showNotification(title: string, body: string, id?: number): Promise<void> {
    try {
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) {
        console.warn('Notification permission not granted');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: id || Date.now(),
            title,
            body,
            schedule: { at: new Date(Date.now() + 100) },
            sound: null,
            attachments: null,
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Register for push notifications
   */
  static async registerPushNotifications(
    onTokenReceived: (token: string) => void,
    onNotificationReceived: (notification: any) => void
  ): Promise<void> {
    try {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        
        PushNotifications.addListener('registration', (token) => {
          console.log('Push notification token:', token.value);
          onTokenReceived(token.value);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
          onNotificationReceived(notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
        });
      } else {
        console.warn('Push notification permission not granted');
      }
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  }

  /**
   * Get push notification token
   */
  static async getPushToken(): Promise<string | null> {
    try {
      const result = await PushNotifications.register();
      return result?.value || null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }
}

export default NativePermissions;
