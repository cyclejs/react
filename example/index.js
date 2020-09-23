import xs from 'xstream';
import {createElement} from 'react';
import {render} from 'react-dom';
import {setModules} from '../src/Modulizer'
import {h, makeComponent} from '../src/index';

function main(sources) {
  const init$ = xs.of(() => 0);

  const increment$ = xs.periodic(1000).mapTo(x => x + 1);

  const btnSel = Symbol();

  const reset$ = sources.react
    .select(btnSel)
    .events('click')
    .mapTo(() => 0);

  const count$ = xs
    .merge(init$, increment$, reset$)
    .fold((state, fn) => fn(state));

  const getRef = el => {
    el.foo='bar';
  }
  const vdom$ = count$.map(i => {
    return h('div', [
      h('h1', {ref: getRef}, `Hello ${i} times`),
      h('button', {
        sel: btnSel, 
        className: 'clicker', 
        domProps: {foo: 3}, 
        domClass: {hello: true, goodbye: false}
      }, 'Reset')
    ])
  });

  return {
    react: vdom$,
  };
}

const App = makeComponent(main);

setModules({
  domProps: {
    componentDidUpdate: (element, props) => {
      Object.entries(props).forEach(([key, val]) => {
        element[key] = val;
      });
    }
  },
  domClass: {
    componentDidUpdate: (element, props) => {
      Object.entries(props).forEach(([key, val]) => {
        val ? element.classList.add(key) : element.classList.remove(key);
      });
    }
  }
})

render(createElement(App), document.getElementById('app'));
