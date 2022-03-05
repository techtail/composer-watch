/**
 * Composer Watch
 * Automatically watches and updates local Composer libraries.
 * 
 * @author Matheus Giovani <matheus@techtail.net>
 */

const App = require("./app");

const app = new App({
    rootDir: process.cwd(),
    debug: process.argv.indexOf("--debug") > -1
});

app.init();