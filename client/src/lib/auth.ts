import { useEffect, useState } from "react";
import { apiRequest } from "./queryClient";
import { mockAuth } from "./mock-auth";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  role: string;
  subscriptionTier: string;
  createdAt: string;
  updatedAt: string;
  hasChangedPassword?: boolean;
  connectedWearable?: boolean;
  dateOfBirth?: string;
  phenoAge?: number;
  verifiedAccount?: boolean;
  memberSince?: string;
  labTest?: number;
  actionPlan?: number;
  activeClient?: boolean;
  plan?: string;
  showPhenoage?: boolean;
  hasReport?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  sessionId: string;
  expires: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
}

const PASSWORD_CHANGE_DEFERRED_KEY = "passwordChangeDeferred";

export function isPasswordChangeDeferred(): boolean {
  try {
    return localStorage.getItem(PASSWORD_CHANGE_DEFERRED_KEY) === "true";
  } catch {
    return false;
  }
}

export function deferPasswordChange(): void {
  try {
    localStorage.setItem(PASSWORD_CHANGE_DEFERRED_KEY, "true");
    sessionStorage.removeItem(PASSWORD_CHANGE_DEFERRED_KEY);
  } catch {
    // Private mode / storage blocked.
  }
}

export function clearPasswordChangeDefer(): void {
  try {
    localStorage.removeItem(PASSWORD_CHANGE_DEFERRED_KEY);
    sessionStorage.removeItem(PASSWORD_CHANGE_DEFERRED_KEY);
  } catch {
    // Private mode / storage blocked.
  }
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private sessionId: string | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    // Try to restore session from localStorage
    this.restoreSession();
  }

  private restoreSession() {
    try {
      const userData = localStorage.getItem("health_user");
      const sessionId = localStorage.getItem("health_session");
      const expires = localStorage.getItem("health_session_expires");

      if (userData && sessionId && expires) {
        const expiresDate = new Date(expires);
        if (expiresDate > new Date()) {
          this.currentUser = JSON.parse(userData);
          this.sessionId = sessionId;
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      this.clearSession();
    }
  }

  private saveSession(response: AuthResponse) {
    this.currentUser = response.user;
    this.sessionId = response.sessionId;

    localStorage.setItem("health_user", JSON.stringify(response.user));
    localStorage.setItem("health_session", response.sessionId);
    localStorage.setItem("health_session_expires", response.expires);
  }

  private clearSession() {
    this.currentUser = null;
    this.sessionId = null;

    localStorage.removeItem("health_user");
    localStorage.removeItem("health_session");
    localStorage.removeItem("health_session_expires");
    localStorage.removeItem("health_device_connection_state");
    clearPasswordChangeDefer();
  }

  async login(credentials: LoginCredentials): Promise<AuthUser> {
    // Check if mock mode is enabled for UI testing
    if (mockAuth.isMockModeEnabled()) {
      try {
        const user = await mockAuth.mockLogin(
          credentials.email,
          credentials.password
        );
        this.currentUser = user;
        this.sessionId = "mock-session-123";
        // Store mock session
        localStorage.setItem("health_user", JSON.stringify(user));
        localStorage.setItem("health_session", "mock-session-123");
        return user;
      } catch (error) {
        throw new Error("Invalid credentials");
      }
    }

    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const data: AuthResponse = await response.json();

    this.saveSession(data);
    return data.user;
  }

  async register(userData: RegisterData): Promise<AuthUser> {
    const response = await apiRequest("POST", "/api/auth/register", userData);
    const data: AuthResponse = await response.json();

    this.saveSession(data);
    return data.user;
  }

  async logout(): Promise<void> {
    // Handle mock mode logout
    if (mockAuth.isMockModeEnabled()) {
      mockAuth.logout();
    } else if (this.sessionId) {
      try {
        await apiRequest("POST", "/api/auth/logout", {});
      } catch (error) {
        console.error("Error during logout:", error);
      }
    }

    this.clearSession();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    // Check mock mode first
    if (mockAuth.isMockModeEnabled()) {
      const user = mockAuth.getCurrentUser();
      if (user) {
        this.currentUser = user;
        this.sessionId = "mock-session-123";
        return user;
      }
    }

    if (!this.sessionId) {
      return null;
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${this.sessionId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.currentUser = data.user;
        return data.user;
      } else if (response.status === 401) {
        this.clearSession();
        return null;
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }

    return this.currentUser;
  }

  async fetchClientInformation(): Promise<void> {
    if (!this.sessionId && !mockAuth.isMockModeEnabled()) {
      return;
    }

    try {
      const response = await fetch("/api/client_information_mobile", {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Client info received:', data);
        console.log('🔍 has_changed_password value:', data.has_changed_password);
        
        // Restore user from localStorage if not already set
        if (!this.currentUser) {
          const userData = localStorage.getItem("health_user");
          if (userData) {
            this.currentUser = JSON.parse(userData);
          }
        }
        
        // Update current user with client information
        if (this.currentUser) {
          this.currentUser = {
            ...this.currentUser,
            hasChangedPassword: data.has_changed_password,
            connectedWearable: data.connected_wearable,
            dateOfBirth: data.date_of_birth,
            phenoAge: data.pheno_age,
            verifiedAccount: data.verified_account,
            memberSince: data.member_since,
            labTest: data.lab_test,
            actionPlan: data.action_plan,
            activeClient: data.active_client,
            plan: data.plan,
            showPhenoage: data.show_phenoage,
            hasReport: data.has_report,
          };
          
          console.log('🔍 Updated user hasChangedPassword:', this.currentUser.hasChangedPassword);
          
          // Update localStorage
          localStorage.setItem("health_user", JSON.stringify(this.currentUser));
        }
      }
    } catch (error) {
      console.error("Error fetching client information:", error);
    }
  }

  needsPasswordChange(): boolean {
    if (isPasswordChangeDeferred()) {
      return false;
    }
    return this.currentUser?.hasChangedPassword === false;
  }

  getUser(): AuthUser | null {
    return this.currentUser;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  isAuthenticated(): boolean {
    // Check mock mode
    if (localStorage.getItem("token")) {
      return true;
    }
    return false;
  }

  hasSubscription(tier: "plus" | "professional"): boolean {
    if (!this.currentUser) return false;

    const userTier = this.currentUser.subscriptionTier;
    if (tier === "plus") {
      return userTier === "plus" || userTier === "professional";
    }
    if (tier === "professional") {
      return userTier === "professional";
    }

    return false;
  }

  // Add auth header to requests
  getAuthHeaders(): Record<string, string> {
    if (this.sessionId) {
      return {
        Authorization: `Bearer ${this.sessionId}`,
      };
    }
    return {};
  }
}

export const authService = AuthService.getInstance();

const authListeners = new Set<() => void>();

export function notifyAuthChanged() {
  authListeners.forEach((listener) => listener());
}

export function subscribeAuthChanged(listener: () => void) {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

// Custom hook for auth (to be used in React components)
export function useAuth() {
  const [, setAuthTick] = useState(0);

  useEffect(() => subscribeAuthChanged(() => setAuthTick((tick) => tick + 1)), []);

  return {
    user: authService.getUser(),
    isAuthenticated: authService.isAuthenticated(),
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    hasSubscription: authService.hasSubscription.bind(authService),
    fetchClientInformation: authService.fetchClientInformation.bind(authService),
    needsPasswordChange: authService.needsPasswordChange.bind(authService),
    deferPasswordChange,
    isPasswordChangeDeferred,
  };
}
