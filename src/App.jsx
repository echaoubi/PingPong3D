import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import Stats from "three/addons/libs/stats.module.js";
import { GroundProjectedSkybox } from "three/addons/objects/GroundProjectedSkybox.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

import io from "socket.io-client";
const socket = io("http://10.12.4.5:3000"); // Replace with your Socket.io server URL

class element {
  constructor(obj, mtl, position, rotation, scale) {
    this.obj = obj;
    this.mtl = mtl;
    this.position = position;
    this.rotation = rotation;
    this.scale = scale;
    this.mesh = null;
  }

  define_mesh(the_new_mesh) {
    this.mesh = the_new_mesh;
  }
}

const PongGame = () => {
  const containerRef = useRef(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });

  // Constants
  const WIDTH = window.innerWidth - 10,
    HEIGHT = 1200,
    FIELD_WIDTH = 960,
    FIELD_LENGTH = 3000,
    PADDLE_WIDTH = 300,
    PADDLE_HEIGHT = 30,
    BALL_RADIUS = 100,
    Player_GeoList = [],
    Player_OP_GeoList = [];

  let renderer, scene, camera, paddle1, paddle2, ball, paddle1_player, stats;
  let BALL_DX = 0.15,
    CLIKED_RIGHT = false,
    CLIKED_LEFT = false,
    player1_rotation = Math.PI / 2;

  const params = {
    camerax: 30,
    cameray: 12,
    cameraz: 0,
    cameraangle: 45,
    cameraaround: 20,
  };
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to Socket.io server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.io server");
    });
    socket.on("id", (data) => {
      console.log(data);
    });
    socket.on("ballmove", (data) => {
      // console.log(data);
    });
    socket.on("paddlemove", (data) => {
      // console.log(data);
      for (let geo of Player_OP_GeoList) {
        geo.position.x = data.x * -1;
        geo.position.y = data.y;
        geo.position.z = data.z;
        geo.rotation.x = data.rotationx;
        geo.rotation.y = -data.rotationy;
        geo.rotation.z = -data.rotationz;
      }
    });

    let angle = 0; // Initialize rotation angle
    let object;

    // Initialize Three.js

    function containerMouseMove(e) {
      var mouseX = e.clientX;
      console.log(mouseX);
      var posii = ((WIDTH - mouseX) / WIDTH) * FIELD_WIDTH - FIELD_WIDTH / 2;
      console.log(posii);
      paddle1_player.position.z = posii;
      // console.log(paddle1_player.position);
      for (let geo of paddle1_player.mesh) {
        geo.position.z = posii / 40;
        player1_rotation = 0.015;
        // geo.rotateOnAxis(new THREE.Vector3(0, -0.7, 1), player1_rotation);
        // geo.position.y = geo.position.y + 0.2;
        // console.log(geo.position);
        geo.position.y = 5 + (3.5 - Math.abs(geo.position.z)) / 5;
        geo.position.x = 10.5 + (3.5 - Math.abs(geo.position.z)) / 10;
      }
    }

    const init = (geometries) => {
      const gui = new GUI();
      gui.add(params, "camerax", 0, 50, 0.1).onChange(() => {
        camera.position.x = params.camerax;
        renderer.render(scene, camera);
      });
      gui.add(params, "cameray", 0, 50, 0.1).onChange(() => {
        camera.position.y = params.cameray;
        renderer.render(scene, camera);
      });
      gui.add(params, "cameraz", 0, 50, 0.1).onChange(() => {
        camera.position.z = params.cameraz;
        renderer.render(scene, camera);
      });
      gui.add(params, "cameraangle", 30, 180, 0.1).onChange(() => {
        camera.fov = params.cameraangle;
        camera.updateProjectionMatrix();
        renderer.render(scene, camera);
      });
      gui.add(params, "cameraaround", 0, 360, 0.1).onChange(() => {
        const radius = 20;
        camera.position.x = radius * Math.sin(params.cameraaround);
        camera.position.z = radius * Math.cos(params.cameraaround);
        camera.lookAt(scene.position);
      });
      stats = new Stats();

      // console.log(geometries);
      // create a scene, that will hold all our elements
      // such as objects, cameras and lights.
      scene = new THREE.Scene();

      // scene.background = new THREE.Color(0x548f89);
      // const loader_back = new THREE.CubeTextureLoader();
      // const texture = loader_back.load([
      //   "wall2.png", // px
      //   "wall2.png", // nx
      //   "wall4.jpeg", // py
      //   "wall4.jpeg", // ny
      //   "wall22.png", // pz
      //   "wall22.png", // nz
      // ]);
      // scene.background = texture;
      // orbital controls

      async function loadSkybox() {
        const hdrLoader = new RGBELoader();
        const envMap = await hdrLoader.loadAsync("test_hdr_kiara.pic");
        envMap.mapping = THREE.EquirectangularReflectionMapping;

        const skybox = new GroundProjectedSkybox(envMap);
        skybox.scale.setScalar(100);
        scene.add(skybox);
      }
      loadSkybox();

      // scene.background = new THREE.Color(0x333333);
      // scene.environment = new RGBELoader().load("venice_sunset_1k.hdr");
      // scene.environment.mapping = THREE.EquirectangularReflectionMapping;
      // scene.fog = new THREE.Fog(0x333333, 10, 15);

      // grid = new THREE.GridHelper(20, 40, 0xffffff, 0xffffff);
      // grid.material.opacity = 0.2;
      // grid.material.depthWrite = false;
      // grid.material.transparent = true;
      // scene.add(grid);

      // create a camera, which defines where we looking at.
      camera = new THREE.PerspectiveCamera(
        params.cameraangle,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      // position and point the camera to the center
      // camera.position.x = 30;
      // camera.position.y = 12;
      // camera.position.z = 0;
      camera.position.x = params.camerax;
      camera.position.y = params.cameray;
      camera.position.z = params.cameraz;

      // camera.rotation.x = 1.7;
      // camera.rotation.y = 1.2;
      // camera.rotation.z = 1.6;

      camera.lookAt(scene.position);

      // create a renderer, set the background color and size
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.domElement.addEventListener("mousemove", containerMouseMove);
      // const controls = new OrbitControls(camera, renderer.domElement);

      renderer.setPixelRatio(window.devicePixelRatio);
      // renderer.setClearColor(0x000000, 1.0);
      renderer.setSize(window.innerWidth, window.innerHeight - 10);

      // create a field and add to scene
      const testure = new THREE.TextureLoader().load("table.png");

      const materials = [
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // right side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // left side
        // new THREE.MeshBasicMaterial({ color: 0xb2c2d6 }), // top side
        //assets

        new THREE.MeshMatcapMaterial({ map: testure }), // top side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // bottom side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // front side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // back side
      ];

      // Create the field geometry

      var fieldGeometry = new THREE.BoxGeometry(20, 1, 14);

      // Create the field mesh with the geometry and the materials array
      var field = new THREE.Mesh(fieldGeometry, materials);
      field.position.set(0, 0, 0); // Set the position
      // scene.add(field);
      field.position.x = 0; // Position it at one edge of the field
      field.position.y = 0; // Adjust the height if necessary
      field.position.z = 0;

      // scene.add(field);
      function loadmodel_obj(the_element) {
        return new Promise((resolve, reject) => {
          const mtloader = new MTLLoader();
          mtloader.load(the_element.mtl, (mtl) => {
            mtl.preload();
            loader.setMaterials(mtl);
            loader.load(
              the_element.obj,
              (obj) => {
                const new_mesh_list = [];
                obj.traverse((child) => {
                  if (child.isMesh) {
                    // console.log(child);
                    const mesh = new THREE.Mesh(
                      child.geometry,
                      new THREE.MeshBasicMaterial({
                        color: child.material.color,
                      })
                    );
                    mesh.scale.set(
                      the_element.scale.x,
                      the_element.scale.y,
                      the_element.scale.z
                    );
                    mesh.position.set(
                      the_element.position.x,
                      the_element.position.y,
                      the_element.position.z
                    );
                    mesh.rotation.set(
                      the_element.rotation.x,
                      the_element.rotation.y,
                      the_element.rotation.z
                    );
                    new_mesh_list.push(mesh);
                    scene.add(mesh);
                  }
                });
                the_element.define_mesh(new_mesh_list);
                resolve(); // Resolve the promise after loading is complete
              },
              undefined,
              reject
            ); // Reject the promise on error
          });
        });
      }

      let table_ping = new element(
        "tableTennisTable3.obj",
        "tableTennisTable3.mtl",
        { x: 0, y: 0, z: 0 },
        { x: 0, y: Math.PI / 2, z: 0 },
        { x: 3.5, y: 3.5, z: 3.5 }
      );
      // loadmodel_obj(table_ping);
      paddle1_player = new element(
        "paddlev3.obj",
        "paddlev3.mtl",
        { x: 10.85, y: 5, z: 0 },
        { x: 0, y: Math.PI / 2, z: 0 },
        { x: 5, y: 5, z: 5 }
      );
      let paddle2_player = new element(
        "paddlev3.obj",
        "paddlev3.mtl",
        { x: -10.85, y: 5, z: 0 },
        { x: 0, y: Math.PI / 2, z: 0 },
        { x: 5, y: 5, z: 5 }
      );
      // loadmodel_obj(paddle);
      async function loadModels() {
        await loadmodel_obj(table_ping);
        // console.log(table_ping.mesh);
        await loadmodel_obj(paddle1_player);
        // console.log(paddle1_player.mesh);
        await loadmodel_obj(paddle2_player);
      }

      loadModels();

      // loadmodel_obj("tableTennisTable3.obj", "tableTennisTable3.mtl");
      // loadmodel_obj("paddlev3.obj", "paddlev3.mtl");

      const paddleGeometry = new THREE.BoxGeometry(1, 0.3, 3); // 10 is the depth of the paddle
      const paddleMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      // Paddle 1
      paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
      paddle1.position.x = 9.5; // Position it at one edge of the field
      paddle1.position.y = 0.7; // Adjust the height if necessary
      paddle1.position.z = 0;
      // scene.add(paddle1);
      // Paddle 2
      paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
      paddle2.position.x = -9.5; // Position it at one edge of the field
      paddle2.position.y = 0.7; // Adjust the height if necessary
      paddle2.position.z = 0;
      // scene.add(paddle2);

      const ballGeometry = new THREE.SphereGeometry(0.23, 32, 32);
      const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      ball = new THREE.Mesh(ballGeometry, ballMaterial);
      ball.position.x = 0;
      ball.position.y = 1;
      ball.position.z = 0;
      scene.add(ball);

      var geoMaterial;
      const colorlist = {
        Cap_2_1: 0xffffff,
        Cap_1_1: 0xffffff,
        Cap_2: 0xde0b0b,
        Cap_1: 0xde0b0b,
        Extrude: 0xde0b0b,
        "Extrude.1": 0xffffff,
      };

      for (let geo of geometries) {
        geoMaterial = new THREE.MeshBasicMaterial({
          color: colorlist[geo.name],
        });
        const mesh = new THREE.Mesh(geo.geometry, geoMaterial);
        mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), player1_rotation);
        //resize
        mesh.scale.x = 0.3;
        mesh.scale.y = 0.3;
        mesh.scale.z = 0.3;
        mesh.position.x = 10.85;
        mesh.position.y = 2.7;
        mesh.position.z = 0;
        Player_GeoList.push(mesh);
        // scene.add(mesh);
      }
      for (let geo of geometries) {
        geoMaterial = new THREE.MeshBasicMaterial({
          color: colorlist[geo.name],
        });
        const mesh = new THREE.Mesh(geo.geometry, geoMaterial);
        mesh.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI / 2);
        //resize
        mesh.scale.x = 0.3;
        mesh.scale.y = 0.3;
        mesh.scale.z = 0.3;
        mesh.position.x = -10.85;
        mesh.position.y = 2.7;
        mesh.position.z = 0;
        Player_OP_GeoList.push(mesh);
        // scene.add(mesh);
      }
      // function loadModel() {
      //   object.traverse(function (child) {
      //     if (child.isMesh) child.material.map = texture;
      //   });

      //   object.position.y = -0.95;
      //   object.scale.setScalar(0.01);
      //   scene.add(object);

      //   render();
      // }

      // const manager = new THREE.LoadingManager(loadModel);

      // const textureLoader = new THREE.TextureLoader(manager);
      // const texture = textureLoader.load("textures/uv_grid_opengl.jpg", render);
      // texture.colorSpace = THREE.SRGBColorSpace;
      // function onProgress(xhr) {
      //   if (xhr.lengthComputable) {
      //     const percentComplete = (xhr.loaded / xhr.total) * 100;
      //     console.log("model " + percentComplete.toFixed(2) + "% downloaded");
      //   }
      // }

      // function onError() {}

      // const loader = new OBJLoader(manager);
      // loader.load(
      //   "paddle.obj",
      //   function (obj) {
      //     object = obj;
      //   },
      //   onProgress,
      //   onError
      // );

      // ... rest of the init function ...

      // add the output of the renderer to the html element
      containerRef.current.appendChild(renderer.domElement);
      containerRef.current.appendChild(stats.dom);

      // call the render function
      renderer.render(scene, camera);
      const handleKeyDown = (event) => {
        // Movement speed of the paddle
        const paddleMoveSpeed = 1;

        if (event.key === "a") {
          CLIKED_RIGHT = true;
        }
        if (event.key === "d") {
          CLIKED_LEFT = true;
        }
      };
      const handleKeyUp = (event) => {
        if (event.key === "a") {
          CLIKED_RIGHT = false;
        }
        if (event.key === "d") {
          CLIKED_LEFT = false;
        }
      };
      // Attach the event listener
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      // Start the game loop
      const animate = () => {
        // console.log(Player_GeoList[0]);
        // console.log(camera.position);
        // console.log(camera.rotation);

        socket.emit("ballmove", {
          x: ball.position.x,
          y: ball.position.y,
          z: ball.position.z,
        });
        socket.emit("paddlemove", {
          x: Player_GeoList[0].position.x,
          y: Player_GeoList[0].position.y,
          z: Player_GeoList[0].position.z,
          rotationx: Player_GeoList[0].rotation.x,
          rotationy: Player_GeoList[0].rotation.y,
          rotationz: Player_GeoList[0].rotation.z,
        });

        // for (let geo of Player_GeoList) {
        // console.log(geo.position);
        // geo.rotateOnAxis(new THREE.Vector3(0, 1, 0), player1_rotation);
        // }
        // console.log("------------------");
        if (CLIKED_RIGHT == CLIKED_LEFT) {
          //
        } else if (CLIKED_RIGHT) {
          for (let geo of paddle1_player.mesh) {
            player1_rotation = 0.015;
            // geo.rotateOnAxis(new THREE.Vector3(0, -0.7, 1), player1_rotation);
            geo.position.z = geo.position.z + 0.2;
            // geo.position.y = geo.position.y + 0.2;
            // console.log(geo.position);
            // geo.position.y = 5 + (3.5 - Math.abs(geo.position.z)) / 5;
            // geo.position.x = 10.5 + (3.5 - Math.abs(geo.position.z)) / 10;
            // console.log(geo.position.y);

            // console.log(Math.abs(geo.position.z));
          }
          // paddle1.position.z = paddle1.position.z + 0.2;
        } else if (CLIKED_LEFT) {
          for (let geo of paddle1_player.mesh) {
            player1_rotation = -0.015;
            // geo.rotateOnAxis(new THREE.Vector3(0, -0.7, 1), player1_rotation);
            geo.position.z = geo.position.z - 0.2;
            // geo.position.y = 5 + (3.5 - Math.abs(geo.position.z)) / 5;
            // geo.position.x = 10.5 + (3.5 - Math.abs(geo.position.z)) / 10;

            // console.log(geo.position.y);
            // console.log(Math.abs(geo.position.z));
          }
          // paddle1.position.z = paddle1.position.z - 0.2;
        }
        // console.log(ball.position.y);
        // console.log(ball.position.x, ball.position.y, ball.position.z);
        ball.position.x = ball.position.x + BALL_DX;
        if (ball.position.x > 10) {
          // ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
          BALL_DX = -BALL_DX;
        }
        if (ball.position.x < -10) {
          // ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
          BALL_DX = -BALL_DX;
        }
        ball.position.y =
          12.5 - (Math.abs(ball.position.x) * Math.abs(ball.position.x)) / 20;
        // console.log(ball.position.y);
        // if (paddle1_player.mesh) console.log(paddle1_player.mesh[0].position);

        requestAnimationFrame(animate);

        const animatescene = () => {
          // Update angle for rotation
          angle += 0.01; // Adjust this value to control the speed of rotation

          // Calculate new camera position
          const radius = 20; // Distance of the camera from the center of the field
          camera.position.x = radius * Math.sin(angle);
          camera.position.y = 16; // Keep the height constant or adjust as needed
          camera.position.z = radius * Math.cos(angle);

          // Make the camera look towards the center of the field
          camera.lookAt(scene.position);
        };
        // animatescene();

        // Update game state
        // Here you would include logic for ball movement, collision detection, scoring etc.
        // if (ball.position.x > FIELD_LENGTH / 2 - BALL_RADIUS) {
        //   ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
        //   BALL_DX = -BALL_DX;
        // }
        // controls.maxDistance = 70;
        // controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
        // controls.target.set(0.25, 0.5, 0);
        // controls.update();
        renderer.render(scene, camera);
        // console.log("animate");
      };
      animate();
    };
    const loader = new OBJLoader();
    loader.load("paddle.obj", (obj) => init(obj.children));
    // init();

    return () => {
      // Perform cleanup
      // renderer.dispose();
    };
  }, []);

  // Event handlers
  // const handleKeyDown = (event) => {

  //   // Handle key down events for paddle control
  //   // You need to implement paddle movement logic here
  // };

  // const handleKeyUp = (event) => {
  //   // Handle key up events
  //   // You can stop paddle movement here
  // };

  // Render the game container
  return (
    <div
      ref={containerRef}
      tabIndex="0"
      // onKeyDown={handleKeyDown}
      // onKeyUp={handleKeyUp}
      style={{ width: WIDTH, height: HEIGHT }}
    >
      <div>
        Player 1: {score.player1} Player 2: {score.player2}
      </div>
    </div>
  );
};

export default PongGame;
