// src/types/index.ts

// User types
export interface User {
  id: string;              // ✅ Hierarchical ID like "CA1-S-000001"
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  position?: string;
  status: UserStatus;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  avatar_url?: string;
  company_id?: number;
  company_name?: string;
  company_code?: string;
  parent_id?: string; 
  salary?: number;
  payment_rate?: number;
  confidential_notes?: string;
  is_online?: boolean;
  last_seen?: string;
}

export interface UserProfile {
  id: string;              // ✅ Hierarchical ID
  username: string;
  full_name: string;
  role: UserRole;
  position?: string;
  status: UserStatus;
  capacity: number;
  avatar_url?: string;
  company_id?: number;
  company_code?: string;
  is_online?: boolean;
  last_seen?: string;
  salary?: number;           // Monthly salary in cents
  payment_rate?: number;
}

export type UserRole = 'super_admin' | 'admin' | 'member';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'BUSY' | 'OFFLINE';

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// ✅ ADDED: User creation payload
export interface UserCreate {
  email: string;
  username?: string;
  full_name: string;
  password: string;
  position: string;
  role: UserRole;
  company_id?: number;
  company_code?: string;
  parent_id: string;      // ✅ References User.id (string)
  salary?: number;
  payment_rate?: number;
  confidential_notes?: string;
}

// Task types
export interface Task {
  id: number;              // ✅ Task ID is integer (backend uses Integer for tasks)
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: string;     // ✅ CHANGED: number → string (references User.id)
  assignee_name?: string;
  assigned_by_id?: string; // ✅ CHANGED: number → string (references User.id)
  due_date: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  payment_amount?: number;
  is_paid?: boolean;
  requirements?: string;
  requirements_checklist?: any;
  client_name?: string;
  company_name?: string;
  image_url?: string;    
  image_urls?: string[];
  estimated_hours?: number;
  ai_priority_score?: number;
  progress?: number;
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

// Company types
export interface CompanyCreate {
  name: string;
  code: string;
  description?: string;
  company_code?: string;
  is_active?: boolean;
}

export interface CompanyWithAdminResponse {
  company: {
    id: number;
    company_code: string;
    name: string;
    code: string;
    description?: string;
    is_active: boolean;
  };
  admin: User;
  access_token: string;
  token_type: string;
}