# Redux Persist Cookie Storage Adapter

[![Travis branch](https://img.shields.io/travis/abersager/redux-persist-cookie-storage/master.svg)](https://travis-ci.org/abersager/redux-persist-cookie-storage)

[Redux Persist](https://github.com/rt2zz/redux-persist) storage adapter for cookies. Works in the browser and in Node.js with [cookie-parser](https://github.com/expressjs/cookie-parser) output. This makes it suitable for universal / isomorphic applications.

## Installation

`npm install --save redux-persist-cookie-storage`

## Usage

### Browser

```js
import { persistStore, autoRehydrate } from 'redux-persist'
import CookieStorage from 'redux-persist-cookie-storage'

const store = createStore(reducer, undefined, autoRehydrate())
persistStore(store, { storage: new CookieStorage() })
```

### Server

```js
import { persistStore, autoRehydrate } from 'redux-persist'
import CookieStorage from 'redux-persist-cookie-storage'
import cookieParser from 'cookie-parser'

const app = new Express()

app.use(cookieParser())

app.use((req, res) => {
  const store = createStore(reducer, undefined, autoRehydrate())
  persistStore(store, { storage: new CookieStorage({ cookies: req.cookies }) })
})
```

## Development

### Running tests

`npm test`
