// Discriminated payload for the `purge` queue.
//
// `signals` runs while the user still exists: it deletes every message the user
// owns (in their topics) or sent into others' topics, keeping the topics intact.
//
// `storage` runs after an account has been deleted: the DB rows are already gone
// via cascade, so the job only removes the orphaned files from object storage.
export type PurgeJob =
    | { avatarKey?: string; kind: 'storage'; storageKeys: string[] }
    | { kind: 'expired' }
    | { kind: 'signals'; userId: string };
