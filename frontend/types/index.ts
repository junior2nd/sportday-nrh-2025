// Type definitions for NRSport

export interface User {
  id: number;
  username: string;
  email?: string;
  role: "superadmin" | "org_admin" | "staff" | "viewer";
  org?: number;
  org_id?: number;
  org_name?: string;
  is_active: boolean;
}

export interface Organization {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
}

export interface Event {
  id: number;
  org: number;
  org_id?: number;
  org_name: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "draft" | "active" | "completed" | "cancelled";
  status_display: string;
  settings: Record<string, any>;
}

export type UserRole = "superadmin" | "org_admin" | "staff" | "viewer";

