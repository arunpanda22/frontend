import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/lib/context/AuthContext';
import { apiClient } from '@/lib/api/config';

export interface ConnectedAdvertisingProfile {
  profile_id: string;
  region: string;
  is_active: boolean;
  created_at: string;
}

export interface UserProfile {
  id: number;
  email: string;
  firebase_uid: string;
  username: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
  connected_advertising_profiles: ConnectedAdvertisingProfile[];
}

export const useUserProfile = (): UseQueryResult<UserProfile, Error> => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      const response = await apiClient.get('/api/v1/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      return response.data;
    },
    enabled: !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}; 