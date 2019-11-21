import optionally from ".";

describe("optionally", () => {
  it("can handle undefined options", async () => {
    expect(optionally({})).toEqual({});
  });

  it("can handle empty options", () => {
    expect(optionally({}, {})).toEqual({});
  });

  it("will ignore an option not in the schema", () => {
    expect(optionally({}, { port: 3000 })).toEqual({});
  });

  it("will accept options in the schema even if they are formless", () => {
    expect(optionally({ port: {} }, { port: 3000 })).toEqual({ port: 3000 });
  });

  it("throws when not an object", () => {
    expect(() => optionally({ port: {} }, 3000)).toThrow();
  });

  it("handles __root options", () => {
    expect(optionally({ __root: "port", port: {} }, 3000)).toEqual({
      port: 3000
    });
  });

  it("requires a valid definition", () => {
    expect(() => optionally({ port: false }, { port: 3000 })).toThrow();
  });

  describe("arguments", () => {
    it("keeps the name by default", () => {
      const schema = { port: {} };
      const options = { port: 3000 };
      expect(optionally(schema, options)).toEqual({ port: 3000 });
    });

    it("keeps the name when true", () => {
      const schema = { port: { arg: true } };
      const options = { port: 3000 };
      expect(optionally(schema, options)).toEqual({ port: 3000 });
    });

    it("can force the user *not* to pass the argument", () => {
      const schema = { port: { arg: false } };
      const options = { port: 3000 };
      expect(() => optionally(schema, options)).toThrow();
    });

    it("can go through without parameter", () => {
      const schema = { port: { arg: false } };
      const options = {};
      expect(optionally(schema, options)).toEqual({});
    });

    it("can rename an argument", () => {
      const schema = { port: { arg: "port_number" } };
      const options = { port_number: 3000 };
      expect(optionally(schema, options)).toEqual({ port: 3000 });
    });

    it("throws when passing NaN", () => {
      const schema = { public: { type: Number } };
      const options = { public: NaN };
      expect(() => optionally(schema, options)).toThrow();
    });
  });

  describe("environment", () => {
    it("keeps the name by default", () => {
      const schema = { port: {} };
      const options = { port: 3000 };
      expect(optionally(schema, options)).toEqual({ port: 3000 });
    });

    it("keeps the name when true", () => {
      const schema = { port: { env: true } };
      const env = { PORT: 3000 };
      expect(optionally(schema, {}, env)).toEqual({ port: 3000 });
    });

    it("can force the user *not* to pass the argument", () => {
      const schema = { port: { env: false } };
      const env = { PORT: 3000 };
      expect(() => optionally(schema, {}, env)).toThrow();
    });

    it("can go through without parameter", () => {
      const schema = { port: { env: false } };
      const env = {};
      expect(optionally(schema, {}, env)).toEqual({});
    });

    it("can rename an argument", () => {
      const schema = { port: { env: "port_number" } };
      const env = { PORT_NUMBER: 3000 };
      expect(optionally(schema, {}, env)).toEqual({ port: 3000 });
    });
  });

  describe("extend", () => {
    it("will become an object if undefined", () => {
      const schema = { cors: { extend: true } };
      const options = {};
      expect(optionally(schema, options)).toEqual({ cors: {} });
    });

    it("will extend a default object", () => {
      const schema = { cors: { default: { origin: "*" }, extend: true } };
      const options = {};
      expect(optionally(schema, options)).toEqual({ cors: { origin: "*" } });
    });

    it("will be the value if no default", () => {
      const schema = { cors: { extend: true } };
      const options = { cors: { origin: "*" } };
      expect(optionally(schema, options)).toEqual({ cors: { origin: "*" } });
    });

    it("will ignore them if a different parameter", () => {
      const schema = { cors: { extend: true } };
      const options = { cors: false };
      expect(optionally(schema, options)).toEqual({ cors: false });
    });
  });

  describe("parse", () => {
    it("can accept a parse argument", () => {
      const schema = { port: { type: Number, parse: Number } };
      expect(optionally(schema, { port: "3000" })).toEqual({ port: 3000 });
    });
  });

  describe("required", () => {
    it("can require a valid value", () => {
      const schema = { port: { type: Number, required: true } };
      const options = { port: 3000 };
      expect(optionally(schema, options)).toEqual({ port: 3000 });
    });

    it("can require the number 0", () => {
      const schema = { port: { type: Number, required: true } };
      const options = { port: 0 };
      expect(optionally(schema, options)).toEqual({ port: 0 });
    });

    it("can require the boolean false", () => {
      const schema = { port: { type: Boolean, required: true } };
      const options = { port: false };
      expect(optionally(schema, options)).toEqual({ port: false });
    });

    it("throws when no required value is present", () => {
      const schema = { port: { type: Number, required: true } };
      const options = {};
      expect(() => optionally(schema, options)).toThrow();
    });

    it("throws when required is null", () => {
      const schema = { public: { type: String, required: true } };
      const options = { public: null };
      expect(() => optionally(schema, options)).toThrow();
    });

    it("throws when required is NaN", () => {
      const schema = { public: { type: Number, required: true } };
      const options = { public: NaN };
      expect(() => optionally(schema, options)).toThrow();
    });

    it("throws when required is empty string", () => {
      const schema = { public: { type: String, required: true } };
      const options = { public: "" };
      expect(() => optionally(schema, options)).toThrow();
    });
  });

  describe("enum", () => {
    it("accepts the value if it's part of the enum", () => {
      const schema = { port: { type: Number, enum: [2000, 3000, 3001] } };
      const options = { port: 3000 };
      expect(optionally(schema, options)).toEqual({ port: 3000 });
    });

    it("rejects the value if it's not part of the enum", () => {
      const schema = { port: { type: Number, enum: [2000, 3000, 3001] } };
      const options = { port: 80 };
      expect(() => optionally(schema, options)).toThrow();
    });
  });

  describe("types", () => {
    it("will accept numbers", () => {
      const schema = { port: { type: Number } };
      expect(optionally(schema, { port: 3000 })).toEqual({ port: 3000 });
    });

    it("will accept numbers", () => {
      const schema = { port: { type: [Number] } };
      expect(optionally(schema, { port: 3000 })).toEqual({ port: 3000 });
    });

    it("will accept numbers", () => {
      const schema = { port: { type: "number" } };
      expect(optionally(schema, { port: 3000 })).toEqual({ port: 3000 });
    });

    it("will accept numbers", () => {
      const schema = { port: { type: ["number"] } };
      expect(optionally(schema, { port: 3000 })).toEqual({ port: 3000 });
    });

    it("throws when the type does not match", () => {
      const schema = { port: { type: Number } };
      expect(() => optionally(schema, { port: "3000" })).toThrow();
    });

    it("throws when it cannot parse the value", () => {
      const schema = { port: { type: Number, parse: Number } };
      expect(() => optionally(schema, { port: "abc" })).toThrow();
    });
  });

  describe("options", () => {
    it("can define a subschema", () => {
      const schema = {
        cors: { extend: true, options: { origin: { default: "*" } } }
      };
      const options = {};
      expect(optionally(schema, options)).toEqual({ cors: { origin: "*" } });
    });

    it("can nullify a subschema", () => {
      const schema = {
        cors: { extend: true, options: { origin: { default: "*" } } }
      };
      const options = { cors: false };
      expect(optionally(schema, options)).toEqual({ cors: false });
    });

    // Are we sure?
    it("inherits by default", () => {
      const schema = {
        origin: { type: "string" },
        cors: {
          extend: true,
          options: { origin: {} }
        }
      };
      const options = { origin: "https://example.com/" };
      expect(optionally(schema, options)).toEqual({
        origin: "https://example.com/",
        cors: { origin: "https://example.com/" }
      });
    });

    it("can inherit from the same parent key", () => {
      const schema = {
        origin: { type: "string" },
        cors: {
          extend: true,
          options: { origin: { inherit: true } }
        }
      };
      const options = { origin: "https://example.com/" };
      expect(optionally(schema, options)).toEqual({
        origin: "https://example.com/",
        cors: { origin: "https://example.com/" }
      });
    });

    it("won't inherit if set to false", () => {
      const schema = {
        origin: { type: "string" },
        cors: {
          extend: true,
          options: { origin: { inherit: false } }
        }
      };
      const options = { origin: "https://example.com/" };
      expect(optionally(schema, options)).toEqual({
        origin: "https://example.com/",
        cors: {}
      });
    });

    it("can inherit from a different parent key", () => {
      const schema = {
        domain: { type: "string" },
        cors: {
          extend: true,
          options: { origin: { inherit: "domain" } }
        }
      };
      const options = { domain: "https://example.com/" };
      expect(optionally(schema, options)).toEqual({
        domain: "https://example.com/",
        cors: { origin: "https://example.com/" }
      });
    });
  });
});
