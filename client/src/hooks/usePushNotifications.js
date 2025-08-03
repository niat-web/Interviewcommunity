import { useState, useEffect } from 'react';
import { useAlert } from './useAlert';
import { subscribePush } from '../api/interviewer.api';

// Function to convert VAPID key to a Uint8Array
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const { showSuccess, showWarning, showError } = useAlert();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) {
                        setIsSubscribed(true);
                        setSubscription(sub);
                    }
                });
            });
        }
    }, []);

    const askPermissionAndSubscribe = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            showError("Push Notifications are not supported by this browser.");
            setError("Push not supported.");
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            showWarning('You have blocked notifications. You will only receive email alerts.');
            setError("Permission not granted.");
            return;
        }
        
        try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
            });

            await subscribePush(sub); // Send subscription to backend
            
            showSuccess('Desktop notifications enabled!');
            setIsSubscribed(true);
            setSubscription(sub);

        } catch (err) {
            console.error('Failed to subscribe to push notifications:', err);
            showError('Failed to enable push notifications.');
            setError(err);
        }
    };
    
    // An optional function to unsubscribe if needed
    const unsubscribe = async () => {
      if (subscription) {
        await subscription.unsubscribe();
        // Here you would also call an API to remove the subscription from the backend
        setIsSubscribed(false);
        setSubscription(null);
      }
    };

    return {
        isSubscribed,
        subscription,
        askPermissionAndSubscribe,
        unsubscribe,
        error
    };
}
