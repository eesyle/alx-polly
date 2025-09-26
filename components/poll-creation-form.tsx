'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Plus, Calendar, Users, Eye, EyeOff, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { createPoll } from '@/lib/supabase';
import { CreatePollFormData, PollFormErrors } from '@/lib/types';

/**
 * Enhanced Poll Creation Form Component
 * 
 * A comprehensive form component for creating polls with advanced features:
 * - Real-time validation with visual feedback
 * - Security validation using SecurityValidator
 * - Dynamic option management (add/remove up to 10 options)
 * - Advanced poll settings (anonymous voting, multiple votes, expiration)
 * - Modern UI with loading states and error handling
 * - Responsive design with accessibility features
 * 
 * Features:
 * - Title validation (3-255 characters, required)
 * - Description validation (optional, max 1000 characters)
 * - Option validation (min 2, max 10, each max 500 characters)
 * - Expiration date validation (must be future date)
 * - Client-side and server-side security validation
 * - Rate limiting protection via middleware
 * 
 * Security measures:
 * - Input sanitization and validation
 * - XSS prevention through SecurityValidator
 * - CSRF protection via middleware
 * - Authentication requirement enforcement
 * 
 * @returns {JSX.Element} The poll creation form component
 * 
 * @example
 * ```tsx
 * import { PollCreationForm } from '@/components/poll-creation-form';
 * 
 * function CreatePollPage() {
 *   return (
 *     <div className="container mx-auto p-4">
 *       <PollCreationForm />
 *     </div>
 *   );
 * }
 * ```
 */
