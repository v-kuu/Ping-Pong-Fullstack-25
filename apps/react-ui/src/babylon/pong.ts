export const createScene = function() {
    var scene = new BABYLON.Scene(engine);

    //camera setup
    var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 6, 20, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    camera.lowerBetaLimit = camera.upperBetaLimit = camera.beta;
    camera.lowerAlphaLimit = camera.upperAlphaLimit = camera.alpha;
    camera.panningAxis = new BABYLON.Vector3(1, 1, 0);
    camera.panningSensibility = 1e3;

    //light setup
    const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(-0.7, -1, -0.5), scene);
    light.autoCalcShadowZBounds = true;
    light.intensity = 0.7;

    //entity setup
    var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 0.5, segments: 32 }, scene);
    sphere.position.y = 0.25;
    var ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 12, height: 6 }, scene);
    ground.receiveShadows = true;
    var box1 = BABYLON.MeshBuilder.CreateBox("player1", { width: 0.5, height: 0.3, depth: 3 }, scene);
    box1.position.x = -6;
    box1.position.y = 0.2;
    var box2 = BABYLON.MeshBuilder.CreateBox("player2", { width: 0.5, height: 0.3, depth: 3 }, scene);
    box2.position.x = 6;
    box2.position.y = 0.2;

    //shadow setup
    const csm = new BABYLON.CascadedShadowGenerator(4096, light);csm.autoCalcDepthBounds = true;
    csm.addShadowCaster(sphere);
    csm.addShadowCaster(box1);
    csm.addShadowCaster(box2);

    //input setup
    const keys = {};
    window.addEventListener("keydown", (e) => keys[e.key] = true);
    window.addEventListener("keyup", (e) => keys[e.key] = false);
    const moveSpeed = 6;
    scene.onBeforeRenderObservable.add(() => {
        const delta = scene.getEngine().getDeltaTime() / 1e3;
        const distance = moveSpeed * delta;
        if (keys["w"]) {
            box1.position.z += distance;
        }
        if (keys["s"]) {
            box1.position.z -= distance;
        }
        if (keys["ArrowUp"]) {
            box2.position.z += distance;
        }
        if (keys["ArrowDown"]) {
            box2.position.z -= distance;
        }
    });
    return scene;
};
