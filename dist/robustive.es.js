var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _domain, _usecase, _initialContext, _scenario;
class BaseActor {
  constructor(user = null) {
    this.user = user;
  }
}
class Nobody extends BaseActor {
}
const isNobody = (actor) => actor.constructor === Nobody;
const ContextSelector = class ContextSelector2 {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        switch (prop) {
          case "basics":
          case "alternatives":
          case "goals": {
            return new Proxy({}, {
              get(target2, prop_scene, receiver2) {
                return typeof prop_scene === "string" && !(prop_scene in target2) ? (withValues) => {
                  return Object.freeze({ "scene": prop_scene, course: prop, ...withValues });
                } : Reflect.get(target2, prop, receiver2);
              }
            });
          }
          default: {
            return Reflect.get(target, prop, receiver);
          }
        }
      }
    });
  }
};
const InteractResultType = {
  success: "success",
  failure: "failure"
};
const InteractResultFactory = class InteractResultFactory2 {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (withValues) => {
          return Object.freeze({ "type": prop, ...withValues });
        } : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const generateId = (length) => {
  const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length))).map((n) => S[n % S.length]).join("");
};
class _Usecase {
  constructor(domain, usecase, initialContext, scenario) {
    __privateAdd(this, _domain, void 0);
    __privateAdd(this, _usecase, void 0);
    __privateAdd(this, _initialContext, void 0);
    __privateAdd(this, _scenario, void 0);
    this.id = generateId(8);
    __privateSet(this, _domain, domain);
    __privateSet(this, _usecase, usecase);
    __privateSet(this, _initialContext, initialContext);
    __privateSet(this, _scenario, scenario);
  }
  interactedBy(actor) {
    const startAt = new Date();
    const InteractResult = new InteractResultFactory();
    const recursive = (scenario2) => {
      const lastScene = scenario2.slice(-1)[0];
      if (lastScene.course === "goals") {
        return Promise.resolve(scenario2);
      }
      return __privateGet(this, _scenario).next(lastScene).then((nextScene) => {
        scenario2.push(nextScene);
        return recursive(scenario2);
      });
    };
    if (__privateGet(this, _scenario).authorize && !__privateGet(this, _scenario).authorize(actor, __privateGet(this, _domain), __privateGet(this, _usecase))) {
      const err = new ActorNotAuthorizedToInteractIn(actor, __privateGet(this, _domain), __privateGet(this, _usecase));
      return Promise.reject(err);
    }
    const scenario = [__privateGet(this, _initialContext)];
    return recursive(scenario).then((performedScenario) => {
      const endAt = new Date();
      const elapsedTimeMs = endAt.getTime() - startAt.getTime();
      const lastSceneContext = performedScenario.slice(-1)[0];
      const result = InteractResult.success({
        id: this.id,
        actor,
        domain: __privateGet(this, _domain),
        usecase: __privateGet(this, _usecase),
        startAt,
        endAt,
        elapsedTimeMs,
        performedScenario,
        lastSceneContext
      });
      if (__privateGet(this, _scenario).complete) {
        __privateGet(this, _scenario).complete(result);
      }
      return result;
    }).catch((err) => {
      console.error(err);
      const endAt = new Date();
      const elapsedTimeMs = endAt.getTime() - startAt.getTime();
      const result = InteractResult.failure({
        id: this.id,
        actor,
        domain: __privateGet(this, _domain),
        usecase: __privateGet(this, _usecase),
        startAt,
        endAt,
        elapsedTimeMs,
        error: err
      });
      if (__privateGet(this, _scenario).complete) {
        __privateGet(this, _scenario).complete(result);
      }
      return result;
    });
  }
}
_domain = new WeakMap();
_usecase = new WeakMap();
_initialContext = new WeakMap();
_scenario = new WeakMap();
const Course = class Course2 {
  constructor(domain, usecase, course, scenario) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (withValues) => {
          const context = { "scene": prop, course, ...withValues };
          const s = new scenario();
          const usecaseCore = new _Usecase(domain, usecase, context, s);
          return Object.freeze(Object.assign(usecaseCore, { "name": usecase, "domain": domain }));
        } : Reflect.get(target, prop, receiver);
      }
    });
  }
};
class BaseScenario {
  constructor() {
    const { basics, alternatives, goals } = new ContextSelector();
    this.basics = basics;
    this.alternatives = alternatives;
    this.goals = goals;
  }
  just(next) {
    return Promise.resolve(next);
  }
}
class CourseSelector {
  constructor(domain, usecase, scenario) {
    this.basics = new Course(domain, usecase, "basics", scenario);
    this.alternatives = new Course(domain, usecase, "alternatives", scenario);
    this.goals = new Course(domain, usecase, "goals", scenario);
  }
}
const UsecaseSelector = class UsecaseSelector2 {
  constructor(domain, usecases) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? new CourseSelector(domain, prop, usecases[prop]) : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const Robustive = class Robustive2 {
  constructor(requirements) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? new UsecaseSelector(prop, requirements[prop]) : Reflect.get(target, prop, receiver);
      }
    });
  }
};
class ActorNotAuthorizedToInteractIn extends Error {
  constructor(actor, domain, usecase) {
    super(`The actor "${actor.constructor.name}" is not authorized to interact on usecase "${String(usecase)}" of domain "${String(domain)}".`);
  }
}
export { ActorNotAuthorizedToInteractIn, BaseActor, BaseScenario, ContextSelector, InteractResultType, Nobody, Robustive, UsecaseSelector, isNobody };
