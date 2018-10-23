import {createElement, ReactElement, ReactType} from 'react';
import {incorporate} from './incorporate';

export type PropsExtensions = {
  sel?: string | symbol;
};

function createElementSpreading<P = any>(
  type: ReactType<P>,
  props: P | null,
  children: string | Array<ReactElement<any>>,
): ReactElement<P> {
  if (typeof children === 'string') {
    return createElement(type, props, children);
  } else {
    return createElement(type, props, ...children);
  }
}

function hyperscriptProps<P = any>(
  type: ReactType<P>,
  props: P & PropsExtensions,
): ReactElement<P> {
  if (!props.sel) {
    return createElement(type, props);
  } else {
    return createElement(incorporate(type), props);
  }
}

function hyperscriptChildren<P = any>(
  type: ReactType<P>,
  children: string | Array<ReactElement<any>>,
): ReactElement<P> {
  return createElementSpreading(type, null, children);
}

function hyperscriptPropsChildren<P = any>(
  type: ReactType<P>,
  props: P & PropsExtensions,
  children: string | Array<ReactElement<any>>,
): ReactElement<P> {
  if (!props.sel) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(incorporate(type), props, children);
  }
}

export function h<P = any>(
  type: ReactType<P>,
  a?: (P & PropsExtensions) | string | Array<ReactElement<any>>,
  b?: string | Array<React.ReactElement<any>>,
): ReactElement<P> {
  if (a === undefined && b === undefined) {
    return createElement(type, null);
  }
  if (b === undefined && (typeof a === 'string' || Array.isArray(a))) {
    return hyperscriptChildren(type, a as string | Array<ReactElement<any>>);
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
