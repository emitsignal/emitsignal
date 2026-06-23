import type { ReactNode } from 'react';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { authClient } from '#/lib/auth-client';
import { queryKeys, sessionQueryOptions } from '#/lib/query-client';

export interface SessionContextValue {
    loading: boolean;
    signOut: () => Promise<void>;
    user: null | SessionUser;
}

export interface SessionUser {
    email: string;
    id: string;
    image: null | string;
    name: null | string;
    onboarded: boolean;
}

export function SessionProvider({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

export function useSession(): SessionContextValue {
    const queryClient = useQueryClient();

    const { data, isPending } = useQuery(sessionQueryOptions);

    return {
        loading: isPending,
        signOut: async () => {
            await authClient.signOut();

            queryClient.removeQueries({ queryKey: queryKeys.session });
            queryClient.removeQueries({ queryKey: queryKeys.billing });
        },
        user: data?.user
            ? {
                  email: data.user.email,
                  id: data.user.id,
                  image: data.user.image ?? null,
                  name: data.user.name ?? null,
                  onboarded: data.user.onboarded ?? false,
              }
            : null,
    };
}
