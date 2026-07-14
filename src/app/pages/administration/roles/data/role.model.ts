export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

export interface RoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export interface PermissionDescriptor {
  id: number;
  name: string;
  description: string;
  module: string;
}
