import { supabase } from '../integrations/supabase/client'

export interface CaptchaVerificationRequest {
  captchaToken: string
  action: string
}

export interface CaptchaVerificationResponse {
  verified: boolean
  action: string
  userId?: string
}

export interface CaptchaConfig {
  siteKey?: string
  action: string
  scoreThreshold?: number
}

class CaptchaService {
  private static instance: CaptchaService
  private readonly DEFAULT_SCORE_THRESHOLD = 0.5
  private verificationCache = new Map<string, { verified: boolean; timestamp: number }>()
  private readonly CACHE_DURATION = 300000 // 5 minutes

  private constructor() {}

  static getInstance(): CaptchaService {
    if (!CaptchaService.instance) {
      CaptchaService.instance = new CaptchaService()
    }
    return CaptchaService.instance
  }

  /**
   * Load Google reCAPTCHA script
   */
  loadRecaptchaScript(siteKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if script is already loaded
      if (window.grecaptcha) {
        resolve()
        return
      }

      // Create script element
      const script = document.createElement('script')
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`
      script.async = true
      script.defer = true

      script.onload = () => {
        // Wait for grecaptcha to be available
        const checkGrecaptcha = () => {
          if (window.grecaptcha && window.grecaptcha.ready) {
            resolve()
          } else {
            setTimeout(checkGrecaptcha, 100)
          }
        }
        checkGrecaptcha()
      }

      script.onerror = () => {
        reject(new Error('Failed to load reCAPTCHA script'))
      }

      document.head.appendChild(script)
    })
  }

  /**
   * Execute reCAPTCHA and get token
   */
  async executeRecaptcha(action: string): Promise<string> {
    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA not loaded')
    }

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha.execute(action, { action })
          .then((token: string) => {
            resolve(token)
          })
          .catch((error: any) => {
            reject(error)
          })
      })
    })
  }

  /**
   * Verify CAPTCHA token with backend
   */
  async verifyCaptcha(request: CaptchaVerificationRequest): Promise<CaptchaVerificationResponse> {
    const cacheKey = `${request.action}-${request.captchaToken.substring(0, 20)}`
    const cached = this.verificationCache.get(cacheKey)
    
    // Check cache first
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return {
        verified: cached.verified,
        action: request.action,
        userId: undefined
      }
    }

    try {
      // Call the CAPTCHA verification edge function
      const { data, error } = await supabase.functions.invoke('captcha-verify', {
        body: request
      })

      if (error) {
        console.error('CAPTCHA verification error:', error)
        throw new Error('CAPTCHA verification failed')
      }

      const response = data as CaptchaVerificationResponse
      
      // Cache the result
      this.verificationCache.set(cacheKey, {
        verified: response.verified,
        timestamp: Date.now()
      })

      return response
    } catch (error) {
      console.error('CAPTCHA service error:', error)
      throw error
    }
  }

  /**
   * Complete CAPTCHA flow: execute and verify
   */
  async completeCaptchaFlow(action: string): Promise<boolean> {
    try {
      // Execute reCAPTCHA
      const token = await this.executeRecaptcha(action)
      
      // Verify with backend
      const result = await this.verifyCaptcha({
        captchaToken: token,
        action
      })

      return result.verified
    } catch (error) {
      console.error('CAPTCHA flow error:', error)
      return false
    }
  }

  /**
   * Clear verification cache
   */
  clearCache(action?: string): void {
    if (action) {
      // Clear specific action cache
      for (const key of this.verificationCache.keys()) {
        if (key.startsWith(action)) {
          this.verificationCache.delete(key)
        }
      }
    } else {
      // Clear all cache
      this.verificationCache.clear()
    }
  }

  /**
   * Get cache status for monitoring
   */
  getCacheStatus(): { size: number; entries: Array<{ key: string; timestamp: number }> } {
    const entries = Array.from(this.verificationCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp
    }))

    return {
      size: this.verificationCache.size,
      entries
    }
  }

  /**
   * Check if CAPTCHA is required for an action
   */
  isCaptchaRequired(action: string): boolean {
    const highRiskActions = [
      'signup',
      'password_reset',
      'delete_account',
      'delete_car',
      'cancel_booking',
      'payment',
      'contact_form'
    ]

    return highRiskActions.some(riskAction => 
      action.toLowerCase().includes(riskAction)
    )
  }
}

// Export singleton instance
export const captchaService = CaptchaService.getInstance()

// Predefined CAPTCHA configurations
export const CAPTCHA_CONFIGS = {
  SIGN_UP: { action: 'signup', scoreThreshold: 0.5 },
  SIGN_IN: { action: 'signin', scoreThreshold: 0.3 },
  PASSWORD_RESET: { action: 'password_reset', scoreThreshold: 0.5 },
  DELETE_ACCOUNT: { action: 'delete_account', scoreThreshold: 0.7 },
  ADD_CAR: { action: 'add_car', scoreThreshold: 0.4 },
  DELETE_CAR: { action: 'delete_car', scoreThreshold: 0.6 },
  CREATE_BOOKING: { action: 'create_booking', scoreThreshold: 0.4 },
  CANCEL_BOOKING: { action: 'cancel_booking', scoreThreshold: 0.5 },
  PAYMENT: { action: 'payment', scoreThreshold: 0.6 },
  CONTACT_FORM: { action: 'contact_form', scoreThreshold: 0.3 }
} as const

// Helper function to get CAPTCHA config by key
export function getCaptchaConfig(key: keyof typeof CAPTCHA_CONFIGS): CaptchaConfig {
  return CAPTCHA_CONFIGS[key]
}

// Helper function to complete CAPTCHA flow with predefined config
export async function completeCaptchaFlowByKey(key: keyof typeof CAPTCHA_CONFIGS): Promise<boolean> {
  const config = getCaptchaConfig(key)
  return captchaService.completeCaptchaFlow(config.action)
}

// Type declaration for global grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
} 