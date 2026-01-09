const KeyFactory = class KeyFactory2 {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? prop : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const SwiftEnum = class SwiftEnum2 {
  constructor(f) {
    this.keys = new KeyFactory();
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (associatedValues) => f !== void 0 ? Object.freeze(Object.assign(new f(), Object.assign(associatedValues || {}, { case: prop }))) : Object.freeze(Object.assign(associatedValues || {}, { case: prop })) : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const ResponseStatus = new SwiftEnum();
export { ResponseStatus };
