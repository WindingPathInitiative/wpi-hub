# Authentication
Provides way to authenticate user. Requires correct configuration in `auth.json` to properly interface with the Portal.

## `GET /v1/auth/signin/{code}`
Redirects the user for authentication.

__Params__

* `{code}` - Required. Valid client configured in `clients.json`.

__Responses__

* __Code__: 302<br>
  __Content__: Redirect to OAuth portal server.

* __Code__: 500<br>
  __Content__: `{ status: 500, message: 'Error message' }`

## `GET /v1/auth/verify/{code}`
Internal, used to pass user back to User Hub before directing to client. Also creates the user if they are not found in the DB.

__Params__

* `{code}` - Required. Valid client configured in `clients.json`.

__Responses__

* Successful redirect.<br>
  __Code__: 302

* No code provided.<br>
  __Code__: 404

* Invalid code provided.<br>
  __Code__: 500<br>
  __Content__: `{ status: 500, message: 'Invalid code provided' }`

* No data provided by Portal.<br>
  __Code__: 500<br>
  __Content__: `{ message: "Unknown authentication strategy "provider"", status: 500 }`

* Malformed response from Portal.<br>
  __Code__: 500<br>
  __Content__: `{ status: 500, message: 'No Portal ID provided' }`

## `GET /v1/auth/signout`
Destroys provided `token`.

__Params__

* `token` - Required, either as GET param or cookie. The user token.

__Responses__

* __Code__: 200<br>
  __Content__: `{ success: 1 }`
