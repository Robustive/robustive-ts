class AbstractActor {
  constructor(user = null) {
    this.user = user;
  }
}
class Nobody extends AbstractActor {
}
const isNobody = (actor) => actor.constructor === Nobody;
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
class Scenario {
  constructor(domain, usecase, id) {
    this.domain = domain;
    this.usecase = usecase;
    this.id = id;
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
  just(next) {
    return Promise.resolve(next);
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
const currentContextStore = /* @__PURE__ */ new WeakMap();
class UsecaseImple {
  constructor(id, domain, usecase, initialContext, scenario) {
    this.id = id;
    this._domain = domain;
    this._usecase = usecase;
    this._scenario = scenario;
    currentContextStore.set(this, initialContext);
  }
  get currentContext() {
    return currentContextStore.get(this);
  }
  set currentContext(context) {
    currentContextStore.set(this, context);
  }
  set(delegate) {
    this._scenario.delegate = delegate;
  }
  progress(actor) {
    if (this._scenario.authorize && !this._scenario.authorize(actor, this._domain, this._usecase)) {
      const err = new ActorNotAuthorizedToInteractIn(actor, this._domain, this._usecase);
      return Promise.reject(err);
    }
    return this._scenario.next(this.currentContext, actor).then((nextScene) => {
      this.currentContext = nextScene;
      return nextScene;
    });
  }
  interactedBy(actor) {
    const startAt = new Date();
    const InteractResult = new InteractResultFactory();
    const recursive = (scenario2) => {
      const lastScene = scenario2.slice(-1)[0];
      if (lastScene.course === "goals") {
        return Promise.resolve(scenario2);
      }
      return this._scenario.next(lastScene, actor).then((nextScene) => {
        this.currentContext = nextScene;
        scenario2.push(nextScene);
        return recursive(scenario2);
      });
    };
    if (this._scenario.authorize && !this._scenario.authorize(actor, this._domain, this._usecase)) {
      const err = new ActorNotAuthorizedToInteractIn(actor, this._domain, this._usecase);
      return Promise.reject(err);
    }
    const scenario = [this.currentContext];
    return recursive(scenario).then((performedScenario) => {
      const endAt = new Date();
      const elapsedTimeMs = endAt.getTime() - startAt.getTime();
      const lastSceneContext = performedScenario.slice(-1)[0];
      const result = InteractResult.success({
        id: this.id,
        actor,
        domain: this._domain,
        usecase: this._usecase,
        startAt,
        endAt,
        elapsedTimeMs,
        performedScenario,
        lastSceneContext
      });
      if (this._scenario.complete) {
        this._scenario.complete(result);
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
        domain: this._domain,
        usecase: this._usecase,
        startAt,
        endAt,
        elapsedTimeMs,
        performedScenario: scenario,
        failedSceneContext: lastSceneContext,
        error: err
      });
      if (this._scenario.complete) {
        this._scenario.complete(result);
      }
      return result;
    });
  }
}
const ScenarioFactory = class ScenarioFactory2 {
  constructor(domain, usecase, course, scenario) {
    return new Proxy(this, {
      get(target, prop, receiver) {
        return typeof prop === "string" && !(prop in target) ? (withValues, id) => {
          const context = Object.assign(withValues || {}, { "scene": prop, course });
          const _id = id || generateId(8);
          const s = new scenario(domain, usecase, _id);
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
export { AbstractActor, ActorNotAuthorizedToInteractIn, CourseSelector, InteractResultType, Nobody, Robustive, Scenario, SwiftEnum, UsecaseImple, UsecaseSelector, isNobody };
//# sourceMappingURL=robustive.es.js.map
