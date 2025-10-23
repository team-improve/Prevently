import { authApi, authStorage } from './auth-api';

declare global {
  interface Window {
    google: any;
  }
}

export class GoogleAuth {
  private static instance: GoogleAuth;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GoogleAuth {
    if (!GoogleAuth.instance) {
      GoogleAuth.instance = new GoogleAuth();
    }
    return GoogleAuth.instance;
  }

  async initialize(clientId: string): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => this.initGoogleAuth(clientId, resolve, reject);
        script.onerror = reject;
        document.head.appendChild(script);
      } else {
        this.initGoogleAuth(clientId, resolve, reject);
      }
    });
  }

  private initGoogleAuth(clientId: string, resolve: () => void, reject: (error: any) => void): void {
    try {
      const checkGoogle = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: this.handleCredentialResponse.bind(this),
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          this.isInitialized = true;
          resolve();
        } else {
          setTimeout(checkGoogle, 100);
        }
      };

      checkGoogle();
    } catch (error) {
      reject(error);
    }
  }

  private async handleCredentialResponse(response: any): Promise<void> {
    try {
      if (response.credential) {
        const authResponse = await authApi.googleAuth(response.credential);

        if (authResponse.idToken) {
          authStorage.setToken(authResponse.idToken);
        }

        window.dispatchEvent(new CustomEvent('google-auth-success', {
          detail: {
            idToken: authResponse.idToken,
            refreshToken: authResponse.refreshToken,
            user: authResponse
          }
        }));
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('google-auth-error', {
        detail: { error }
      }));
    }
  }

  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Google Auth not initialized. Call initialize() first.');
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      throw new Error('Google Identity Services not loaded');
    }

    return new Promise((resolve) => {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          window.google.accounts.id.renderButton(
            document.createElement('div'),
            { theme: 'outline', size: 'large' }
          );
        }
        resolve();
      });
    });
  }

  renderButton(elementId: string, options: any = {}): void {
    if (!this.isInitialized) {
      throw new Error('Google Auth not initialized. Call initialize() first.');
    }

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      type: 'standard',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      ...options
    };

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      defaultOptions
    );
  }
}

export const googleAuth = GoogleAuth.getInstance();