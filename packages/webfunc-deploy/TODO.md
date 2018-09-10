# To Do

- Replace the `readline` module with `inquirer`.
- Make sure all `console.log` are using `debugInfo`.
- Clean the `utils/index.js` and only reference that one in the rest of the source code.
- Add an `index.js` to the `provides/google` folder.
- Clean (probably break down) the `gcp.js` file.
- `provides/google/account.js` seems unecessary or badly used.
- `getToken.js` seems to be the wrong name (maybe `token.js` instead). Also, that function does a lot of state mutation. Is it the right approach?
- Always get a new token before using a service to make sure it hasn't expire.
- Extract the `gcp.js` module to make its own open-source package.