import { useState, useEffect } from 'react';

export interface UsernameValidationResult {
  username: string;
  isValid: boolean | null;
  inputClassName: string;
  errorMessage: string | null;
}

export const useUsernameValidation = (initialUsername: string = '') => {
  const [username, setUsername] = useState(initialUsername);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  useEffect(() => {
    if (username) {
      setIsValid(validateUsername(username));
    } else {
      setIsValid(null);
    }
  }, [username]);

  const inputClassName = `w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-white/50 backdrop-blur-sm ${
    username && isValid === false
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : username && isValid === true
      ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
      : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
  }`;

  const errorMessage = username && isValid === false ? 'Username must be 3-20 characters, letters, numbers, and underscores only' : null;

  return {
    username,
    setUsername,
    isValid,
    inputClassName,
    errorMessage,
    validateUsername: () => validateUsername(username),
  };
};