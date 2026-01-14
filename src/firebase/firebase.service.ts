import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private db: admin.database.Database;

    onModuleInit() {
        try {
            // Load service account from JSON file
            const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
            const serviceAccount = require(serviceAccountPath);

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://hula-erp-default-rtdb.asia-southeast1.firebasedatabase.app'
                });
                this.logger.log('Firebase Admin SDK initialized successfully');
            }

            this.db = admin.database();
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK:', error);
        }
    }

    /**
     * Push a new notification to Firebase Realtime Database
     * Path: /notifications/user_{userId}/{pushId}
     */
    async pushNotification(userId: number, notification: {
        id: number;
        title: string;
        message: string;
        type: string;
        link?: string;
        is_read: boolean;
        created_at: Date;
    }): Promise<void> {
        if (!this.db) {
            this.logger.warn('Firebase DB not initialized, skipping push');
            return;
        }

        try {
            const ref = this.db.ref(`notifications/user_${userId}`);
            await ref.push({
                ...notification,
                created_at: notification.created_at.toISOString(),
                timestamp: Date.now()
            });
            this.logger.debug(`Pushed notification to Firebase for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to push notification to Firebase:`, error);
        }
    }

    /**
     * Mark a notification as read in Firebase
     */
    async markAsRead(userId: number, notificationId: number): Promise<void> {
        if (!this.db) return;

        try {
            // Find and update the notification by ID
            const ref = this.db.ref(`notifications/user_${userId}`);
            const snapshot = await ref.orderByChild('id').equalTo(notificationId).once('value');

            if (snapshot.exists()) {
                const updates: any = {};
                snapshot.forEach((child) => {
                    updates[`${child.key}/is_read`] = true;
                });
                await ref.update(updates);
            }
        } catch (error) {
            this.logger.error(`Failed to mark notification as read in Firebase:`, error);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: number): Promise<void> {
        if (!this.db) return;

        try {
            const ref = this.db.ref(`notifications/user_${userId}`);
            const snapshot = await ref.once('value');

            if (snapshot.exists()) {
                const updates: any = {};
                snapshot.forEach((child) => {
                    if (!child.val().is_read) {
                        updates[`${child.key}/is_read`] = true;
                    }
                });
                if (Object.keys(updates).length > 0) {
                    await ref.update(updates);
                }
            }
        } catch (error) {
            this.logger.error(`Failed to mark all notifications as read in Firebase:`, error);
        }
    }

    /**
     * Clear old notifications (keep last 50) - call periodically
     */
    async cleanupOldNotifications(userId: number, keepCount: number = 50): Promise<void> {
        if (!this.db) return;

        try {
            const ref = this.db.ref(`notifications/user_${userId}`);
            const snapshot = await ref.orderByChild('timestamp').once('value');

            const notifications: { key: string; timestamp: number }[] = [];
            snapshot.forEach((child) => {
                notifications.push({
                    key: child.key!,
                    timestamp: child.val().timestamp || 0
                });
            });

            // Sort by timestamp descending and remove old ones
            notifications.sort((a, b) => b.timestamp - a.timestamp);

            if (notifications.length > keepCount) {
                const toDelete = notifications.slice(keepCount);
                const updates: any = {};
                toDelete.forEach((n) => {
                    updates[n.key] = null;
                });
                await ref.update(updates);
                this.logger.debug(`Cleaned up ${toDelete.length} old notifications for user ${userId}`);
            }
        } catch (error) {
            this.logger.error(`Failed to cleanup notifications:`, error);
        }
    }
}
