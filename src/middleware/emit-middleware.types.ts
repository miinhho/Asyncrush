export interface EmitMiddleware<I, O> {
  (value: I): O | Promise<O>;
}
