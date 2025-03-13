import { RushDebugHook, RushSubject, RushSubscriber } from "../../lib";

describe("flow control", () => {
  let subject: RushSubject;
  let rushSpy: RushDebugHook;

  beforeEach(() => {
    subject = new RushSubject();
    rushSpy = {
      onEmit: jest.fn(),
      onError: jest.fn(),
      onListen: jest.fn(),
      onUnlisten: jest.fn(),
      onSubscribe: jest.fn(),
      onUnsubscribe: jest.fn(),
    }
    subject.debug(rushSpy);
  });

  it("should call next", () => {
    subject.next('test value');
    expect(rushSpy.onEmit).toHaveBeenCalledWith('test value');
  });

  it("should call error", () => {
    const testError = new Error('test error');
    subject.error(testError);
    expect(rushSpy.onError).toHaveBeenCalledWith(testError);
  });

  it("should call complete", () => {
    const completeSpy = jest.fn();

    subject.listen({
      complete: completeSpy
    });
    subject.complete();

    expect(completeSpy).toHaveBeenCalled();
  });

  it("should listen", () => {
    subject.listen({
      next: () => { },
      error: () => { },
      complete: () => { },
    });

    expect(rushSpy.onListen).toHaveBeenCalled();
  });

  it("should unlisten by destroy", () => {
    subject.unlisten('destroy');
    expect(rushSpy.onUnlisten).toHaveBeenCalledWith('destroy');
  });

  it("should unlisten by complete", () => {
    subject.unlisten('complete');
    expect(rushSpy.onUnlisten).toHaveBeenCalledWith('complete');
  });

  it("should subscribe", () => {
    const sub = new RushSubscriber();
    subject.subscribe(sub);
    expect(rushSpy.onSubscribe).toHaveBeenCalledWith(sub);
  });

  it("should unsubscribe", () => {
    const sub = new RushSubscriber();
    subject.subscribe(sub).unsubscribe(sub);
    expect(rushSpy.onUnsubscribe).toHaveBeenCalledWith(sub);
  });
});
