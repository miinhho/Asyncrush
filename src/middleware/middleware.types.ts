import { EmitStream } from "@emiter/emit-stream";

/**
 * A middleware function that takes an EmitStream and returns a new EmitStream
 */
export type EmitAsyncMiddleware = Promise<EmitMiddleware>;
export type EmitMiddleware = (source: EmitStream) => EmitStream;
