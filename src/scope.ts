import xs, {Stream} from 'xstream';

export interface Handlers {
  [selector: string]: {
    [evType: string]: Stream<any>;
  };
};

export interface Listeners {
  [selector: string]: () => void;
};

export class Scope {
  public handlers: Handlers;
  public listeners: Listeners;

  constructor() {
    this.handlers = {};
    this.listeners = {};
  }

  public getSelectorHandlers(selector: string | symbol) {
    return this.handlers[selector as any] || {};
  }

  public getHandler(selector: string | symbol, evType: string) {
    const sel: any = selector;
    this.handlers[sel] = this.handlers[sel] || {};
    if (!this.handlers[sel][evType]) {
      this.handlers[sel][evType] = xs.create<any>();
      if (this.listeners[sel]) {
        this.listeners[sel]();
      }
    }
    return this.handlers[sel][evType];
  }

  public subscribe(selector: string | symbol, listener: () => void) {
    const sel: any = selector;
    this.listeners[sel] = listener;
    const that = this;
    return function unsubscribe() {
      delete that.listeners[sel];
    };
  }
}
