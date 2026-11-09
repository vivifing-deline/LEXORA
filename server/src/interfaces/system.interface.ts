import { IPaginationOptions } from './pagination.interface.js';

export interface IUserFilter extends IPaginationOptions {
  workspaceId: string;
  search?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface ICreateUserDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  designation?: string;
  phone?: string;
  roleIds?: string[];
  departmentId?: string;
}

export interface IUpdateUserDto extends Partial<ICreateUserDto> {
  isActive?: boolean;
}

export interface ICreateRoleDto {
  name: string;
  displayName: string;
  description?: string;
  permissionIds?: string[];
}

export interface IUpdateRoleDto extends Partial<ICreateRoleDto> {}

export interface ICreatePermissionDto {
  code: string;
  module: string;
  action: string;
  description?: string;
}

export interface IUpdatePermissionMatrixDto {
  roleId: string;
  permissionIds: string[];
}

