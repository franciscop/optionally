const OptionsError = Error;

// TODO: find closest match for the match if strict mode is on:
// https://stackoverflow.com/a/11958496
// https://github.com/gustf/js-levenshtein

// Use the environment option unles explictly told not to
const findEnvKey = (name, def, env) => {
  if (typeof def === "string") {
    name = def;
  }
  name = name.toUpperCase();
  if (def === false && typeof env[name] !== "undefined") {
    // Windows has an environment variable called "PUBLIC" that points to the
    // "public" user home directory. This is NOT the public folder we want
    if (!/^win/.test(process.platform) || name !== "public") {
      throw new OptionsError("noenv", { name });
    }
  }
  return def === false ? false : name;
};

// Use the user-passed option unles explictly told not to
const findArgKey = (name, def, arg) => {
  if (typeof def === "string") {
    name = def;
  }
  if (def === false && typeof arg[name] !== "undefined") {
    throw new OptionsError("noarg", { name });
  }
  return def === false ? false : name;
};

const findParentKey = (name, def, parent) => {
  if (def === false) {
    return false;
  }
  if (def === true) {
    return name;
  }
  return def || name;
};

const findValue = ({ name, arg, env, def, parent }) => {
  // Use the environment variable unless explicitly told not to
  def.env = findEnvKey(name, def.env, env);
  def.arg = findArgKey(name, def.arg, arg);
  def.inherit = findParentKey(name, def.inherit, parent);

  // List of possibilities, from HIGHER preference to LOWER preference
  // Removes the empty ones and gets the first one as it has HIGHER pref
  const list = [env[def.env], arg[def.arg], parent[def.inherit], def.default];
  return list.find(value => typeof value !== "undefined");
};

const parseValue = (value, def) => {
  // Extend the base/user object with new values if these are not set
  if (def.extend) {
    if (typeof value === "undefined") {
      value = { ...def.default };
    }
    if (typeof value === "object") {
      value = { ...def.default, ...value };
    }
  }

  return value;
};

const validateValue = (value, def) => {
  // Validate the type (only if there's a value)
  if (def.type && typeof value !== "undefined") {
    // Parse valid types into a simple array of strings: ['string', 'number']
    def.type = (def.type instanceof Array ? def.type : [def.type])
      // pulls up the name for primitives such as String, Number, etc
      .map(one => (one.name ? one.name : one).toLowerCase());

    // Make sure it is one of the valid types
    if (!def.type.includes(typeof value)) {
      throw new OptionsError("type", {
        name,
        expected: def.type,
        value
      });
    }
  }

  // Validate that it is set
  if (def.required) {
    if (typeof value === "undefined") {
      throw new OptionsError("required", { name });
    }
  }

  if (def.enum) {
    if (!def.enum.includes(value)) {
      throw new OptionsError("enum", { name, value, possible: def.enum });
    }
  }

  // Nobody ever wants NaN. NaN was an error.
  if (typeof value === "number" && isNaN(value)) {
    throw new Error("NaN Error!");
  }
};

const optionally = (schema, arg = {}, env = {}, parent = {}) => {
  // Fully parsed options will be stored here
  const options = {};

  // For plugins, accept "false" as an option to nuke a full plugin
  if (arg === false && parent) {
    return false;
  }

  // Accepts a single option instead of an object and it will be mapped to its
  // root value. Example: server(2000) === server({ port: 2000 })
  if (typeof arg !== "object") {
    if (!schema.__root) {
      throw new OptionsError("notobject");
    }
    arg = { [schema.__root]: arg };
  }

  // Loop each of the defined options
  for (let name in schema) {
    // RETRIEVAL
    // Skip the control variables such as '__root'
    if (/^__/.test(name)) continue;

    // Make sure we are dealing with a valid schema definition for this option
    if (typeof schema[name] !== "object") {
      throw new Error(
        "Invalid option definition: " + JSON.stringify(schema[name])
      );
    }

    // Make the definition local so it's easier to handle
    const def = { ...schema[name] };

    const find = def.find || findValue;
    let value = find({ name, arg, env, def, parent });

    // Or call it .clean?
    const parse = def.parse || parseValue;
    value = parse(value, def);

    const validate = def.validate || validateValue;
    validate(value, def, options);

    if (typeof value !== "undefined") {
      options[name] = value;
    }
  }

  // If the property 'options' exists handle it recursively
  for (let name in schema) {
    const def = schema[name];
    if (def.options) {
      options[name] = optionally(def.options, arg[name], env, options);
    }
  }

  return options;
};

export default optionally;
