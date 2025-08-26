import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // Check if there's a token in localStorage before making the request
  const token = typeof window !== 'undefined' ? localStorage.getItem('user_token') : null;
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: !!token, // Only make request if token exists
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
