"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseStatus = void 0;
const robustive_ts_1 = require("robustive-ts");
exports.ResponseStatus = new robustive_ts_1.SwiftEnum();
robustive_ts_1.Scenario.prototype.proceedUntilResponse = function (req, res, to, actor) {
    if (this.delegate !== undefined && this.delegate.proceedUntilResponse !== undefined) {
        return this.delegate.proceedUntilResponse(req, res, to, actor, this);
    }
    return Promise.reject(new Error());
};
robustive_ts_1.Scenario.prototype.respond = function (next, status = exports.ResponseStatus.normal({ statusCode: 200 })) {
    return Promise.resolve({ ...next, status });
};
robustive_ts_1.UsecaseImple.prototype.handleRequest = function (req, res, actor) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = this;
    const recursive = (req, res, scenario) => {
        const lastScene = scenario.slice(-1)[0];
        if (lastScene.course === "goals" || lastScene.status) { // exit criteria
            return Promise.resolve(lastScene);
        }
        return self._scenario.proceedUntilResponse(req, res, lastScene, actor)
            .then((nextScene) => {
            self._currentContext = nextScene;
            scenario.push(nextScene);
            return recursive(req, res, scenario);
        });
    };
    if (self._scenario.authorize && !self._scenario.authorize(actor, self._domain, self._usecase)) {
        const err = new robustive_ts_1.ActorNotAuthorizedToInteractIn(actor, self._domain, self._usecase);
        return Promise.reject(err);
    }
    const scenario = [self._currentContext];
    return recursive(req, res, scenario);
};
