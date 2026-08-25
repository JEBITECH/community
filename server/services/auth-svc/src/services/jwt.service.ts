import jwt, { SignOptions } from 'jsonwebtoken';
import { User, Membership } from '@shared/entities';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: number | null;
  membershipId: string | null;
}

export class JwtService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'your-access-secret';
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

    // Production Configuration
    // Access token: 1 hour (auto-refreshed by frontend)
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '1h';

    // Refresh token: 7 days (maximum session duration)
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  /**
   * `membership` is the caller's currently-active org membership. Master Admin
   * accounts (platform-level, not org-scoped) pass null/undefined.
   */
  generateAccessToken(user: User, membership?: Membership | null): string {
    const payload: JwtPayload = {
      userId: user.id!,
      email: user.email,
      role: membership ? membership.role : user.role,
      organizationId: membership ? membership.organization_id : null,
      membershipId: membership ? membership.id : null,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
      issuer: 'auth-service',
      audience: 'community-system'
    } as SignOptions);
  }

  generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      tokenType: 'refresh'
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
      issuer: 'auth-service',
      audience: 'community-system'
    } as SignOptions);
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.accessTokenSecret) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.refreshTokenSecret);
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  generateTokenPair(user: User, membership?: Membership | null): { accessToken: string; refreshToken: string } {
    return {
      accessToken: this.generateAccessToken(user, membership),
      refreshToken: this.generateRefreshToken(user)
    };
  }
}
