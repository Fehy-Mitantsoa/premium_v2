/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Loader2, Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';

const GOOGLE_CLIENT_ID = 
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
  '112086335849-p51i3pms1srkd07rvsb3nclmnjfcj8n1.apps.googleusercontent.com';

interface GoogleAuthButtonProps {
  mode?: 'signup' | 'signin';
  text?: string;
  className?: string;
  onSuccess?: () => void;
  fullWidth?: boolean;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleAuthButton({
  mode = 'signup',
  text,
  className = '',
  onSuccess,
  fullWidth = true
}: GoogleAuthButtonProps) {
  const { loginWithGoogle, showToast } = useApp();
  const [loading, setLoading] = useState(false);
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const defaultText = text || (mode === 'signup' ? "S'inscrire avec Google" : "Se connecter avec Google");

  // Load Google Identity Services script if not already present
  useEffect(() => {
    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      setGsiLoaded(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
        setGsiLoaded(true);
        clearInterval(checkInterval);
      }
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(checkInterval);
    }, 4000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timer);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      if (response.credential) {
        await loginWithGoogle({ credential: response.credential });
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Google Sign-in Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomButtonClick = async () => {
    if (loading) return;

    // 1. Try Google Identity Services OAuth2 Token Client (Custom Popup)
    if (window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setLoading(false);
              showToast(`Erreur Google: ${tokenResponse.error_description || tokenResponse.error}`, 'error');
              return;
            }

            if (tokenResponse.access_token) {
              try {
                // Fetch profile directly
                const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                
                if (userinfoRes.ok) {
                  const profile = await userinfoRes.json();
                  await loginWithGoogle({
                    accessToken: tokenResponse.access_token,
                    email: profile.email,
                    name: profile.name,
                    avatar: profile.picture,
                    googleId: profile.sub
                  });
                  onSuccess?.();
                } else {
                  await loginWithGoogle({ accessToken: tokenResponse.access_token });
                  onSuccess?.();
                }
              } catch (err: any) {
                console.error('Google profile fetch error:', err);
                showToast('Erreur lors de la récupération du profil Google.', 'error');
              } finally {
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (err) {
        console.warn('OAuth2 client init error, falling back to OneTap or prompt:', err);
      }
    }

    // 2. Fallback to Google ID initialize & prompt
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // If One Tap cannot be displayed (e.g. in iframe or 3rd party cookies restricted)
            console.log('Google One Tap not displayed:', notification.getNotDisplayedReason());
          }
        });
      } catch (err) {
        console.error('Google Accounts ID Prompt error:', err);
      }
    }
  };

  const [showOriginHelp, setShowOriginHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  const copyOriginToClipboard = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopied(true);
    showToast('Origine JavaScript copiée dans le presse-papiers !', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <button
        type="button"
        id={`google-auth-btn-${mode}`}
        onClick={handleCustomButtonClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-all cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
        ) : (
          <svg className="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.97 1 12 1 7.35 1 3.32 3.68 1.34 7.6l3.85 2.99c.9-2.73 3.44-4.55 6.81-4.55z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.5z" />
            <path fill="#FBBC05" d="M5.19 14.59c-.24-.71-.38-1.47-.38-2.59s.14-1.88.38-2.59L1.34 6.41C.49 8.12 0 10.01 0 12s.49 3.88 1.34 5.59l3.85-3z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.51 1.18-4.3 1.18-3.37 0-5.91-1.82-6.81-4.55L1.34 16.87C3.32 20.32 7.35 23 12 23z" />
          </svg>
        )}
        <span>{loading ? 'Authentification Google...' : defaultText}</span>
      </button>

      {/* Origin helper toggle */}
      <div className="mt-1.5 flex justify-center">
        <button
          type="button"
          onClick={() => setShowOriginHelp(!showOriginHelp)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Erreur 400 (origin_mismatch) ? Configurer l'origine</span>
        </button>
      </div>

      {showOriginHelp && (
        <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs space-y-2 text-amber-900 dark:text-amber-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <span>Origine JavaScript requise par Google Cloud</span>
          </p>
          <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/80">
            Ajoutez cette URL exacte dans votre console Google Cloud sous <b>Origines JavaScript autorisées</b> :
          </p>
          
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-slate-800 font-mono text-[11px] select-all">
            <span className="truncate flex-1 text-slate-700 dark:text-slate-300">{currentOrigin}</span>
            <button
              type="button"
              onClick={copyOriginToClipboard}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"
              title="Copier l'URL d'origine"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline pt-0.5"
          >
            <span>Ouvrir Google Cloud Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Hidden container for Google GSI standard button fallback if needed */}
      <div ref={buttonContainerRef} className="hidden" />
    </div>
  );
}
