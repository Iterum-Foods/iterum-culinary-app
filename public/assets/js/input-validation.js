/**
 * Input Validation System for Iterum R&D Chef Notebook
 * Provides comprehensive input validation and sanitization
 */

class InputValidator {
    constructor() {
        this.rules = {
            email: {
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            phone: {
                pattern: /^[\+]?[1-9][\d]{0,15}$/,
                message: 'Please enter a valid phone number'
            },
            url: {
                pattern: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                message: 'Please enter a valid URL'
            },
            name: {
                pattern: /^[a-zA-Z\s\-'\.]{2,50}$/,
                message: 'Name must be 2-50 characters and contain only letters, spaces, hyphens, apostrophes, and periods'
            },
            username: {
                pattern: /^[a-zA-Z0-9_]{3,20}$/,
                message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores'
            },
            password: {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
            },
            recipeName: {
                pattern: /^[a-zA-Z0-9\s\-'\.\(\)]{3,100}$/,
                message: 'Recipe name must be 3-100 characters'
            },
            ingredientName: {
                pattern: /^[a-zA-Z\s\-'\.]{2,50}$/,
                message: 'Ingredient name must be 2-50 characters'
            },
            quantity: {
                pattern: /^\d+(\.\d{1,3})?$/,
                message: 'Quantity must be a positive number with up to 3 decimal places'
            },
            price: {
                pattern: /^\d+(\.\d{2})?$/,
                message: 'Price must be a positive number with up to 2 decimal places'
            },
            percentage: {
                pattern: /^(?:100(?:\.0{1,2})?|[0-9]{1,2}(?:\.[0-9]{1,2})?)$/,
                message: 'Percentage must be between 0 and 100'
            }
        };
    }

    /**
     * Validate input against a specific rule
     * @param {string} value - Input value
     * @param {string} ruleName - Rule name
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    validate(value, ruleName, options = {}) {
        const {
            required = true,
            minLength = 0,
            maxLength = Infinity,
            customMessage = null
        } = options;

        const result = {
            isValid: true,
            message: '',
            value: value
        };

        // Check if value is required
        if (required && (!value || value.trim() === '')) {
            result.isValid = false;
            result.message = 'This field is required';
            return result;
        }

        // Skip validation if value is empty and not required
        if (!value || value.trim() === '') {
            return result;
        }

        // Check length constraints
        if (value.length < minLength) {
            result.isValid = false;
            result.message = `Minimum length is ${minLength} characters`;
            return result;
        }

        if (value.length > maxLength) {
            result.isValid = false;
            result.message = `Maximum length is ${maxLength} characters`;
            return result;
        }

        // Check against pattern rule
        if (ruleName && this.rules[ruleName]) {
            const rule = this.rules[ruleName];
            if (!rule.pattern.test(value)) {
                result.isValid = false;
                result.message = customMessage || rule.message;
                return result;
            }
        }

        return result;
    }

    /**
     * Sanitize input value
     * @param {string} value - Input value
     * @param {Object} options - Sanitization options
     * @returns {string} - Sanitized value
     */
    sanitize(value, options = {}) {
        if (!value || typeof value !== 'string') {
            return '';
        }

        const {
            trim = true,
            removeHTML = true,
            removeScripts = true,
            maxLength = 1000,
            allowSpecialChars = true
        } = options;

        let sanitized = value;

        // Trim whitespace
        if (trim) {
            sanitized = sanitized.trim();
        }

        // Remove HTML tags
        if (removeHTML) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        }

        // Remove script content
        if (removeScripts) {
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            sanitized = sanitized.replace(/javascript:/gi, '');
            sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        }

        // Remove special characters if not allowed
        if (!allowSpecialChars) {
            sanitized = sanitized.replace(/[<>'"&]/g, '');
        }

        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    /**
     * Validate form field
     * @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} field - Form field
     * @param {string} ruleName - Validation rule
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    validateField(field, ruleName, options = {}) {
        const value = field.value;
        const result = this.validate(value, ruleName, options);
        
        // Update field appearance
        this.updateFieldAppearance(field, result);
        
        return result;
    }

    /**
     * Update field appearance based on validation result
     * @param {HTMLElement} field - Form field
     * @param {Object} result - Validation result
     */
    updateFieldAppearance(field, result) {
        const fieldContainer = field.closest('.form-group, .input-group');
        
        // Remove existing validation classes
        field.classList.remove('is-valid', 'is-invalid');
        if (fieldContainer) {
            fieldContainer.classList.remove('has-error', 'has-success');
        }

        // Remove existing error message
        const existingError = fieldContainer?.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (result.isValid) {
            field.classList.add('is-valid');
            if (fieldContainer) {
                fieldContainer.classList.add('has-success');
            }
        } else {
            field.classList.add('is-invalid');
            if (fieldContainer) {
                fieldContainer.classList.add('has-error');
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message text-red-500 text-sm mt-1';
                errorDiv.textContent = result.message;
                fieldContainer.appendChild(errorDiv);
            }
        }
    }

    /**
     * Validate entire form
     * @param {HTMLFormElement} form - Form element
     * @param {Object} rules - Validation rules for each field
     * @returns {Object} - Validation result
     */
    validateForm(form, rules) {
        const result = {
            isValid: true,
            errors: {},
            values: {}
        };

        Object.entries(rules).forEach(([fieldName, ruleConfig]) => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                const fieldResult = this.validateField(field, ruleConfig.rule, ruleConfig.options);
                result.values[fieldName] = fieldResult.value;
                
                if (!fieldResult.isValid) {
                    result.isValid = false;
                    result.errors[fieldName] = fieldResult.message;
                }
            }
        });

        return result;
    }

    /**
     * Add real-time validation to form field
     * @param {HTMLInputElement|HTMLTextAreaElement} field - Form field
     * @param {string} ruleName - Validation rule
     * @param {Object} options - Validation options
     */
    addRealTimeValidation(field, ruleName, options = {}) {
        let timeout;
        
        const validateField = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.validateField(field, ruleName, options);
            }, 300);
        };

        // Add event listeners
        field.addEventListener('input', validateField);
        field.addEventListener('blur', validateField);
        field.addEventListener('change', validateField);
    }

    /**
     * Validate file upload
     * @param {File} file - File object
     * @param {Object} options - Validation options
     * @returns {Object} - Validation result
     */
    validateFile(file, options = {}) {
        const {
            maxSize = 10 * 1024 * 1024, // 10MB default
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
        } = options;

        const result = {
            isValid: true,
            message: '',
            file: file
        };

        // Check file size
        if (file.size > maxSize) {
            result.isValid = false;
            result.message = `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
            return result;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            result.isValid = false;
            result.message = `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
            return result;
        }

        // Check file extension
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            result.isValid = false;
            result.message = `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`;
            return result;
        }

        return result;
    }

    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @returns {Object} - Validation result
     */
    validateURL(url) {
        const result = {
            isValid: true,
            message: '',
            url: url
        };

        try {
            const urlObj = new URL(url);
            
            // Check protocol
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                result.isValid = false;
                result.message = 'URL must use HTTP or HTTPS protocol';
                return result;
            }
            
            // Check for dangerous patterns
            if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:')) {
                result.isValid = false;
                result.message = 'URL contains potentially dangerous content';
                return result;
            }
            
        } catch (error) {
            result.isValid = false;
            result.message = 'Invalid URL format';
            return result;
        }

        return result;
    }

    /**
     * Validate JSON data
     * @param {string} jsonString - JSON string to validate
     * @returns {Object} - Validation result
     */
    validateJSON(jsonString) {
        const result = {
            isValid: true,
            message: '',
            data: null
        };

        try {
            result.data = JSON.parse(jsonString);
        } catch (error) {
            result.isValid = false;
            result.message = 'Invalid JSON format';
            return result;
        }

        return result;
    }

    /**
     * Create validation rules for common form types
     * @param {string} formType - Type of form
     * @returns {Object} - Validation rules
     */
    getFormRules(formType) {
        const formRules = {
            userRegistration: {
                name: { rule: 'name', options: { required: true, minLength: 2, maxLength: 50 } },
                email: { rule: 'email', options: { required: true } },
                username: { rule: 'username', options: { required: true } },
                password: { rule: 'password', options: { required: true } }
            },
            recipeForm: {
                name: { rule: 'recipeName', options: { required: true, minLength: 3, maxLength: 100 } },
                description: { rule: null, options: { required: false, maxLength: 500 } },
                servings: { rule: 'quantity', options: { required: true, minLength: 1, maxLength: 10 } },
                prepTime: { rule: 'quantity', options: { required: false, maxLength: 10 } },
                cookTime: { rule: 'quantity', options: { required: false, maxLength: 10 } }
            },
            ingredientForm: {
                name: { rule: 'ingredientName', options: { required: true, minLength: 2, maxLength: 50 } },
                quantity: { rule: 'quantity', options: { required: true } },
                unit: { rule: null, options: { required: true, maxLength: 20 } }
            },
            vendorForm: {
                name: { rule: 'name', options: { required: true, minLength: 2, maxLength: 100 } },
                email: { rule: 'email', options: { required: false } },
                phone: { rule: 'phone', options: { required: false } },
                website: { rule: 'url', options: { required: false } }
            }
        };

        return formRules[formType] || {};
    }
}

// Initialize input validator
window.inputValidator = new InputValidator();

console.log('🔒 Input Validator initialized');
