export interface AppUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  active: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}
