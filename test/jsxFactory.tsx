import * as React from 'react';
import * as Adapter from 'enzyme-adapter-react-16';
import * as Enzyme from 'enzyme';
const assert = require('assert');
import {jsxFactory, h, ReactSource, makeCycleReactComponent} from '../src';

Enzyme.configure({adapter: new Adapter()});

const {shallow} = Enzyme;

describe('jsxFactory', function () {
  it('w/ nothing', () => {
    const wrapper = shallow(<h1></h1>);

    assert.strictEqual(wrapper.find('h1').length, 1);
  });

  it('w/ text child', () => {
    const wrapper = shallow(<h1>heading 1</h1>);

    const h1 = wrapper.find('h1');
    assert.strictEqual(h1.text(), 'heading 1');
  });

  it('w/ children array', () => {
    const wrapper = shallow(
      <section>
        <h1>heading 1</h1>
        <h2>heading 2</h2>
        <h3>heading 3</h3>
      </section>
    );

    const section = wrapper.find('section');
    assert.strictEqual(section.children().length, 3);
  });

  it('w/ props', () => {
    const wrapper = shallow(<section data-foo='bar' />);

    assert(wrapper.exists('[data-foo="bar"]'));
  });

  it('w/ props and children', () => {
    const wrapper = shallow(
      <section data-foo="bar">
        <h1>heading 1</h1>
        <h2>heading 2</h2>
        <h3>heading 3</h3>
      </section>
    );

    const section = wrapper.first();
    assert.strictEqual(section.length, 1);
    assert(section.exists('[data-foo="bar"]'));
    assert.deepStrictEqual(section.children().length, 3);
  });

  it('w/ className', () => {
    const wrapper = shallow(<section className="foo" />);

    assert(wrapper.hasClass('foo'));
  });

  it('renders functional component', () => {
    const Test = () => <h1>Functional</h1>;
    const wrapper = shallow(<Test />);

    assert.strictEqual(wrapper.first().type(), 'h1');
  });

  it('renders class component', () => {
    class Test extends React.Component {
      render() {
        return <h1>Class</h1>;
      }
    }

    const wrapper = shallow(<Test />);

    assert.strictEqual(wrapper.first().type(), 'h1');
  });
});
