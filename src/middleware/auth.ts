import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin, isServerConfigValid } from '../lib/supabase-server.ts';
import { User } from '@supabase/supabase-js';
import { UserRole } from '../types.ts';

export interface AuthUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  idNumber: string;
  department: string;
}

export interface AuthRequest extends Request {
  user?: User;
  userProfile?: AuthUserProfile;
}

/**
 * Authentication middleware that verifies JWT Bearer tokens with Supabase Auth.
 * Fails safely with 401 if missing, invalid, or expired.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or malformed authorization header. Bearer token required.',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Empty token provided.' });
  }

  if (!isServerConfigValid()) {
    return res.status(503).json({
      error: 'Service Unavailable: Supabase server environment is not configured.',
    });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data: { user }, error } = await admin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid or expired session token.',
        details: error?.message,
      });
    }

    req.user = user;
    next();
  } catch (error: any) {
    console.error('Error verifying Supabase token in requireAuth:', error?.message);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed.' });
  }
};

/**
 * Authorization middleware that verifies the user's authoritative role
 * by querying the database profiles table, rather than trusting client claims.
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    if (!isServerConfigValid()) {
      return res.status(503).json({
        error: 'Service Unavailable: Database configuration incomplete.',
      });
    }

    try {
      const admin = getSupabaseAdmin();
      const { data: profile, error } = await admin
        .from('profiles')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();

      if (error) {
        console.error('Database query error in requireRole:', error.message);
        return res.status(500).json({ error: 'Database error validating account permissions.' });
      }

      if (!profile) {
        return res.status(403).json({
          error: 'Forbidden: No institutional profile found for this authenticated user.',
        });
      }

      const role = profile.role as UserRole;
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: `Forbidden: Role '${role}' is not authorized to access this resource.`,
          requiredRoles: allowedRoles,
        });
      }

      req.userProfile = {
        id: profile.id,
        name: profile.name,
        email: profile.email || req.user.email || '',
        role: role,
        idNumber: profile.id_number || profile.idNumber || '',
        department: profile.department || '',
      };

      next();
    } catch (err: any) {
      console.error('Exception in requireRole middleware:', err?.message);
      return res.status(500).json({ error: 'Internal server error verifying authorization.' });
    }
  };
};
