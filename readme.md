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
  <summary><strong>Pass event handlers as props to react components</strong> (click here)</summary>
  <p>

Use hyperscript `h` and pass a **`sel`** as a prop. Use that selector in `sources.react.select(sel).events(whatever)` to have cyclejs/react pass an `onWhatever` function to the react component:

```js
import React from "react";
import ReactDOM from "react-dom";
import { makeComponent, h } from "@cycle/react";

// React component
function Welcome(props) {
  return (
    <div>
      <h1>Hello, {props.name}</h1>
      <button onClick={() => props.onPressWelcomeButton({ random: Math.random().toFixed(2) }) } >
        press me
      </button>
    </div>
  );
}

// Cycle.js component that uses the React component above
function main(sources) {
  const click$ = sources.react
    .select('welcome')
    .events('pressWelcomeButton')
    .debug('btn')
    .startWith(null);

  const vdom$ = click$.map(click =>
    h('div', [
      h(Welcome, { sel: 'welcome', name: 'madame' }),
      h('h3', [`button click event stream: ${click}`])
    ])
  );

  return {
    react: vdom$
  };
}

const Component = makeComponent(main);
ReactDOM.render(<Component />, document.getElementById('root'));
```

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

It takes one argument, a `run` function which should set up and execute your application, and return three things: source, sink, (optionally:) events object, and dispose function.

- `run: () => {source, sink, events, dispose}`

As an example usage:

```js
const CycleApp = makeCycleReactComponent(() => {
  const reactDriver = (sink) => new ReactSource();
  const program = setup(main, {...drivers, react: reactDriver});
  const source = program.sources.react;
  const sink = program.sinks.react;
  const events = {...program.sinks};
  delete events.react;
  for (let name in events) if (name in drivers) delete events[name];
  const dispose = program.run();
  return {source, sink, events, dispose};
});
```

**source** is an instance of ReactSource from this library, provided to the `main` so that events can be selected in the intent.

**sink** is the stream of ReactElements your `main` creates, which should be rendered in the component we're creating.

**events** is a *subset* of the sinks, and contains streams that describe events that can be listened by the parent component of the `CycleApp` component. For instance, the stream `events.save` will emit events that the parent component can listen by passing the prop `onSave` to `CycleApp` component. This `events` object is optional, you do not need to create it if this component does not bubble events up to the parent.

**dispose** is a function `() => void` that runs any other disposal logic you want to happen on componentWillUnmount. This is optional.

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
    const events = {...program.sinks};
    delete events[channel];
    for (let name in events) if (name in drivers) delete events[name];
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
    const events = {...sinks};
    delete events[channel];
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

<details>
  <summary><strong>JSX support</strong> (click here)</summary>

  <p>

### Babel

Add the following to your webpack config:

```js
module: {
  rules: [
    {
      test: /\.jsx?$/,
      loader: 'babel-loader',
      options: {
        plugins: [
          ['transform-react-jsx', { pragma: 'jsxFactory.createElement' }],
        ]
      }
    }
  ]
},
```

If you used `create-cycle-app` you may have to eject to modify the config.

### Automatically providing jsxFactory

You can avoid having to import `jsxFactory` in every jsx file by allowing webpack to provide it:

```js
plugins: [
  new webpack.ProvidePlugin({
    jsxFactory: ['@cycle/react', 'jsxFactory']
  })
],
```

### Typescript

Add the following to your `tsconfig.json`:

```js
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "jsxFactory.createElement"
  }
}
```

If webpack is providing `jsxFactory` you will need to add typings to `custom-typings.d.ts`:

```js
declare var jsxFactory: any;
```


### Usage

```js
import { jsxFactory } from '@cycle/react';
function view(state$: Stream<State>): Stream<ReactElement> {
    return state$.map(({ count }) => (
        <div>
            <h2>Counter: {count}</h2>
            <button sel="add">Add</button>
            <button sel="subtract">Subtract</button>
        </div>
    ));
}
```

  </p>
</details>

## License

MIT, Copyright Andre 'Staltz' Medeiros 2018
