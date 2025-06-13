import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  // FacebookAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { apiClient } from '@/lib/api/config'

const googleProvider = new GoogleAuthProvider()
// const facebookProvider = new FacebookAuthProvider()

export const authService = {
  // Google Sign in
  signInWithGoogle: async () => {
    if (!auth) throw new Error('Firebase auth not initialized');
    try {
      const result = await signInWithPopup(auth, googleProvider)
      // After successful sign in, verify token with Django
      await authService.verifyTokenWithBackend()
      return result.user
    } catch (error) {
      throw error
    }
  },

  // Facebook Sign in can be added later
  // signInWithFacebook: async () => {
  //   if (!auth) throw new Error('Firebase auth not initialized');
  //   try {
  //     const result = await signInWithPopup(auth, facebookProvider)
  //     return result.user
  //   } catch (error) {
  //     throw error
  //   }
  // },

  // Email/Password Sign up
  signUpWithEmail: async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      // After successful sign up, verify token with Django
      await authService.verifyTokenWithBackend()
      return result.user
    } catch (error) {
      throw error
    }
  },

  // Email/Password Sign in
  signInWithEmail: async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase auth not initialized');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      // After successful sign in, verify token with Django
      await authService.verifyTokenWithBackend()
      return result.user
    } catch (error) {
      throw error
    }
  },

  // Sign out
  signOut: async () => {
    if (!auth) throw new Error('Firebase auth not initialized');
    try {
      await signOut(auth)
    } catch (error) {
      throw error
    }
  },

  // Verify token with Django backend
  verifyTokenWithBackend: async () => {
    try {
      const currentUser = auth?.currentUser;
      if (!currentUser) {
        throw new Error('No user is currently signed in');
      }

      const token = await currentUser.getIdToken();
      await apiClient.post('/api/v1/auth/verify-token/', { token });
    } catch (error) {
      console.error('Error verifying token with backend:', error);
      throw error;
    }
  }
} 