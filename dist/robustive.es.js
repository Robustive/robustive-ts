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
var _domain, _usecase, _currentContext, _scenario;
class AbstractActor {
  constructor(user = null) {
    this.user = user;
  }
}
class Nobody extends AbstractActor {
}
const isNobody = (actor) => actor.constructor === Nobody;
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
const SceneFactory = class SceneFactory2 {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? prop : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const ContextFactory = class ContextFactory2 {
  constructor(course) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (withValues) => {
          return Object.freeze(Object.assign(withValues || {}, { "scene": prop, course }));
        } : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const SceneFactoryAdapter = class SceneFactoryAdapter2 {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? prop : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const ResponseStatus = new SwiftEnum();
class Scenario {
  constructor(domain, usecase, id, isSubstitute = false) {
    this.domain = domain;
    this.usecase = usecase;
    this.id = id;
    this.isSubstitute = isSubstitute;
    this.keys = {
      basics: new SceneFactory(),
      alternatives: new SceneFactory(),
      goals: new SceneFactory()
    };
    this.basics = new ContextFactory("basics");
    this.alternatives = new ContextFactory("alternatives");
    this.goals = new ContextFactory("goals");
  }
  next(to, actor) {
    if (this.delegate !== void 0 && this.delegate.next !== void 0) {
      return this.delegate.next(to, actor, this);
    }
    return Promise.reject(new Error());
  }
  proceedUntilResponse(req, res, to, actor) {
    if (this.delegate !== void 0 && this.delegate.proceedUntilResponse !== void 0) {
      return this.delegate.proceedUntilResponse(req, res, to, actor, this);
    }
    return Promise.reject(new Error());
  }
  just(next) {
    return Promise.resolve(next);
  }
  respond(next, status = ResponseStatus.normal({ statusCode: 200 })) {
    return Promise.resolve({ ...next, status });
  }
  authorize(actor, domain, usecase) {
    if (this.delegate !== void 0 && this.delegate.authorize !== void 0) {
      return this.delegate.authorize(actor, domain, usecase);
    }
    throw new Error(`USECASE "${usecase}" IS NOT AUTHORIZED FOR ACTOR "${actor.constructor.name}."`);
  }
  complete(withResult) {
    if (this.delegate !== void 0 && this.delegate.complete !== void 0) {
      this.delegate.complete(withResult);
    }
  }
}
const InteractResultType = {
  success: "success",
  failure: "failure"
};
const InteractResultFactory = class InteractResultFactory2 {
  constructor() {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (withValues) => {
          return Object.freeze(Object.assign(withValues, { "type": prop }));
        } : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const generateId = (length) => {
  const S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(length))).map((n) => S[n % S.length]).join("");
};
class UsecaseImple {
  constructor(id, domain, usecase, initialContext, scenario) {
    __privateAdd(this, _domain, void 0);
    __privateAdd(this, _usecase, void 0);
    __privateAdd(this, _currentContext, void 0);
    __privateAdd(this, _scenario, void 0);
    this.id = id;
    __privateSet(this, _domain, domain);
    __privateSet(this, _usecase, usecase);
    __privateSet(this, _currentContext, initialContext);
    __privateSet(this, _scenario, scenario);
  }
  set(delegate) {
    __privateGet(this, _scenario).delegate = delegate;
  }
  handleRequest(req, res, actor) {
    const recursive = (req2, res2, scenario2) => {
      const lastScene = scenario2.slice(-1)[0];
      if (lastScene.course === "goals" || lastScene.status) {
        return Promise.resolve(lastScene);
      }
      return __privateGet(this, _scenario).proceedUntilResponse(req2, res2, lastScene, actor).then((nextScene) => {
        __privateSet(this, _currentContext, nextScene);
        scenario2.push(nextScene);
        return recursive(req2, res2, scenario2);
      });
    };
    if (__privateGet(this, _scenario).authorize && !__privateGet(this, _scenario).authorize(actor, __privateGet(this, _domain), __privateGet(this, _usecase))) {
      const err = new ActorNotAuthorizedToInteractIn(actor, __privateGet(this, _domain), __privateGet(this, _usecase));
      return Promise.reject(err);
    }
    const scenario = [__privateGet(this, _currentContext)];
    return recursive(req, res, scenario);
  }
  interactedBy(actor) {
    const startAt = new Date();
    const InteractResult = new InteractResultFactory();
    const recursive = (scenario2) => {
      const lastScene = scenario2.slice(-1)[0];
      if (lastScene.course === "goals") {
        return Promise.resolve(scenario2);
      }
      return __privateGet(this, _scenario).next(lastScene, actor).then((nextScene) => {
        __privateSet(this, _currentContext, nextScene);
        scenario2.push(nextScene);
        return recursive(scenario2);
      });
    };
    if (__privateGet(this, _scenario).authorize && !__privateGet(this, _scenario).authorize(actor, __privateGet(this, _domain), __privateGet(this, _usecase))) {
      const err = new ActorNotAuthorizedToInteractIn(actor, __privateGet(this, _domain), __privateGet(this, _usecase));
      return Promise.reject(err);
    }
    const scenario = [__privateGet(this, _currentContext)];
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
      const lastSceneContext = scenario.slice(-1)[0];
      const result = InteractResult.failure({
        id: this.id,
        actor,
        domain: __privateGet(this, _domain),
        usecase: __privateGet(this, _usecase),
        startAt,
        endAt,
        elapsedTimeMs,
        performedScenario: scenario,
        failedSceneContext: lastSceneContext,
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
_currentContext = new WeakMap();
_scenario = new WeakMap();
const ScenarioFactory = class ScenarioFactory2 {
  constructor(domain, usecase, course, scenario) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (withValues, id, isSubstitute = false) => {
          const context = Object.assign(withValues || {}, { "scene": prop, course });
          const _id = id || generateId(8);
          const s = new scenario(domain, usecase, _id, isSubstitute);
          const usecaseImple = new UsecaseImple(_id, domain, usecase, context, s);
          return Object.freeze(Object.assign(usecaseImple, { "domain": domain, "name": usecase, "scene": prop, course }));
        } : Reflect.get(target, prop, receiver);
      }
    });
  }
};
class CourseSelector {
  constructor(domain, usecase, scenario) {
    this.keys = {
      basics: new SceneFactoryAdapter(),
      alternatives: new SceneFactoryAdapter(),
      goals: new SceneFactoryAdapter()
    };
    this.basics = new ScenarioFactory(domain, usecase, "basics", scenario);
    this.alternatives = new ScenarioFactory(domain, usecase, "alternatives", scenario);
    this.goals = new ScenarioFactory(domain, usecase, "goals", scenario);
  }
}
const UsecaseSelector = class UsecaseSelector2 {
  constructor(domain, scenarioConstructors) {
    const usecaseKeys = Object.keys(scenarioConstructors);
    this.keys = usecaseKeys.reduce((keys, usecase) => {
      keys[usecase] = usecase;
      return keys;
    }, {});
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && usecaseKeys.includes(prop) ? new CourseSelector(domain, prop, scenarioConstructors[prop]) : Reflect.get(target, prop, receiver);
      }
    });
  }
};
const Robustive = class Robustive2 {
  constructor(requirements) {
    const domainKeys = Object.keys(requirements);
    this.keys = domainKeys.reduce((keys, domain) => {
      keys[domain] = domain;
      return keys;
    }, {});
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && domainKeys.includes(prop) ? new UsecaseSelector(prop, requirements[prop]) : Reflect.get(target, prop, receiver);
      }
    });
  }
};
class ActorNotAuthorizedToInteractIn extends Error {
  constructor(actor, domain, usecase) {
    super(`The actor "${actor.constructor.name}" is not authorized to interact on usecase "${String(usecase)}" of domain "${String(domain)}".`);
  }
}
export { AbstractActor, ActorNotAuthorizedToInteractIn, CourseSelector, InteractResultType, Nobody, ResponseStatus, Robustive, Scenario, SwiftEnum, UsecaseSelector, isNobody };
