interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface LoginResponse {
  token: string;
  admin: AdminUser;
}

class AdminAuthService {
  private token: string | null = null;
  private admin: AdminUser | null = null;

  constructor() {
    this.token = localStorage.getItem('admin_token');
    const adminData = localStorage.getItem('admin_user');
    if (adminData) {
      this.admin = JSON.parse(adminData);
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro no login');
    }

    const data: LoginResponse = await response.json();
    
    this.token = data.token;
    this.admin = data.admin;
    
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.admin));
    
    return data;
  }

  logout(): void {
    this.token = null;
    this.admin = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.admin;
  }

  getToken(): string | null {
    return this.token;
  }

  getAdmin(): AdminUser | null {
    return this.admin;
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('No admin token available');
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
}

export const adminAuth = new AdminAuthService();