{
    let container,
        renderer,
        scene,
        camera,
        start = Date.now(),
        fov = 30,
        controls,
        material,
        appleObj,
        apple,
        appleList,
        appleMaterial,
        radius;

    window.addEventListener('load', function () {

        // grab the container from the DOM
        container = document.getElementById("container");

        // create a scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0xffffff);


        // create a camera the size of the browser window
        // and place it 100 units away, looking towards the center of the scene
        camera = new THREE.PerspectiveCamera(
            fov,
            window.innerWidth / window.innerHeight,
            1,
            10000
        );

        controls = new THREE.OrbitControls(camera);

        //controls.update() must be called after any manual changes to the camera's transform
        camera.position.z = 50;
        controls.update();

        // create a pink toon material for skelly man
        material = new THREE.ShaderMaterial({
            uniforms: {
                ambientColor: { value: new THREE.Color(0xFFB6C1) },
                ambientStrength: { value: 0.2 },
                lightDir: { value: new THREE.Vector3() }
            },
            vertexShader: document.getElementById('vertexShader').textContent,
            fragmentShader: document.getElementById('fragmentShader').textContent
        });

        // create separate but similar material for apple
        // so that i can change it up if I wish
        appleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                ambientColor: { value: new THREE.Color(0xFFB6C1) },
                ambientStrength: { value: 0.2 },
                lightDir: { value: new THREE.Vector3() },
            },
            vertexShader: document.getElementById("vertexShader").textContent,
            fragmentShader: document.getElementById("fragmentShader").textContent
        });

        // instantiate loader
        var loader = new THREE.OBJLoader();


        // load resource
        loader.load(
            // resource URL
            'assets/skelly.obj',

            // callback function when resource is loaded
            function (object) {
                object.traverse(function (node) {
                    if (node.isMesh) node.material = material;
                }
                );

                let scl = 0.01;

                scene.add(object);
                object.scale.set(scl, scl, scl);

                object.children[0].geometry.computeBoundingSphere();
                let boundingSphere = object.children[0].geometry.boundingSphere;
                radius = boundingSphere.radius * scl;
                // let geometry = new THREE.SphereGeometry(radius, 8, 8);
                // let mat = new THREE.MeshBasicMaterial({ color: 0x777777, wireframe: true });

                // let sphere = new THREE.Mesh(geometry, mat);

                // scene.add(sphere);

                object.position.y = -radius;
                let appleSize = getRandom(1, 2);
                radius += appleSize*1.1;
                appleMaterial.uniforms['radius'] = radius;
                let appleGeometry = new THREE.SphereGeometry(appleSize, 8, 8);
                apple = new THREE.Mesh(appleGeometry, appleMaterial);

                scene.add(apple);



                // destructuring is very cool
                let { x, y, z, theta, pi } = getPointOnSphere(radius);

                appleObj = { apple, theta, pi };

                apple.translateX(x);
                apple.translateY(y);
                apple.translateZ(z);
            },

            // callback function when loading is in progress
            function (xhr) {

            }
        );





        // create the renderer and attach it to the DOM
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        container.appendChild(renderer.domElement);


        render();



        function getRandom(min, max) {
            return Math.random() * (max - min) + min;
        }

        // return x,y,z coordinates as well as theta and pi
        // if theta and pi are not given, then generate randomly
        function getPointOnSphere(r, t, p) {
            let theta = t || getRandom(0, 2 * Math.PI);
            let pi = p || getRandom(0, Math.PI);
            let x = r * Math.cos(theta) * Math.sin(pi);
            let y = r * Math.sin(theta) * Math.sin(pi);
            let z = r * Math.cos(pi);
            return { x, y, z, theta, pi };
        }

        function render() {
            controls.update();
            var time = (Date.now() - start) * 0.0005;
            material.uniforms['lightDir'].value = new THREE.Vector3(Math.sin(time), -0.25, Math.cos(time));
            appleMaterial.uniforms['lightDir'].value = new THREE.Vector3( Math.cos(time/0.4)*Math.sin(-time),  Math.cos(time/0.4), Math.sin(time/10.0))
            if (appleObj) {
                let { x, y, z} = getPointOnSphere(radius, (appleObj.theta+(time*0.1)) % 2 * Math.PI + 0.01, appleObj.pi+time % 2 * Math.PI + 0.01);

                apple.position.set(x,y,z);
            }
            renderer.render(scene, camera);




            requestAnimationFrame(render);

        }
    });
}