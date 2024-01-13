export interface ILogin {
  email: string;
  password: string;
}

export interface IResetPassword {
  oldPassword: string;
  password: string;
}

export interface IUser {
  name?: string;
  fullname?: string;
  password?: string;
  roleId?: string;
  email?: string;
  idNo?: string;
  phone?: string;
  address?: string;
  image?: string;
  status?: boolean;
}
