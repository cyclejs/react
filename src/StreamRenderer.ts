import {Stream, Subscription} from 'xstream';
import {PureComponent, ReactElement} from 'react';

interface Props {
  stream: Stream<ReactElement<any>>;
}

type State = {
  reactElem: ReactElement<any> | null;
};

export class StreamRenderer extends PureComponent<Props, State> {
  private reactElemSub?: Subscription;

  constructor(props: Props) {
    super(props);
    this.state = {reactElem: null};
  }

  public componentDidMount() {
    this.reactElemSub = this.props.stream.subscribe({
      next: (elem: ReactElement<any>) => {
        this.setState(() => ({reactElem: elem}));
      },
    });
  }

  public render() {
    return this.state.reactElem;
  }

  public componentWillUnmount() {
    if (this.reactElemSub) {
      this.reactElemSub.unsubscribe();
      this.reactElemSub = undefined;
    }
  }
}
