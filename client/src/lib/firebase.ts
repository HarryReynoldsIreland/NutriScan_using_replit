import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "default_api_key",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "default_project"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "default_project",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "default_project"}.firebasestorage.app`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "default_app_id",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Generate random username
export const generateRandomUsername = () => {
  const adjectives = ['Swift', 'Bright', 'Clever', 'Quick', 'Smart', 'Wise', 'Bold', 'Calm', 'Cool', 'Fast'];
  const nouns = ['Fox', 'Eagle', 'Tiger', 'Wolf', 'Lion', 'Bear', 'Hawk', 'Owl', 'Deer', 'Rabbit'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
};

// Anonymous authentication
export const signInAnonymouslyWithUsername = async () => {
  try {
    const result = await signInAnonymously(auth);
    const username = generateRandomUsername();
    
    // Create user in our database
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        firebaseUid: result.user.uid,
        isAnonymous: true,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    const user = await response.json();
    return { firebaseUser: result.user, user };
  } catch (error) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
};

// Get current user from our database
export const getCurrentUser = async (firebaseUid: string) => {
  try {
    const response = await fetch(`/api/users/firebase/${firebaseUid}`);
    if (!response.ok) {
      throw new Error('User not found');
    }
    return await response.json();
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};
