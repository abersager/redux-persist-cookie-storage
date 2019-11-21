# Redux Persist Cookie Storage Adapter

[![Travis branch](https://img.shields.io/travis/abersager/redux-persist-cookie-storage/master.svg)](https://travis-ci.org/abersager/redux-persist-cookie-storage)

[Redux Persist](https://github.com/rt2zz/redux-persist) storage adapter for cookies. Works in the browser (using [cookies-js](https://github.com/ScottHamper/Cookies)) and in Node.js (using [cookies](https://github.com/pillarjs/cookies)). This makes it suitable for universal / isomorphic applications.

## Installation

`npm install --save redux-persist-cookie-storage`

## Usage

### Browser

#### Pure Cookie mode

```js
import { createStore } from 'redux'
import { persistStore, persistCombineReducers } from 'redux-persist'
import { CookieStorage } from 'redux-persist-cookie-storage'
import Cookies from 'cookies-js'

// Cookies.defaults.domain = ...

const persistConfig = {
  key: "root",
  storage: new CookieStorage(Cookies/*, options */)
}

const rootReducer = persistCombineReducers(persistConfig, reducers)

const store = createStore(rootReducer, undefined)

const persistor = persistStore(store, {})
```

#### Bootstrap from preloaded state in window object

```js
import { createStore } from 'redux'
import { persistStore, persistCombineReducers } from 'redux-persist'
import { CookieStorage } from 'redux-persist-cookie-storage'
import Cookies from 'cookies-js'

const persistConfig = {
  key: "root",
  storage: new CookieStorage(Cookies/*, options */),
  stateReconciler(inboundState, originalState) {
    // Ignore state from cookies, only use preloadedState from window object
    return originalState
  }
}

const rootReducer = persistCombineReducers(persistConfig, reducers)

const store = createStore(rootReducer)

const persistor = persistStore(store, window.PRELOADED_STATE)
```

### Server

#### Read-only mode: Use getStoredState method

```js
import { createStore } from 'redux'
import { persistStore, getStoredState } from 'redux-persist'
import { CookieStorage, NodeCookiesWrapper } from 'redux-persist-cookie-storage'
import Cookies from 'cookies'

const app = new Express()

app.use(Cookies.express())

app.use(async (req, res) => {
  const cookieJar = new NodeCookiesWrapper(new Cookies(req, res))

  const persistConfig = {
    key: "root",
    storage: new CookieStorage(cookieJar/*, options */),
    stateReconciler(inboundState, originalState) {
      // Ignore state from cookies, only use preloadedState from window object
      return originalState
    }
  }

  let preloadedState
  try {
    preloadedState = await getStoredState(persistConfig)
  }
  catch (e) {
    // getStoredState implementation fails when index storage item is not set.
    preloadedState = {}
  }

  const rootReducer = persistCombineReducers(persistConfig, reducers)

  const store = createStore(rootReducer, preloadedState)
})

```

#### Read-write mode: Create persistor

```js
import { createStore } from 'redux'
import { persistStore, getStoredState } from 'redux-persist'
import { CookieStorage, NodeCookiesWrapper } from 'redux-persist-cookie-storage'
import Cookies from 'cookies'

const configurePersistor = async (store) => {
  return new Promise((resolve) => {
    const persistor = persistStore(store, {}, () => {
      resolve(persistor)
    })
  })
}

const app = new Express()

app.use(Cookies.express())

app.use(async (req, res) => {
  const cookieJar = new NodeCookiesWrapper(new Cookies(req, res))

  const persistConfig = {
    key: "root",
    storage: new CookieStorage(cookieJar/*, options */),
    stateReconciler(inboundState, originalState) {
      // Ignore state from cookies, only use preloadedState from window object
      return originalState
    }
  }

  const rootReducer = persistCombineReducers(persistConfig, reducers)

  // Initialize store without preloaded state
  const store = createStore(rootReducer)

  // Wait until persistor has completed deserialization
  const persistor = await configurePersistor(store)

  // Force cookies to be set
  await persistor.flush()

  res.send(200, 'Done!')
})
```

**Note:** Cookies set with this approach will by default have an `httpOnly` flag preventing them to be modified by client scripts. However, when you use `CookieStorage` on the client-side too, you most likely want those cookies to be modified by `CookieStorage`. In this case, you can set `httpOnly` to false in the server-side `CookieStorage` options as follows:

```js
  const persistConfig = {
    key: "root",
    storage: new CookieStorage(cookieJar, {
      setCookieOptions: {
        httpOnly: false, // Allow modifications on the client side
      }
    }),
    ...
  }
```

### Options

```js
// By default, session cookies are used
persistStore(store, { storage: new CookieStorage(Cookies) })

// Expiration time can be set via options
persistStore(store, { storage: new CookieStorage(Cookies, {
    expiration: {
      'default': 365 * 86400 // Cookies expire after one year
    }
  })
})

// Default expiration time can be overridden for specific parts of the store:
persistStore(store, { storage: new CookieStorage(Cookies, {
    expiration: {
      'default': null, // Session cookies used by default
      'storeKey': 600 // State in key `storeKey` expires after 10 minutes
    }
  })
})

// Other cookie options like domain, path and secure:
persistStore(store, { storage: new CookieStorage(Cookies, {
    setCookieOptions: {
      path: '/mypath'
    }
  })
})
```


## Development

### Running tests

`npm test`
