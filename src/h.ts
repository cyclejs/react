import {
  createElement,
  ReactElement,
  ReactNode,
  ElementType,
  ReactHTML,
  Attributes,
} from 'react';
import {incorporate, setIncorporator} from './incorporate';
import {setModules, hasModuleProps, Modulizer} from './Modulizer';
import Incorporator from './Incorporator';

export type PropsExtensions = {
  sel?: string | symbol;
};

let shouldIncorporate = props => props.sel

export function useModules(modules: any) {
  if (!modules || typeof modules !== 'object') return 

  setModules(modules);
  shouldIncorporate = props => props.sel || hasModuleProps(props)
  setIncorporator(Modulizer)
}

type PropsLike<P> = P & PropsExtensions & Attributes;

type Children = string | Array<ReactNode>;

function createElementSpreading<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  props: PropsLike<P> | null,
  children: Children
): ReactElement<P> {
  if (typeof children === 'string') {
    return createElement(type, props, children);
  } else {
    return createElement(type, props, ...children);
  }
}

function hyperscriptProps<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  props: PropsLike<P>
): ReactElement<P> {
  if (!shouldIncorporate(props)) {
    return createElement(type, props);
  } else {
    return createElement(incorporate(type), props);
  }
}

function hyperscriptChildren<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  children: Children
): ReactElement<P> {
  return createElementSpreading(type, null, children);
}

function hyperscriptPropsChildren<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  props: PropsLike<P>,
  children: Children
): ReactElement<P> {
  if (!shouldIncorporate(props)) {
    return createElementSpreading(type, props, children);
  } else {
    return createElementSpreading(incorporate(type), props, children);
  }
}

export function h<P = any>(
  type: ElementType<P> | keyof ReactHTML,
  a?: PropsLike<P> | Children,
  b?: Children
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
