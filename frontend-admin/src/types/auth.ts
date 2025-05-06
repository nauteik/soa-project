export enum UserRole {
  USER = 'USER',
  STAFF = 'STAFF',
  MANAGER = 'MANAGER'
}

export interface User {
  id: number;
  name: string;
  email: string;
  mobileNumber?: string;
  profileImage?: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}


export interface AuthResponse {
  token: string;
  user: User;
}

export interface PasswordUpdateRequest {
  currentPassword: string;
  newPassword: string;
} 