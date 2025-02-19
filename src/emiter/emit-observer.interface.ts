export interface EmitObserverImpl<T> {
  next: (value: T) => void;
  error: (err: any) => void;
  complete: () => void;
}
