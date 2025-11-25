import { supabase } from './supabaseClient'

const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

export const isPushSupported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

async function subscribeToPush() {
  if (!publicVapidKey) {
    throw new Error('Missing VITE_VAPID_PUBLIC_KEY')
  }

  const registration = await navigator.serviceWorker.ready

  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) {
    return existingSubscription
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
  })

  return subscription
}

async function saveSubscriptionToSupabase(subscription: PushSubscription) {
  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh ?? null
  const auth = json.keys?.auth ?? null

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint,
      p256dh,
      auth,
    },
    {
      onConflict: 'endpoint',
    }
  )

  if (error) {
    throw error
  }
}

export async function enablePushNotifications() {
  if (!isPushSupported) {
    return false
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return false
  }

  const subscription = await subscribeToPush()
  await saveSubscriptionToSupabase(subscription)

  return true
}
