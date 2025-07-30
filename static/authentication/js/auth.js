// Authentication JavaScript Module
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupPasswordToggles();
        this.setupProfilePicture();
        
        // Add smooth loading animation
        document.body.classList.add('fade-in');
    }

    // Form Validation
    setupFormValidation() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            this.setupLoginValidation(loginForm);
        }

        if (registerForm) {
            this.setupRegisterValidation(registerForm);
        }
    }

    setupLoginValidation(form) {
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const submitBtn = document.getElementById('loginButton');

        // Real-time validation
        username.addEventListener('input', () => this.validateUsername(username));
        password.addEventListener('input', () => this.validatePassword(password, 'login'));

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLoginSubmit(form, submitBtn);
        });
    }

    setupRegisterValidation(form) {
        const email = document.getElementById('email');
        const username = document.getElementById('regUsername');
        const mobile = document.getElementById('mobile');
        const password = document.getElementById('regPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        const agreeTerms = document.getElementById('agreeTerms');
        const submitBtn = document.getElementById('registerButton');

        // Real-time validation
        email.addEventListener('input', () => this.validateEmail(email));
        username.addEventListener('input', () => this.validateUsername(username, 'reg'));
        mobile.addEventListener('input', () => this.validateMobile(mobile));
        password.addEventListener('input', () => {
            this.validatePassword(password, 'reg');
            this.updatePasswordStrength(password);
            if (confirmPassword.value) {
                this.validateConfirmPassword(password, confirmPassword);
            }
        });
        confirmPassword.addEventListener('input', () => {
            this.validateConfirmPassword(password, confirmPassword);
        });
        agreeTerms.addEventListener('change', () => this.validateTerms(agreeTerms));
    }

    // Individual Validation Functions
    validateUsername(input, type = '') {
        const value = input.value.trim();
        const errorElement = document.getElementById(type + 'usernameError') || document.getElementById('usernameError');
        const validationIcon = document.getElementById(type + 'usernameValidation');

        if (!value) {
            this.showError(input, errorElement, 'Username is required', validationIcon);
            return false;
        }

        if (type === 'reg' && (value.length < 3 || value.length > 20)) {
            this.showError(input, errorElement, 'Username must be 3-20 characters', validationIcon);
            return false;
        }

        if (type === 'reg' && !/^[a-zA-Z0-9_]+$/.test(value)) {
            this.showError(input, errorElement, 'Username can only contain letters, numbers, and underscores', validationIcon);
            return false;
        }

        this.showSuccess(input, errorElement, validationIcon);
        return true;
    }

    validateEmail(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById('emailError');
        const validationIcon = document.getElementById('emailValidation');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!value) {
            this.showError(input, errorElement, 'Email is required', validationIcon);
            return false;
        }

        if (!emailRegex.test(value)) {
            this.showError(input, errorElement, 'Please enter a valid email address', validationIcon);
            return false;
        }

        this.showSuccess(input, errorElement, validationIcon);
        return true;
    }

    validateMobile(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById('mobileError');
        const validationIcon = document.getElementById('mobileValidation');
        const mobileRegex = /^[0-9]{10}$/;

        if (!value) {
            this.showError(input, errorElement, 'Mobile number is required', validationIcon);
            return false;
        }

        if (!mobileRegex.test(value)) {
            this.showError(input, errorElement, 'Please enter a valid 10-digit mobile number', validationIcon);
            return false;
        }

        this.showSuccess(input, errorElement, validationIcon);
        return true;
    }

    validatePassword(input, type = '') {
        const value = input.value;
        const errorElement = document.getElementById(type + 'PasswordError') || document.getElementById('passwordError');
        const validationIcon = document.getElementById(type === 'reg' ? 'passwordValidation' : null);

        if (!value) {
            this.showError(input, errorElement, 'Password is required', validationIcon);
            return false;
        }

        if (type === 'reg') {
            if (value.length < 8) {
                this.showError(input, errorElement, 'Password must be at least 8 characters', validationIcon);
                return false;
            }

            const hasUpper = /[A-Z]/.test(value);
            const hasLower = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

            if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
                this.showError(input, errorElement, 'Password must contain uppercase, lowercase, number, and special character', validationIcon);
                return false;
            }
        }

        this.showSuccess(input, errorElement, validationIcon);
        return true;
    }

    validateConfirmPassword(passwordInput, confirmInput) {
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;
        const errorElement = document.getElementById('confirmPasswordError');
        const validationIcon = document.getElementById('confirmPasswordValidation');

        if (!confirmPassword) {
            this.showError(confirmInput, errorElement, 'Please confirm your password', validationIcon);
            return false;
        }

        if (password !== confirmPassword) {
            this.showError(confirmInput, errorElement, 'Passwords do not match', validationIcon);
            return false;
        }

        this.showSuccess(confirmInput, errorElement, validationIcon);
        return true;
    }

    validateTerms(input) {
        const errorElement = document.getElementById('termsError');

        if (!input.checked) {
            this.showError(input, errorElement, 'You must agree to the terms and conditions');
            return false;
        }

        this.hideError(errorElement);
        return true;
    }

    // Password Strength Indicator
    updatePasswordStrength(input) {
        const password = input.value;
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');

        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let strengthLevel = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        strengthBar.className = 'strength-fill';

        if (strength === 0) {
            strengthLevel = 'Very Weak';
        } else if (strength <= 2) {
            strengthLevel = 'Weak';
            strengthBar.classList.add('weak');
        } else if (strength === 3) {
            strengthLevel = 'Fair';
            strengthBar.classList.add('fair');
        } else if (strength === 4) {
            strengthLevel = 'Good';
            strengthBar.classList.add('good');
        } else {
            strengthLevel = 'Strong';
            strengthBar.classList.add('strong');
        }

        strengthText.textContent = `Password strength: ${strengthLevel}`;
    }

    // Error and Success Display
    showError(input, errorElement, message, validationIcon = null) {
        input.classList.add('error');
        input.classList.remove('success');
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }

        if (validationIcon) {
            validationIcon.className = 'validation-icon error';
        }
    }

    showSuccess(input, errorElement, validationIcon = null) {
        input.classList.remove('error');
        input.classList.add('success');
        
        if (errorElement) {
            errorElement.classList.remove('show');
        }

        if (validationIcon) {
            validationIcon.className = 'validation-icon success';
        }
    }

    hideError(errorElement) {
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Password Toggle
    setupPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const input = toggle.parentElement.querySelector('input');
                const icon = toggle.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }

    // Profile Picture Upload
    setupProfilePicture() {
        const picInput = document.getElementById('profilePic');
        const picPreview = document.getElementById('picPreview');
        const uploadBtn = document.getElementById('picUploadBtn');
        const removeBtn = document.getElementById('picRemoveBtn');

        if (!picInput || !picPreview || !uploadBtn) return;

        uploadBtn.addEventListener('click', () => {
            picInput.click();
        });

        picInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleProfilePicture(file, picPreview, removeBtn);
            }
        });

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeProfilePicture(picInput, picPreview, removeBtn);
            });
        }
    }

    handleProfilePicture(file, preview, removeBtn) {
        const errorElement = document.getElementById('profilePicError');
        
        // Validate file
        if (!this.validateProfilePicture(file, errorElement)) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Safely create image element to prevent XSS
            preview.innerHTML = ''; // Clear existing content
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Profile Preview';
            preview.appendChild(img);
            preview.classList.add('has-image');
            if (removeBtn) {
                removeBtn.style.display = 'flex';
            }
        };
        reader.readAsDataURL(file);
    }

    validateProfilePicture(file, errorElement) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (file.size > maxSize) {
            this.showError(null, errorElement, 'Image size must be less than 5MB');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showError(null, errorElement, 'Only JPEG, PNG, GIF, and WebP images are allowed');
            return false;
        }

        this.hideError(errorElement);
        return true;
    }

    removeProfilePicture(input, preview, removeBtn) {
        input.value = '';
        preview.innerHTML = '<i class="fas fa-user"></i>';
        preview.classList.remove('has-image');
        if (removeBtn) {
            removeBtn.style.display = 'none';
        }
    }

    // Form Submission
    handleLoginSubmit(form, submitBtn) {
        const username = document.getElementById('username');
        const password = document.getElementById('password');
        const generalError = document.getElementById('generalError');

        // Validate all fields
        const isValidUsername = this.validateUsername(username);
        const isValidPassword = this.validatePassword(password, 'login');

        if (!isValidUsername || !isValidPassword) {
            this.showGeneralError('Please fix the errors above', generalError);
            return;
        }

        // Show loading state
        this.setLoadingState(submitBtn, true);
        this.hideGeneralError(generalError);

        // Submit the form normally (let Django handle it)
        form.submit();
    }

    handleRegisterSubmit(form, submitBtn) {
        const email = document.getElementById('email');
        const username = document.getElementById('regUsername');
        const mobile = document.getElementById('mobile');
        const password = document.getElementById('regPassword');
        const confirmPassword = document.getElementById('confirmPassword');
        const agreeTerms = document.getElementById('agreeTerms');
        const generalError = document.getElementById('generalError');

        // Validate all fields
        const isValidEmail = this.validateEmail(email);
        const isValidUsername = this.validateUsername(username, 'reg');
        const isValidMobile = this.validateMobile(mobile);
        const isValidPassword = this.validatePassword(password, 'reg');
        const isValidConfirmPassword = this.validateConfirmPassword(password, confirmPassword);
        const isValidTerms = this.validateTerms(agreeTerms);

        if (!isValidEmail || !isValidUsername || !isValidMobile || 
            !isValidPassword || !isValidConfirmPassword || !isValidTerms) {
            this.showGeneralError('Please fix the errors above', generalError);
            return;
        }

        // Show loading state
        this.setLoadingState(submitBtn, true);
        this.hideGeneralError(generalError);

        return;
    }

    setLoadingState(button, isLoading) {
        const buttonText = button.querySelector('.button-text');
        const buttonLoading = button.querySelector('.button-loading');

        if (isLoading) {
            button.disabled = true;
            buttonText.style.opacity = '0';
            buttonLoading.style.display = 'block';
        } else {
            button.disabled = false;
            buttonText.style.opacity = '1';
            buttonLoading.style.display = 'none';
        }
    }

    showGeneralError(message, errorElement) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            errorElement.classList.add('shake');
            setTimeout(() => {
                errorElement.classList.remove('shake');
            }, 500);
        }
    }

    hideGeneralError(errorElement) {
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});