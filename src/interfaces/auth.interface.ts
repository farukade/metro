export interface IAuthUser {
  id: number;
  email: string;
}

declare module "express" {
  interface Request {
    user: IAuthUser;
    files?: any;
  }
}
