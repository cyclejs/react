import 'mocha';
import xs from 'xstream';
import {createElement, PureComponent} from 'react';
import * as renderer from 'react-test-renderer';
import {h, ReactSource, makeCycleReactComponent} from '../src/index';
const assert = require('assert');

class Touchable extends PureComponent<any, any> {
  public press() {
    if (this.props.onPress) {
      this.props.onPress(null);
    }
  }

  public render() {
    return this.props.children;
  }
}

describe('Conversion', function() {
  it('converts an MVI Cycle app into a React component', done => {
    function main(sources: {react: ReactSource}) {
      const inc$ = sources.react.select('button').events('press');
      const count$ = inc$.fold((acc: number, x: any) => acc + 1, 0);
      const vdom$ = count$.map((i: number) =>
        h(Touchable, {sel: 'button'}, [h('div', [h('h1', {}, '' + i)])]),
      );
      return {react: vdom$};
    }

    let turn = 0;
    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = main({react: source}).react;
      return {source, sink};
    });
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;
    const check = () => {
      const to = root.findByType(Touchable);
      const view = to.props.children;
      const text = view.props.children;
      assert.strictEqual(text.props.children, `${turn}`);
      to.instance.press();
      turn++;
      if (turn === 3) {
        done();
      }
    };
    setTimeout(check, 50);
    setTimeout(check, 100);
    setTimeout(check, 150);
  });

  it('allows Symbol selectors', done => {
    function main(sources: {react: ReactSource}) {
      const inc = Symbol();
      const inc$ = sources.react.select(inc).events('press');
      const count$ = inc$.fold((acc: number, x: any) => acc + 1, 0);
      const vdom$ = count$.map((i: number) =>
        h(Touchable, {sel: inc}, [h('div', [h('h1', {}, '' + i)])]),
      );
      return {react: vdom$};
    }

    let turn = 0;
    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = main({react: source}).react;
      return {source, sink};
    });
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;
    const check = () => {
      const to = root.findByType(Touchable);
      const view = to.props.children;
      const text = view.props.children;
      assert.strictEqual(text.props.children, `${turn}`);
      to.instance.press();
      turn++;
      if (turn === 3) {
        done();
      }
    };
    setTimeout(check, 50);
    setTimeout(check, 100);
    setTimeout(check, 150);
  });

  it('output React component routes props to sources.react.props()', done => {
    function main(sources: {react: ReactSource}) {
      sources.react.props().addListener({
        next: props => {
          assert.strictEqual(props.name, 'Alice');
          assert.strictEqual(props.age, 30);
          done();
        },
      });

      return {
        react: xs.of(
          h('section', [h('div', {}, [h('h1', {}, 'Hello world')])]),
        ),
      };
    }

    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = main({react: source}).react;
      return {source, sink};
    });
    renderer.create(createElement(RootComponent, {name: 'Alice', age: 30}));
  });

  it('output React component routes other sinks to handlers in props', done => {
    function main(sources: {react: ReactSource}) {
      return {
        react: xs.of(
          h('section', [h('div', {}, [h('h1', {}, 'Hello world')])]),
        ),
        something: xs
          .periodic(200)
          .mapTo('yellow')
          .take(1),
      };
    }

    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sinks = main({react: source});
      const sink = sinks.react;
      return {source, sink, events: {something: sinks.something}};
    });
    renderer.create(
      createElement(RootComponent, {
        onSomething: x => {
          assert.strictEqual(x, 'yellow');
          done();
        },
      }),
    );
  });

  it('sources.react.props() evolves over time as new props come in', done => {
    function main(sources: {react: ReactSource}) {
      let first = false;
      sources.react
        .props()
        .take(1)
        .addListener({
          next: props => {
            assert.strictEqual(props.name, 'Alice');
            assert.strictEqual(props.age, 30);
            first = true;
          },
        });

      sources.react
        .props()
        .drop(1)
        .take(1)
        .addListener({
          next: props => {
            assert.strictEqual(first, true);
            assert.strictEqual(props.name, 'alice');
            assert.strictEqual(props.age, 31);
            done();
          },
        });

      return {
        react: xs.of(
          h('section', [h('div', {}, [h('h1', {}, 'Hello world')])]),
        ),
      };
    }

    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = main({react: source}).react;
      return {source, sink};
    });
    const r = renderer.create(
      createElement(RootComponent, {name: 'Alice', age: 30}),
    );
    r.update(createElement(RootComponent, {name: 'alice', age: 31}));
  });

  it('no synchronous race conditions with handler registration', done => {
    function main(sources: {react: ReactSource}) {
      const inc$ = xs.create({
        start(listener: any) {
          setTimeout(() => {
            sources.react
              .select('button')
              .events('press')
              .addListener(listener);
          }, 30);
        },
        stop() {},
      });
      const count$ = inc$.fold((acc: number, x: any) => acc + 1, 0);
      const vdom$ = count$.map((i: number) =>
        h(Touchable, {sel: 'button'}, [h('div', [h('h1', {}, '' + i)])]),
      );
      return {react: vdom$};
    }

    let turn = 0;
    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = main({react: source}).react;
      return {source, sink};
    });
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;
    const check = () => {
      const to = root.findByType(Touchable);
      const view = to.props.children;
      const text = view.props.children;
      assert.strictEqual(text.props.children, `${turn}`);
      to.instance.press();
      turn++;
      if (turn === 3) {
        done();
      }
    };
    setTimeout(check, 100);
    setTimeout(check, 150);
    setTimeout(check, 200);
  });
});
