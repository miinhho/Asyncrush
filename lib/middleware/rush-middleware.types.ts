/**
 * Middleware function type
 * @param value - The input value
 * @returns The output value or a promise that resolves to the output value
 */
export type RushMiddleware<I, O> = (value: I) => O | Promise<O>;
