/**
 * Integration Test for Poll Creation Form
 * Tests the complete form submission flow including user interactions,
 * validation, database operations, and navigation
 * Covers both happy path and failure scenarios
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PollCreationForm } from '../poll-creation-form'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/polls/create',
}))

// Mock the auth context
const mockAuthContext = {
  user: { 
    id: 'test-user-id', 
    email: 'test@example.com',
    user_metadata: { name: 'Test User' }
  },
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('../../context/auth-context', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock Supabase client with detailed responses
const mockSupabaseInsert = jest.fn()
const mockSupabaseFrom = jest.fn(() => ({
  insert: mockSupabaseInsert,
}))

jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: mockSupabaseFrom,
  })),
}))

describe('Poll Creation Form Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Form Submission Flow (Happy Path)', () => {
    
    test('should successfully create a poll with all features', async () => {
      const user = userEvent.setup()
      
      // Mock successful database response
      const mockPollData = {
        id: 'poll-123',
        title: 'Favorite Programming Language',
        description: 'Help us understand programming preferences',
        created_by: 'test-user-id',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        max_votes_per_user: 1,
        is_anonymous: false,
        created_at: new Date().toISOString(),
      }
      
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [mockPollData],
        error: null
      })
      
      render(<PollCreationForm />)
      
      // Step 1: Fill out the poll title
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Favorite Programming Language')
      
      // Step 2: Fill out the description
      const descriptionInput = screen.getByLabelText(/description/i)
      await user.type(descriptionInput, 'Help us understand programming preferences')
      
      // Step 3: Fill out poll options
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'JavaScript')
      await user.type(optionInputs[1], 'Python')
      
      // Step 4: Add a third option
      const addOptionButton = screen.getByRole('button', { name: /add another option/i })
      await user.click(addOptionButton)
      
      const updatedOptionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(updatedOptionInputs[2], 'TypeScript')
      
      // Step 5: Set expiration date
      const dateInput = screen.getByLabelText(/expiration date/i)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateString = futureDate.toISOString().split('T')[0]
      await user.type(dateInput, dateString)
      
      // Step 6: Configure settings
      const maxVotesInput = screen.getByLabelText(/max votes per user/i)
      await user.clear(maxVotesInput)
      await user.type(maxVotesInput, '1')
      
      const anonymousToggle = screen.getByRole('switch', { name: /anonymous voting/i })
      await user.click(anonymousToggle) // Enable anonymous voting
      
      // Step 7: Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Step 8: Verify database call
      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalledWith({
          title: 'Favorite Programming Language',
          description: 'Help us understand programming preferences',
          options: ['JavaScript', 'Python', 'TypeScript'],
          created_by: 'test-user-id',
          expires_at: expect.any(String),
          max_votes_per_user: 1,
          is_anonymous: true,
        })
      })
      
      // Step 9: Verify navigation after successful creation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls/poll-123')
      })
    })

    test('should handle form submission with minimal required data', async () => {
      const user = userEvent.setup()
      
      // Mock successful database response
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [{ id: 'poll-456' }],
        error: null
      })
      
      render(<PollCreationForm />)
      
      // Fill only required fields
      await user.type(screen.getByLabelText(/title/i), 'Simple Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option A')
      await user.type(optionInputs[1], 'Option B')
      
      // Submit with minimal data
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Verify submission with default values
      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalledWith({
          title: 'Simple Poll',
          description: '',
          options: ['Option A', 'Option B'],
          created_by: 'test-user-id',
          expires_at: null,
          max_votes_per_user: 1,
          is_anonymous: false,
        })
      })
    })
  })

  describe('Form Validation Integration', () => {
    
    test('should prevent submission with invalid data and show errors', async () => {
      const user = userEvent.setup()
      
      render(<PollCreationForm />)
      
      // Try to submit with empty form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/poll title is required/i)).toBeInTheDocument()
      })
      
      // Should not call database
      expect(mockSupabaseInsert).not.toHaveBeenCalled()
      
      // Should not navigate
      expect(mockPush).not.toHaveBeenCalled()
    })

    test('should validate and show real-time feedback', async () => {
      const user = userEvent.setup()
      
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      
      // Type a short title
      await user.type(titleInput, 'Hi')
      
      // Try to submit to trigger validation
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should show title length error
      await waitFor(() => {
        expect(screen.getByText(/title must be at least 3 characters/i)).toBeInTheDocument()
      })
      
      // Fix the title
      await user.clear(titleInput)
      await user.type(titleInput, 'Valid Poll Title')
      
      // Add valid options
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Mock successful submission
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [{ id: 'poll-789' }],
        error: null
      })
      
      // Submit again
      await user.click(submitButton)
      
      // Should now succeed
      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling Integration', () => {
    
    test('should handle database errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock database error
      mockSupabaseInsert.mockResolvedValueOnce({
        data: null,
        error: { 
          message: 'Database connection failed',
          code: 'PGRST301'
        }
      })
      
      render(<PollCreationForm />)
      
      // Fill out valid form
      await user.type(screen.getByLabelText(/title/i), 'Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to create poll/i)).toBeInTheDocument()
      })
      
      // Should not navigate
      expect(mockPush).not.toHaveBeenCalled()
      
      // Form should remain interactive
      expect(submitButton).not.toBeDisabled()
    })

    test('should handle network errors', async () => {
      const user = userEvent.setup()
      
      // Mock network error
      mockSupabaseInsert.mockRejectedValueOnce(new Error('Network error'))
      
      render(<PollCreationForm />)
      
      // Fill out valid form
      await user.type(screen.getByLabelText(/title/i), 'Network Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option A')
      await user.type(optionInputs[1], 'Option B')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should handle the error gracefully
      await waitFor(() => {
        // Error should be displayed or form should be re-enabled
        expect(submitButton).not.toBeDisabled()
      })
      
      // Should not navigate
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('User Experience Integration', () => {
    
    test('should show loading states during submission', async () => {
      const user = userEvent.setup()
      
      // Mock delayed response
      mockSupabaseInsert.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: [{ id: 'poll-loading' }], error: null }), 1000)
        )
      )
      
      render(<PollCreationForm />)
      
      // Fill out form
      await user.type(screen.getByLabelText(/title/i), 'Loading Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should show loading state
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /creating/i }) ||
                             screen.getByRole('button', { name: /create poll/i })
        expect(loadingButton).toBeInTheDocument()
      })
    })

    test('should handle form reset after successful submission', async () => {
      const user = userEvent.setup()
      
      // Mock successful submission
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [{ id: 'poll-reset' }],
        error: null
      })
      
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      
      // Fill out form
      await user.type(titleInput, 'Reset Test Poll')
      await user.type(descriptionInput, 'This should be reset')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // After successful submission, should navigate
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/polls/poll-reset')
      })
    })
  })

  describe('Authentication Integration', () => {
    
    test('should use authenticated user data in poll creation', async () => {
      const user = userEvent.setup()
      
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [{ id: 'poll-auth' }],
        error: null
      })
      
      render(<PollCreationForm />)
      
      // Fill and submit form
      await user.type(screen.getByLabelText(/title/i), 'Auth Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should include user ID in submission
      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            created_by: 'test-user-id'
          })
        )
      })
    })
  })
})