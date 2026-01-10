import { SwiftEnum, Scenario, UsecaseImple, ActorNotAuthorizedToInteractIn } from "robustive-ts";
const ResponseStatus = new SwiftEnum();
Scenario.prototype.proceedUntilResponse = function(req, res, to, actor) {
  if (this.delegate !== void 0 && this.delegate.proceedUntilResponse !== void 0) {
    return this.delegate.proceedUntilResponse(req, res, to, actor, this);
  }
  return Promise.reject(new Error());
};
Scenario.prototype.respond = function(next, status = ResponseStatus.normal({ statusCode: 200 })) {
  return Promise.resolve({ ...next, status });
};
UsecaseImple.prototype.handleRequest = function(req, res, actor) {
  const self = this;
  const recursive = (req2, res2, scenario2) => {
    const lastScene = scenario2.slice(-1)[0];
    if (lastScene.course === "goals" || lastScene.status) {
      return Promise.resolve(lastScene);
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
  const scenario = [self.currentContext];
  return recursive(req, res, scenario);
};
export { ResponseStatus };
//# sourceMappingURL=robustive-express.es.js.map
