import xs, {Stream} from 'xstream';

export class Scope {
  public handlers: Map<string | symbol, Record<string, Stream<any>>>;
  public listeners: Map<string, () => void>;

  constructor() {
    this.handlers = new Map();
    this.listeners = new Map();
  }

  public getSelectorHandlers(selector: string | symbol) {
    return this.handlers.get(selector) ?? {};
  }

  public getHandler(selector: string | symbol, evType: string) {
    const sel: any = selector;
    const selHandlers =
      this.handlers.get(sel) ?? ({} as Record<string, Stream<any>>);
    this.handlers.set(sel, selHandlers);
    if (!selHandlers[evType]) {
      selHandlers[evType] = xs.create<any>();
      this.listeners.get(sel)?.();
    }
    return selHandlers[evType]!;
  }

  public subscribe(selector: string | symbol, listener: () => void) {
    const sel: any = selector;
    this.listeners.set(sel, listener);
    const that = this;
    return function unsubscribe() {
      that.listeners.delete(sel);
    };
  }
}
