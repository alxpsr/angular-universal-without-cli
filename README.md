# angular-universal-without-cli
Angular Universal app without angular-cli (only own webpack configs)

## Usage
1. `npm i`
1. `npm run build:all` - building all instances of app (wep-app & server-app)
1. `npm run go` - run local server

#### How to check SSR?
Get `http://localhost:4000` with `curl` or your favorite rest-client like a Postman. If you will see in response rendered App - you are on the right track!