declare type D1Result<T = unknown> = {
  results?: T[];
  success?: boolean;
  meta?: unknown;
};

declare interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
}

declare interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

declare interface EventContext<Env = unknown, P extends string = string, Data = unknown> {
  request: Request;
  env: Env;
  params: Data;
  waitUntil(promise: Promise<unknown>): void;
  next(input?: Request | string, init?: RequestInit): Promise<Response>;
  data: Record<string, unknown>;
  functionPath: P;
}
