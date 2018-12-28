(function() {
let container,
    renderer,
    scene,
    camera,
    start = Date.now(),
    fov = 30,
    dirLight,
    controls,
    material;

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
    camera.position.z = 100;
    controls.update();

    // create a pink toon material
    material = new THREE.ShaderMaterial({
        uniforms: {
            ambientColor: { value: new THREE.Vector3(1, 0.7, 0.75) },
            ambientStrength: { value: 0.12 },
            lightDir: { value: new THREE.Vector3(1, 0.0, 0.5) }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
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
            let radius = boundingSphere.radius * scl;
            let geometry = new THREE.SphereGeometry(radius, 8, 8);
            let mat = new THREE.MeshBasicMaterial({ color: 0x777777, wireframe: true });

            console.log(object.children[0].geometry.boundingSphere);
            let sphere = new THREE.Mesh(geometry, mat);
            console.log(sphere.position);

            scene.add(sphere);

            object.position.y = -radius;
            let appleSize = Math.random() * 3;
            let appleGeometry = new THREE.SphereGeometry(appleSize, 8, 8);
            let apple = new THREE.Mesh(appleGeometry, material.clone());

            scene.add(apple);
            let theta = getRandom(0, 2 * Math.PI);
            let pi = getRandom(0, Math.PI);
            let x = radius * Math.cos(theta) * Math.sin(pi);
            let y = radius * Math.sin(theta) * Math.sin(pi);
            let z = radius * Math.cos(pi);
            apple.position.set(x, y, z);
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

    function render() {
        controls.update();
        var time = (Date.now() - start) * 0.0005;
        material.uniforms['lightDir'].value = new THREE.Vector3(Math.sin(time), 0.25, Math.cos(time))
        renderer.render(scene, camera);



        requestAnimationFrame(render);

    }
});
})();