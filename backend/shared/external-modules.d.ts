declare module '@neondatabase/serverless' {
  export function neon(connectionString: string): any;
}

declare module 'bcryptjs' {
  const bcrypt: {
    compare(plain: string, hashed: string): Promise<boolean>;
    hash(plain: string, rounds: number): Promise<string>;
  };
  export default bcrypt;
}

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    sub?: string;
    iat?: number;
    exp?: number;
    [key: string]: unknown;
  }

  const jwt: {
    sign(payload: object, secret: string, options?: object): string;
    verify(token: string, secret: string, options?: object): JwtPayload | string;
  };

  export default jwt;
}

