export interface UserProfile {
  name?: string | null;
  email?: string | null;
  isTwoFactorEnabled?: boolean | null;
}

export interface BarProps {
  user?: UserProfile | null;
}