// User types
export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  salary?: number;
  payment_rate?: number;
}

export interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  capacity: number; // 0-100%
}

export type UserRole = 'OWNER' | 'ADMIN' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Task types
export interface Task {
  id: number;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: number;
  assignee_name: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  payment_amount?: number; // Owner-only field
  is_paid?: boolean;       // Owner-only field
}

export type TaskCategory = 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'HR' | 'FINANCE' | 'OPERATIONS' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'OVERDUE' | 'CANCELLED';

// Financial types
export interface FinancialSummary {
  total_users: number;
  active_users: number;
  total_tasks: number;
  completed_tasks: number;
  completion_rate: number;
  total_payment_cents: number;
  total_payment_usd: string;
}