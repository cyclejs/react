# Cycle React

> Interoperability layer between Cycle.js and React

- Use React (DOM or Native) as the rendering library in a Cycle.js app
- Convert a Cycle.js app into a React component
- Support model-view-intent architecture with isolation scopes

```
npm install @cycle/react
```

## Example

```js
import xs from 'xstream';
import {render} from 'react-dom';
import {h, makeComponent} from '@cycle/react';

function main(sources) {
  const inc = Symbol();
  const inc$ = sources.react.select(inc).events('click');

  const count$ = inc$.fold(count => count + 1, 0);

  const vdom$ = count$.map(i =>
    h('div', [
      h('h1', `Counter: ${i}`),
      h('button', {sel: inc}, 'Increment'),
    ]),
  );

  return {
    react: vdom$,
  };
}

const App = makeComponent(main);

render(h(App), document.getElementById('app'));
```

Other examples:

- [Use React inside Cycle.js (CodeSandbox)](https://codesandbox.io/s/4zqply47nw)
- [Use Cycle.js to write a React component (CodeSandbox)](https://codesandbox.io/s/6xzrv29963)

Read also the [announcement blog post](https://staltz.com/use-react-in-cyclejs-and-vice-versa.html).

## Usage

<details>
  <summary><strong>Installation</strong> (click here)</summary>
  <p>

Install the package:

```bash
npm install @cycle/react
```

Note that this package **only supports React 16.4.0** and above. Also, as usual with Cycle.js apps, you might need `xstream` (or another stream library).

</p>
</details>

<details>
  <summary><strong>Use React as the rendering library</strong> (click here)</summary>
  <p>

Use the hyperscript `h` function (from this library) to create streams of ReactElements:

```js
import xs from 'xstream'
import {h} from '@cycle/react'

function main(sources) {
  const vdom$ = xs.periodic(1000).map(i =>
    h('div', [
      h('h1', `Hello ${i + 1} times`)
    ])
  );

  return {
    react: vdom$,
  }
}
```

Alternatively, you can also use JSX or `createElement`:

```jsx
import xs from 'xstream'

function main(sources) {
  const vdom$ = xs.periodic(1000).map(i =>
    <div>
      <h1>Hello ${i + 1} times</h1>
    </div>
  );

  return {
    react: vdom$,
  }
}
```

However, to attach event listeners in model-view-intent style, you must use `h` which supports the special prop `sel`. See the next section.

  </p>
</details>

<details>
  <summary><strong>Listen to events in the Intent</strong> (click here)</summary>
  <p>

Use hyperscript `h` and pass a **`sel`** as a prop. `sel` means "selector" and it's special like `ref` and `key` are: it does not affect the rendered DOM elements. Then, use that selector in `sources.react.select(_).events(_)`:

```js
import xs from 'xstream'
import {h} from '@cycle/react'

function main(sources) {
  const increment$ = sources.react.select('inc').events('click')

  const count$ = increment$.fold(count => count + 1, 0)

  const vdom$ = count$.map(x =>
    h('div', [
      h('h1', `Counter: ${x}`),
      h('button', {sel: 'inc'}),
    ])
  )

  return {
    react: vdom$,
  }
}
```

The `sel` can be a string or a symbol. We recommend using symbols to avoid string typos and have safer guarantees when using multiple selectors in your Cycle.js app.

  </p>
</details>

<details>
  <summary><strong>Isolate event selection in a scope</strong> (click here)</summary>
  <p>

This library supports isolation with `@cycle/isolate`, so that you can prevent components from `select`ing into each other even if they use the same string `sel`. Selectors just need to be unique within an isolation scope.

```js
import xs from 'xstream'
import isolate from '@cycle/isolate'
import {h} from '@cycle/react'

function child(sources) {
  const elem$ = xs.of(
    h('h1', {sel: 'foo'}, 'click$ will NOT select this')
  )
  return { react: vdom$ }
}

function parent(sources) {
  const childSinks = isolate(child, 'childScope')(sources)

  const click$ = sources.react.select('foo').events('click')

  const elem$ = childSinks.react.map(childElem =>
    h('div', [
      childElem,
      h('h1', {sel: 'foo'}, `click$ will select this`),
    ])
  )

  return { react: elem$ }
}
```

  </p>
</details>

<details>
  <summary><strong>(Easy) Convert a Cycle.js app into a React component</strong> (click here)</summary>
  <p>

Use `makeComponent` which takes the Cycle.js `main` function and a `drivers` object and returns a React component.

```js
const CycleApp = makeComponent(main, {
  HTTP: makeHTTPDriver(),
  history: makeHistoryDriver(),
});
```

Then you can use `CycleApp` in a larger React app, e.g. in JSX `<CycleApp/>`. Any props that you pass to this component will be available as `sources.react.props()` which returns a stream of props.

If you are not using any other drivers, then you do not need to pass the second argument:

```js
const CycleApp = makeComponent(main);
```

  </p>
</details>

<details>
  <summary>(Advanced) Convert a Cycle.js app into a React component (click here)</summary>
  <p>

Besides `makeComponent`, this library also provides the `makeCycleReactComponent(run)` API which is more powerful and can support more use cases.

It takes one argument, a `run` function which should set up and execute your application, and return three things: source, sink, (optionally:) dispose function.

- `run: () => {source, sink, dispose}`

As an example usage:

```js
const CycleApp = makeCycleReactComponent(() => {
  const reactDriver = (sink) => new ReactSource();
  const program = setup(main, {...drivers, react: reactDriver});
  const source = program.sources.react;
  const sink = program.sinks.react;
  const dispose = program.run();
  return {source, sink, dispose};
});
```

Use this API to customize how instances of the returned component will use shared resources like non-rendering drivers. See recipes below.

  </p>
</details>

<details>
  <summary>Recipe: from main and drivers to a React component (click here)</summary>
  <p>

Use the shortcut API `makeComponent` which is implemented in terms of the more the powerful `makeCycleReactComponent` API:

```js
import {setup} from '@cycle/run';

function makeComponent(main, drivers, channel = 'react') {
  return makeCycleReactComponent(() => {
    const program = setup(main, {...drivers, [channel]: () => new ReactSource()});
    const source = program.sources[channel];
    const sink = program.sinks[channel];
    const dispose = program.run();
    return {source, sink, dispose};
  });
}
```

  </p>
</details>

<details>
  <summary>Recipe: from main and engine to a React component (click here)</summary>
  <p>

Assuming you have an `engine` created with `setupReusable` (from `@cycle/run`), use the `makeCycleReactComponent` API like below:

```js
function makeComponentReusing(main, engine, channel = 'react') {
  return makeCycleReactComponent(() => {
    const source = new ReactSource();
    const sources = {...engine.sources, [channel]: source};
    const sinks = main(sources);
    const sink = sinks[channel];
    const dispose = engine.run(sinks);
    return {source, sink, dispose};
  });
}
```

  </p>
</details>

<details>
  <summary>Recipe: from source and sink to a React component (click here)</summary>
  <p>

Use the `makeCycleReactComponent` API like below:

```js
function fromSourceSink(source, sink) {
  return makeCycleReactComponent(() => ({source, sink}));
}
```

  </p>
</details>

<details>
  <summary><strong>Make a driver that uses ReactDOM</strong> (click here)</summary>
  <p>

See [`@cycle/react-dom`](https://github.com/cyclejs/react-dom).

  </p>
</details>

<details>
  <summary><strong>Make a driver that uses React Native</strong> (click here)</summary>
  <p>

See [`@cycle/react-native`](https://github.com/cyclejs/react-native).

  </p>
</details>

## License

MIT, Copyright Andre 'Staltz' Medeiros 2018
