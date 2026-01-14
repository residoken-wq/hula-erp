import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private db: admin.database.Database | null = null;
    private initialized = false;

    onModuleInit() {
        this.initializeFirebase();
    }

    private initializeFirebase() {
        if (this.initialized) return;

        try {
            // Try multiple paths to find the service account file
            const possiblePaths = [
                // Development: src folder
                path.join(process.cwd(), 'src', 'firebase', 'firebase-service-account.json'),
                // Production: dist folder
                path.join(process.cwd(), 'dist', 'firebase', 'firebase-service-account.json'),
                // Docker: relative to current file
                path.join(__dirname, 'firebase-service-account.json'),
                // Root folder
                path.join(process.cwd(), 'firebase-service-account.json'),
            ];

            let serviceAccount = null;
            let foundPath = '';

            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    serviceAccount = require(p);
                    foundPath = p;
                    break;
                }
            }

            if (!serviceAccount) {
                this.logger.warn('Firebase service account file not found. Tried paths:');
                possiblePaths.forEach(p => this.logger.warn(`  - ${p}`));
                this.logger.warn('Firebase real-time notifications will be disabled.');
                return;
            }

            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: 'https://hula-erp-default-rtdb.asia-southeast1.firebasedatabase.app'
                });
                this.logger.log(`Firebase Admin SDK initialized from: ${foundPath}`);
            }

            this.db = admin.database();
            this.initialized = true;
        } catch (error) {
            this.logger.error('Failed to initialize Firebase Admin SDK:', error.message);
            this.logger.warn('Firebase real-time notifications will be disabled.');
        }
    }

    /**
     * Check if Firebase is available
     */
    isAvailable(): boolean {
        return this.db !== null;
    }

    /**
     * Push a new notification to Firebase Realtime Database
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
            return; // Silently skip if Firebase not available
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
            this.logger.error(`Failed to push notification to Firebase:`, error.message);
        }
    }

    /**
     * Mark a notification as read in Firebase
     */
    async markAsRead(userId: number, notificationId: number): Promise<void> {
        if (!this.db) return;

        try {
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
            this.logger.error(`Failed to mark notification as read in Firebase:`, error.message);
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
            this.logger.error(`Failed to mark all notifications as read in Firebase:`, error.message);
        }
    }

    /**
     * Clear old notifications (keep last 50)
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
            this.logger.error(`Failed to cleanup notifications:`, error.message);
        }
    }
}
