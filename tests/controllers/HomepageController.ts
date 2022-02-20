import { Controller } from "../../libs/Controller.ts";


export class HomepageController extends Controller {

    injectDummyDependency(instance: unknown) {
        console.log("Homepage::injectDummyDependency", instance);
    }


    startup() {
        super.startup();
        console.log("Homepage::startup");
    }


    shutdown() {
        super.shutdown();
        console.log("Homepage::shutdown");
    }


    beforeRender() {
        super.beforeRender();
        console.log("Homepage::beforeRender");
    }


    afterRender() {
        super.afterRender();
        console.log("Homepage::afterRender");
    }


    actionDefault() {
        console.log("Homepage::actionDefault");
    }


    renderDefault() {
        console.log("Homepage::renderDefault");
        
        this.sendJson({
            "message": "4"
        }, true)
    }
}
