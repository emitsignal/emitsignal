import { prisma } from "../src/lib/prisma";
import { serializeTags } from "../src/lib/topic";

const SAMPLE_TOPICS = [
    { name: "deploy/prod", displayName: "Deploy · Prod", description: "Production deployments" },
    { name: "alerts/prod", displayName: "Alerts · Prod", description: "Server alerts & pages" },
    { name: "ci/web", displayName: "CI · Web", description: "Frontend CI pipelines" },
    { name: "github/whinsper", displayName: "GitHub · whinsper", description: "Repo events" },
    { name: "cron/backup", displayName: "Cron · Backup", description: "Nightly jobs" },
    { name: "errors/web", displayName: "Errors · Web", description: "Sentry → whinsper bridge" },
];

const SAMPLE_MESSAGES = [
    {
        topic: "deploy/prod",
        title: "Deploy succeeded",
        body: "api-gateway → vercel prod",
        priority: 4,
        tags: ["vercel", "prod"],
    },
    {
        topic: "alerts/prod",
        title: "High memory on api-02",
        body: "mem.used > 92% for 5m (threshold 90%)",
        priority: 5,
        tags: ["sev2", "resolved-auto"],
    },
    {
        topic: "ci/web",
        title: "Build passed",
        body: "feat/oauth-pkce · 247 tests green",
        priority: 3,
        tags: ["ci", "passed"],
    },
    {
        topic: "github/whinsper",
        title: "PR #482 reviewed",
        body: "maya approved · refactor: extract topic router",
        priority: 2,
        tags: ["approved"],
    },
    {
        topic: "cron/backup",
        title: "nightly-backup.sh ✓",
        body: "dumped 14.2 GB → s3://backups/2026-04-21",
        priority: 3,
        tags: ["cron", "success"],
    },
    {
        topic: "errors/web",
        title: "TypeError spike",
        body: "Cannot read property 'id' of undefined — 34 events in 2m",
        priority: 5,
        tags: ["new", "x34"],
    },
];

async function main() {
    for (const t of SAMPLE_TOPICS) {
        await prisma.topic.upsert({
            where: { name: t.name },
            update: { displayName: t.displayName, description: t.description },
            create: {
                name: t.name,
                displayName: t.displayName,
                description: t.description,
                isPublic: true,
            },
        });
    }

    const topics = await prisma.topic.findMany();
    const byName = new Map(topics.map((t) => [t.name, t]));

    for (const m of SAMPLE_MESSAGES) {
        const topic = byName.get(m.topic);
        if (!topic) continue;
        await prisma.message.create({
            data: {
                topicId: topic.id,
                title: m.title,
                body: m.body,
                priority: m.priority,
                tags: serializeTags(m.tags),
            },
        });
    }

    console.log(
        `🌱 seeded ${SAMPLE_TOPICS.length} topics and ${SAMPLE_MESSAGES.length} messages`,
    );
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
