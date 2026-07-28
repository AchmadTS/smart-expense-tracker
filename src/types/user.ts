export interface UserProfile {
  name?: string | null;
  email?: string | null;
}

export interface BarProps {
  user?: UserProfile | null;
}