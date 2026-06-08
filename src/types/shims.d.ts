declare const process: {
  env: Record<string, string | undefined>;
  exit(code?: number): never;
};

declare module "node:path" {
  const path: any;
  export default path;
}

declare module "cors" {
  const cors: any;
  export default cors;
}

declare module "jsonwebtoken" {
  const jwt: {
    sign: (...args: any[]) => string;
    verify: (...args: any[]) => any;
  };
  export default jwt;
  export type JwtPayload = any;
}

declare module "express" {
  export type Request = any;
  export type Response = any;
  export type NextFunction = any;

  export interface Router {
    use: (...args: any[]) => any;
    get(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): any;
    get(...args: any[]): any;
    post(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): any;
    post(...args: any[]): any;
    put(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): any;
    put(...args: any[]): any;
    patch(path: string, handler: (req: Request, res: Response, next?: NextFunction) => any): any;
    patch(...args: any[]): any;
  }

  export interface Application extends Router {
    listen: (...args: any[]) => any;
  }

  function express(): Application;
  namespace express {
    function json(): any;
    function static(...args: any[]): any;
  }

  export default express;
  export function Router(): Router;
}
