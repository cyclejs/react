import {createContext, Context} from 'react';
import {Scope} from './scope';

export const ScopeContext: Context<Scope> = createContext<Scope>(new Scope());
