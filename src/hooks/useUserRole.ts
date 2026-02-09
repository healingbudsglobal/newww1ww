/**
 * useUserRole Hook
 * 
 * Detects user roles from Supabase and provides role-based state.
 * Supports tiered roles: root_admin > admin > operator > user
 * 
 * Role hierarchy (has_role DB function handles inheritance):
 * - root_admin: inherits admin + operator permissions
 * - admin: inherits operator permissions  
 * - operator: limited storefront access
 * - user: patient/client access only
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export type AppRole = 'root_admin' | 'admin' | 'moderator' | 'operator' | 'user';

interface UserRoleState {
  user: User | null;
  /** True if user has admin-level access (admin or root_admin) */
  isAdmin: boolean;
  /** True if user is the root platform admin */
  isRootAdmin: boolean;
  /** True if user has operator-level access (operator, admin, or root_admin) */
  isOperator: boolean;
  isModerator: boolean;
  /** The highest role the user holds */
  highestRole: AppRole | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const ROLE_PRIORITY: Record<string, number> = {
  root_admin: 4,
  admin: 3,
  moderator: 2,
  operator: 1,
  user: 0,
};

export const useUserRole = (): UserRoleState => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRootAdmin, setIsRootAdmin] = useState(false);
  const [isOperator, setIsOperator] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [highestRole, setHighestRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkRoles = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(false);
      setIsRootAdmin(false);
      setIsOperator(false);
      setIsModerator(false);
      setHighestRole(null);
      setIsLoading(false);
      return;
    }

    try {
      // Query all roles for this user directly
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', currentUser.id);

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        setError(rolesError.message);
        setIsLoading(false);
        return;
      }

      const roleNames = (roles || []).map(r => r.role as string);
      
      const hasRootAdmin = roleNames.includes('root_admin');
      const hasAdmin = hasRootAdmin || roleNames.includes('admin');
      const hasOperator = hasAdmin || roleNames.includes('operator');
      const hasModerator = roleNames.includes('moderator');

      setIsRootAdmin(hasRootAdmin);
      setIsAdmin(hasAdmin);
      setIsOperator(hasOperator);
      setIsModerator(hasModerator);

      // Determine highest role
      let highest: AppRole = 'user';
      for (const roleName of roleNames) {
        if ((ROLE_PRIORITY[roleName] ?? 0) > (ROLE_PRIORITY[highest] ?? 0)) {
          highest = roleName as AppRole;
        }
      }
      setHighestRole(roleNames.length > 0 ? highest : null);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          setTimeout(() => {
            checkRoles(currentUser);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsRootAdmin(false);
          setIsOperator(false);
          setIsModerator(false);
          setHighestRole(null);
          setIsLoading(false);
        }
      }
    );

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
    isRootAdmin,
    isOperator,
    isModerator,
    highestRole,
    isLoading,
    error,
    refetch
  };
};

export default useUserRole;
