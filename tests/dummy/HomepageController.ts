import { Controller } from "../../libs/Controller.ts";


export class HomepageController extends Controller {

    startup() {
        console.log("---> HomepageController.startup", this);
    }


    beforeRender() {
        console.log("---> HomepageController.beforeRender", this);
    }


    actionDefault() {
        console.log("---> HomepageController.actionDefault", this);
    }


    renderDefault() {
        console.log("---> HomepageController.rendernDefault", this);
        
        this.sendJson({
            "ahoj": "world",
        })
    }

}