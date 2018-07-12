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
import {Stream} from 'xstream';
import {ScopeContext} from './context';
import {Sources, FantasySinks, Drivers, setup} from '@cycle/run';
import {ReactSource} from './ReactSource';
import {StreamRenderer} from './StreamRenderer';

type RunOnDidMount = () => {
  source: ReactSource;
  sink: Stream<ReactElement<any>>;
  dispose?: () => void;
};

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
      this._latestProps = props;
    }

    public _latestProps: P;
    public _dispose?: () => void;

    public componentDidMount() {
      const {source, sink, dispose} = run();
      source._props$._n(this.props);
      this._latestProps = this.props;
      this._dispose = dispose;
      this.setState({source, sink});
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

    public componentDidUpdate(props: P) {
      if (!this.state.source) return;
      if (props === this._latestProps) return;
      this.state.source._props$._n(props);
      this._latestProps = props;
    }

    public componentWillUnmount() {
      if (this._dispose) this._dispose();
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
      const dispose = program.run();
      return {source, sink, dispose};
    });
  } else {
    return makeCycleReactComponent<P>(() => {
      const source = new ReactSource();
      const sink = main({[channel]: source} as any)[channel];
      return {source, sink};
    });
  }
}
