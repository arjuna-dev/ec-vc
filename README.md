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

- `#/dialog-shell`: the route-owned `Add/Edit Record Shell`
- `#/fork-shell`: the route-owned `Fork Shell`
- `#/test-shell`: the `File Shell` lab surface

Current expected add/edit behavior:

- add and edit entry points should resolve through the real route-owned `L1`
- widget buttons should open the shared add/edit shell for routable `L1`s
- card-view `Add Relation` should open `dialog-shell` for the clicked source record and start in `KDB`
- branchable create entry points should stop in the independent route-owned `Fork Shell` before continuing into `Add/Edit Record Shell`

### New L1 bootstrap rule

When creating a new `L1`, treat it as a full architectural bootstrap by default, not a partial frontend/source split.

Authority rule:

- new `L1` bootstrap is `Owner`-only work
- it is structural system authority, not normal in-app record creation
- non-owner users/roles should not be able to trigger new `L1` creation from product UI

Required scope:

- add the canonical entity to `docs/canonical-structure.json`
- add route, registry, shell, and navigation
- add runtime ownership for `list`, `create`, `update`, and `delete`
- add the default `L1` subsection baseline:
  - `System`
  - `KDB`
  - `General` when that is part of the current standard
- apply reciprocal KDB propagation across the other relevant `L1`s
- ensure `Add/Edit Record Shell` and add-record flows work immediately

Naming rule:

- the current shared dialog shell should be named `Add/Edit Record Shell`
- `Add/Edit File Shell` is a separate future shell name and should not be used as an alias for the record dialog shell
- run a validation pass confirming the new `L1` is actually createable/editable

Do not treat a new `L1` as complete if it is only visible in the UI.

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
