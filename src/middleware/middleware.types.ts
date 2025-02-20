import { EmitStream } from "@emiter/emit-stream";

/**
 * A middleware function that takes an EmitStream and returns a new EmitStream
 */
export type EmitMiddleware = Promise<(source: EmitStream) => EmitStream>;
