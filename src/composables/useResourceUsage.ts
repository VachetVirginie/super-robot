import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

interface LogResourceUsageOptions {
  source: string
  resourceType: 'sound' | 'breath' | 'express' | 'movement'
  resourceKey: string
  durationSeconds?: number | null
}

export function useResourceUsage(session: Ref<Session | null>) {
  const isLoggingResource = ref(false)
  const resourceUsageError = ref<string | null>(null)

  async function logResourceUsage(options: LogResourceUsageOptions) {
    const user = session.value?.user

    if (!user) {
      return
    }

    isLoggingResource.value = true
    resourceUsageError.value = null

    try {
      const payload: {
        user_id: string
        occurred_at: string
        source: string
        resource_type: string
        resource_key: string
        duration_seconds?: number | null
      } = {
        user_id: user.id,
        occurred_at: new Date().toISOString(),
        source: options.source,
        resource_type: options.resourceType,
        resource_key: options.resourceKey,
      }

      if (typeof options.durationSeconds === 'number') {
        payload.duration_seconds = options.durationSeconds
      }

      const { error } = await supabase.from('resource_events').insert(payload)

      if (error) {
        const msg = (error as { message?: string }).message ?? ''
        if (!msg.includes('relation "resource_events" does not exist')) {
          resourceUsageError.value = "Impossible d'enregistrer cette ressource."
        }
      }
    } finally {
      isLoggingResource.value = false
    }
  }

  return {
    isLoggingResource,
    resourceUsageError,
    logResourceUsage,
  }
}
