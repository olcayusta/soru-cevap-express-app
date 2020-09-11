import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';

const helloController = new HelloController(
    new HelloService()
)

export { helloController }
