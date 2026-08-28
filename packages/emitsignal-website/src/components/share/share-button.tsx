import { parseShareRefusal } from '@emitsignal/shared/share';
import { Share2 } from 'lucide-react';
import { useState } from 'react';

import type { Message } from '#/lib/api';

import { ShareDialog, type ShareState } from '#/components/share/share-dialog';
import { api } from '#/lib/api';
import { apiErrorMessage } from '#/lib/api-error';

export function ShareButton({ message }: { message: Message }) {
    const [state, setState] = useState<ShareState>({ kind: 'idle' });

    const share = async () => {
        setState({ kind: 'loading' });

        try {
            const { shareId } = await api.createMessageShare(message.id);

            setState({ kind: 'ready', shareId });
        } catch (error) {
            const refusal = parseShareRefusal(error);

            setState(
                refusal
                    ? { ...refusal, kind: 'private' }
                    : {
                          kind: 'error',
                          message: apiErrorMessage(error, 'Could not create a link.'),
                      },
            );
        }
    };

    return (
        <>
            <button
                aria-label="Share this message"
                className="flex items-center gap-1.5 rounded-md border border-line bg-elev px-2.5 py-1 font-mono text-[10.5px] text-muted hover:bg-elev-2 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                disabled={state.kind === 'loading'}
                onClick={share}
                title="Share this message"
                type="button"
            >
                <Share2 size={12} />
                share
            </button>

            <ShareDialog
                message={message}
                onClose={() => setState({ kind: 'idle' })}
                onRetry={share}
                state={state}
            />
        </>
    );
}
