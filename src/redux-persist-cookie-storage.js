function CookieStorage(cookies, options) {
  options = options || {};

  this.cookies = cookies;

  this.keyPrefix = options.keyPrefix || '';
  this.indexKey = options.indexKey || 'reduxPersistIndex';
  this.expiration = options.expiration || {};
  if (!this.expiration.default) {
    this.expiration.default = null;
  }

  this.setCookieOptions = options.setCookieOptions;
}

CookieStorage.prototype.getItem = function (key, callback) {
  var item = this.cookies.get(this.keyPrefix + key) || null;
  if (callback) {
    callback(null, item);
  }
  return Promise.resolve(item);
}

CookieStorage.prototype.setItem = function (key, value, callback) {
  var options = Object.assign({}, this.setCookieOptions);

  var expires = this.expiration.default;
  if (typeof this.expiration[key] !== 'undefined') {
    expires = this.expiration[key]
  }
  if (expires) {
    options["expires"] = expires;
  }

  this.cookies.set(this.keyPrefix + key, value, options);

  // Update key index
  var indexOptions = Object.assign({}, this.setCookieOptions);
  if (this.expiration.default) {
    indexOptions["expires"] = this.expiration.default;
  }

  return this.getAllKeys().then(function(allKeys) {
    if (allKeys.indexOf(key) === -1) {
      allKeys.push(key);
      this.cookies.set(this.indexKey, JSON.stringify(allKeys), indexOptions);
    }
    if (callback) {
      callback(null);
    }
    return Promise.resolve(null);
  }.bind(this));
}

CookieStorage.prototype.removeItem = function (key, callback) {
  this.cookies.expire(this.keyPrefix + key);

  return this.getAllKeys().then(function (allKeys) {
    allKeys = allKeys.filter(function (k) {
      return k !== key;
    });

    this.cookies.set(this.indexKey, JSON.stringify(allKeys));
    if (callback) {
      callback(null);
    }
    return Promise.resolve(null);
  }.bind(this));
}

CookieStorage.prototype.getAllKeys = function (callback) {
  var cookie = this.cookies.get(this.indexKey);

  var result = [];
  if (cookie) {
    result = JSON.parse(cookie);
  }

  if (callback) {
    callback(null, result);
  }
  return Promise.resolve(result);
}

module.exports = CookieStorage
