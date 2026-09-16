# Live launch notes

The portal has seven separate location accounts. They are read only by the server from the `LAB_LOGIN_CREDENTIALS` secret and are never sent to the login page.

## Local launch

`npm run dev` starts the local development server. The ignored `.dev.vars` file already contains the current location accounts for this machine.

For a production build and local production-style server, run `npm run start`.

## Production deployment

Before publishing, create a secret named `LAB_LOGIN_CREDENTIALS` in the hosting provider and set it to a JSON array with this shape:

```json
[
  {
    "locationId": "sarojini",
    "username": "location-login-id",
    "password": "a-unique-password"
  }
]
```

Create one item for each of these location IDs: `sarojini`, `aishbagh`, `golaganj`, `sandeela`, `sitapur`, `barabanki`, and `raebareli`. Do not put this value in client-side variables or source control. The portal will return a configuration error instead of accepting any login if the secret is missing or invalid.
