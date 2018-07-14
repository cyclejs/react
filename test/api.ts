import 'mocha';
import xs from 'xstream';
import {createElement, PureComponent} from 'react';
import * as renderer from 'react-test-renderer';
import {
  h,
  ReactSource,
  makeComponent,
  makeCycleReactComponent,
} from '../src/index';
const assert = require('assert');

class Findable extends PureComponent<any, any> {
  public render() {
    return this.props.children;
  }
}

describe('API', function() {
  it('makeCycleReactComponent', function(done) {
    function main(sources: {react: ReactSource}) {
      return {
        react: xs
          .periodic(50)
          .take(4)
          .map(() =>
            h(Findable, {sel: 'ya'}, [
              h('div', {}, [h('h1', {}, 'Hello world')]),
            ]),
          ),
      };
    }

    const RootComponent = makeCycleReactComponent(() => {
      const source = new ReactSource();
      const sink = main({react: source}).react;
      return {source, sink};
    });
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;
    setTimeout(() => {
      const findable = root.findByType(Findable);
      const div = findable.props.children;
      const h1 = div.props.children;
      assert.strictEqual(h1.props.children, 'Hello world');
      done();
    }, 50);
  });

  it('makeComponent from main, drivers, and channel', function(done) {
    function main(sources: {foobar: ReactSource}) {
      return {
        foobar: xs
          .periodic(50)
          .take(4)
          .map(() =>
            h(Findable, {sel: 'ya'}, [
              h('div', {}, [h('h1', {}, 'Hello world')]),
            ]),
          ),
      };
    }

    const RootComponent = makeComponent(main, {} as any, 'foobar');
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;
    setTimeout(() => {
      const findable = root.findByType(Findable);
      const div = findable.props.children;
      const h1 = div.props.children;
      assert.strictEqual(h1.props.children, 'Hello world');
      done();
    }, 50);
  });

  it('makeComponent from main (no drivers, no channel)', function(done) {
    function main(sources: {react: ReactSource}) {
      return {
        react: xs
          .periodic(50)
          .take(4)
          .map(() =>
            h(Findable, {sel: 'ya'}, [
              h('div', {}, [h('h1', {}, 'Hello world')]),
            ]),
          ),
      };
    }

    const RootComponent = makeComponent(main);
    const r = renderer.create(createElement(RootComponent));
    const root = r.root;
    setTimeout(() => {
      const findable = root.findByType(Findable);
      const div = findable.props.children;
      const h1 = div.props.children;
      assert.strictEqual(h1.props.children, 'Hello world');
      done();
    }, 50);
  });
});
