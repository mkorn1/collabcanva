// Signup component for user registration
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import './Auth.css';

export default function Signup({ onToggleMode, onSuccess }) {
  const { signUp, loading, error, clearError } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  
  // Form validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear auth error when user modifies form
    if (error) {
      clearError();
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Display name validation (optional but if provided, must be valid)
    if (formData.displayName && formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters long';
    }
    
    return errors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    setValidationErrors({});
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await signUp(
        formData.email, 
        formData.password, 
        formData.displayName || null
      );
      
      console.log('✅ Signup successful!');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('❌ Signup failed:', error.message);
      // Error is handled by useAuth hook and displayed via error state
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid = formData.email && formData.password && 
                     formData.confirmPassword && !Object.keys(validationErrors).length;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join CollabCanvas and start collaborating!</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${validationErrors.email ? 'error' : ''}`}
              placeholder="Enter your email"
              disabled={loading || isSubmitting}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="error-message">{validationErrors.email}</span>
            )}
          </div>

          {/* Display Name Field (Optional) */}
          <div className="form-group">
            <label htmlFor="displayName" className="form-label">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`form-input ${validationErrors.displayName ? 'error' : ''}`}
              placeholder="Enter display name (optional)"
              disabled={loading || isSubmitting}
              autoComplete="name"
            />
            {validationErrors.displayName && (
              <span className="error-message">{validationErrors.displayName}</span>
            )}
            <small className="form-hint">
              If not provided, we'll generate one for you
            </small>
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`form-input ${validationErrors.password ? 'error' : ''}`}
              placeholder="Enter password (min 6 characters)"
              disabled={loading || isSubmitting}
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${validationErrors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm your password"
              disabled={loading || isSubmitting}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <span className="error-message">{validationErrors.confirmPassword}</span>
            )}
          </div>

          {/* Global Error Display */}
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`auth-button primary ${!isFormValid || loading || isSubmitting ? 'disabled' : ''}`}
            disabled={!isFormValid || loading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Toggle to Login */}
        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="auth-link"
              disabled={loading || isSubmitting}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
