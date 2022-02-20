import { Controller } from "../../libs/Controller.ts";


export class HomepageController extends Controller {

    injectControllerManager(instance: unknown) {
        console.log("Homepage->injectControllerManager", instance);
    }


    startup() {
        super.startup();
        console.log("Homepage->startup");
    }


    beforeRender() {
        super.startup();
        console.log("Homepage->beforeRender");
    }


    actionDefault({ id }: Record<string, string>) {
        console.log("Homepage->actionDefault");
        console.log("> id", id);
    }


    renderDefault(params: Record<string, string>) {
        console.log("Homepage->renderDefault");
        console.log("> params", params);
        
        this.sendJson({
            "message": "4",
        }, true)
    }
}
