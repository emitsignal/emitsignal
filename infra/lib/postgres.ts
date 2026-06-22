/**
 * Runs `pg_dump` / `pg_restore` through a one-off Docker container so the host
 * does not need the PostgreSQL client tools installed. The container version is
 * pinned to the database version via `POSTGRES_IMAGE`.
 *
 * On macOS a one-off container cannot reach the host's `localhost`, so a local
 * `DATABASE_URL` is transparently routed through `host.docker.internal`.
 */

const LOCAL_HOSTNAMES = new Set(['::1', '127.0.0.1', 'localhost']);

interface ConnectionTarget {
    addHostGateway: boolean;
    environment: string[];
}

interface DumpOptions {
    databaseUrl: string;
    outputPath: string;
    postgresImage: string;
}

interface RestoreOptions {
    databaseUrl: string;
    inputPath: string;
    postgresImage: string;
}

export async function dumpDatabase({
    databaseUrl,
    outputPath,
    postgresImage,
}: DumpOptions): Promise<void> {
    const target = buildConnectionTarget(databaseUrl);
    const command = ['pg_dump', '--format=custom', '--no-owner', '--no-privileges'];

    // Stream the dump straight to disk by handing the subprocess the output
    // file as its stdout — Bun pipes it without buffering the dump in memory.
    const proc = Bun.spawn(['docker', ...dockerArguments(target, postgresImage, command)], {
        stderr: 'inherit',
        stdin: 'ignore',
        stdout: Bun.file(outputPath),
    });

    const exitCode = await proc.exited;

    if (exitCode !== 0) {
        throw new Error(`pg_dump exited with code ${exitCode}`);
    }
}

export async function restoreDatabase({
    databaseUrl,
    inputPath,
    postgresImage,
}: RestoreOptions): Promise<void> {
    const target = buildConnectionTarget(databaseUrl);
    const databaseName = decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ''));

    // --dbname is required so pg_restore connects and applies the dump directly
    // instead of emitting the SQL script to stdout.
    const command = [
        'pg_restore',
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--dbname',
        databaseName,
    ];

    const proc = Bun.spawn(['docker', ...dockerArguments(target, postgresImage, command)], {
        stderr: 'inherit',
        stdin: Bun.file(inputPath),
        stdout: 'inherit',
    });

    const exitCode = await proc.exited;

    // pg_restore returns a non-zero code for ignorable warnings (e.g. objects
    // that did not exist when --clean ran). Surface the code but treat the
    // common "completed with warnings" exit (1) as a soft success.
    if (exitCode !== 0 && exitCode !== 1) {
        throw new Error(`pg_restore exited with code ${exitCode}`);
    }

    if (exitCode === 1) {
        console.warn('⚠️  pg_restore completed with warnings (exit code 1).');
    }
}

function buildConnectionTarget(databaseUrl: string): ConnectionTarget {
    const url = new URL(databaseUrl);
    const isLocal = LOCAL_HOSTNAMES.has(url.hostname);
    const host = isLocal ? 'host.docker.internal' : url.hostname;

    const environment: string[] = [
        `PGHOST=${host}`,
        `PGPORT=${url.port || '5432'}`,
        `PGDATABASE=${decodeURIComponent(url.pathname.replace(/^\//, ''))}`,
    ];

    if (url.username !== '') {
        environment.push(`PGUSER=${decodeURIComponent(url.username)}`);
    }

    if (url.password !== '') {
        environment.push(`PGPASSWORD=${decodeURIComponent(url.password)}`);
    }

    const sslMode = url.searchParams.get('sslmode');

    if (sslMode) {
        environment.push(`PGSSLMODE=${sslMode}`);
    }

    return { addHostGateway: isLocal, environment };
}

function dockerArguments(
    target: ConnectionTarget,
    postgresImage: string,
    command: string[],
): string[] {
    const args = ['run', '--rm', '-i'];

    if (target.addHostGateway) {
        args.push('--add-host=host.docker.internal:host-gateway');
    }

    for (const variable of target.environment) {
        args.push('-e', variable);
    }

    args.push(postgresImage, ...command);

    return args;
}
