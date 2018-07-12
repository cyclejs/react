import xs, {Stream} from 'xstream';

export type Handlers = {
  [selector: string]: {
    [evType: string]: Stream<any>;
  };
};

export type Listeners = {
  [selector: string]: () => void;
};

export class Scope {
  public handlers: Handlers;
  public listeners: Listeners;

  constructor() {
    this.handlers = {};
    this.listeners = {};
  }

  public getSelectorHandlers(selector: string) {
    return this.handlers[selector] || {};
  }

  public getHandler(selector: string, evType: string) {
    this.handlers[selector] = this.handlers[selector] || {};
    if (!this.handlers[selector][evType]) {
      this.handlers[selector][evType] = xs.create<any>();
      if (this.listeners[selector]) {
        this.listeners[selector]();
      }
    }
    return this.handlers[selector][evType];
  }

  public subscribe(selector: string, listener: () => void) {
    this.listeners[selector] = listener;
    const that = this;
    return function unsubscribe() {
      delete that.listeners[selector];
    };
  }
}
