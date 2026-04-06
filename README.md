# EC VC (ec-vc)

EC VC

## Prerequisites

- node
- npm
- quasar global install

`$ npm i -g @quasar/cli`

## Install the dependencies

```bash
yarn
# or
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

To run desktop electron app do:

```javascript
quasar dev -m electron
```

### Shared shell dev routes

When you are testing the current shared shell work in Electron, these are the useful routes:

- `#/dialog-shell`: the route-owned `Add/Edit Shell`
- `#/test-shell`: the `File Shell` lab surface

Current expected add/edit behavior:

- add and edit entry points should resolve through the real route-owned `L1`
- widget buttons should open the shared add/edit shell for routable `L1`s
- card-view `Add Relation` should open `dialog-shell` for the clicked source record and start in `KDB`

To bundle app for mac:

```javascript
quasar build -m electron
```

To bundle with debugging:

```javascript
quasar build -m electron -d
```

To bundle app for windows:

```javascript
quasar build -m electron -T win32 -A x64
```

### Lint the files

```bash
yarn lint
# or
npm run lint
```

### Format the files

```bash
yarn format
# or
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).

### SQLite location in macOS fs

- running from terminal: `/Users/alejandrocamus/Library/Application Support/Electron`
- compiled: `/Users/alejandrocamus/Library/Application Support/ec-vc`

To remove do:

```bash
rm "/Users/alejandrocamus/Library/Application Support/Electron"/*.sqlite3*
```
