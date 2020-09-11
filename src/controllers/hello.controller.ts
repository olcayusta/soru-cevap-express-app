import { HelloService } from './hello.service';

export class HelloController {
  constructor(
    private helloService: HelloService
  ) {
  }

  yazdir() {
    this.helloService.execute()
  }
}

export default new HelloController(
  new HelloService()
)


