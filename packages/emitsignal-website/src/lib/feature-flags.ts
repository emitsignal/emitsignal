/**
 * TECH DEBT: delivery routing (push/email/slack/sms/webhook fan-out) and the
 * "will reach" summary are mockups — nothing backs them yet. Flip to `true`
 * once routing ships, or promote to an env-driven flag.
 */
export const DELIVERY_FLAG_ENABLED = false;
