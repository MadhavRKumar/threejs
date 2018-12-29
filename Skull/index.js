{
    let container,
        renderer,
        canvas,
        scene,
        camera,
        start = Date.now(),
        fov = 30,
        controls,
        material,
        heartList = [],
        heartMaterial,
        capturer = new CCapture({format: 'gif', workersPath:"../three/"});

    window.addEventListener('keypress', function (event) {
        let keyCode = event.which;

        // Check for Enter
        if(keyCode === 13) {
            capturer.stop();

            capturer.save();
        }
    })

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

        // create separate but similar material for heart
        // so that i can change it up if I wish
        heartMaterial = new THREE.ShaderMaterial({
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
                camera.lookAt(object);
                object.scale.set(scl, scl, scl);

                object.children[0].geometry.computeBoundingSphere();
                let boundingSphere = object.children[0].geometry.boundingSphere;
                let radius = boundingSphere.radius * scl;
                object.position.y = -radius;

                let count = Math.floor(getRandom(2, 5));
                heartList = new Array(count).fill().map(u => 
                    {
                        let heart = createHeart(radius);
                        scene.add(heart.heart);
                        return heart;
                    });
                

                // let geometry = new THREE.SphereGeometry(radius, 8, 8);
                // let mat = new THREE.MeshBasicMaterial({ color: 0x777777, wireframe: true });
                // let sphere = new THREE.Mesh(geometry, mat);
                // scene.add(sphere);
            },

            // callback function when loading is in progress
            function (xhr) {

            }
        );

        // create the renderer and attach it to the DOM
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        container.appendChild(canvas=renderer.domElement);
        
        capturer.start();

        render();

        function render() {
            requestAnimationFrame(render);

            controls.update();
            var time = (Date.now() - start) * 0.0005;
            material.uniforms['lightDir'].value = new THREE.Vector3(Math.sin(time), -0.25, Math.cos(time));
            heartMaterial.uniforms['lightDir'].value = new THREE.Vector3(Math.cos(time / 0.4) * Math.sin(-time), Math.cos(time / 0.4), Math.sin(time / 10.0));

            for(let i = 0; i < heartList.length; i++) {

                // each heartobj is {heart, thetafunc, pifunc, radius} 
                // where heart is the mesh
                // theta/pi func is function that updates theta/pi on time
                let {heart, thetafunc, pifunc, radius} = heartList[i]; 

                let { x, y, z } = getPointOnSphere(radius, thetafunc(time), pifunc(time));
             
                heart.position.set(x, y, z);
            
            }
            renderer.render(scene, camera);

            capturer.capture(canvas);

        }

        
        function getRandom(min, max) {
            return Math.random() * (max - min) + min;
        }

        // return x,y,z coordinates as well as theta and pi
        // if theta and pi are not given, then generate randomly
        function getPointOnSphere(r, t, p) {
            let theta = t || ((t==0) ? 0 : getRandom(0, 2 * Math.PI));
            let pi = p || ((p==0) ? 0 : getRandom(0, Math.PI));
            let x = r * Math.cos(theta) * Math.sin(pi);
            let y = r * Math.sin(theta) * Math.sin(pi);
            let z = r * Math.cos(pi);
            return { x, y, z, theta, pi };
        }

        function createHeart(r) {

            // let geometry = new THREE.SphereGeometry(radius, 8, 8);
            // let mat = new THREE.MeshBasicMaterial({ color: 0x777777, wireframe: true });
            // let sphere = new THREE.Mesh(geometry, mat);
            // scene.add(sphere);

            function angleFunction(scl, ang) {
                return (t) => {
                    return (ang + t * scl) % 2 * Math.PI;
                }
            }
    
            let heartSize = getRandom(0.5, 2);

            let mat = heartMaterial.clone();
            let heartGeometry = new THREE.SphereGeometry(heartSize, 8, 8);
            let heart = new THREE.Mesh(heartGeometry, mat);
            scene.add(heart);
            let radius = r + heartSize/2.0;

            // destructuring is very cool
            let { x, y, z, theta, pi } = getPointOnSphere(radius);

            let thetafunc = angleFunction(getRandom(0.1, 2), theta);
            let pifunc = angleFunction(getRandom(0.1, 2), pi);      
            let ho = { heart, thetafunc, pifunc, radius };

            heart.position.set(x,y,z);
            
            return ho;
        }
    });



}


