import 'mocha';
import xs, {Stream} from 'xstream';
import {createElement, PureComponent} from 'react';
import isolate from '@cycle/isolate';
import * as renderer from 'react-test-renderer';
import {h, ReactSource, makeCycleReactComponent} from '../src/index';
const assert = require('assert');

class Inspect extends PureComponent<any, any> {
  public press() {
    if (this.props.onPress) {
      this.props.onPress(this.props.name);
    }
  }

  public render() {
    return null;
  }
}

describe('Isolation', function() {
  it('prevents parent from selecting inside the child', done => {
    function child(sources: {react: ReactSource}) {
      sources.react
        .select('bar')
        .events('press')
        .addListener({
          next: name => {
            // This listener exists just to make sure the child's inspect
            // has an onPress prop
          },
        });

      const vdom$ = xs.of(
        h('div', {sel: 'foo'}, [h(Inspect, {sel: 'bar', name: 'wrong'})]),
      );

      return {
        react: vdom$,
      };
    }

    function parent(sources: {react: ReactSource}) {
      const childSinks = isolate(child, 'ISOLATION')(sources);

      const vdom$ = childSinks.react.map(child =>
        h('div', {sel: 'top-most'}, [
          h(Inspect, {sel: 'bar', name: 'correct'}),
          child,
        ]),
      );

      return {
        react: vdom$,
      };
    }

    let times = 0;
    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = parent({react: source}).react;
      source
        .select('bar')
        .events('press')
        .addListener({
          next: name => {
            assert.strictEqual(name, 'correct');
            assert.strictEqual(times, 0);
            times += 1;
          },
        });
      return {source, sink};
    });
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;

    setTimeout(() => {
      const allInspects = root.findAllByType(Inspect, {deep: true});
      const [correct, wrong] = allInspects;
      assert.strictEqual(correct.props.name, 'correct');
      assert.strictEqual(wrong.props.name, 'wrong');
      wrong.instance.press();
      setTimeout(() => {
        correct.instance.press();
      }, 100);
    }, 100);

    setTimeout(() => {
      assert.strictEqual(times, 1);
      done();
    }, 300);
  });

  it('prevents component from selecting inside sibling', done => {
    let times = 0;
    function firstborn(sources: {react: ReactSource}) {
      sources.react
        .select('bar')
        .events('press')
        .addListener({
          next: name => {
            assert.strictEqual(name, 'correct');
            assert.strictEqual(times, 0);
            times += 1;
          },
        });

      const vdom$ = xs.of(
        h('div', {sel: 'foo'}, [h(Inspect, {sel: 'bar', name: 'correct'})]),
      );

      return {
        react: vdom$,
      };
    }

    function secondborn(sources: {react: ReactSource}) {
      sources.react
        .select('bar')
        .events('press')
        .addListener({
          next: name => {
            // This listener exists just to make sure the child's inspect
            // has an onPress prop
          },
        });

      const vdom$ = xs.of(
        h('div', {sel: 'foo'}, [h(Inspect, {sel: 'bar', name: 'wrong'})]),
      );

      return {
        react: vdom$,
      };
    }

    function parent(sources: {react: ReactSource}) {
      type Sinks = {react: Stream<React.ReactElement<any>>};
      const firstSinks: Sinks = isolate(firstborn, 'first')(sources);
      const secondSinks: Sinks = isolate(secondborn, 'second')(sources);

      const vdom$ = xs
        .combine(firstSinks.react, secondSinks.react)
        .map(([firstChild, secondChild]) =>
          h('div', {sel: 'top-most'}, [firstChild, secondChild]),
        );

      return {
        react: vdom$,
      };
    }

    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = parent({react: source}).react;
      return {source, sink};
    });
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;

    setTimeout(() => {
      const allInspects = root.findAllByType(Inspect, {deep: true});
      const [correct, wrong] = allInspects;
      assert.strictEqual(correct.props.name, 'correct');
      assert.strictEqual(wrong.props.name, 'wrong');
      wrong.instance.press();
      setTimeout(() => {
        correct.instance.press();
      }, 100);
    }, 100);

    setTimeout(() => {
      assert.strictEqual(times, 1);
      done();
    }, 300);
  });
});
