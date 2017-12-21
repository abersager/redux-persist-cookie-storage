# Redux Persist Cookie Storage Adapter

[![Travis branch](https://img.shields.io/travis/abersager/redux-persist-cookie-storage/master.svg)](https://travis-ci.org/abersager/redux-persist-cookie-storage)

[Redux Persist](https://github.com/rt2zz/redux-persist) storage adapter for cookies. Works in the browser and in Node.js with [cookie-parser](https://github.com/expressjs/cookie-parser) output. This makes it suitable for universal / isomorphic applications.

## Installation

`npm install --save redux-persist-cookie-storage`

## Usage

### Browser

#### Pure Cookie mode

```js
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

```js
// Read-only mode: Use getStoredState method
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


// Read-write mode: Create persistor
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
