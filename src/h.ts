import {createElement} from 'react';
import {incorporate} from './incorporate';

export type PropsExtensions = {
  sel?: string | symbol;
};

function createElementSpreading<P>(
  type: React.ReactType<P>,
  props: P | null,
  children: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  if (typeof children === 'string') {
    return createElement(type, props, children);
  } else {
    return createElement(type, props, ...children);
  }
}

function hyperscriptProps<P>(
  type: React.ReactType<P>,
  props: P & PropsExtensions,
): React.ReactElement<P> {
  if (!props.sel) {
    return createElement(type, props);
  } else {
    return createElement(incorporate(type), props);
  }
}

function hyperscriptChildren<P>(
  type: React.ReactType<P>,
  children: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  return createElementSpreading(type, null, children);
}

function hyperscriptPropsChildren<P>(
  type: React.ReactType<P>,
  props: P & PropsExtensions,
  children: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  if (!props.sel) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(incorporate(type), props, children);
  }
}

export function h<P>(
  type: React.ReactType<P>,
  a?: (P & PropsExtensions) | string | Array<React.ReactElement<any>>,
  b?: string | Array<React.ReactElement<any>>,
): React.ReactElement<P> {
  if (a === undefined && b === undefined) {
    return createElement(type, null);
  }
  if (b === undefined && (typeof a === 'string' || Array.isArray(a))) {
    return hyperscriptChildren(type, a);
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
