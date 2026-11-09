export interface IJwtPayload {
  id: string;
  email: string;
  workspaceId: string;
  roles: string[];
  permissions: string[];
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    designation: string | null;
    avatarUrl: string | null;
    workspaceId: string;
    workspaceName: string;
    roles: string[];
    permissions: string[];
  };
  token: string;
}

export interface IChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

