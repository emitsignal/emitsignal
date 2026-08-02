import { Logo } from '#/components/ui/logo';
import { STATUS_URL } from '#/lib/links';

export function BlogFooter() {
    return (
        <footer className="border-t border-line bg-[#0a0614] px-5 py-10 md:px-10">
            <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-4">
                <Logo className="text-accent" size={15} />

                <span className="font-mono text-[11.5px] text-dim">
                    The dev-native pubsub layer.
                </span>

                <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-dim">
                    <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_6px_var(--color-success)]" />
                    all systems normal ·{' '}
                    <a href={STATUS_URL} target="_blank">
                        status.emitsignal.com
                    </a>
                </span>
            </div>

            <div className="mx-auto mt-5 max-w-[1200px] font-mono text-[10.5px] text-faint">
                © {new Date().getFullYear()} EmitSignal
            </div>
        </footer>
    );
}
