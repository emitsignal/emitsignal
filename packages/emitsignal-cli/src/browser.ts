import { spawn } from 'node:child_process';

export function openUrl(url: string): void {
    if (process.platform === 'darwin') {
        spawn('open', [url], { stdio: 'ignore' });

        return;
    }

    if (process.platform === 'win32') {
        spawn('cmd', ['/c', 'start', '""', url], { stdio: 'ignore' });

        return;
    }

    spawn('xdg-open', [url], { stdio: 'ignore' });
}
