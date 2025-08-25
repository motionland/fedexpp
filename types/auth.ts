export interface Auth {
  email?: string;
  password?: string;
  pin?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  pin?: string;
  role: "admin" | "user";
  department: string;
  status: "active" | "inactive";
}
