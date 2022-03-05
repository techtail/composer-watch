# composer-watch
Automatically watches and updates Composer libraries and autoloader.

#### Why?
Composer has no built-in feature to automatically generate its autoloader when a PHP class is added or deleted.
This package aims to fix this by updating the autoloader every time a new PHP file is added or deleted inside its local repositories.

## How to use
First, install it using your preferred package manager.

```
npm i composer-watch
```

Then, you will need to configure your `composer.json` file to watch a local repository:

```json
{
    "repositories": [
        {
            "type": "path",
            "url": "path/to/your/local/repository",
            "options": {
                "symlink": true,
                "watch": true
            }
        }
    ]
}
```

Hooray! Now you can run it in the root of your Composer project / library:

```
npm run composer-watch
```