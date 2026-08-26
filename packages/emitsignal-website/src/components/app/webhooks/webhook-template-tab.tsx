import { TRANSFORM_NAMES } from '@emitsignal/shared/webhook-transforms';

import type { WebhookTemplate } from '#/lib/api';

import type { ReplacementRow, TemplateTextField } from './template-fields';

import { PriorityChip } from './priority-chip';
import { placeholderHintFor, TEMPLATE_FIELDS, unknownFiltersIn } from './template-fields';

interface WebhookTemplateTabProps {
    fields: WebhookTemplate;
    onFieldChange: (field: TemplateTextField, value: string) => void;
    onReplacementRowsChange: (rows: ReplacementRow[]) => void;
    onUseTemplateChange: (useTemplate: boolean) => void;
    replacementRows: ReplacementRow[];
    useTemplate: boolean;
}

export function WebhookTemplateTab({
    fields,
    onFieldChange,
    onReplacementRowsChange,
    onUseTemplateChange,
    replacementRows,
    useTemplate,
}: WebhookTemplateTabProps) {
    function updateRow(index: number, patch: Partial<ReplacementRow>) {
        onReplacementRowsChange(
            replacementRows.map((row, position) =>
                position === index ? { ...row, ...patch } : row,
            ),
        );
    }

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
                {TEMPLATE_FIELDS.map((field) => {
                    const unknownFilters = unknownFiltersIn(fields[field] ?? '');

                    return (
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
                            {unknownFilters.length > 0 && (
                                <div className="mt-1 font-mono text-[10.5px] text-warn">
                                    Unknown filter{unknownFilters.length > 1 ? 's' : ''}:{' '}
                                    {unknownFilters.join(', ')}, ignored on delivery.
                                </div>
                            )}
                        </div>
                    );
                })}

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

                <details className="mb-2.5">
                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[1px] text-dim">
                        Replacements
                        <span className="ml-2 normal-case tracking-normal text-faint">
                            {replacementRows.length || 'none'} · used by {'{{ value | map }}'}
                        </span>
                    </summary>

                    <div className="mt-1.5">
                        {replacementRows.map((row, index) => (
                            <div className="mb-1 flex gap-1" key={index}>
                                <input
                                    className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                                    onChange={(event) =>
                                        updateRow(index, { from: event.target.value })
                                    }
                                    placeholder="customer.subscription.created"
                                    value={row.from}
                                />
                                <input
                                    className="w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12.5px] text-fg outline-none placeholder:text-faint focus:border-accent/50"
                                    onChange={(event) =>
                                        updateRow(index, { to: event.target.value })
                                    }
                                    placeholder="Assinatura criada"
                                    value={row.to}
                                />
                                <button
                                    className="rounded-lg border border-line px-2.5 font-mono text-[12px] text-dim hover:text-fg"
                                    onClick={() =>
                                        onReplacementRowsChange(
                                            replacementRows.filter(
                                                (_, position) => position !== index,
                                            ),
                                        )
                                    }
                                    type="button"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        <button
                            className="rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] text-dim hover:text-fg"
                            onClick={() =>
                                onReplacementRowsChange([...replacementRows, { from: '', to: '' }])
                            }
                            type="button"
                        >
                            + Add replacement
                        </button>
                    </div>
                </details>

                <details>
                    <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[1px] text-dim">
                        Available filters
                    </summary>
                    <div className="mt-1.5 font-mono text-[11px] leading-relaxed text-faint">
                        {TRANSFORM_NAMES.join(' · ')}
                        <div className="mt-1.5 text-dim">
                            {"{{ created | date:'YYYY-MM-DD HH:mm' }}"}
                        </div>
                        <div className="text-dim">
                            {"{{ items.data.*.price.unit_amount | divide:100 | currency:'usd' }}"}
                        </div>
                        <div className="text-dim">{'{{ type | map }}'}</div>
                    </div>
                </details>
            </div>
        </div>
    );
}
