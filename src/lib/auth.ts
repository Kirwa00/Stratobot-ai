// Authentication System
// Basic user authentication for Phase 1 - can be extended for production with proper backend

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  subscriptionTier: "free" | "pro";
  strategiesCreated: number;
  simsUsed: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = "stratobot_auth_v1";

// Mock user database - in production this would be a real backend
const MOCK_USERS: Record<string, { user: User; password: string }> = {
  "demo@stratobot.ai": {
    user: {
      id: "user-1",
      email: "demo@stratobot.ai",
      name: "Demo User",
      createdAt: Date.now() - 86400000 * 30,
      subscriptionTier: "free",
      strategiesCreated: 5,
      simsUsed: 12
    },
    password: "demo123"
  }
};

export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { user: null, isAuthenticated: false, isLoading: false };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const user = JSON.parse(stored) as User;
      return { user, isAuthenticated: true, isLoading: false };
    }
  } catch {
    // Invalid storage
  }

  return { user: null, isAuthenticated: false, isLoading: false };
}

export function setAuthState(user: User | null): void {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check mock database
  const mockUser = MOCK_USERS[email.toLowerCase()];
  if (mockUser && mockUser.password === password) {
    setAuthState(mockUser.user);
    return { success: true, user: mockUser.user };
  }

  // For demo purposes, allow any email with a simple password
  if (password.length >= 6) {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: email.toLowerCase(),
      name: email.split("@")[0],
      createdAt: Date.now(),
      subscriptionTier: "free",
      strategiesCreated: 0,
      simsUsed: 0
    };
    
    // Add to mock database
    MOCK_USERS[email.toLowerCase()] = { user: newUser, password };
    setAuthState(newUser);
    
    return { success: true, user: newUser };
  }

  return { success: false, error: "Invalid email or password" };
}

export async function register(email: string, password: string, name: string): Promise<{ success: boolean; user?: User; error?: string }> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check if user already exists
  if (MOCK_USERS[email.toLowerCase()]) {
    return { success: false, error: "Email already registered" };
  }

  // Validate password
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  // Create new user
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: email.toLowerCase(),
    name: name || email.split("@")[0],
    createdAt: Date.now(),
    subscriptionTier: "free",
    strategiesCreated: 0,
    simsUsed: 0
  };

  MOCK_USERS[email.toLowerCase()] = { user: newUser, password };
  setAuthState(newUser);

  return { success: true, user: newUser };
}

export function logout(): void {
  setAuthState(null);
}

export function updateUser(updates: Partial<User>): User | null {
  const authState = getAuthState();
  if (!authState.user) return null;

  const updatedUser = { ...authState.user, ...updates };
  setAuthState(updatedUser);
  
  // Update mock database
  if (MOCK_USERS[updatedUser.email]) {
    MOCK_USERS[updatedUser.email].user = updatedUser;
  }

  return updatedUser;
}

export function incrementSimsUsed(): User | null {
  const authState = getAuthState();
  if (!authState.user) return null;

  return updateUser({ simsUsed: authState.user.simsUsed + 1 });
}

export function incrementStrategiesCreated(): User | null {
  const authState = getAuthState();
  if (!authState.user) return null;

  return updateUser({ strategiesCreated: authState.user.strategiesCreated + 1 });
}

export function upgradeToPro(): User | null {
  const authState = getAuthState();
  if (!authState.user) return null;

  return updateUser({ subscriptionTier: "pro" });
}