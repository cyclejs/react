import {
  createElement,
  ReactElement,
  ReactNode,
  ReactType,
  Attributes,
} from 'react';
import {incorporate} from './incorporate';

export type PropsExtensions = {
  sel?: string | symbol;
};

type PropsLike<P> = P & PropsExtensions & Attributes;

type Children = string | Array<ReactNode>;

function createElementSpreading<P = any>(
  type: ReactType<P>,
  props: PropsLike<P> | null,
  children: Children,
): ReactElement<P> {
  if (typeof children === 'string') {
    return createElement(type, props, children);
  } else {
    return createElement(type, props, ...children);
  }
}

function hyperscriptProps<P = any>(
  type: ReactType<P>,
  props: PropsLike<P>,
): ReactElement<P> {
  if (!props.sel) {
    return createElement(type, props);
  } else {
    return createElement(incorporate(type), props);
  }
}

function hyperscriptChildren<P = any>(
  type: ReactType<P>,
  children: Children,
): ReactElement<P> {
  return createElementSpreading(type, null, children);
}

function hyperscriptPropsChildren<P = any>(
  type: ReactType<P>,
  props: PropsLike<P>,
  children: Children,
): ReactElement<P> {
  if (!props.sel) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(incorporate(type), props, children);
  }
}

export function h<P = any>(
  type: ReactType<P>,
  a?: PropsLike<P> | Children,
  b?: Children,
): ReactElement<P> {
  if (a === undefined && b === undefined) {
    return createElement(type, null);
  }
  if (b === undefined && (typeof a === 'string' || Array.isArray(a))) {
    return hyperscriptChildren(type, a as Array<ReactNode>);
  }
  if (b === undefined && typeof a === 'object' && !Array.isArray(a)) {
    return hyperscriptProps(type, a);
  }
  if (
    a !== undefined &&
    typeof a !== 'string' &&
    !Array.isArray(a) &&
    b !== undefined
  ) {
    return hyperscriptPropsChildren(type, a, b);
  } else {
    throw new Error('Unexpected usage of h() function');
  }
}
