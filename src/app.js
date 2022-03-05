const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const { execSync } = require("child_process");

let debug;

/**
 * @typedef {{
 *  type: string,
 *  url: string,
 *  options: Record<string, any>
 * }} ComposerRepository
 * 
 * @typedef {{
 *  name: string,
 *  type: string,
 *  require: Record<string, string>,
 *  repositories: ComposerRepository[]
 * }} ComposerConfig
 */

module.exports = class App {
    /**
     * @type {string}
     */
    #rootDir;

    /**
     * @type {string}
     */
    #composerFile;

    /**
     * @type {string}
     */
    #vendorDir;

    /**
     * @type {ComposerConfig}
     */
    #composerConfig;

    /**
     * @type {chokidar.FSWatcher}
     */
    #watcher;
    
    constructor(options = {}) {
        if (options.debug) {
            process.env.DEBUG = "composer-watch";
        }

        debug = require("debug")("composer-watch");

        this.#rootDir = options.rootDir;
        
        this.#composerFile = path.resolve(this.#rootDir, "composer.json");
        this.#vendorDir = path.resolve(this.#rootDir, "vendor");
    }

    async init() {
        // Check if the Composer file exists in fact
        if (!fs.existsSync(this.#composerFile)) {
            throw new Error("composer.json file doesn't exists.");
        }

        debug("composer filename is %s", this.#composerFile);

        // Create the watcher for it
        this.#watcher = new chokidar.FSWatcher({
            persistent: true,
            ignoreInitial: true,
            followSymlinks: true,
            interval: 1000
        });

        this.#watcher.on("add", this.#updateAutoloader.bind(this));
        this.#watcher.on("unlink", this.#updateAutoloader.bind(this));

        this.loadConfig();
    }

    /**
     * Updates the Composer autoloader file
     */
    #updateAutoloader(filename) {        
        // It basically callse "composer dump-autoload"
        debug("%s has changed, dumping the autoloader...", filename);

        const result = execSync("composer dump-autoload", {
            cwd: this.#rootDir
        }).toString("utf8")

        if (result.toLocaleLowerCase().includes("generated autoload files")) {
            debug("success");
        } else {
            debug("failed");
        }
    }

    /**
     * Loads / reloads the configuration file
     */
    loadConfig() {
        // Clear the watcher
        this.#watcher.unwatch("*");

        // Load the composer.json file
        this.#composerConfig = JSON.parse(fs.readFileSync(this.#composerFile, "utf8"));

        // Iterate over all repositories
        this.#composerConfig.repositories.forEach((repo) => {
            // Ignore if it's not a local repo
            if (repo.type !== "path") {
                return;
            }

            // Ignore if doesn't have the "watch" option on it
            if (repo.options?.watch !== true) {
                return;
            }

            const repoUrl = path.resolve(this.#rootDir, repo.url);

            // Locate the composer file for this repository
            const composerFile = path.resolve(repoUrl, "composer.json");

            // If it doesn't exists, throw an error
            if (!fs.existsSync(composerFile)) {
                throw new Error("composer.json file not found for local repository \"" + repoUrl + "\"");
            }

            /**
             * Load the library composer file
             * @type {ComposerConfig}
             */
            const libComposerConfig = JSON.parse(fs.readFileSync(composerFile, "utf8"));

            // Check if this library is not required
            if (!(libComposerConfig.name in this.#composerConfig.require)) {
                return;
            }

            debug("preparing require %s", libComposerConfig.name);

            const libVendorDirectory = path.resolve(this.#vendorDir, libComposerConfig.name);

            // Force deleting the vendor directory if it exists
            fs.rmdirSync(libVendorDirectory, {
                recursive: true,
                force: true
            });

            // Create a symlink between them two
            fs.symlinkSync(repoUrl, libVendorDirectory, "junction");

            // Watch the folder for changes
            this.#watcher.add(repoUrl);
        });
    }
}