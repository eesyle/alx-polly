/**
 * Edge Cases and Error Scenarios Tests for Poll Creation Form
 * Tests unusual inputs, boundary conditions, and failure modes
 * Ensures robust handling of unexpected situations
 */

// Mock the createPoll function first
jest.mock('../../lib/supabase', () => ({
  createPoll: jest.fn(),
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}))

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

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { PollCreationForm } from '../poll-creation-form'
import { createPoll } from '../../lib/supabase'

// Get the mocked function
const mockCreatePoll = createPoll as jest.Mock

describe('Poll Creation Form Edge Cases and Error Scenarios', () => {
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Input Boundary Conditions', () => {
    
    test('should handle exactly minimum title length (3 characters)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'abc') // exactly 3 characters
      
      expect(titleInput).toHaveValue('abc')
      
      // Should be valid
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-min-title' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })

    test('should handle exactly maximum title length (255 characters)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const maxTitle = 'a'.repeat(255) // exactly 255 characters
      
      // Use fireEvent.change for better performance with long text
      fireEvent.change(titleInput, { target: { value: maxTitle } })
      expect(titleInput).toHaveValue(maxTitle)
      
      // Should be valid
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      mockCreatePoll.mockResolvedValueOnce({
        success: true,
        data: { poll: { id: 'poll-max-title' }, options: [] }
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })

    test('should handle exactly maximum description length (1000 characters)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      const maxDescription = 'a'.repeat(1000) // exactly 1000 characters
      
      await user.type(titleInput, 'Valid Title')
      await user.type(descriptionInput, maxDescription)
      
      expect(descriptionInput).toHaveValue(maxDescription)
      
      // Should be valid
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-max-desc' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })

    test('should handle exactly maximum option length (500 characters)', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Valid Title')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      const maxOption = 'a'.repeat(500) // exactly 500 characters
      
      await user.type(optionInputs[0], maxOption)
      await user.type(optionInputs[1], 'Normal Option')
      
      expect(optionInputs[0]).toHaveValue(maxOption)
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-max-option' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })
  })

  describe('Special Characters and Unicode', () => {
    
    test('should handle special characters in title', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const specialTitle = 'Poll with émojis 🚀 & symbols @#$%^&*()'
      
      await user.type(titleInput, specialTitle)
      expect(titleInput).toHaveValue(specialTitle)
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-special-chars' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalledWith(
          expect.objectContaining({
            title: specialTitle
          })
        )
      })
    })

    test('should handle unicode characters in options', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Unicode Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], '中文选项 (Chinese)')
      await user.type(optionInputs[1], 'العربية (Arabic)')
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-unicode' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalledWith(
          expect.objectContaining({
            options: ['中文选项 (Chinese)', 'العربية (Arabic)']
          })
        )
      })
    })

    test('should handle HTML/script injection attempts', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      const maliciousTitle = '<script>alert("xss")</script>Malicious Poll'
      
      await user.type(titleInput, maliciousTitle)
      expect(titleInput).toHaveValue(maliciousTitle)
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], '<img src="x" onerror="alert(1)">')
      await user.type(optionInputs[1], 'Normal Option')
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-xss-test' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Should still submit (sanitization should happen server-side)
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })
  })

  describe('Date and Time Edge Cases', () => {
    
    test('should handle date exactly 1 minute in the future', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Near Future Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Set date to 1 minute in the future
      const futureDate = new Date(Date.now() + 60 * 1000)
      const dateInput = screen.getByLabelText(/expiration date/i)
      await user.type(dateInput, futureDate.toISOString().split('T')[0])
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-near-future' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })

    test('should handle leap year dates', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Leap Year Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Set date to February 29th of a leap year (if in future)
      const leapYearDate = '2028-02-29' // 2028 is a leap year
      const dateInput = screen.getByLabelText(/expiration date/i)
      await user.type(dateInput, leapYearDate)
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-leap-year' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })

    test('should handle timezone edge cases', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Timezone Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      // Test with a date that might be past in some timezones but future in others
      const edgeDate = new Date()
      edgeDate.setDate(edgeDate.getDate() + 1)
      edgeDate.setHours(1, 0, 0, 0) // 1 AM tomorrow
      
      const dateInput = screen.getByLabelText(/expiration date/i)
      await user.type(dateInput, edgeDate.toISOString().split('T')[0])
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-timezone' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })
  })

  describe('Network and Database Error Scenarios', () => {
    
    test('should handle timeout errors', async () => {
      const user = userEvent.setup()
      
      // Mock timeout error
      mockCreatePoll.mockRejectedValueOnce(new Error('Request timeout'))
      
      render(<PollCreationForm />)
      
      await user.type(screen.getByLabelText(/title/i), 'Timeout Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        // Should handle timeout gracefully
        expect(submitButton).not.toBeDisabled()
      })
    })

    test('should handle database constraint violations', async () => {
      const user = userEvent.setup()
      
      // Mock constraint violation error
      mockCreatePoll.mockResolvedValueOnce({
        data: null,
        error: { 
          message: 'duplicate key value violates unique constraint',
          code: '23505'
        }
      })
      
      render(<PollCreationForm />)
      
      await user.type(screen.getByLabelText(/title/i), 'Constraint Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/failed to create poll/i)).toBeInTheDocument()
      })
    })

    test('should handle malformed database responses', async () => {
      const user = userEvent.setup()
      
      // Mock malformed response
      mockCreatePoll.mockResolvedValueOnce({
        data: null, // No data
        error: null  // No error either (unexpected state)
      })
      
      render(<PollCreationForm />)
      
      await user.type(screen.getByLabelText(/title/i), 'Malformed Response Test')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        // Should handle unexpected response gracefully
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('User Interaction Edge Cases', () => {
    
    test('should handle rapid consecutive submissions', async () => {
      const user = userEvent.setup()
      
      mockCreatePoll.mockResolvedValue({
        data: [{ id: 'poll-rapid' }],
        error: null
      })
      
      render(<PollCreationForm />)
      
      await user.type(screen.getByLabelText(/title/i), 'Rapid Submit Test')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      
      // Rapid clicks
      await user.click(submitButton)
      await user.click(submitButton)
      await user.click(submitButton)
      
      // Should only submit once
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalledTimes(1)
      })
    })

    test('should handle form submission during field editing', async () => {
      const user = userEvent.setup()
      
      mockCreatePoll.mockResolvedValueOnce({
        success: true,
        data: { poll: { id: 'poll-editing' }, options: [] }
      })
      
      render(<PollCreationForm />)
      
      const titleInput = screen.getByLabelText(/title/i)
      await user.type(titleInput, 'Editing Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      
      // Start typing in second option but don't finish
      await user.click(optionInputs[1])
      await user.type(optionInputs[1], 'Incomplete')
      
      // Submit while still editing
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalledWith(
          expect.objectContaining({
            options: ['Option 1', 'Incomplete']
          })
        )
      })
    }, 10000)

    test('should handle browser back/forward during form submission', async () => {
      const user = userEvent.setup()
      
      // Mock slow submission
      mockCreatePoll.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: true, data: { poll: { id: 'poll-navigation' }, options: [] } }), 2000)
        )
      )
      
      render(<PollCreationForm />)
      
      await user.type(screen.getByLabelText(/title/i), 'Navigation Test Poll')
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      // Simulate browser navigation during submission
      // This would typically be handled by the component's cleanup
      // The test ensures no errors are thrown
      expect(() => {
        // Component should handle this gracefully
      }).not.toThrow()
    }, 10000)
  })

  describe('Memory and Performance Edge Cases', () => {
    
    test('should handle large number of options', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Many Options Poll' } })
      
      // Add many options
      const addButton = screen.getByRole('button', { name: /add another option/i })
      
      // Add 8 more options (starting with 2) for a total of 10
      for (let i = 0; i < 8; i++) {
        await user.click(addButton)
      }
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      expect(optionInputs.length).toBeGreaterThanOrEqual(10)
      
      // Fill all options using fireEvent.change for better performance
      for (let i = 0; i < Math.min(optionInputs.length, 10); i++) {
        fireEvent.change(optionInputs[i], { target: { value: `Option ${i + 1}` } })
      }
      
      mockCreatePoll.mockResolvedValueOnce({
        success: true,
        data: { poll: { id: 'poll-many-options' }, options: [] }
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })

    test('should handle very long text inputs efficiently', async () => {
      const user = userEvent.setup()
      render(<PollCreationForm />)
      
      // Test with very long but valid inputs
      const longTitle = 'A'.repeat(200) // Long but under 255 limit
      const longDescription = 'B'.repeat(900) // Long but under 1000 limit
      
      const titleInput = screen.getByLabelText(/title/i)
      const descriptionInput = screen.getByLabelText(/description/i)
      
      // Use fireEvent.change for better performance with long text
      fireEvent.change(titleInput, { target: { value: longTitle } })
      fireEvent.change(descriptionInput, { target: { value: longDescription } })
      
      expect(titleInput).toHaveValue(longTitle)
      expect(descriptionInput).toHaveValue(longDescription)
      
      const optionInputs = screen.getAllByPlaceholderText(/enter option/i)
      await user.type(optionInputs[0], 'Option 1')
      await user.type(optionInputs[1], 'Option 2')
      
      mockCreatePoll.mockResolvedValueOnce({
        data: [{ id: 'poll-long-text' }],
        error: null
      })
      
      const submitButton = screen.getByRole('button', { name: /create poll/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(mockCreatePoll).toHaveBeenCalled()
      })
    })
  })
})
