import { useState, useEffect } from 'react';

export interface EmailValidationResult {
  email: string;
  isValid: boolean | null;
  inputClassName: string;
  errorMessage: string | null;
}

export const useEmailValidation = (initialEmail: string = '') => {
  const [email, setEmail] = useState(initialEmail);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    if (email) {
      setIsValid(validateEmail(email));
    } else {
      setIsValid(null);
    }
  }, [email]);

  const inputClassName = `w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
    email && isValid === false
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : email && isValid === true
      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  }`;

  const errorMessage = email && isValid === false ? 'Please enter a valid email address' : null;

  return {
    email,
    setEmail,
    isValid,
    inputClassName,
    errorMessage,
    validateEmail: () => validateEmail(email),
  };
};