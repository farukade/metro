export interface IAuthUser {
  id: number;
  username: string;
  email?: string;
}

declare module "express" {
  interface Request {
    user: IAuthUser;
    files?: any;
  }
}
