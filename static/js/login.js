// Login Page JavaScript
// This file contains all the functionality for the login page

function loginApp() {
  return {
    // UI state
    showRegister: false,
    showOTP: false,
    loading: false,
    message: '',
    messageType: 'info',
    pendingUsername: '',

    // Form data
    loginForm: {
      username: '',
      password: ''
    },
    registerForm: {
      username: '',
      email: '',
      password: '',
      confirm_password: ''
    },
    otpForm: {
      otp: ''
    },

    // Initialize the application
    init() {
      // Check for any URL parameters or messages
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get('message');
      const type = urlParams.get('type');
      
      if (message) {
        this.message = message;
        this.messageType = type || 'info';
      }
    },

    // Authentication Methods
    async login() {
      this.loading = true;
      this.message = '';

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.loginForm)
        });

        const result = await response.json();

        if (result.success) {
          this.message = 'Login successful! Redirecting...';
          this.messageType = 'success';
          
          // Redirect to dashboard after successful login
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          this.message = result.message;
          this.messageType = 'error';
        }
      } catch (error) {
        this.message = 'Login failed. Please try again.';
        this.messageType = 'error';
      }

      this.loading = false;
    },

    async register() {
      this.loading = true;
      this.message = '';

      // Validate passwords match
      if (this.registerForm.password !== this.registerForm.confirm_password) {
        this.message = 'Passwords do not match.';
        this.messageType = 'error';
        this.loading = false;
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.registerForm)
        });

        const result = await response.json();

        if (result.success) {
          this.pendingUsername = this.registerForm.username;
          this.showRegister = false;
          this.showOTP = true;
          
          // Show message to check email
          this.message = result.message || 'Account created! Please check your email for the activation code.';
          this.messageType = 'success';
        } else {
          this.message = result.message;
          this.messageType = 'error';
        }
      } catch (error) {
        this.message = 'Registration failed. Please try again.';
        this.messageType = 'error';
      }

      this.loading = false;
    },

    async verifyOTP() {
      this.loading = true;
      this.message = '';

      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: this.pendingUsername,
            otp: this.otpForm.otp
          })
        });

        const result = await response.json();

        if (result.success) {
          this.message = 'Account activated! You can now login.';
          this.messageType = 'success';
          this.showOTP = false;

          // Auto-login after successful activation
          setTimeout(() => {
            this.loginForm.username = this.pendingUsername;
            this.login();
          }, 2000);
        } else {
          this.message = result.message;
          this.messageType = 'error';
        }
      } catch (error) {
        this.message = 'Verification failed. Please try again.';
        this.messageType = 'error';
      }

      this.loading = false;
    },

    // UI Methods
    toggleRegister() {
      this.showRegister = !this.showRegister;
      this.showOTP = false;
      this.message = '';
      this.clearForms();
    },

    toggleLogin() {
      this.showRegister = false;
      this.showOTP = false;
      this.message = '';
      this.clearForms();
    },

    clearForms() {
      this.loginForm = { username: '', password: '' };
      this.registerForm = { username: '', email: '', password: '', confirm_password: '' };
      this.otpForm = { otp: '' };
    },

    // Utility Methods
    showMessage(message, type = 'info') {
      this.message = message;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
      }, 5000);
    }
  };
}
