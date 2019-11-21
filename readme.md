# optionally [![npm install optionally](https://img.shields.io/badge/npm%20install-optionally-blue.svg)](https://www.npmjs.com/package/optionally) [![gzip size](https://img.badgesize.io/franciscop/optionally/master/index.js.svg?compression=gzip&label=size)](https://github.com/franciscop/optionally/blob/master/index.js) [![dependencies](https://img.shields.io/david/franciscop/optionally.svg)](https://github.com/franciscop/optionally/blob/master/package.json)

Option parser with schema definition and descriptive errors:

```js
const schema = {
  port: { default: 3000, type: Number },
  public: { default: "public", type: [String, Boolean] }
};

// All of these result in `{ port: 3000, public: "public" }`
optionally(schema);                   // Uses the defaults
optionally(schema, { port: "3000" }); // Cast to a number since it's possible
optionally(schema, {}, process.env);  // `.env` is `PORT=3000`

// Clear error messages:
optionally(schema, { port: "cow" });
// TypeError: The option `port` should be a number like `{ port: 3000 }` instead of the string "cow".
```

The arguments for each of the options, with all of them being optional:

|key         |description                              |type                   |
|------------|-----------------------------------------|-----------------------|
|`find()`    |manually get the value from the params   |function               |
|↳ `env`     |name of the environment variable to use  |string                 |
|↳ `arg`     |name of the argument to use              |string                 |
|↳ `inherit` |for subtrees, get the value from parent  |boolean, string        |
|↳ `default` |value to use if none is provided         |any                    |
|`parse()`   |parse the previously found value         |function               |
|↳ `extend`  |extend the default object with the value |boolean                |
|`validate()`|manually check that the value is correct |function               |
|↳ `type`    |type must match (or cast) to one of these|function, string, array|
|↳ `required`|value must be provided and found         |boolean                |
|↳ `enum`    |it has to match exactly one of these     |array                  |
|`options`   |define the schema of the children        |object                 |

Internally it works in three steps, if you provide the main function then it will *not* perform the other actions:

- `find()`: uses `env` > `arg` > `inherit` > `default` (in order) to attempt to get a value out of the arguments and environment.
- `clean()`: uses `extend`, `file` and `folder` to expand the previously found value.
- `validate()`: uses `type`, `required`, `enum` to validate the value after cleaning.

Helpers:

- `__root: "abcdef"`: if a single option is provided that is not an object, it will be converted into `{ abcdef: options }`. Example: accept a port as a single argument `{ __root: "port" }` + `server(3000)` = `server({ port: 3000 })`.
- `__mode: "strict"`: defines what to do with options that are not defined. `"strict"` will throw with keys that are not in the schema, `"remove"` will delete these extra keys and `"flexible"` will pass through any extra arguments.
