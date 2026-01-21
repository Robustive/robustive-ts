import { SwiftEnum, Scenario, UsecaseImple, ActorNotAuthorizedToInteractIn } from "@robustive/robustive-ts";
const ResponseStatus = new SwiftEnum();
class HttpMethodIsNotAuthorized extends Error {
  constructor(domain, usecase, method) {
    super(`"${method}" is not authorized to proceed usecase "${String(usecase)}" of domain "${String(domain)}".`);
    this.name = "HttpMethodIsNotAuthorized";
  }
}
Scenario.prototype.validateHttpMethod = function(domain, usecase, method) {
  if (this.delegate !== void 0 && this.delegate.validateHttpMethod !== void 0) {
    return this.delegate.validateHttpMethod(domain, usecase, method);
  }
  return true;
};
Scenario.prototype.proceedUntilResponse = function(req, res, to, actor) {
  if (this.delegate !== void 0 && this.delegate.proceedUntilResponse !== void 0) {
    return this.delegate.proceedUntilResponse(req, res, to, actor, this);
  }
  return Promise.reject(new Error());
};
Scenario.prototype.respond = function(next, status = ResponseStatus.normal({ statusCode: 200 })) {
  return Promise.resolve({ ...next, status });
};
const HandleResultType = {
  success: "success",
  failure: "failure"
};
UsecaseImple.prototype.handleRequest = function(req, res, actor, recursiveWrapper) {
  const self = this;
  const startAt = new Date();
  const recursive = (req2, res2, scenario2) => {
    const lastScene = scenario2.slice(-1)[0];
    if (lastScene.course === "goals" || lastScene.status) {
      return Promise.resolve(scenario2);
    }
    return self._scenario.proceedUntilResponse(req2, res2, lastScene, actor).then((nextScene) => {
      self.currentContext = nextScene;
      scenario2.push(nextScene);
      return recursive(req2, res2, scenario2);
    });
  };
  if (self._scenario.authorize && !self._scenario.authorize(actor, self._domain, self._usecase)) {
    const err = new ActorNotAuthorizedToInteractIn(actor, self._domain, self._usecase);
    return Promise.reject(err);
  }
  if (self._scenario.validateHttpMethod && !self._scenario.validateHttpMethod(self._domain, self._usecase, req.method)) {
    const err = new HttpMethodIsNotAuthorized(self._domain, self._usecase, req.method);
    return Promise.reject(err);
  }
  const scenario = [self.currentContext];
  const execRecursion = () => recursive(req, res, scenario).then((performedScenario) => {
    const endAt = new Date();
    const elapsedTimeMs = endAt.getTime() - startAt.getTime();
    const lastSceneContext = performedScenario.slice(-1)[0];
    return {
      type: HandleResultType.success,
      id: self.id,
      actor,
      domain: self._domain,
      usecase: self._usecase,
      startAt,
      endAt,
      elapsedTimeMs,
      performedScenario,
      lastSceneContext
    };
  }).catch((error) => {
    const endAt = new Date();
    const elapsedTimeMs = endAt.getTime() - startAt.getTime();
    const lastSceneContext = scenario.slice(-1)[0];
    return {
      type: HandleResultType.failure,
      id: self.id,
      actor,
      domain: self._domain,
      usecase: self._usecase,
      startAt,
      endAt,
      elapsedTimeMs,
      performedScenario: scenario,
      failedSceneContext: lastSceneContext,
      error
    };
  });
  if (recursiveWrapper) {
    return recursiveWrapper(execRecursion);
  } else {
    return execRecursion();
  }
};
export { HandleResultType, HttpMethodIsNotAuthorized, ResponseStatus };
//# sourceMappingURL=robustive-express.es.js.map
