var Cookies = require('cookies-js');

function CookieStorage(options) {
  options = options || {};
  this.windowRef = options.windowRef || window;
  this.keyPrefix = options.keyPrefix || 'reduxPersist_';
  this.indexKey = options.indexKey || 'reduxPersistIndex';

  this.cookies = new Cookies(this.windowRef);
}

CookieStorage.prototype.getItem = function (key, callback) {
  var cookie = this.cookies.get(this.keyPrefix + key);

  var result;
  if (cookie) {
    result = JSON.parse(cookie);
  }

  callback(null, result);
}

CookieStorage.prototype.setItem = function (key, value, callback) {
  this.cookies.set(this.keyPrefix + key, JSON.stringify(value));

  this.getAllKeys(function (error, allKeys) {
    if (allKeys.indexOf(key) === -1) {
      allKeys.push(key);
      this.cookies.set(this.indexKey, JSON.stringify(allKeys));
    }
    callback(null);
  }.bind(this));
}

CookieStorage.prototype.removeItem = function (key, callback) {
  this.cookies.expire(this.keyPrefix + key);

  this.getAllKeys(function (error, allKeys) {
    allKeys = allKeys.filter(function (k) {
      return k !== key;
    });

    this.cookies.set(this.indexKey, JSON.stringify(allKeys));
    callback(null);
  }.bind(this));
}

CookieStorage.prototype.getAllKeys = function (callback) {
  var cookie = this.cookies.get(this.indexKey);

  var result = [];
  if (cookie) {
    result = JSON.parse(cookie);
  }

  callback(null, result);
}

module.exports = CookieStorage
