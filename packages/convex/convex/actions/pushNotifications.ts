"use node";

import { v } from "convex/values";
import { action } from "../_generated/server.js";
import { api, internal } from "../_generated/api.js";
import type { Id } from "../_generated/dataModel.js";

// Expo Push Notification API endpoint
const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

// Send push notifications to multiple devices
export const sendPushNotifications = action({
    args: {
        tokens: v.array(v.string()),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.record(v.string(), v.any())),
    },
    handler: async (ctx, args): Promise<{ sent: number; failed: number }> => {
        if (args.tokens.length === 0) {
            return { sent: 0, failed: 0 };
        }

        // Expo Push API accepts max 100 messages per request
        const batchSize = 100;
        const batches: string[][] = [];

        for (let i = 0; i < args.tokens.length; i += batchSize) {
            batches.push(args.tokens.slice(i, i + batchSize));
        }

        let totalSent = 0;
        let totalFailed = 0;

        for (const batch of batches) {
            const messages = batch.map((token: string) => ({
                to: token,
                sound: "default",
                title: args.title,
                body: args.body,
                data: args.data || {},
                priority: "high",
                channelId: "default",
            }));

            try {
                const response = await fetch(EXPO_PUSH_API, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                        "Accept-Encoding": "gzip, deflate",
                    },
                    body: JSON.stringify(messages),
                });

                if (!response.ok) {
                    console.error(
                        "Push notification API error:",
                        await response.text(),
                    );
                    totalFailed += batch.length;
                    continue;
                }

                const result = await response.json();

                // Count successes and failures
                if (result.data && Array.isArray(result.data)) {
                    result.data.forEach((item: { status: string }) => {
                        if (item.status === "ok") {
                            totalSent++;
                        } else {
                            totalFailed++;
                            console.error("Push notification failed:", item);
                        }
                    });
                }
            } catch (error) {
                console.error("Error sending push notifications:", error);
                totalFailed += batch.length;
            }
        }

        return { sent: totalSent, failed: totalFailed };
    },
});

// Publish a message and send push notifications to subscribers
export const publishMessageWithNotifications = action({
    args: {
        topicId: v.id("topics"),
        title: v.string(),
        body: v.string(),
        priority: v.optional(
            v.union(
                v.literal(1),
                v.literal(2),
                v.literal(3),
                v.literal(4),
                v.literal(5),
            ),
        ),
        tags: v.optional(v.array(v.string())),
        userId: v.optional(v.id("users")),
    },
    handler: async (
        ctx,
        args,
    ): Promise<{ messageId: Id<"messages">; notificationsSent: number }> => {
        // First, publish the message via mutation
        const messageId: Id<"messages"> = await ctx.runMutation(
            api.mutations.messages.publishMessage,
            {
                topicId: args.topicId,
                title: args.title,
                body: args.body,
                priority: args.priority,
                tags: args.tags,
                userId: args.userId,
            },
        );

        // Get topic info for the notification
        const topic = await ctx.runQuery(api.queries.topics.getById, {
            id: args.topicId,
        });

        if (!topic) {
            throw new Error("Topic not found after publishing");
        }

        // Get all subscribers with push tokens
        interface Subscriber {
            deviceId: string;
            pushToken: string | null;
        }

        const subscribers: Subscriber[] = await ctx.runQuery(
            api.queries.subscriptions.getTopicSubscribers,
            { topicId: args.topicId },
        );

        // Extract push tokens
        const tokens: string[] = subscribers
            .filter(
                (
                    sub: Subscriber,
                ): sub is { deviceId: string; pushToken: string } =>
                    sub.pushToken !== null,
            )
            .map(
                (sub: { deviceId: string; pushToken: string }) => sub.pushToken,
            );

        // Send push notifications
        if (tokens.length > 0) {
            await ctx.runAction(
                internal.actions.pushNotifications.sendPushNotifications,
                {
                    tokens,
                    title: args.title,
                    body: args.body,
                    data: {
                        topicId: args.topicId,
                        topicName: topic.name,
                        messageId,
                        priority: String(args.priority ?? 3),
                    },
                },
            );
        }

        console.log(
            `Message published to ${subscribers.length} subscribers, ${tokens.length} with push tokens`,
        );

        return { messageId, notificationsSent: tokens.length };
    },
});
