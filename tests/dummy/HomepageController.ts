import { Controller } from "../../libs/Controller.ts";


export class HomepageController extends Controller {

    startup() {
        console.log("Homepage->startup");
    }


    beforeRender() {
        console.log("Homepage->beforeRender");
    }


    actionDefault() {
        console.log("Homepage->actionDefault");
    }


    renderDefault() {
        console.log("Homepage->rendernDefault");
        
        this.sendJson({
            "message": "4",
        }, true)
    }

}