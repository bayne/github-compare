# angular-oauth.io

https://oauth.io/ is a service that allows you to integrate in your app a lot of
OAuth providers, without much hassle and keeping the secret keys away from your
code.

However, it only handles the login until you get an access token, and then you
are on your own.

angular-oauth.io was born to go a step further, allowing the developer to attach
handlers that can exploit said token, by storing it, making api calls and
whatever they want.

## Getting Started

* Download the [oauth library][oauth]
* Download the [production version][min] or the [development version][max].

[oauth]: https://oauth.io//auth/download/latest/oauth.min.js
[min]: https://raw.github.com/matteosuppo/angular-oauthio/master/dist/angular-oauth.io.min.js
[max]: https://raw.github.com/matteosuppo/angular-oauthio/master/dist/angular-oauth.io.js

In your web page:

```html
<script src="angular.js"></script>
<script src="oauth.min.js"></script>
<script src="dist/angular-oauth.io.min.js"></script>
```

In your app.js file:

```javascript
var app = angular.module('yourApp', [
  ...
  'oauth.io',
  ...
]);
```

## Configuration

Oauth.io needs a public key to work, and you can set it like this:

```javascript
app.config(function (OAuthProvider) {
  OAuthProvider.setPublicKey('ABC');  // where instead of ABC you put your key
});
```

This is the bare minimum. Of course you may want to attach an handler for a
certain provider:

```javascript
app.config(function(OAuthProvider) {
  OAuthProvider.setHandler('facebook', function (OAuthData, $http) {
    $http.get('https://graph.facebook.com/me?access_token=' + OAuthData.result.access_token)
      .then(function (resp) {
        console.log(resp);
      });
    });
});
```

Note that thanks to dependency injection you have access to other services inside
your handler, which allows you to do nearly everything.

## Documentation

The oauth.io module contains a OAuth provider, which does the wrapping, and a
OAuthData service, which contains the latest result from your login attempts.

### OAuthProvider
This provider can be used to setup the application with the oauth.io public key
and to setup the handler for each authentication method you plan to use.

```javascript
OauthProvider.setPublicKey = function (key) {}
```

This method allows you to provide the Public Key you can get from
https://oauth.io.

```key``` should be a string (of course);

```javascript
OauthProvider.setHandler = function (provider, handler) {}
```

This method allows you to provide an handler for a certain authentication
provider.

```provider``` should be a string, and represent the provider which you want
to connect.

```handler``` should be a function which will be called once the user is
authenticated. Thanks to the magic of dependency injection you can use
whichever angular service you want inside it.

### OAuth
This service can be used to fire the popup with the authentication.

```javascript
OAuth.popup = function (provider) {}
```

```provider``` should be a string, and represent the provider which you want
to connect.

Of course when the popup authentication has been successful the handler for
that provider will be called.

### OauthData
This service can be used to retrieve the results of the authentication.

```javascript
Oauth.results = {}
```

This object contain the results of the authentication, including access
tokens and whatever.

It's most useful inside an handler.

## Limitations
* There is no safety net: who know what would happen if you provide bad input?
* Only the popup method is wrapped.
* Handlers are defined in the config stage. This means you have to use raw
functions or angular constants, which is weird.

#License

    The MIT License
    Copyright (c) 2013 Matteo Suppo

    Permission is hereby granted, free of charge, to any person obtaining a
    copy of this software and associated documentation files (the "Software"),
    to deal in the Software without restriction, including without limitation
    the rights to use, copy, modify, merge, publish, distribute, sublicense,
    and/or sell copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
    THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
    IN THE SOFTWARE.
