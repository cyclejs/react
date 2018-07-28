import {
  PureComponent,
  Component,
  ProviderProps,
  ReactNodeArray,
  ReactPortal,
  ReactElement,
  createElement,
  ComponentType,
} from 'react';
import {Stream, Subscription} from 'xstream';
import {ScopeContext} from './context';
import {Sources, FantasySinks, Drivers, setup} from '@cycle/run';
import {ReactSource} from './ReactSource';
import {StreamRenderer} from './StreamRenderer';

type CycleReactEngine = {
  source: ReactSource;
  sink: Stream<ReactElement<any>>;
  events?: {[name: string]: Stream<any>};
  dispose?: () => void;
};

type RunOnDidMount = () => CycleReactEngine;

type State = {
  source: ReactSource | null;
  sink: Stream<ReactElement<any>> | null;
};

export function makeCycleReactComponent<P = any>(
  run: RunOnDidMount,
): ComponentType<P> {
  return class CycleReactComponent extends PureComponent<P, State> {
    constructor(props: P) {
      super(props);
      this.state = {source: null, sink: null};
      this._subs = [];
    }

    public _dispose?: () => void;
    public _subs: Array<Subscription>;

    public componentDidMount() {
      const {source, sink, events, dispose} = run();
      source._props$._n(this.props);
      this._dispose = dispose;
      if (events) {
        this._subscribeToEvents(events);
      }
      this.setState({source, sink});
    }

    public _subscribeToEvents(events: Pick<CycleReactEngine, 'events'>) {
      if (!events) return;
      for (let name in events) {
        if (!events[name]) continue;
        const handlerName = `on${name[0].toUpperCase()}${name.slice(1)}`;
        this._subs.push(
          events[name].subscribe({
            next: x => {
              if (this.props[handlerName]) this.props[handlerName](x);
            },
          }),
        );
      }
    }

    public render() {
      const {source, sink} = this.state;
      if (!source || !sink) return null;
      return createElement(
        ScopeContext.Provider,
        {value: source._scope},
        createElement(StreamRenderer, {stream: sink}),
      );
    }

    public componentDidUpdate(prevProps: P) {
      if (!this.state.source) return;
      if (this.props === prevProps) return;
      this.state.source._props$._n(this.props);
    }

    public componentWillUnmount() {
      if (this._dispose) this._dispose();
      for (const sub of this._subs) {
        sub.unsubscribe();
      }
    }
  };
}

export function makeComponent<
  So extends Sources,
  Si extends FantasySinks<Si>,
  P = any
>(
  main: (sources: So) => Si,
  drivers: Drivers<So, Si> = null as any,
  channel: string = 'react',
): ComponentType<P> {
  if (drivers) {
    return makeCycleReactComponent<P>(() => {
      const program = setup(main, {
        ...(drivers as object),
        [channel]: () => new ReactSource(),
      } as any);
      const source: ReactSource = program.sources[channel];
      const sink = program.sinks[channel];
      const events = {...(program.sinks as object)};
      delete events[channel];
      for (let name in events) {
        if (name in drivers) delete events[name];
      }
      const dispose = program.run();
      return {source, sink, events, dispose};
    });
  } else {
    return makeCycleReactComponent<P>(() => {
      const source = new ReactSource();
      const sinks = main({[channel]: source} as any);
      const events = {...(sinks as object)};
      delete events[channel];
      const sink = sinks[channel];
      return {source, sink, events};
    });
  }
}
