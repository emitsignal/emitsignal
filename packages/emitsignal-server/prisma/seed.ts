import { prisma } from '../src/lib/prisma';

const SAMPLE_TOPICS = [
    { description: 'Production deployments', displayName: 'Deploy · Prod', name: 'deploy/prod' },
    { description: 'Server alerts & pages', displayName: 'Alerts · Prod', name: 'alerts/prod' },
    { description: 'Frontend CI pipelines', displayName: 'CI · Web', name: 'ci/web' },
    { description: 'Repo events', displayName: 'GitHub · EmitSignal', name: 'github/emitsignal' },
    { description: 'Nightly jobs', displayName: 'Cron · Backup', name: 'cron/backup' },
    { description: 'Sentry → EmitSignal bridge', displayName: 'Errors · Web', name: 'errors/web' },
];

const SAMPLE_MESSAGES = [
    {
        body: 'api-gateway → vercel prod',
        priority: 4,
        tags: ['vercel', 'prod'],
        title: 'Deploy succeeded',
        topic: 'deploy/prod',
    },
    {
        body: 'mem.used > 92% for 5m (threshold 90%)',
        priority: 5,
        tags: ['sev2', 'resolved-auto'],
        title: 'High memory on api-02',
        topic: 'alerts/prod',
    },
    {
        body: 'feat/oauth-pkce · 247 tests green',
        priority: 3,
        tags: ['ci', 'passed'],
        title: 'Build passed',
        topic: 'ci/web',
    },
    {
        body: 'maya approved · refactor: extract topic router',
        priority: 2,
        tags: ['approved'],
        title: 'PR #482 reviewed',
        topic: 'kevenleone/emitsignal',
    },
    {
        body: 'dumped 14.2 GB → s3://backups/2026-04-21',
        priority: 3,
        tags: ['cron', 'success'],
        title: 'nightly-backup.sh ✓',
        topic: 'cron/backup',
    },
    {
        body: "Cannot read property 'id' of undefined — 34 events in 2m",
        priority: 5,
        tags: ['new', 'x34'],
        title: 'TypeError spike',
        topic: 'errors/web',
    },
];

async function main() {
    for (const t of SAMPLE_TOPICS) {
        await prisma.topic.upsert({
            create: {
                description: t.description,
                displayName: t.displayName,
                isPublic: true,
                name: t.name,
            },
            update: { description: t.description, displayName: t.displayName },
            where: { name: t.name },
        });
    }

    const topics = await prisma.topic.findMany();
    const byName = new Map(topics.map((topic) => [topic.name, topic]));

    for (const m of SAMPLE_MESSAGES) {
        const topic = byName.get(m.topic);
        if (!topic) continue;
        await prisma.message.create({
            data: {
                body: m.body,
                priority: m.priority,
                tags: m.tags,
                title: m.title,
                topicId: topic.id,
            },
        });
    }

    console.log(`🌱 seeded ${SAMPLE_TOPICS.length} topics and ${SAMPLE_MESSAGES.length} messages`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
