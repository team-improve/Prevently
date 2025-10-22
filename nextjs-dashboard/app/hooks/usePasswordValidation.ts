import { useState, useEffect } from 'react';

export interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export interface PasswordValidationResult {
  password: string;
  validation: PasswordValidation;
  isValid: boolean;
  inputClassName: string;
  requirements: Array<{
    text: string;
    met: boolean;
  }>;
}

export const usePasswordValidation = (initialPassword: string = '') => {
  const [password, setPassword] = useState(initialPassword);
  const [validation, setValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const validatePassword = (password: string): PasswordValidation => {
    return {
      length: password.length >= 6 && password.length <= 4096,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[\^\$\*\.\[\]\{\}\(\)\?\-"!@#%&/\\,><':;|_~]/.test(password),
    };
  };

  useEffect(() => {
    if (password) {
      setValidation(validatePassword(password));
    } else {
      setValidation({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      });
    }
  }, [password]);

  const isValid = Object.values(validation).every(Boolean);

  const inputClassName = `w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
    password && !isValid
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : password && isValid
      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
  }`;

  const requirements = [
    { text: '6-4096 characters', met: validation.length },
    { text: 'One uppercase letter', met: validation.uppercase },
    { text: 'One lowercase letter', met: validation.lowercase },
    { text: 'One number', met: validation.number },
    { text: 'One special character', met: validation.special },
  ];

  return {
    password,
    setPassword,
    validation,
    isValid,
    inputClassName,
    requirements,
  };
};