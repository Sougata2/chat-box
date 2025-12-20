export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  defaultRole: Role;
}

export interface Role {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
