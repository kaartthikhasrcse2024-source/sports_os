import { Pool, PoolClient } from 'pg';

export interface NotificationParams {
    recipientId: string;
    actorId?: string;
    type: string;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
}

export async function createNotification(
    dbClient: Pool | PoolClient,
    data: NotificationParams
) {
    try {
        await dbClient.query(`
            INSERT INTO notifications (recipient_id, actor_id, type, title, message, entity_type, entity_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (recipient_id, type, entity_id) DO NOTHING
        `, [
            data.recipientId,
            data.actorId || null,
            data.type,
            data.title,
            data.message,
            data.entityType || null,
            data.entityId || null
        ]);
    } catch (e) {
        console.error('Non-lethal notification service failure. Safe state continues without dropping cascade constraints.', e);
    }
}
