/*
Wraps instance of Node.js cookie implementation [1] to match API of Cookies.js
browser library [2].

[1] https://github.com/pillarjs/cookies
[2] https://github.com/ScottHamper/Cookies
*/

function NodeCookiesWrapper(cookies) {
  this.cookies = cookies;
}

NodeCookiesWrapper.prototype.get = function (key) {
  key = encodeKey(key);
  var encodedValue = this.cookies.get(key);
  if (encodedValue) {
    return decodeURIComponent(encodedValue);
  }
  return undefined;
}

NodeCookiesWrapper.prototype.set = function (key, value, options) {
  key = encodeKey(key);
  value = (value + '').replace(/[^!#$&-+\--:<-\[\]-~]/g, encodeURIComponent);
  this.cookies.set(key, value, options);
}

NodeCookiesWrapper.prototype.expire = function (key) {
  this.set(key, undefined);
}

function encodeKey (key) {
  key = key.replace(/[^#$&+\^`|]/g, encodeURIComponent);
  key = key.replace(/\(/g, '%28').replace(/\)/g, '%29');
  return key;
}

module.exports = NodeCookiesWrapper;
