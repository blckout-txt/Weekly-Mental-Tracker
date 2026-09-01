import { Alert, Linking, Platform } from 'react-native';

import type { CrisisResource } from '@/domain/crisisResources';

/** Strip spaces and dashes so tel: links dial correctly. */
export function normaliseNumber(value: string): string {
  return value.replace(/[^\d+*#]/g, '');
}

function fail(what: string) {
  Alert.alert(
    'Could not open',
    `This device could not open ${what} automatically. You can still ${what} manually — the number is on screen.`,
  );
}

export async function openResource(resource: CrisisResource): Promise<void> {
  try {
    switch (resource.method) {
      case 'call':
        await Linking.openURL(`tel:${normaliseNumber(resource.value)}`);
        return;
      case 'text': {
        // Android and iOS disagree about the separator before the body.
        const separator = Platform.OS === 'ios' ? '&' : '?';
        const body = resource.display.match(/Text\s+([A-Z]+)\s+to/)?.[1];
        const url = body
          ? `sms:${normaliseNumber(resource.value)}${separator}body=${encodeURIComponent(body)}`
          : `sms:${normaliseNumber(resource.value)}`;
        await Linking.openURL(url);
        return;
      }
      case 'chat':
      case 'web':
        await Linking.openURL(resource.value);
        return;
    }
  } catch {
    fail(resource.method === 'call' ? 'call' : 'open this');
  }
}

export async function dial(number: string): Promise<void> {
  try {
    await Linking.openURL(`tel:${normaliseNumber(number)}`);
  } catch {
    fail('call');
  }
}
