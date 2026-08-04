import { supabase } from './client';

export type InstallState =
  | 'loading'
  | 'installed'
  | 'ready'
  | 'ios'
  | 'unavailable';

export type PushSubscriptionState =
  | 'unsupported'
  | 'blocked'
  | 'disabled'
  | 'enabled';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

const VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BO3Epvi-d_2kfqW3cpA6DYdPYRHdvrdUyV9SMCAVLgSPwHCUcGes6DYjEr6-_3uTQTXq0HY0kI_gK8TVdhDhx-4';

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const urlBase64ToUint8Array = (value: string): Uint8Array => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(character => character.charCodeAt(0))
  );
};

export const isStandaloneApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
};

export const isIosDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export const getInstallState = (): InstallState => {
  if (typeof window === 'undefined') return 'loading';
  if (isStandaloneApp()) return 'installed';
  if (deferredInstallPrompt) return 'ready';
  if (isIosDevice()) return 'ios';

  return 'unavailable';
};

export const subscribeToPwaChanges = (
  listener: () => void
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const registerHireUpPwa = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined') return null;

  if (!registrationPromise) {
    window.addEventListener('beforeinstallprompt', event => {
      event.preventDefault();
      deferredInstallPrompt = event as BeforeInstallPromptEvent;
      notifyListeners();
    });

    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      notifyListeners();
    });

    window
      .matchMedia('(display-mode: standalone)')
      .addEventListener?.('change', notifyListeners);

    registrationPromise = (async () => {
      if (!('serviceWorker' in navigator)) return null;

      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        await registration.update();
        return registration;
      } catch (error) {
        console.error(
          'HireUp service worker registration failed:',
          error
        );
        return null;
      }
    })();
  }

  return registrationPromise;
};

export const promptHireUpInstall = async () => {
  if (isStandaloneApp()) {
    return { outcome: 'accepted' as const, platform: 'installed' };
  }

  if (!deferredInstallPrompt) {
    return { outcome: 'unavailable' as const };
  }

  await deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;

  deferredInstallPrompt = null;
  notifyListeners();

  return result;
};

export const getNotificationPermission = ():
  | NotificationPermission
  | 'unsupported' => {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }

  return Notification.permission;
};

export const requestHireUpNotificationPermission = async (): Promise<
  NotificationPermission | 'unsupported'
> => {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window)
  ) {
    return 'unsupported';
  }

  return Notification.requestPermission();
};

export const getPushSubscriptionState =
  async (): Promise<PushSubscriptionState> => {
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window)
    ) {
      return 'unsupported';
    }

    if (Notification.permission === 'denied') return 'blocked';
    if (Notification.permission !== 'granted') return 'disabled';

    const registration = await navigator.serviceWorker.ready;
    const subscription =
      await registration.pushManager.getSubscription();

    return subscription ? 'enabled' : 'disabled';
  };

export const enableHireUpPushNotifications = async (
  userId: string
): Promise<PushSubscriptionState> => {
  if (
    !userId ||
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return 'unsupported';
  }

  const permission = await Notification.requestPermission();

  if (permission === 'denied') return 'blocked';
  if (permission !== 'granted') return 'disabled';

  const registration = await navigator.serviceWorker.ready;
  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey:
        urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const serialised = subscription.toJSON();
  const p256dh = serialised.keys?.p256dh;
  const auth = serialised.keys?.auth;

  if (!serialised.endpoint || !p256dh || !auth) {
    throw new Error(
      'The browser returned an incomplete push subscription.'
    );
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint: serialised.endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

  if (error) throw error;

  return 'enabled';
};

export const disableHireUpPushNotifications = async (
  userId: string
): Promise<PushSubscriptionState> => {
  if (
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window)
  ) {
    return 'unsupported';
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;

    await subscription.unsubscribe();

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) throw error;
  }

  return 'disabled';
};

export const showHireUpNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<boolean> => {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    Notification.permission !== 'granted'
  ) {
    return false;
  }

  const notificationOptions: NotificationOptions = {
    body: options.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: options.tag || 'hireup-notification',
    data: { url: '/', ...(options.data || {}) },
    ...options,
  };

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(
      title,
      notificationOptions
    );

    return true;
  } catch (error) {
    console.error(
      'Could not show HireUp notification:',
      error
    );

    return false;
  }
};