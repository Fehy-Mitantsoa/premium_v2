/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw, ShieldCheck, KeyRound } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [isEditingEmail, setIsEditingEmail] = useState(!emailParam);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { verifyEmail, resendVerificationCode } = useApp();
  const navigate = useNavigate();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update email if query parameter changes
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
      setIsEditingEmail(false);
    }
  }, [emailParam]);

  // Focus the first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown timer interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleInputChange = (index: number, value: string) => {
    // Handle paste of whole code
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      if (pastedDigits.length > 0) {
        const newCode = [...code];
        pastedDigits.forEach((d, i) => {
          if (index + i < 6) newCode[index + i] = d;
        });
        setCode(newCode);
        const nextFocus = Math.min(index + pastedDigits.length, 5);
        inputRefs.current[nextFocus]?.focus();
        
        // Auto submit if all 6 digits are filled
        if (newCode.every((digit) => digit !== '')) {
          handleSubmitCode(newCode.join(''));
        }
        return;
      }
    }

    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = cleanChar;
    setCode(newCode);
    setErrorMessage('');

    // Advance focus to next input
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when complete
    if (cleanChar && index === 5 && newCode.every((digit) => digit !== '')) {
      handleSubmitCode(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitCode = async (fullCodeToSubmit?: string) => {
    const codeString = fullCodeToSubmit || code.join('');
    if (!email || !email.includes('@')) {
      setErrorMessage('Veuillez renseigner une adresse email valide.');
      setIsEditingEmail(true);
      return;
    }

    if (codeString.length !== 6) {
      setErrorMessage('Veuillez saisir le code complet à 6 chiffres.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await verifyEmail(email, codeString);
      setSuccessMessage('Compte validé avec succès ! Redirection en cours...');
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Code incorrect ou expiré.';
      setErrorMessage(msg);
      // Clear inputs for retry
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || isResending) return;

    try {
      setIsResending(true);
      setErrorMessage('');
      const msg = await resendVerificationCode(email);
      setSuccessMessage(msg || 'Nouveau code envoyé par email.');
      setCooldown(60); // 60s cooldown
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Impossible de renvoyer le code actuellement.';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
        
        {/* Header Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-950/20">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Vérifiez votre adresse email
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Un code de confirmation à 6 chiffres a été envoyé pour sécuriser votre compte.
          </p>
        </div>

        {/* Target Email Display / Edit */}
        <div className="bg-slate-100/80 dark:bg-slate-800/80 rounded-xl p-3.5 mb-6 text-center border border-slate-200/60 dark:border-slate-700/60">
          {!isEditingEmail ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden text-left">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {email || 'Adresse non spécifiée'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline flex-shrink-0"
              >
                Modifier
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 text-left font-medium">
                Adresse email associée :
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(false)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-start gap-3 text-emerald-700 dark:text-emerald-300 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* 6-Digit OTP Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmitCode(); }}>
          <div className="flex justify-center items-center gap-2 sm:gap-3 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                disabled={isSubmitting}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || code.some((d) => d === '')}
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Vérification en cours...
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5" />
                Confirmer mon inscription
              </>
            )}
          </button>
        </form>

        {/* Resend Code Action with Cooldown */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Vous n'avez pas reçu le code ? Vérifiez également votre dossier courrier indésirable (spam).
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline disabled:text-slate-400 dark:disabled:text-slate-600 disabled:no-underline cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Envoi en cours...
              </>
            ) : cooldown > 0 ? (
              <>
                <RefreshCw className="w-4 h-4" />
                Renvoyer le code ({cooldown}s)
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Renvoyer un nouveau code
              </>
            )}
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la page d'inscription
          </Link>
        </div>

      </div>
    </div>
  );
}
