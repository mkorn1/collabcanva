// Unit tests for auth service functions
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  signUp, 
  signIn, 
  signOut, 
  getCurrentUser,
  onAuthStateChange,
  getUserProfile 
} from '../../services/auth'

// Mock Firebase modules
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
  updateProfile: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}))

vi.mock('../../services/firebase', () => ({
  auth: {
    currentUser: null
  },
  db: {}
}))

// Import mocked functions
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../services/firebase'

describe('Auth Service Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signUp', () => {
    it('should create user with correct data', async () => {
      // Mock Firebase responses
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: null
      }
      const mockUserCredential = { user: mockUser }

      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential)
      updateProfile.mockResolvedValue()
      setDoc.mockResolvedValue()
      doc.mockReturnValue('mock-doc-ref')

      // Test signUp
      const result = await signUp('test@example.com', 'password123', 'John Doe')

      // Verify Firebase auth was called correctly
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth, 
        'test@example.com', 
        'password123'
      )

      // Verify profile update was called
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'John Doe'
      })

      // Verify Firestore document creation
      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        expect.objectContaining({
          uid: 'test-uid-123',
          email: 'test@example.com',
          displayName: 'John Doe',
          createdAt: expect.any(String),
          isOnline: true,
          lastSeen: expect.any(String)
          // Note: cursorColor no longer assigned at signup
        })
      )

      // Verify return value
      expect(result).toEqual({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe'
        // Note: cursorColor no longer included at signup
      })

      expect(console.log).toHaveBeenCalledWith('✅ User signed up successfully:', 'John Doe')
    })

    it('should generate display name if not provided', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: null
      }
      const mockUserCredential = { user: mockUser }

      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential)
      updateProfile.mockResolvedValue()
      setDoc.mockResolvedValue()

      const result = await signUp('test@example.com', 'password123')

      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: expect.stringMatching(/^User_\d+$/)
      })
      
      expect(result.displayName).toMatch(/^User_\d+$/)
    })

    it('should handle signup errors', async () => {
      const error = new Error('Email already in use')
      createUserWithEmailAndPassword.mockRejectedValue(error)

      await expect(signUp('test@example.com', 'password123')).rejects.toThrow('Email already in use')
      expect(console.error).toHaveBeenCalledWith('❌ Sign up error:', 'Email already in use')
    })
  })

  describe('signIn', () => {
    it('should return user object on successful login', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe'
      }
      const mockUserCredential = { user: mockUser }

      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential)
      setDoc.mockResolvedValue()
      doc.mockReturnValue('mock-doc-ref')

      const result = await signIn('test@example.com', 'password123')

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      )

      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        {
          isOnline: true,
          lastSeen: expect.any(String)
        },
        { merge: true }
      )

      expect(result).toEqual({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe'
      })

      expect(console.log).toHaveBeenCalledWith('✅ User signed in successfully:', 'John Doe')
    })

    it('should use email as displayName if displayName is null', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: null
      }
      const mockUserCredential = { user: mockUser }

      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential)
      setDoc.mockResolvedValue()

      const result = await signIn('test@example.com', 'password123')

      expect(result.displayName).toBe('test@example.com')
    })

    it('should handle signin errors', async () => {
      const error = new Error('Invalid credentials')
      signInWithEmailAndPassword.mockRejectedValue(error)

      await expect(signIn('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials')
      expect(console.error).toHaveBeenCalledWith('❌ Sign in error:', 'Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should update user status and sign out', async () => {
      // Mock current user
      auth.currentUser = {
        uid: 'test-uid-123',
        email: 'test@example.com'
      }

      setDoc.mockResolvedValue()
      firebaseSignOut.mockResolvedValue()
      doc.mockReturnValue('mock-doc-ref')

      await signOut()

      expect(setDoc).toHaveBeenCalledWith(
        'mock-doc-ref',
        {
          isOnline: false,
          lastSeen: expect.any(String)
        },
        { merge: true }
      )

      expect(firebaseSignOut).toHaveBeenCalledWith(auth)
      expect(console.log).toHaveBeenCalledWith('✅ User signed out successfully')
    })

    it('should handle signout when no current user', async () => {
      auth.currentUser = null
      firebaseSignOut.mockResolvedValue()

      await signOut()

      expect(setDoc).not.toHaveBeenCalled()
      expect(firebaseSignOut).toHaveBeenCalledWith(auth)
    })

    it('should handle signout errors', async () => {
      auth.currentUser = { uid: 'test-uid-123' }
      const error = new Error('Signout failed')
      firebaseSignOut.mockRejectedValue(error)

      await expect(signOut()).rejects.toThrow('Signout failed')
      expect(console.error).toHaveBeenCalledWith('❌ Sign out error:', 'Signout failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user object when user is logged in', () => {
      auth.currentUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe'
      }

      const result = getCurrentUser()

      expect(result).toEqual({
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe'
      })
    })

    it('should return null when no user is logged in', () => {
      auth.currentUser = null

      const result = getCurrentUser()

      expect(result).toBeNull()
    })

    it('should use email as displayName if displayName is null', () => {
      auth.currentUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: null
      }

      const result = getCurrentUser()

      expect(result.displayName).toBe('test@example.com')
    })
  })

  describe('onAuthStateChange', () => {
    it('should call Firebase onAuthStateChanged with callback', () => {
      const mockCallback = vi.fn()
      const mockUnsubscribe = vi.fn()
      
      onAuthStateChanged.mockReturnValue(mockUnsubscribe)

      const unsubscribe = onAuthStateChange(mockCallback)

      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, mockCallback)
      expect(unsubscribe).toBe(mockUnsubscribe)
    })
  })

  describe('getUserProfile', () => {
    it('should return user profile data when document exists', async () => {
      const mockProfileData = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'John Doe',
        cursorColor: '#FF6B6B'
      }

      const mockDocSnap = {
        exists: () => true,
        data: () => mockProfileData
      }

      doc.mockReturnValue('mock-doc-ref')
      getDoc.mockResolvedValue(mockDocSnap)

      const result = await getUserProfile('test-uid-123')

      expect(doc).toHaveBeenCalledWith(db, 'users', 'test-uid-123')
      expect(getDoc).toHaveBeenCalledWith('mock-doc-ref')
      expect(result).toEqual(mockProfileData)
    })

    it('should throw error when user profile not found', async () => {
      const mockDocSnap = {
        exists: () => false
      }

      doc.mockReturnValue('mock-doc-ref')
      getDoc.mockResolvedValue(mockDocSnap)

      await expect(getUserProfile('nonexistent-uid')).rejects.toThrow('User profile not found')
    })

    it('should handle errors when fetching user profile', async () => {
      const error = new Error('Network error')
      getDoc.mockRejectedValue(error)

      await expect(getUserProfile('test-uid-123')).rejects.toThrow('Network error')
      expect(console.error).toHaveBeenCalledWith('❌ Error fetching user profile:', 'Network error')
    })
  })
})
