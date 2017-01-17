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

// By default, session cookies are used
persistStore(store, { storage: new CookieStorage() })

// Expiration time can be set via options
persistStore(store, { storage: new CookieStorage({
    expiration: {
      'default': 365 * 86400 // Cookies expire after one year
    }
  })
})

// Default expiration time can be overridden for specific parts of the store:
persistStore(store, { storage: new CookieStorage({
    expiration: {
      'default': null, // Session cookies used by default
      'storeKey': 600 // State in key `storeKey` expires after 10 minutes
    }
  })
})
```



### Server
```js
import { persistStore, autoRehydrate } from 'redux-persist'
import CookieStorage from 'redux-persist-cookie-storage'
import cookieParser from 'cookie-parser'

const app = new Express()

app.use(cookieParser())

// cookies can be a plain object
app.use((req, res) => {
  const store = createStore(reducer, undefined, autoRehydrate())
  const cookies = req.cookies
  persistStore(store, { storage: new CookieStorage({ cookies }) })
})

// or an actual cookie jar
import Cookies from 'cookies'
app.use(Cookies.express())

app.use((req, res) => {
  const store = createStore(reducer, undefined, autoRehydrate())
  const cookies = new Cookies(req, res)
  persistStore(store, { storage: new CookieStorage({ cookies }) })
})

```
N.B.: Custom expiration times are not supported server-side at the moment.

## Development

### Running tests

`npm test`
