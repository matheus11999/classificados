interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  whatsapp?: string;
  cpf?: string;
  activeAdsCount: string;
  createdAt: string;
  updatedAt: string;
  profileImageUrl?: string;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

class UserAuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.token = localStorage.getItem('user_token');
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        this.user = JSON.parse(userData);
      } catch (e) {
        this.logout();
      }
    }
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no login');
    }

    const data: LoginResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    
    return data;
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no cadastro');
    }

    const data: LoginResponse = await response.json();
    
    this.token = data.token;
    this.user = data.user;
    
    localStorage.setItem('user_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    
    return data;
  }

  logout(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('No user token available');
    }
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.logout();
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const user = await this.apiCall('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    
    this.user = user;
    localStorage.setItem('user_data', JSON.stringify(user));
    
    return user;
  }

  async getUserAds(): Promise<any[]> {
    return this.apiCall('/api/user/ads');
  }

  async getNotifications(): Promise<any[]> {
    return this.apiCall('/api/notifications');
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await this.apiCall(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.apiCall(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // Check if user can create more ads
  canCreateAd(maxAds: number): boolean {
    if (!this.user) return false;
    return parseInt(this.user.activeAdsCount) < maxAds;
  }
}

export const userAuth = new UserAuthService();