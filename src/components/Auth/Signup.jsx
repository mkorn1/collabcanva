// Signup component for user registration
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';

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
    
    // Display name validation
    if (!formData.displayName) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      await signUp(formData.email, formData.password, formData.displayName);
      
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
  const isFormValid = formData.email && formData.password && formData.confirmPassword && formData.displayName && !Object.keys(validationErrors).length;

  return (
    <div className="flex justify-center items-center min-h-screen p-8 bg-gradient-to-br from-primary-500 to-purple-600">
      <div className="bg-white rounded-xl p-10 shadow-auth-card w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h2 className="text-gray-700 text-3xl font-semibold mb-2 m-0">Create Account</h2>
          <p className="text-gray-500 text-base m-0">Join CollabCanvas to start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Display Name Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="displayName" className="text-sm font-medium text-gray-700 m-0">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`px-4 py-3 border-2 rounded-lg text-base transition-all duration-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-50 ${validationErrors.displayName ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Enter your display name"
              disabled={loading || isSubmitting}
              autoComplete="name"
            />
            {validationErrors.displayName && (
              <span className="text-red-500 text-sm mt-1">{validationErrors.displayName}</span>
            )}
          </div>

          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 m-0">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`px-4 py-3 border-2 rounded-lg text-base transition-all duration-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-50 ${validationErrors.email ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Enter your email"
              disabled={loading || isSubmitting}
              autoComplete="email"
            />
            {validationErrors.email && (
              <span className="text-red-500 text-sm mt-1">{validationErrors.email}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 m-0">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`px-4 py-3 border-2 rounded-lg text-base transition-all duration-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-50 ${validationErrors.password ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Create a password"
              disabled={loading || isSubmitting}
              autoComplete="new-password"
            />
            {validationErrors.password && (
              <span className="text-red-500 text-sm mt-1">{validationErrors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 m-0">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`px-4 py-3 border-2 rounded-lg text-base transition-all duration-200 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:shadow-[0_0_0_3px_rgba(102,126,234,0.1)] disabled:bg-gray-50 ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Confirm your password"
              disabled={loading || isSubmitting}
              autoComplete="new-password"
            />
            {validationErrors.confirmPassword && (
              <span className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</span>
            )}
          </div>

          {/* Global Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-700">
              <span className="text-lg">⚠️</span>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className={`w-full py-3 px-4 rounded-lg font-medium text-base transition-all duration-200 flex items-center justify-center gap-2 ${
              !isFormValid || loading || isSubmitting 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-primary-500 text-white hover:bg-primary-600 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0'
            }`}
            disabled={!isFormValid || loading || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Toggle to Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-primary-500 hover:text-primary-600 font-medium underline-offset-2 hover:underline transition-colors duration-200 bg-transparent border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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