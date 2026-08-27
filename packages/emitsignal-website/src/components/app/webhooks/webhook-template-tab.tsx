import type { WebhookTemplate } from '#/lib/api';

import type { TemplateTextField } from './template-fields';

import { PriorityChip } from './priority-chip';
import { placeholderHintFor, TEMPLATE_FIELDS } from './template-fields';

interface WebhookTemplateTabProps {
    fields: WebhookTemplate;
    onFieldChange: (field: TemplateTextField, value: string) => void;
    onUseTemplateChange: (useTemplate: boolean) => void;
    useTemplate: boolean;
}

export function WebhookTemplateTab({
    fields,
    onFieldChange,
    onUseTemplateChange,
    useTemplate,
}: WebhookTemplateTabProps) {
    return (
        <div className="px-5 py-4">
            <button
                className="mb-3 flex w-full cursor-pointer items-center"
                onClick={() => onUseTemplateChange(!useTemplate)}
                type="button"
            >
                <span
                    className="font-mono text-[11px]"
                    style={{ color: useTemplate ? 'var(--color-accent)' : 'var(--color-dim)' }}
                >
                    {useTemplate ? 'Using template' : 'Raw passthrough'}
                </span>
                <div
                    className="ml-auto flex items-center rounded-full p-0.5 transition-colors"
                    style={{
                        background: useTemplate ? 'var(--color-accent)' : 'var(--color-line)',
                        height: 21,
                        justifyContent: useTemplate ? 'flex-end' : 'flex-start',
                        width: 36,
                    }}
                >
                    <div className="h-[17px] w-[17px] rounded-full bg-fg" />
                </div>
            </button>

            <div
                className="transition-opacity"
                style={{
                    opacity: useTemplate ? 1 : 0.4,
                    pointerEvents: useTemplate ? 'auto' : 'none',
                }}
            >
                {TEMPLATE_FIELDS.map((field) => (
                    <div className="mb-2.5" key={field}>
                        <div className="mb-1 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                            {field}
                        </div>
                        <input
                            className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                            onChange={(event) => onFieldChange(field, event.target.value)}
                            placeholder={placeholderHintFor(field)}
                            value={fields[field] ?? ''}
                        />
                    </div>
                ))}

                {(fields.link ?? '') !== '' && (
                    <div className="mb-2.5">
                        <div className="mb-1 flex items-baseline gap-2 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                            Button label
                            <span className="normal-case tracking-normal text-faint">
                                optional · defaults to “View”
                            </span>
                        </div>
                        <input
                            className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                            onChange={(event) => onFieldChange('linkLabel', event.target.value)}
                            placeholder="View"
                            value={fields.linkLabel ?? ''}
                        />
                    </div>
                )}

                <div className="mb-2.5">
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-[1px] text-dim">
                        Priority
                    </div>

                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((priority) => (
                            <PriorityChip
                                active={String(priority) === (fields.priority ?? '3')}
                                key={priority}
                                onClick={() => onFieldChange('priority', String(priority))}
                                value={priority}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
