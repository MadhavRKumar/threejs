{
    let container,
        renderer,
        canvas,
        scene,
        quadScene,
        camera,
        orthoCamera,
        baseTexture,
        start = Date.now(),
        fov = 30,
        controls,
        ditherMaterial,
        quad,
        material,
        heartList = [],
        heartMaterial,
        isRecord = window.location.href.indexOf("?record") > -1;
        capturer = !isRecord || new CCapture({ format: 'gif', workersPath: "../three/" }),
        pink = new THREE.Color(0xffe2e7),
        darkGrey = new THREE.Color(0x010101),
        palette = [darkGrey, pink];



    window.addEventListener('keypress', function (event) {
        let keyCode = event.which;

        // Check for Enter
        if (keyCode === 13 && isRecord) {
            capturer.stop();

            capturer.save();
        }
    })


    function onWindowResize() {
        let w = window.innerWidth, h = window.innerHeight;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        baseTexture.setSize(w, h);
        camera.updateProjectionMatrix();
        
    }

    function init() {
        let skullLightX = lightFunction(),
            skullLightY = lightFunction(),
            skullLightZ = lightFunction();

        // grab the container from the DOM
        container = document.getElementById("container");

        // create the renderer and attach it to the DOM
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        container.appendChild(canvas = renderer.domElement);


        // create a scene for 3D objects
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);

        // create scene for post-processing
        quadScene = new THREE.Scene();


        // create a camera the size of the browser window
        // and place it 10000 units away, looking towards the center of the scene
        camera = new THREE.PerspectiveCamera(
            fov,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );

        window.addEventListener('resize', onWindowResize);


        // create orthographic camera for post-processing
        orthoCamera = new THREE.OrthographicCamera(1 / -2, 1 / 2, 1 / 2, 1 / -2, .00001, 1000);


        controls = new THREE.OrbitControls(camera);

        //controls.update() must be called after any manual changes to the camera's transform
        camera.position.z = 50;
        controls.update();

        // set up texture
        baseTexture = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat });

        // create a pink toon material for skelly man
        material = new THREE.ShaderMaterial({
            uniforms: {
                ambientColor: { value: pink },
                ambientStrength: { value: 0.2 },
                lightDir: { value: new THREE.Vector3() }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });

        // create separate but similar material for heart
        // so that i can change it up if I wish
        heartMaterial = new THREE.ShaderMaterial({
            uniforms: {
                ambientColor: { value: pink },
                ambientStrength: { value: 0.2 },
                lightDir: { value: new THREE.Vector3() },
            },
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("fragmentShader").textContent
        });

        // material to apply to quad for post-processing
        ditherMaterial = new THREE.ShaderMaterial({
            uniforms: {
                texture: { type: 't', value: 0, texture: baseTexture },
                palette: { value: palette },
                paletteSize: { value: 2 }
            },
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("ditheringShader").textContent,
            depthWrite: false
        });


        // create quad and add it to orthoscene
        quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), ditherMaterial);
        quadScene.add(quad);



        // instantiate loader
        let loader = new THREE.OBJLoader2();
        loader.setLogging(false);

        // load resource
        loader.load(
            // resource URL
            'assets/skelly2.obj',

            // callback function when resource is loaded
            function (loadObj) {
                // This is syntax required from OBJLoader2 because argument is NOT Object3D it turns out
                let object = loadObj.detail.loaderRootNode;
                object.traverse(function (node) {
                    console.log(node);
                    if (node.isMesh) node.material = material;
                }
                );

                let scl = 0.01;

                scene.add(object);
                camera.lookAt(object);
                object.scale.set(scl, scl, scl);

                object.children[0].geometry.computeBoundingSphere();
                let boundingSphere = object.children[0].geometry.boundingSphere;
                let radius = boundingSphere.radius * scl;
                object.position.y = -radius;

                let heartLoader = new THREE.OBJLoader2();
                heartLoader.setLogging(false);
                heartLoader.load(
                    // resource URL
                    'assets/heart.obj',

                    // callback function when resource is loaded
                    function (loadHeart) {
                        let h = loadHeart.detail.loaderRootNode;
                        let count = Math.floor(getRandom(4, 8));
                        heartList = new Array(count).fill().map(u => {
                            let heartScl = getRandom(0.01, 0.03);
                            let heart = createHeart(h, radius);
                            heart.heart.scale.set(heartScl, heartScl, heartScl);
                            scene.add(heart.heart);
                            heart.heart.children[0].material = heartMaterial.clone();
                            return heart;
                        });

                        let loader = document.getElementById("wrapper");
                        loader.classList.add("fade-out");
                    },
                    null,
                    null,
                    null,
                    true
                )
            },
            null,
            null,
            null,
            true
        );
        if(isRecord) {
        capturer.start();
        }
        render();

        //////////////////// RENDER FUNCTION ////////////////////
        function render() {

            controls.update();
            var time = (Date.now() - start) * 0.0005;
            material.uniforms['lightDir'].value = new THREE.Vector3(skullLightX(time), skullLightY(time), skullLightZ(time));

            for (let i = 0; i < heartList.length; i++) {

                // each heartobj is {heart, thetafunc, pifunc, radius} 
                // where heart is the mesh
                // theta/pi func is function that updates theta/pi on time
                let { heart, thetafunc, pifunc, radius, light, offset } = heartList[i];
                heart.children[0].material.uniforms['lightDir'].value = new THREE.Vector3(light.xfunc(time), light.yfunc(time), light.zfunc(time));

                let { x, y, z } = getPointOnSphere(radius, thetafunc(time), pifunc(time));

                heart.position.set(x, y - offset, z);
                heart.rotation.setFromVector3(new THREE.Vector3(light.xfunc(time), light.yfunc(time), light.zfunc(time)));

            }
            renderer.render(scene, camera, baseTexture);
            quad.material.uniforms['texture'].value = baseTexture.texture;
            renderer.render(quadScene, orthoCamera);

            requestAnimationFrame(render);

            if(isRecord) {
            capturer.capture(canvas);
            }
        }


        //////////////////// HELPER FUNCTIONS ////////////////////

        function getRandom(min, max) {
            return Math.random() * (max - min) + min;
        }

        // return x,y,z coordinates as well as theta and pi
        // if theta and pi are not given, then generate randomly
        function getPointOnSphere(r, t, p) {
            let theta = t || ((t == 0) ? 0 : getRandom(0, 2 * Math.PI));
            let pi = p || ((p == 0) ? 0 : getRandom(0, Math.PI));
            let x = r * Math.cos(theta) * Math.sin(pi);
            let y = r * Math.sin(theta) * Math.sin(pi);
            let z = r * Math.cos(pi);
            return { x, y, z, theta, pi };
        }

        // creates a "heart object" from heart mesh and radius
        // each heart object contains info concering mesh rotation, "light" rotation,
        // size, and offset
        function createHeart(h, r) {

            function angleFunction(scl, ang) {
                return (t) => {
                    return (ang + t * scl) % 2 * Math.PI;
                }
            }

            let heartSize = getRandom(2,4);

            let heart = h.clone();
            scene.add(heart);
            let radius = r + heartSize / 2.0;

            // destructuring is very cool
            let { x, y, z, theta, pi } = getPointOnSphere(radius);

            let offset = heartSize / 2.0;

            let thetafunc = angleFunction(getRandom(0.05, 1.5), theta);
            let pifunc = angleFunction(getRandom(0.05, 1.5), pi);
            let xfunc = lightFunction();
            let yfunc = lightFunction();
            let zfunc = lightFunction();
            let light = { xfunc, yfunc, zfunc };
            let ho = { heart, thetafunc, pifunc, radius, light, offset };

            heart.position.set(x, y, z);

            return ho;
        }

        function lightFunction() {
            let scl = getRandom(.5, 5);
            let scl2 = getRandom(.5, 5);
            let chance = Math.random();
            if (chance < 0.33) {
                return (t) => {
                    return (Math.cos(t * scl));
                }
            }
            else if (chance < 0.66) {
                return (t) => {
                    return (Math.sin(t * scl));
                }
            }
            else {
                return (t) => {
                    return (Math.sin(t * scl) * Math.cos(t * scl2));
                }
            }
        }

    }
    init();
}


