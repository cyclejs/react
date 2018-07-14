import xs, {Stream, MemoryStream} from 'xstream';
import {ReactElement, createElement} from 'react';
import {adapt} from '@cycle/run/lib/adapt';
import {Scope} from './scope';
import {ScopeContext} from './context';

type Sink = Stream<ReactElement<any>>;

export class ReactSource<P = any> {
  public _selector: string | symbol | null;
  public _scope: Scope;
  public _props$: MemoryStream<P>;
  public _childScopes: Map<string, Scope>;

  constructor(
    scope: Scope = new Scope(),
    selector: string | symbol | null = null,
    props$: MemoryStream<P> = xs.createWithMemory<P>(),
  ) {
    this._scope = scope;
    this._selector = selector;
    this._props$ = props$;
    this._childScopes = new Map();
  }

  public select(selector: string | symbol): ReactSource {
    return new ReactSource(this._scope, selector, this._props$);
  }

  public events(eventType: string): Stream<any> {
    if (this._selector === null) {
      return adapt(xs.empty());
    } else {
      return adapt(this._scope.getHandler(this._selector, eventType));
    }
  }

  public props(): MemoryStream<P> {
    return adapt(this._props$);
  }

  private getChildScope(scopeId: string): Scope {
    if (!this._childScopes.has(scopeId)) {
      this._childScopes.set(scopeId, new Scope());
    }
    return this._childScopes.get(scopeId) as Scope;
  }

  public isolateSink(sink: Sink, scopeId: string): Sink {
    const isolation = this.getChildScope(scopeId);
    return sink.map(elem =>
      createElement(ScopeContext.Provider, {value: isolation}, elem),
    );
  }

  public isolateSource(source: ReactSource, scopeId: string): ReactSource {
    const isolation = this.getChildScope(scopeId);
    return new ReactSource(isolation);
  }
}
