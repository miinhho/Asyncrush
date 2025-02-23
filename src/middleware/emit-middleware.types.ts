export type EmitMiddleware<I, O> = (value: I) => O | Promise<O>;
