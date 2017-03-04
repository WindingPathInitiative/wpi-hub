# Endpoint Details

* [Authentication](auth.md)
* [User](user.md)
* [Office](office.md)
* [Org Unit](org-unit.md)

# All Endpoints
The following information applies to most or all endpoints:

## Tokens
Most endpoints require a token, provided by the `auth` endpoint. This should be stored and passed in the query string with a key of `token`. Alternatively, passing a header of `Auth-User` with the user ID of the current user also works. The latter is designed to work with the AWS API Gateway functionality.

Successful queries with a valid token refreshes it for an additional hour on all endpoints that require the token.

Errors with tokens are as follows:

* Token not provided.<br>
  __Code__: 403<br>
  __Content__: `{ status: 403, message: 'Token not provided' }`

* Invalid token.<br>
  __Code__: 403<br>
  __Content__: `{ status: 403, message: 'Invalid token' }`

* Member is expired and attempting to act as an officer.<br>
  __Code__: 403<br>
  __Content__: `{ status: 403, message: 'User is expired' }`

* Member is suspended and attempting to act as an officer.<br>
  __Code__: 403<br>
  __Content__: `{ status: 403, message: 'User is suspended' }`

* Attempted to check user expiration but no user data found.<br>
  __Code__: 500<br>
  __Content__: `{ status: 500, message: 'User is not loaded' }`

## Permissions
Some endpoints, mostly write ones, require the user associated with a given `token` to have a given role.

Endpoints that check permissions can accept an optional query string of `useOffice` equal to the ID of the office to use. This is useful where a user wants to act as a specific office, instead of the first available one.

Errors with permission errors are as follows:

* User has no offices<br>
  __Code__: 403<br>
  __Content__: `{ status: 403, message: 'User has no offices' }`

* User has offices, but none with the right role<br>
__Code__: 403<br>
__Content__: `{ status: 403, message: 'No offices with permission' }`

* No valid offices found<br>
  __Code__: 403<br>
  __Content__: `{ status: 403, message: 'Officer not found in chain' }`

__Note__: Users with the `admin` role pass _all_ permission checks.
