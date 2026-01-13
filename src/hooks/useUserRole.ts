/**
 * useUserRole Hook
 * 
 * Detects user roles from Supabase and provides role-based state.
 * Caches results to prevent repeated queries.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserRoleState {
  user: User | null;
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UserRoleState => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkRoles = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsModerator(false);
      setIsLoading(false);
      return;
    }

    try {
      // Check admin role using the has_role RPC function
      const { data: hasAdminRole, error: adminError } = await supabase.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'admin'
      });

      if (adminError) {
        console.error('Error checking admin role:', adminError);
        setError(adminError.message);
      } else {
        setIsAdmin(!!hasAdminRole);
      }

      // Check moderator role
      const { data: hasModeratorRole, error: modError } = await supabase.rpc('has_role', {
        _user_id: currentUser.id,
        _role: 'moderator'
      });

      if (modError) {
        console.error('Error checking moderator role:', modError);
      } else {
        setIsModerator(!!hasModeratorRole);
      }
    } catch (err) {
      console.error('Error checking roles:', err);
      setError(err instanceof Error ? err.message : 'Failed to check roles');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await checkRoles(user);
  }, [user, checkRoles]);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        // Use setTimeout to defer role check (avoid Supabase deadlock)
        if (currentUser) {
          setTimeout(() => {
            checkRoles(currentUser);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsModerator(false);
          setIsLoading(false);
        }
      }
    );

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      checkRoles(currentUser);
    });

    return () => subscription.unsubscribe();
  }, [checkRoles]);

  return {
    user,
    isAdmin,
    isModerator,
    isLoading,
    error,
    refetch
  };
};

export default useUserRole;
