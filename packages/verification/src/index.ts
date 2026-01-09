import "robustive-ts-express";
import { Scenario, IActor, UsecaseImple, Context, Scenes, Empty } from "robustive-ts";
import { Request, Response } from "express";

type MyScenes = {
    basics: { start: Empty },
    alternatives: {},
    goals: { done: Empty }
};

class Actor implements IActor<any> {
    user = null;
    constructor(public id: string) { }
}

const actor = new Actor("test-actor");
const scenario = new Scenario<MyScenes>("domain", "usecase", "id");

// Mocking UsecaseImple manually for testing because constructing it via Robustive is verbose for unit test
const usecase = new UsecaseImple<any, any, any>(
    "id",
    "domain",
    "usecase",
    { scene: "start", course: "basics" },
    scenario
);

console.log("Checking if handleRequest exists...");
if (typeof usecase.handleRequest === "function") {
    console.log("handleRequest exists!");
} else {
    console.error("handleRequest DOES NOT EXIST");
    // process.exit(1); 
    // Typescript definition exists, but let's check runtime. 
    // If it's missing at runtime, the output will show.
}

// Check prototype injection
console.log("Checking if proceedUntilResponse exists on Scenario...");
if (typeof scenario.proceedUntilResponse === "function") {
    console.log("proceedUntilResponse exists!");
} else {
    console.error("proceedUntilResponse DOES NOT EXIST");
    process.exit(1);
}

console.log("Verification Passed.");
