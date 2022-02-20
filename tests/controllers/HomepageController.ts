import { Controller } from "../../libs/Controller.ts";


export class HomepageController extends Controller {

    injectDummyDependency(instance: unknown) {
        console.log("Homepage::injectDummyDependency", instance);
    }


    startup() {
        super.startup();
        console.log("Homepage::startup");
    }


    beforeRender() {
        super.startup();
        console.log("Homepage::beforeRender");
    }


    actionDefault() {
        console.log("Homepage::actionDefault");
    }


    renderDefault() {
        console.log("Homepage::renderDefault");
        
        this.sendJson({
            "message": "4",
        }, true)
    }
}
