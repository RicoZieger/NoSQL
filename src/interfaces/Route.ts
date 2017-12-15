import { Express } from "express";

export interface Route {
    constructor(expressApp: Express);

    getRoutes(): void;
}