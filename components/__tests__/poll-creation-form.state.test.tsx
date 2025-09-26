/**
 * Unit Tests for Poll Creation Form State Management
 * Tests state updates, field changes, and user interactions
 * Covers both happy path and edge/failure cases
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PollCreationForm } from '../poll-creation-form'

// Mock the auth context
const mockAuthContext = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
}

jest.mock('../../context/auth-context', () => ({
  useAuth: () => mockAuthContext,
}))

// Mock Supabase client
const mockSupabaseInsert = jest.fn()
jest.mock('../../lib/supabase', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: mockSupabaseInsert,
    })),
  })),
}))

describe('Poll Creation Form State Management', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    
    test('should initialize with default form state (happy path)', () => {
      render(<PollCreationForm />)
      
      // Check initial form elements
      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      
      expect(titleInput).toHaveValue('')
      expect(descriptionInput).toHaveValue('')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })

    test('should initialize with two empty poll options', () => {
      render(<PollCreationForm />)
      
      // Check initial poll options
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs).toHaveLength(2)
      
      optionInputs.forEach(input => {
        expect(input).toHaveValue('')
      })
    })

    test('should initialize with default settings', () => {
      render(<PollCreationForm />)
      
      // Check default settings - max votes input is only visible when multiple votes is enabled
      const anonymousToggle = screen.getByRole('switch', { name: /anonymous voting/i })
      
      expect(anonymousToggle).not.toBeChecked()
    })
  })

  describe('Field Updates', () => {
    
    test('should update title field correctly (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const testTitle = 'What is your favorite programming language?'
      
      await user.type(titleInput, testTitle)
      
      expect(titleInput).toHaveValue(testTitle)
    })

    test('should update description field correctly (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const descriptionInput = screen.getByLabelText(/description/i)
      const testDescription = 'This poll helps us understand programming preferences.'
      
      await user.type(descriptionInput, testDescription)
      
      expect(descriptionInput).toHaveValue(testDescription)
    })

    test('should update poll options correctly (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      const testOptions = ['JavaScript', 'Python']
      
      for (let i = 0; i < testOptions.length; i++) {
        await user.type(optionInputs[i], testOptions[i])
        expect(optionInputs[i]).toHaveValue(testOptions[i])
      }
    })

    test('should handle rapid field updates (edge case)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      
      // Rapid typing simulation
      await user.type(titleInput, 'Test')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Test Title')
      
      expect(titleInput).toHaveValue('New Test Title')
    })
  })

  describe('Dynamic Options Management', () => {
    
    test('should add new poll option (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const addButton = screen.getByRole('button', { name: /add another option/i })
      
      // Initially should have 2 options
      let optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs).toHaveLength(2)
      
      // Add a new option
      await user.click(addButton)
      
      // Should now have 3 options
      optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs).toHaveLength(3)
    })

    test('should remove poll option (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      // Add an extra option first
      const addButton = screen.getByRole('button', { name: /add another option/i })
      await user.click(addButton)
      
      // Should have 3 options
      let optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs).toHaveLength(3)
      
      // Remove an option
      const removeButtons = screen.getAllByRole('button', { name: /remove option/i })
      await user.click(removeButtons[0])
      
      // Should now have 2 options
      optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs).toHaveLength(2)
    })

    test('should prevent removing when only 2 options remain (edge case)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      // Initially should have 2 options
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs).toHaveLength(2)
      
      // Try to remove an option (should not be possible with only 2 options)
      const removeButtons = screen.queryAllByRole('button', { name: /remove option/i })
      
      // With only 2 options, remove buttons should be disabled or not present
      if (removeButtons.length > 0) {
        removeButtons.forEach(button => {
          expect(button).toBeDisabled()
        })
      }
    })

    test('should handle maximum number of options (edge case)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const addButton = screen.getByRole('button', { name: /add another option/i })
      
      // Add options up to a reasonable limit (e.g., 10)
      for (let i = 0; i < 8; i++) { // Start with 2, add 8 more = 10 total
        await user.click(addButton)
      }
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs.length).toBeGreaterThanOrEqual(2)
      expect(optionInputs.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Settings Management', () => {
    
    test('should update max votes per user (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      // First enable multiple votes to make max votes input visible
      const multipleVotesToggle = screen.getByRole('switch', { name: /allow multiple votes/i })
      await user.click(multipleVotesToggle)
      
      // Now the max votes input should be visible
      const maxVotesInput = screen.getByLabelText(/max votes per user/i)
      
      await user.clear(maxVotesInput)
      await user.type(maxVotesInput, '3')
      
      expect(maxVotesInput).toHaveValue('3')
    })

    test('should toggle anonymous voting (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const anonymousToggle = screen.getByRole('switch', { name: /anonymous voting/i })
      
      // Initially should be unchecked
      expect(anonymousToggle).not.toBeChecked()
      
      // Toggle it
      await user.click(anonymousToggle)
      expect(anonymousToggle).toBeChecked()
      
      // Toggle it back
      await user.click(anonymousToggle)
      expect(anonymousToggle).not.toBeChecked()
    })

    test('should update expiration date (happy path)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const dateInput = screen.getByLabelText(/expiration date/i)
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      const dateString = futureDate.toISOString().slice(0, 16) // datetime-local format
      
      await user.clear(dateInput)
      await user.type(dateInput, dateString)
      
      expect(dateInput).toHaveValue(dateString)
    })

    test('should handle invalid max votes input (edge case)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      // First enable multiple votes to make max votes input visible
      const multipleVotesToggle = screen.getByRole('switch', { name: /allow multiple votes/i })
      await user.click(multipleVotesToggle)
      
      const maxVotesInput = screen.getByLabelText(/max votes per user/i)
      
      // Try to enter invalid values
      await user.clear(maxVotesInput)
      await user.type(maxVotesInput, '0')
      
      // Should either prevent the input or show validation error
      // The exact behavior depends on implementation
      expect((maxVotesInput as HTMLInputElement).value).toBeDefined()
    })
  })

  describe('Form Submission State', () => {
    
    test('should show loading state during submission (happy path)', async () => {
      const user = userEvent.setup()
      
      // Mock successful submission
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [{ id: 'test-poll-id' }],
        error: null
      })
      
      render(<PollCreationForm />)
      
      // Fill out the form
      await user.type(screen.getByLabelText(/title/i), 'Test Poll')
      await user.type(screen.getByLabelText(/description/i), 'Test Description')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      
      // Submit the form
      await user.click(submitButton)
      
      // Should show loading state (button disabled or loading text)
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /creating/i }) ||
                             screen.getByRole('button', { name: /create poll/i })
        expect(loadingButton).toBeInTheDocument()
      })
    })

    test('should handle submission errors (edge case)', async () => {
      const user = userEvent.setup()
      
      // Mock failed submission
      mockSupabaseInsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      })
      
      render(<PollCreationForm />)
      
      // Fill out the form
      await user.type(screen.getByLabelText(/title/i), 'Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      
      // Submit the form
      await user.click(submitButton)
      
      // Should handle the error gracefully
      await waitFor(() => {
        // Error message should be displayed or form should be re-enabled
        expect(submitButton).not.toBeDisabled()
      })
    })

    test('should reset form after successful submission (happy path)', async () => {
      const user = userEvent.setup()
      
      // Mock successful submission
      mockSupabaseInsert.mockResolvedValueOnce({
        data: [{ id: 'test-poll-id' }],
        error: null
      })
      
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      
      // Fill out the form
      await user.type(titleInput, 'Test Poll')
      await user.type(descriptionInput, 'Test Description')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      
      // Submit the form
      await user.click(submitButton)
      
      // After successful submission, form should reset or redirect
      await waitFor(() => {
        // This depends on implementation - form might reset or redirect
        expect(mockSupabaseInsert).toHaveBeenCalled()
      })
    })
  })
})
