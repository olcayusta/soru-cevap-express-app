"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelloController = void 0;
const hello_service_1 = require("./hello.service");
class HelloController {
    constructor(helloService) {
        this.helloService = helloService;
    }
    yazdir() {
        this.helloService.execute();
    }
}
exports.HelloController = HelloController;
exports.default = new HelloController(new hello_service_1.HelloService());
