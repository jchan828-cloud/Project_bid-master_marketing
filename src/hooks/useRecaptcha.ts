import { useState, useEffect, useCallback } from 'react';

const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js';

export function useRecaptcha(siteKey?: string) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!siteKey) return;

    // Check if script is already loaded
    if (document.querySelector(`script[src="${RECAPTCHA_SCRIPT_URL}?render=${siteKey}"]`)) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `${RECAPTCHA_SCRIPT_URL}?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    return () => {
      // Optional: Cleanup if needed
    };
  }, [siteKey]);

  const executeRecaptcha = useCallback(async (action: string) => {
    if (!siteKey || !isLoaded || !(window as any).grecaptcha) {
      console.warn('Recaptcha not loaded or configured');
      return null;
    }

    try {
      return await (window as any).grecaptcha.execute(siteKey, { action });
    } catch (error) {
      console.error('Recaptcha execution failed:', error);
      return null;
    }
  }, [siteKey, isLoaded]);

  return { executeRecaptcha, isLoaded };
}
