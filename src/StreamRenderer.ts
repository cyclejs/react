import {Stream, Subscription} from 'xstream';
import {PureComponent, ReactElement} from 'react';

interface Props {
  stream: Stream<ReactElement<any>>;
}

export class StreamRenderer extends PureComponent<Props> {
  private reactElemSub?: Subscription;
  private elem?: ReactElement<any> | null;

  constructor(props: Props) {
    super(props);
    this.elem = null;
  }

  public componentDidMount() {
    this.reactElemSub = this.props.stream.subscribe({
      next: (elem: ReactElement<any>) => {
        this.elem = elem;
        this.forceUpdate();
      },
    });
  }

  public render() {
    return this.elem;
  }

  public componentWillUnmount() {
    if (this.reactElemSub) {
      this.reactElemSub.unsubscribe();
      this.reactElemSub = undefined;
    }
    this.elem = null;
  }
}
