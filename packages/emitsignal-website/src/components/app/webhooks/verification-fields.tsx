import type { VerificationConfig, VerificationScheme } from '@emitsignal/shared';

import {
    schemeNeedsConfig,
    VERIFICATION_HINTS,
    VERIFICATION_LABELS,
    VERIFICATION_SCHEMES,
} from '@emitsignal/shared';
import { ChevronDown, Eye, EyeOff, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

interface VerificationFieldsProps {
    config: VerificationConfig;
    hasStoredSecret: boolean;
    onConfigChange: (config: VerificationConfig) => void;
    onSchemeChange: (scheme: VerificationScheme) => void;
    onSecretChange: (secret: string) => void;
    scheme: VerificationScheme;
    secret: string;
}

const FIELD_CLASS =
    'w-full rounded-lg border border-line bg-elev px-3 py-2 font-mono text-[12px] text-fg outline-none placeholder:text-faint';
const LABEL_CLASS = 'mb-2 font-mono text-[10px] uppercase tracking-[1.3px] text-dim';

export function VerificationFields({
    config,
    hasStoredSecret,
    onConfigChange,
    onSchemeChange,
    onSecretChange,
    scheme,
    secret,
}: VerificationFieldsProps) {
    const [secretVisible, setSecretVisible] = useState(false);

    const verified = scheme !== 'none';
    const needsConfig = schemeNeedsConfig(scheme);

    return (
        <div className="border-b border-line px-6 py-4">
            <div className="mb-3 flex items-center gap-2">
                {verified ? (
                    <ShieldCheck className="text-success" size={13} />
                ) : (
                    <ShieldAlert className="text-warn" size={13} />
                )}
                <span className="font-mono text-[10px] uppercase tracking-[1.3px] text-dim">
                    Signature verification
                </span>
            </div>

            <div className="grid grid-cols-[1.1fr_1.6fr] gap-5">
                <div>
                    <div className={LABEL_CLASS}>Scheme</div>
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-elev px-3 py-2">
                        <select
                            className="flex-1 bg-transparent font-mono text-[12px] text-fg outline-none"
                            onChange={(event) =>
                                onSchemeChange(event.target.value as VerificationScheme)
                            }
                            value={scheme}
                        >
                            {VERIFICATION_SCHEMES.map((option) => (
                                <option key={option} value={option}>
                                    {VERIFICATION_LABELS[option]}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none text-dim" size={13} />
                    </div>
                </div>

                <div>
                    <div className={LABEL_CLASS}>
                        {verified ? 'Secret from the provider' : 'No secret required'}
                    </div>
                    <div className="relative">
                        <input
                            autoComplete="off"
                            className={`${FIELD_CLASS} pr-9`}
                            disabled={!verified}
                            onChange={(event) => onSecretChange(event.target.value)}
                            placeholder={
                                hasStoredSecret
                                    ? 'A secret is stored. Type to replace it'
                                    : 'Paste the signing secret'
                            }
                            spellCheck={false}
                            type={secretVisible ? 'text' : 'password'}
                            value={secret}
                        />
                        <button
                            className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-2.5 text-faint hover:text-fg disabled:cursor-default disabled:opacity-40"
                            disabled={!verified || !secret}
                            onClick={() => setSecretVisible((visible) => !visible)}
                            tabIndex={-1}
                            title={secretVisible ? 'Hide secret' : 'Show secret'}
                            type="button"
                        >
                            {secretVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-2 font-mono text-[10.5px] text-faint">
                {VERIFICATION_HINTS[scheme]}
                {verified &&
                    hasStoredSecret &&
                    ' A secret is already stored; leave blank to keep it.'}
            </div>

            {needsConfig && (
                <div className="mt-4 grid grid-cols-[1.6fr_1fr_1fr_1.1fr] gap-3">
                    <div>
                        <div className={LABEL_CLASS}>Header</div>
                        <input
                            className={FIELD_CLASS}
                            onChange={(event) =>
                                onConfigChange({ ...config, header: event.target.value })
                            }
                            placeholder="x-signature"
                            spellCheck={false}
                            value={config.header}
                        />
                    </div>

                    {scheme === 'hmac' && (
                        <>
                            <div>
                                <div className={LABEL_CLASS}>Digest</div>
                                <select
                                    className={FIELD_CLASS}
                                    onChange={(event) =>
                                        onConfigChange({
                                            ...config,
                                            algorithm: event.target
                                                .value as VerificationConfig['algorithm'],
                                        })
                                    }
                                    value={config.algorithm ?? 'sha256'}
                                >
                                    <option value="sha1">sha1</option>
                                    <option value="sha256">sha256</option>
                                    <option value="sha512">sha512</option>
                                </select>
                            </div>

                            <div>
                                <div className={LABEL_CLASS}>Encoding</div>
                                <select
                                    className={FIELD_CLASS}
                                    onChange={(event) =>
                                        onConfigChange({
                                            ...config,
                                            encoding: event.target
                                                .value as VerificationConfig['encoding'],
                                        })
                                    }
                                    value={config.encoding ?? 'hex'}
                                >
                                    <option value="hex">hex</option>
                                    <option value="base64">base64</option>
                                </select>
                            </div>
                        </>
                    )}

                    <div className={scheme === 'token' ? 'col-span-2' : undefined}>
                        <div className={LABEL_CLASS}>Prefix (optional)</div>
                        <input
                            className={FIELD_CLASS}
                            onChange={(event) =>
                                onConfigChange({ ...config, prefix: event.target.value })
                            }
                            placeholder={scheme === 'token' ? 'Bearer ' : 'sha256='}
                            spellCheck={false}
                            value={config.prefix ?? ''}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
