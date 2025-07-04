import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { rateLimitService } from '../../services/rateLimitService'
import { captchaService } from '../../services/captchaService'
import { useToast } from '../../hooks/use-toast'

interface SecurityContextType {
  isRateLimited: boolean
  isCaptchaRequired: boolean
  checkRateLimit: (endpoint: string) => Promise<boolean>
  verifyCaptcha: (action: string) => Promise<boolean>
  clearRateLimitCache: () => void
  clearCaptchaCache: () => void
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined)

interface SecurityMiddlewareProps {
  children: ReactNode
  recaptchaSiteKey?: string
}

export const SecurityMiddleware: React.FC<SecurityMiddlewareProps> = ({ 
  children, 
  recaptchaSiteKey = '6LcXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' // Replace with your actual site key
}) => {
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [isCaptchaRequired, setIsCaptchaRequired] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load reCAPTCHA script on component mount
    if (recaptchaSiteKey) {
      captchaService.loadRecaptchaScript(recaptchaSiteKey)
        .catch(error => {
          console.error('Failed to load reCAPTCHA:', error)
        })
    }
  }, [recaptchaSiteKey])

  const checkRateLimit = async (endpoint: string): Promise<boolean> => {
    try {
      const result = await rateLimitService.checkRateLimit({
        endpoint,
        maxRequests: 100,
        windowMinutes: 15
      })

      setIsRateLimited(!result.allowed)

      if (!result.allowed) {
        toast({
          title: "Rate Limit Exceeded",
          description: "You've made too many requests. Please wait a moment before trying again.",
          variant: "destructive"
        })
      }

      return result.allowed
    } catch (error) {
      console.error('Rate limit check error:', error)
      // Default to allowing if check fails
      return true
    }
  }

  const verifyCaptcha = async (action: string): Promise<boolean> => {
    try {
      setIsCaptchaRequired(true)
      
      const verified = await captchaService.completeCaptchaFlow(action)
      
      setIsCaptchaRequired(false)

      if (!verified) {
        toast({
          title: "CAPTCHA Verification Failed",
          description: "Please complete the CAPTCHA verification to continue.",
          variant: "destructive"
        })
      }

      return verified
    } catch (error) {
      console.error('CAPTCHA verification error:', error)
      setIsCaptchaRequired(false)
      
      toast({
        title: "CAPTCHA Error",
        description: "There was an error with CAPTCHA verification. Please try again.",
        variant: "destructive"
      })

      return false
    }
  }

  const clearRateLimitCache = () => {
    rateLimitService.clearCache()
  }

  const clearCaptchaCache = () => {
    captchaService.clearCache()
  }

  const contextValue: SecurityContextType = {
    isRateLimited,
    isCaptchaRequired,
    checkRateLimit,
    verifyCaptcha,
    clearRateLimitCache,
    clearCaptchaCache
  }

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  )
}

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext)
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityMiddleware')
  }
  return context
}

// Higher-order component for protecting components that require CAPTCHA
export const withCaptcha = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  action: string
) => {
  return React.forwardRef<any, P & { verifyCaptcha: () => Promise<boolean>; isVerifying: boolean }>((props, ref) => {
    const { verifyCaptcha } = useSecurity()
    const [isVerifying, setIsVerifying] = useState(false)

    const handleCaptchaVerification = async () => {
      setIsVerifying(true)
      const verified = await verifyCaptcha(action)
      setIsVerifying(false)
      return verified
    }

    return (
      <WrappedComponent
        {...(props as P)}
        ref={ref}
        verifyCaptcha={handleCaptchaVerification}
        isVerifying={isVerifying}
      />
    )
  })
}

// Higher-order component for protecting components that require rate limiting
export const withRateLimit = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  endpoint: string
) => {
  return React.forwardRef<any, P & { checkRateLimit: () => Promise<boolean>; isChecking: boolean }>((props, ref) => {
    const { checkRateLimit } = useSecurity()
    const [isChecking, setIsChecking] = useState(false)

    const handleRateLimitCheck = async () => {
      setIsChecking(true)
      const allowed = await checkRateLimit(endpoint)
      setIsChecking(false)
      return allowed
    }

    return (
      <WrappedComponent
        {...(props as P)}
        ref={ref}
        checkRateLimit={handleRateLimitCheck}
        isChecking={isChecking}
      />
    )
  })
}

// Hook for automatic rate limiting on component mount
export const useAutoRateLimit = (endpoint: string, enabled: boolean = true) => {
  const { checkRateLimit } = useSecurity()
  const [isAllowed, setIsAllowed] = useState(true)

  useEffect(() => {
    if (enabled) {
      checkRateLimit(endpoint).then(setIsAllowed)
    }
  }, [endpoint, enabled, checkRateLimit])

  return { isAllowed }
}

// Hook for automatic CAPTCHA verification
export const useAutoCaptcha = (action: string, enabled: boolean = true) => {
  const { verifyCaptcha } = useSecurity()
  const [isVerified, setIsVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const verify = async () => {
    if (!enabled) return true
    
    setIsVerifying(true)
    const verified = await verifyCaptcha(action)
    setIsVerified(verified)
    setIsVerifying(false)
    return verified
  }

  return { isVerified, isVerifying, verify }
} 