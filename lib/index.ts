import { RushObserver, RushStream, RushSubscriber } from './core';

import type {
  BackpressureOptions,
  BackpressureResult,
  RushDebugHook,
  RushMiddleware,
  RushObserverImpl,
  RushObserveStream,
  RushOptions,
  RushUseOption,
} from './types';

import {
  addDOMListener,
  addEmitterListener,
  BackpressureController,
  BackpressureMode,
  cleanupManager,
  createEventCleanup,
  createEventPool,
  DEFAULT_BACKPRESSURE_OPTIONS,
  EventCleanupManager,
  ObjectPool,
  PoolableEvent,
} from './manager';

import {
  combineLatest,
  createStream,
  createSubscriber,
  fromDOMEvent,
  fromEmitter,
  fromPromise,
  fromValues,
  mergeStreams,
  setBackpressure,
  withBuffer,
  withDelay,
  withInterval,
} from './utils';

export {
  addDOMListener,
  addEmitterListener,
  BackpressureController,
  BackpressureMode,
  cleanupManager,
  combineLatest,
  createEventCleanup,
  createEventPool,
  createStream,
  createSubscriber,
  DEFAULT_BACKPRESSURE_OPTIONS,
  EventCleanupManager,
  fromDOMEvent,
  fromEmitter,
  fromPromise,
  fromValues,
  mergeStreams,
  ObjectPool,
  PoolableEvent,
  RushObserver,
  RushStream,
  RushSubscriber,
  setBackpressure,
  withBuffer,
  withDelay,
  withInterval,
};

export type {
  BackpressureOptions,
  BackpressureResult,
  RushDebugHook,
  RushMiddleware,
  RushObserverImpl,
  RushObserveStream,
  RushOptions,
  RushUseOption,
};
