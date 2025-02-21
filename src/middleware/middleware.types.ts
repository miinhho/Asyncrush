import { EmitStream } from "@emiter/emit-stream";

/**
 * Middleware function that transforms stream values
 * @template T - Input value type
 * @template R - Output value type
 * @param source - Input stream
 * @returns Output stream
 */
export type EmitMiddleware<T, R> = (source: EmitStream<T>) => EmitStream<R>;

