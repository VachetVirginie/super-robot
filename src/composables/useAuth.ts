import { computed, onMounted, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../supabaseClient'

export function useAuth() {
  const session = ref<Session | null>(null)
  const email = ref('')
  const password = ref('')
  const authMessage = ref<string | null>(null)
  const authError = ref<string | null>(null)
  const isAuthLoading = ref(false)
  const authMode = ref<'login' | 'signup'>('login')

  const isAuthenticated = computed(() => !!session.value)
  const isLoginMode = computed(() => authMode.value === 'login')
  const submitLabel = computed(() =>
    authMode.value === 'login' ? 'Se connecter' : 'Creer un compte'
  )
  const submitLoadingLabel = computed(() =>
    authMode.value === 'login' ? 'Connexion...' : 'Creation...'
  )
  const switchLabel = computed(() =>
    authMode.value === 'login'
      ? 'Pas encore de compte ? Creer un compte'
      : 'Deja un compte ? Se connecter'
  )

  async function submitAuth() {
    if (!email.value || !password.value) {
      authError.value = 'Merci de saisir un email et un mot de passe.'
      return
    }

    authError.value = null
    authMessage.value = null
    isAuthLoading.value = true

    try {
      if (authMode.value === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
        })

        if (error) {
          authError.value = 'Inscription impossible.'
          return
        }

        authMessage.value =
          'Compte cree. Verifie tes emails et valide ton compte avant de te connecter.'
        authMode.value = 'login'
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        })

        if (error) {
          authError.value = 'Identifiants incorrects.'
          return
        }
      }
    } finally {
      isAuthLoading.value = false
    }
  }

  async function requestPasswordReset() {
    if (!email.value) {
      authError.value = 'Merci de saisir ton email pour recevoir un lien.'
      return
    }

    authError.value = null
    authMessage.value = null
    isAuthLoading.value = true

    try {
      const redirectTo = `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo,
      })

      if (error) {
        authError.value = "Impossible d'envoyer le lien de reinitialisation."
        return
      }

      authMessage.value =
        "Si cet email est connu, un lien de reinitialisation vient de t'etre envoye."
    } finally {
      isAuthLoading.value = false
    }
  }

  function toggleAuthMode() {
    authError.value = null
    authMessage.value = null
    password.value = ''
    authMode.value = authMode.value === 'login' ? 'signup' : 'login'
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    // On force la session locale à null pour que l'UI se mette a jour
    session.value = null

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error during signOut', error)
    }
  }

  async function loadInitialSession() {
    const { data } = await supabase.auth.getSession()
    session.value = data.session ?? null

    supabase.auth.onAuthStateChange((_event, newSession) => {
      session.value = newSession
    })
  }

  onMounted(() => {
    void loadInitialSession()
  })

  return {
    session,
    email,
    password,
    authMessage,
    authError,
    isAuthLoading,
    authMode,
    isAuthenticated,
    isLoginMode,
    submitLabel,
    submitLoadingLabel,
    switchLabel,
    submitAuth,
    requestPasswordReset,
    toggleAuthMode,
    signOut,
  }
}
