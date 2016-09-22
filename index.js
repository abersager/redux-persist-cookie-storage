var Cookies = require('cookies-js');

function FakeCookieJar(cookies) {
  this.cookies = cookies || {};
}

FakeCookieJar.prototype.get = function (key) {
  return this.cookies[key];
}

FakeCookieJar.prototype.set = function (key, value) {
  this.cookies[key] = value;
}

FakeCookieJar.prototype.expire = function (key) {
  delete this.cookies[key];
}


function CookieStorage(options) {
  options = options || {};

  this.keyPrefix = options.keyPrefix || 'reduxPersist_';
  this.indexKey = options.indexKey || 'reduxPersistIndex';

  if (options.windowRef) {
    this.cookies = Cookies(options.windowRef);
  } else if (typeof window !== 'undefined') {
    this.cookies = Cookies;
  } else {
    this.cookies = new FakeCookieJar(options.cookies);
  }
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
