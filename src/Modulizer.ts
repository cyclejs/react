import {Component, ComponentType, forwardRef, createRef, createElement} from 'react';
import Incorporator from './Incorporator'

let moduleEntries: any = []

let onMounts: any[] = []
let onUpdates: any[] = []
let onUnmounts: any[] = []

export function setModules(mods: any) {
  if (mods === null || typeof mods !== 'object') return;
  moduleEntries = Object.entries(mods)
  onMounts = moduleEntries.map(mod => [mod[0], mod[1].componentDidMount]).filter(mod => mod[1])
  onUpdates = moduleEntries.map(mod => [mod[0], mod[1].componentDidUpdate]).filter(mod => mod[1])
  onUnmounts = moduleEntries.map(mod => [mod[0], mod[1].componentWillUnmount]).filter(mod => mod[1])
}

export function usesModules() {
  return moduleEntries.length > 0
}

export function hasModuleProps (props) {
  return props 
    ? moduleEntries.some(([mkey]) => props.hasOwnProperty(mkey))
    : false
}

function moduleProcessor (base, current, props) {
  if (current && base.length) {
    base.forEach(([key, f]) => {
      const prop = props[key]
      if (prop) f(current, prop)
    });
  }
}

export class Modulizer extends Component<any, any> {
  private ref: any;
  private element: any;
  private setRef: any;
  constructor(props) {
    super(props);
    this.element = null

    const {targetProps, targetRef} = props
    const useRef = hasModuleProps(targetProps)
    if (targetRef) {
      if (typeof targetRef === 'function' && useRef) {
        this.setRef = element => {
          this.element = element;
          targetRef(element);
        };

        this.ref = this.setRef;
      } else {
        this.ref = targetRef;
      }
    } else {
      this.ref = useRef ? createRef() : null;
    }
  }

  public componentDidMount() {
    moduleProcessor(onMounts, this.element || (this.ref && this.ref.current), this.props.targetProps)
  }

  public componentDidUpdate() {
    moduleProcessor(onUpdates, this.element || (this.ref && this.ref.current), this.props.targetProps)
  }

  public componentWillUnmount() { 
    moduleProcessor(onUnmounts, this.element || (this.ref && this.ref.current), this.props.targetProps)
  }

  render() {
    const targetProps = {...this.props.targetProps}
    moduleEntries.forEach(pair => delete targetProps[pair[0]])
    const output: any = {...this.props, targetRef: this.ref, targetProps};

    return createElement(Incorporator, output);
  }
}
