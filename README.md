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
