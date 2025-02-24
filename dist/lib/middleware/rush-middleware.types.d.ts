export type RushMiddleware<I, O> = (value: I) => O | Promise<O>;