export function PollCreationForm() {
  const router = useRouter();
  
  // Form state with enhanced tracking
  const [formData, setFormData] = useState<CreatePollFormData>({
    title: '',
    description: '',
    options: ['', ''],
    expires_at: '',
    allow_multiple_votes: false,
    is_anonymous: false,
    max_votes_per_user: 1
  });

  // Enhanced validation and UI state
  const [errors, setErrors] = useState<PollFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationState, setValidationState] = useState<{[key: string]: 'valid' | 'invalid' | 'pending'}>({});
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  /**
   * Real-time Field Validation with Visual Feedback
   * 
   * Validates individual form fields in real-time as users type.
   * Provides immediate feedback to improve user experience and prevent
   * submission errors. Each field has specific validation rules based
   * on security requirements and business logic.
   * 
   * Validation Rules:
   * - title: Required, 3-255 characters, trimmed
   * - description: Optional, max 1000 characters
   * - expires_at: Must be future date if provided
   * - options: Validated separately in validateForm()
   * 
   * @param {string} field - The name of the field to validate
   * @param {any} value - The current value of the field
   * @returns {{ isValid: boolean; error?: string }} Validation result object
   * 
   * @example
   * ```typescript
   * const result = validateField('title', 'My Poll Title');
   * if (!result.isValid) {
   *   console.error(result.error); // Display error to user
   * }
   * ```
   */
  const validateField = (field: string, value: any): { isValid: boolean; error?: string } => {
    switch (field) {
      case 'title':
        if (!value.trim()) return { isValid: false, error: 'Poll title is required' };
        if (value.trim().length < 3) return { isValid: false, error: 'Title must be at least 3 characters' };
        if (value.trim().length > 255) return { isValid: false, error: 'Title must be less than 255 characters' };
        return { isValid: true };
      
      case 'description':
        if (value && value.length > 1000) return { isValid: false, error: 'Description must be less than 1000 characters' };
        return { isValid: true };
      
      case 'expires_at':
        if (value) {
          const expirationDate = new Date(value);
          const now = new Date();
          if (expirationDate <= now) return { isValid: false, error: 'Expiration date must be in the future' };
        }
        return { isValid: true };
      
      default:
        return { isValid: true };
    }
  };

  /**
   * Enhanced Form Validation with Real-time Feedback
   * 
   * Performs comprehensive validation of the entire form before submission.
   * Updates both error states and validation states for visual feedback.
   * This function is called on form submission and during real-time validation.
   * 
   * Validation Process:
   * 1. Validates title (required, length constraints)
   * 2. Validates description (optional, length constraints)
   * 3. Validates poll options (minimum 2, maximum 10, length per option)
   * 4. Validates expiration date (must be future date if provided)
   * 5. Updates visual validation states for UI feedback
   * 
   * Error Handling:
   * - Sets specific error messages for each field
   * - Updates validation state for visual indicators (valid/invalid/pending)
   * - Prevents form submission if any validation fails
   * 
   * @returns {boolean} True if all validations pass, false otherwise
   * 
   * @example
   * ```typescript
   * const isValid = validateForm();
   * if (isValid) {
   *   // Proceed with form submission
   *   await submitForm();
   * } else {
   *   // Display validation errors to user
   *   console.log('Form has validation errors');
   * }
   * ```
   */
  const validateForm = (): boolean => {
    const newErrors: PollFormErrors = {};
    const newValidationState: {[key: string]: 'valid' | 'invalid' | 'pending'} = {};

    // Validate title
    const titleValidation = validateField('title', formData.title);
    if (!titleValidation.isValid) {
      newErrors.title = titleValidation.error;
      newValidationState.title = 'invalid';
    } else {
      newValidationState.title = 'valid';
    }

    // Validate description
    const descValidation = validateField('description', formData.description);
    if (!descValidation.isValid) {
      newErrors.description = descValidation.error;
      newValidationState.description = 'invalid';
    } else {
      newValidationState.description = 'valid';
    }

    // Validate options with enhanced feedback
    const validOptions = formData.options.filter(option => option.trim().length > 0);
    if (validOptions.length < 2) {
      newErrors.options = ['Poll must have at least 2 options'];
      newValidationState.options = 'invalid';
    } else {
      const optionErrors: string[] = [];
      formData.options.forEach((option, index) => {
        if (option.trim().length > 0 && option.trim().length > 500) {
          optionErrors[index] = 'Option must be less than 500 characters';
        }
      });
      if (optionErrors.length > 0) {
        newErrors.options = optionErrors;
        newValidationState.options = 'invalid';
      } else {
        newValidationState.options = 'valid';
      }
    }

    // Validate expiration date
    const expiresValidation = validateField('expires_at', formData.expires_at);
    if (!expiresValidation.isValid) {
      newErrors.expires_at = expiresValidation.error;
      newValidationState.expires_at = 'invalid';
    } else {
      newValidationState.expires_at = 'valid';
    }

    setErrors(newErrors);
    setValidationState(newValidationState);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation on field changes
  useEffect(() => {
    if (isSubmitted) {
      validateForm();
    }
  }, [formData, isSubmitted]);

  /**
   * Handles real-time field validation with visual feedback
   */
  const handleFieldChange = (field: keyof CreatePollFormData, value: any) => {
    updateField(field, value);
    
    // Real-time validation for better UX
    if (isSubmitted) {
      const validation = validateField(field, value);
      setValidationState(prev => ({
        ...prev,
        [field]: validation.isValid ? 'valid' : 'invalid'
      }));
    }
  };

  /**
   * Handles Form Submission with Security Validation
   * 
   * Processes the poll creation form submission with comprehensive validation
   * and security measures. This function coordinates client-side validation,
   * security validation, and server-side poll creation.
   * 
   * Submission Process:
   * 1. Prevents default form submission behavior
   * 2. Triggers comprehensive form validation
   * 3. Applies security validation using SecurityValidator
   * 4. Calls createPoll API with validated data
   * 5. Handles success/error responses appropriately
   * 6. Redirects to created poll on success
   * 
   * Security Features:
   * - Client-side input validation before submission
   * - Security validation for XSS prevention
   * - Error handling for validation failures
   * - Proper error categorization and display
   * 
   * Error Handling:
   * - Field-specific error messages
   * - General error fallback
   * - Loading state management
   * - User-friendly error display
   * 
   * @param {React.FormEvent} e - The form submission event
   * @returns {Promise<void>} Promise that resolves when submission is complete
   * 
   * @example
   * Call this function when the form is submitted to create a new poll
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Import security validator
      const { SecurityValidator } = await import('@/lib/security');
      
      // Validate inputs on client side before submission
      const validatedTitle = SecurityValidator.validatePollTitle(formData.title);
      const validatedDescription = SecurityValidator.validatePollDescription(formData.description || '');
      const validatedOptions = SecurityValidator.validatePollOptions(
        formData.options.filter(opt => opt.trim() !== '')
      );
      const validatedExpiresAt = SecurityValidator.validateExpirationDate(formData.expires_at || undefined);

      // Create the poll with validated data
      const validatedFormData = {
        ...formData,
        title: validatedTitle,
        description: validatedDescription,
        options: validatedOptions,
        expires_at: validatedExpiresAt?.toISOString() || formData.expires_at,
      };

      const result = await createPoll(validatedFormData);

      if (result.success && result.data) {
        // Redirect to the created poll
        router.push('/polls/' + result.data.poll.id);
      } else {
        setErrors({ general: result.error || 'Failed to create poll' });
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      
      // Handle validation errors specifically
      if (error instanceof Error) {
        if (error.message.includes('title')) {
          setErrors({ title: error.message });
        } else if (error.message.includes('description')) {
          setErrors({ description: error.message });
        } else if (error.message.includes('option') || error.message.includes('Option')) {
          setErrors({ options: [error.message] });
        } else if (error.message.includes('expiration') || error.message.includes('date')) {
          setErrors({ expires_at: error.message });
        } else {
          setErrors({ general: error.message });
        }
      } else {
        setErrors({ general: 'Failed to create poll. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Adds a New Option Input Field
   * 
   * Dynamically adds a new empty option to the poll options array.
   * Enforces a maximum limit of 10 options to prevent UI overflow
   * and maintain reasonable poll complexity.
   * 
   * Business Rules:
   * - Maximum 10 options allowed per poll
   * - New options are added as empty strings
   * - Triggers re-validation if form has been submitted
   * 
   * @returns {void}
   * 
   * @example
   * // Called when user clicks "Add Option" button
   * addOption(); // Adds empty option if under limit
   */
  const addOption = () => {
    if (formData.options.length < 10) { // Limit to 10 options
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  /**
   * Removes an Option Input Field
   * 
   * Removes an option from the poll options array at the specified index.
   * Enforces a minimum of 2 options to ensure valid poll structure.
   * 
   * Business Rules:
   * - Minimum 2 options required per poll
   * - Removes option at specified index
   * - Triggers re-validation if form has been submitted
   * 
   * @param {number} index - The index of the option to remove
   * @returns {void}
   * 
   * @example
   * // Called when user clicks delete button on option
   * removeOption(2); // Removes option at index 2
   */
  const removeOption = (index: number) => {
    if (formData.options.length > 2) { // Keep at least 2 options
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  /**
   * Updates an Option Value
   * 
   * Updates the value of a specific option at the given index.
   * Triggers real-time validation if the form has been submitted.
   * 
   * @param {number} index - The index of the option to update
   * @param {string} value - The new value for the option
   * @returns {void}
   * 
   * @example
   * // Called when user types in option input field
   * updateOption(0, 'Option A'); // Updates first option
   */
  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  /**
   * Updates form field values
   */
  const updateField = (field: keyof CreatePollFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Enhanced Card with gradient background */}
      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/20 to-blue-400/20 rounded-full blur-2xl"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Poll
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Create an engaging poll to gather opinions and insights from your audience
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error Alert */}
            {errors.general && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* Enhanced Poll Title with validation indicators */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                Poll Title *
                {validationState.title === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {validationState.title === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  type="text"
                  placeholder="What's your question?"
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className={'transition-all duration-300 ' + (errors.title ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 focus:ring-red-200' : validationState.title === 'valid' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 focus:ring-green-200' : 'focus:ring-blue-200 hover:border-blue-300')}
                  maxLength={255}
                />
                {/* Character counter */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                  {formData.title.length}/255
                </div>
              </div>
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Enhanced Poll Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                Description (Optional)
                {validationState.description === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {validationState.description === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </Label>
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Provide additional context or details about your poll..."
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  className={'min-h-[120px] transition-all duration-300 resize-none ' + (errors.description ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 focus:ring-red-200' : validationState.description === 'valid' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 focus:ring-green-200' : 'focus:ring-blue-200 hover:border-blue-300')}
                  maxLength={1000}
                />
                {/* Character counter */}
                <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded">
                  {formData.description?.length || 0}/1000
                </div>
              </div>
              {errors.description && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.description}
                </p>
              )}
            </div>

            {/* Enhanced Poll Options with animations */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-2">
                Poll Options *
                {validationState.options === 'valid' && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                {validationState.options === 'invalid' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </Label>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div 
                    key={index} 
                    className="group flex gap-3 items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder={'Enter option ' + (index + 1) + '...'}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        className={'border-0 bg-transparent focus:ring-2 transition-all duration-200 ' + (errors.options?.[index] ? 'focus:ring-red-200 text-red-600' : 'focus:ring-blue-200')}
                        maxLength={500}
                      />
                      {errors.options?.[index] && (
                        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.options[index]}
                        </p>
                      )}
                    </div>
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              
              </div>
               
               {/* Enhanced Add Option Button */}
               {formData.options.length < 10 && (
                 <Button
                   type="button"
                   variant="outline"
                   onClick={addOption}
                   className="w-full border-dashed border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 hover:text-blue-700 transition-all duration-200"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Add Another Option
                 </Button>
               )}
               
               {errors.options && Array.isArray(errors.options) && errors.options.length === 1 && (
                 <p className="text-sm text-red-500 flex items-center gap-1">
                   <AlertCircle className="h-3 w-3" />
                   {errors.options[0]}
                 </p>
               )}
             </div>

             {/* Enhanced Poll Settings */}
             <div className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-6">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                   <Calendar className="h-5 w-5 text-white" />
                 </div>
                 <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                   Poll Settings
                 </h3>
               </div>
              
              {/* Enhanced Expiration Date */}
               <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
                 <Label htmlFor="expires_at" className="text-sm font-medium flex items-center gap-2">
                   <Calendar className="h-4 w-4 text-blue-600" />
                   Expiration Date (Optional)
                   {validationState.expires_at === 'valid' && (
                     <CheckCircle className="h-4 w-4 text-green-500" />
                   )}
                   {validationState.expires_at === 'invalid' && (
                     <AlertCircle className="h-4 w-4 text-red-500" />
                   )}
                 </Label>
                 <Input
                   id="expires_at"
                   type="datetime-local"
                   value={formData.expires_at}
                   onChange={(e) => handleFieldChange('expires_at', e.target.value)}
                   className={'transition-all duration-300 ' + (errors.expires_at ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 focus:ring-red-200' : validationState.expires_at === 'valid' ? 'border-green-500 bg-green-50/50 dark:bg-green-900/20 focus:ring-green-200' : 'focus:ring-blue-200 hover:border-blue-300')}
                 />
                 {errors.expires_at && (
                   <p className="text-sm text-red-500 flex items-center gap-1">
                     <AlertCircle className="h-3 w-3" />
                     {errors.expires_at}
                   </p>
                 )}
                 <p className="text-xs text-blue-600 dark:text-blue-400">
                   Leave empty for polls that never expire
                 </p>
               </div>

               {/* Enhanced Multiple Votes Setting */}
               <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                 <div className="space-y-1">
                   <Label className="text-sm font-medium flex items-center gap-2">
                     <Users className="h-4 w-4 text-green-600" />
                     Allow Multiple Votes
                   </Label>
                   <p className="text-xs text-green-600 dark:text-green-400">
                     Allow users to vote for multiple options
                   </p>
                 </div>
                 <Switch
                   checked={formData.allow_multiple_votes}
                   onCheckedChange={(checked) => updateField('allow_multiple_votes', checked)}
                 />
               </div>

              {/* Enhanced Max Votes Per User */}
               {formData.allow_multiple_votes && (
                 <div className="space-y-3 p-4 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200/50 dark:border-yellow-700/50 animate-in slide-in-from-top duration-300">
                   <Label htmlFor="max_votes" className="text-sm font-medium flex items-center gap-2">
                     <Users className="h-4 w-4 text-yellow-600" />
                     Max Votes Per User
                   </Label>
                   <Input
                     id="max_votes"
                     type="number"
                     min="1"
                     max="10"
                     value={formData.max_votes_per_user}
                     onChange={(e) => updateField('max_votes_per_user', parseInt(e.target.value) || 1)}
                     className={'transition-all duration-300 ' + (errors.max_votes_per_user ? 'border-red-500 bg-red-50/50 dark:bg-red-900/20 focus:ring-red-200' : 'focus:ring-yellow-200 hover:border-yellow-300')}
                   />
                   {errors.max_votes_per_user && (
                     <p className="text-sm text-red-500 flex items-center gap-1">
                       <AlertCircle className="h-3 w-3" />
                       {errors.max_votes_per_user}
                     </p>
                   )}
                 </div>
               )}

               {/* Enhanced Anonymous Voting Setting */}
               <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200/50 dark:border-purple-700/50">
                 <div className="space-y-1">
                   <Label className="text-sm font-medium flex items-center gap-2">
                     {formData.is_anonymous ? (
                       <EyeOff className="h-4 w-4 text-purple-600" />
                     ) : (
                       <Eye className="h-4 w-4 text-purple-600" />
                     )}
                     Anonymous Voting
                   </Label>
                   <p className="text-xs text-purple-600 dark:text-purple-400">
                     Hide voter identities in results
                   </p>
                 </div>
                 <Switch
                   checked={formData.is_anonymous}
                   onCheckedChange={(checked) => updateField('is_anonymous', checked)}
                 />
               </div>
             </div>

             {/* Enhanced Submit Buttons */}
             <div className="flex gap-4 pt-8">
               <Button
                 type="button"
                 variant="outline"
                 onClick={() => router.back()}
                 className="flex-1 h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                 disabled={isLoading}
               >
                 Cancel
               </Button>
               <Button
                 type="submit"
                 className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-50"
                 disabled={isLoading}
               >
                 {isLoading ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     Creating Poll...
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <Sparkles className="h-4 w-4" />
                     Create Poll
                   </div>
                 )}
               </Button>
             </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}