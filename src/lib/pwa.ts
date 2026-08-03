export type InstallState =
  | 'loading'
  | 'installed'
  | 'ready'
  | 'ios'
  | 'unavailable';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const isStandaloneApp = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
};

export const isIosDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
};

export const getInstallState = (): InstallState => {
  if (typeof window === 'undefined') return 'loading';

  if (isStandaloneApp()) {
    return 'installed';
  }

  if (deferredInstallPrompt) {
    return 'ready';
  }

  if (isIosDevice()) {
    return 'ios';
  }

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

export const registerHireUpPwa = async (): Promise<
  ServiceWorkerRegistration | null
> => {
  if (typeof window === 'undefined') return null;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event as BeforeInstallPromptEvent;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyListeners();
  });

  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
  } catch (error) {
    console.error('HireUp service worker registration failed:', error);
    return null;
  }
};

export const promptHireUpInstall = async (): Promise<
  | {
      outcome: 'accepted' | 'dismissed';
      platform: string;
    }
  | {
      outcome: 'unavailable';
    }
> => {
  if (!deferredInstallPrompt) {
    return {
      outcome: 'unavailable',
    };
  }

  await deferredInstallPrompt.prompt();

  const result = await deferredInstallPrompt.userChoice;

  if (result.outcome === 'accepted') {
    deferredInstallPrompt = null;
    notifyListeners();
  }

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
    icon: '/hireup-logo.png',
    badge: '/hireup-logo.png',
    tag: options.tag || 'hireup-notification',
    data: {
      url: '/',
      ...(options.data || {}),
    },
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification(
        title,
        notificationOptions
      );

      return true;
    }

    new Notification(title, notificationOptions);
    return true;
  } catch (error) {
    console.error('Could not show HireUp notification:', error);
    return false;
  }
};
