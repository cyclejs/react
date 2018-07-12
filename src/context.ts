import {createContext, Context} from 'react';
import {Scope} from './scope';

export const ScopeContext = createContext<Scope>(new Scope());
