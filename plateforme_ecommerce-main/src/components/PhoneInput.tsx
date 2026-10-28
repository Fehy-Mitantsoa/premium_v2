import { useEffect, useRef } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
  className?: string;
}

export default function PhoneInput({ value, onChange, className = '', inputClassName = '' }: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itiRef = useRef<any>(null);

  useEffect(() => {
    if (inputRef.current && (window as any).intlTelInput) {
      itiRef.current = (window as any).intlTelInput(inputRef.current, {
        initialCountry: "auto",
        geoIpLookup: function(callback: (countryCode: string) => void) {
          fetch("https://ipapi.co/json")
            .then(res => res.json())
            .then(data => callback(data.country_code))
            .catch(() => callback("mg")); // Default to Madagascar
        },
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.0.11/build/js/utils.js",
        separateDialCode: true,
      });

      const handleChange = () => {
        if (itiRef.current) {
          onChange(itiRef.current.getNumber());
        }
      };

      inputRef.current.addEventListener('countrychange', handleChange);
      inputRef.current.addEventListener('input', handleChange);

      return () => {
        if (inputRef.current) {
          inputRef.current.removeEventListener('countrychange', handleChange);
          inputRef.current.removeEventListener('input', handleChange);
        }
        if (itiRef.current) {
          itiRef.current.destroy();
        }
      };
    }
  }, []);

  useEffect(() => {
    if (itiRef.current && value && value !== itiRef.current.getNumber()) {
      itiRef.current.setNumber(value);
    }
  }, [value]);

  return (
    <div className={`relative w-full ${className}`}>
      <input
        ref={inputRef}
        type="tel"
        required
        className={`w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors ${inputClassName}`}
        placeholder="34 74 548 71"
      />
    </div>
  );
}
