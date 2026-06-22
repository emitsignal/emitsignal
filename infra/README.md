# infra

Operational scripts for EmitSignal. All scripts run with Bun and require Docker
(the PostgreSQL client tools run inside a one-off `postgres:*` container, so you
don't need `pg_dump`/`pg_restore` installed locally).

## Database backup & restore (Cloudflare R2)

Dumps the database with `pg_dump` (custom format) and stores it in an R2 bucket;
restore pulls a dump back down and applies it with `pg_restore`.

### Setup

```bash
cp infra/.env.example infra/.env
# then fill in your R2 credentials + bucket in infra/.env
```

`DATABASE_URL` and the `S3_*` credentials fall back to
`packages/emitsignal-server/.env`, so in dev you usually only need to add the R2
credentials and `BACKUP_BUCKET`.

### Backup

```bash
bun run db:backup
# or: bun infra/db-backup.ts
```

Prints the uploaded object key, e.g. `db-backups/emitsignal-20260621-2247.dump`.

### Restore

```bash
bun run db:restore                 # restore the most recent backup
bun run db:restore -- --list       # list available backups
bun run db:restore -- <object-key> # restore a specific backup
bun run db:restore -- <key> --yes  # skip the confirmation prompt
```

Restore uses `pg_restore --clean --if-exists`, which **drops and recreates**
objects in the target database. It prompts for confirmation unless `--yes` is
passed.

### Notes

- A local `DATABASE_URL` (`localhost`/`127.0.0.1`) is automatically routed to
  `host.docker.internal` so the one-off container reaches your host database.
- Keep `POSTGRES_IMAGE` in sync with your database's major version.
- Credentials are passed to the container via `PG*` env vars (not on the command
  line), so they don't leak into `docker`'s process arguments.
