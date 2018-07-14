import {
  PureComponent,
  createElement,
  Component,
  ComponentElement,
  ComponentClass,
  StatelessComponent,
  InputHTMLAttributes,
  DetailedReactHTMLElement,
  forwardRef,
} from 'react';
import {Scope} from './scope';
import {ScopeContext} from './context';

const wrapperComponents: Map<any, React.ComponentType<any>> = new Map();

type Props = {
  targetProps: any;
  targetRef: any;
  target: any;
  scope: Scope;
};

type State = {
  flip: boolean;
};

export class Incorporator extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {flip: false};
    this.selector = props.targetProps.selector;
  }

  private selector: string | symbol;
  private unsubscribe: any;

  public componentDidMount() {
    const {targetProps, scope} = this.props;
    const selector = targetProps.selector;
    this.unsubscribe = scope.subscribe(selector, () => {
      this.setState((prev: any) => ({flip: !prev.flip}));
    });
  }

  private incorporateHandlers<P>(props: P, scope: Scope): P {
    const handlers = scope.getSelectorHandlers(this.selector);
    for (const evType of Object.keys(handlers)) {
      const onFoo = `on${evType[0].toUpperCase()}${evType.slice(1)}`;
      props[onFoo] = (ev: any) => handlers[evType]._n(ev);
    }
    return props;
  }

  public render() {
    const {target, targetProps, targetRef, scope} = this.props;
    this.incorporateHandlers(targetProps, scope);
    if (targetRef) {
      targetProps.ref = targetRef;
    }
    if (targetProps.children) {
      return createElement(target, targetProps, targetProps.children);
    } else {
      return createElement(target, targetProps);
    }
  }

  public componentWillUnmount() {
    this.unsubscribe();
  }
}

export function incorporate(type: any) {
  if (!wrapperComponents.has(type)) {
    wrapperComponents.set(
      type,
      forwardRef<any, any>((props, ref) =>
        createElement(ScopeContext.Consumer, null, (scope: Scope) =>
          createElement(Incorporator, {
            targetProps: {...props},
            targetRef: ref,
            target: type,
            scope: scope,
          }),
        ),
      ),
    );
  }
  return wrapperComponents.get(type) as React.ComponentType<any>;
}
