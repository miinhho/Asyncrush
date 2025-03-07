import { RushStream } from '../';

/**
 * Merges multiple streams into a single stream
 * @param streams - The streams to merge
 */
export const mergeStream = <T>(...streams: RushStream<T>[]): RushStream<T> => {
  return new RushStream<T>((observer) => {
    let completedStreams = 0;
    const streamBundle = streams.map((stream) => {
      return stream.listen({
        next: (value) => observer.next(value),
        error: (error) => observer.error(error),
        complete: () => {
          completedStreams++;
          if (completedStreams === streams.length) observer.complete();
        },
      });
    });

    return () => streamBundle.forEach((stream) => stream.unlisten());
  });
};
