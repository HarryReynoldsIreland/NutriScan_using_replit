import { apiRequest } from './queryClient';

// Simple token storage
const TOKEN_KEY = 'nutriscan_token';

export const generateRandomUsername = () => {
  const adjectives = ['Curious', 'Smart', 'Healthy', 'Mindful', 'Caring', 'Wise', 'Fresh', 'Green'];
  const nouns = ['Explorer', 'Reader', 'Hunter', 'Seeker', 'Guardian', 'Learner', 'Keeper', 'Guide'];
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomAdj}${randomNoun}${randomNum}`;
};

export const createAnonymousUser = async () => {
  const username = generateRandomUsername();
  
  const response = await fetch('/api/auth/anonymous', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user');
  }
  
  const { user, token } = await response.json();
  localStorage.setItem(TOKEN_KEY, token);
  
  return user;
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  
  const response = await fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
  
  return response.json();
};

export const logout = async () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthHeader = (headers: Record<string, string> = {}) => {
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};