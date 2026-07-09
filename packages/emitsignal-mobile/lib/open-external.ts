import { isSafeExternalUrl } from '@emitsignal/shared/url';
import { Linking } from 'react-native';

// Single choke point for opening publisher-supplied URLs. Rejects anything that
// isn't http(s)/mailto so a malicious notification/message can't launch a
// dangerous custom-scheme deep link or a javascript:/data: URL.
export async function openExternalUrl(url: null | string | undefined): Promise<boolean> {
    if (!isSafeExternalUrl(url)) {
        console.warn('Blocked attempt to open unsafe URL scheme');

        return false;
    }

    try {
        await Linking.openURL(url as string);

        return true;
    } catch (error) {
        console.warn('Failed to open URL:', error);

        return false;
    }
}
