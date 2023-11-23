import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const PongGame = () => {
  const containerRef = useRef(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });

  // Constants
  const WIDTH = 1800,
    HEIGHT = 1200,
    FIELD_WIDTH = 1800,
    FIELD_LENGTH = 3000,
    PADDLE_WIDTH = 300,
    PADDLE_HEIGHT = 30,
    BALL_RADIUS = 100,
    Player_GeoList = [],
    Player_OP_GeoList = [];

  let renderer, scene, camera, paddle1, paddle2, ball;
  let BALL_DX = 0.1,
    CLIKED_RIGHT = false,
    CLIKED_LEFT = false,
    player1_rotation = Math.PI / 2;

  useEffect(() => {
    let angle = 0; // Initialize rotation angle
    let object;

    // Initialize Three.js
    const init = (geometries) => {
      console.log(geometries);
      // create a scene, that will hold all our elements
      // such as objects, cameras and lights.
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x548f89);
      // create a camera, which defines where we looking at.
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / (window.innerHeight - 100),
        0.1,
        1000
      );
      // position and point the camera to the center
      // camera.position.x = 19;
      // camera.position.y = 18;
      // camera.position.z = 0;
      camera.position.x = 19;
      camera.position.y = 17;
      camera.position.z = 0;
      camera.lookAt(scene.position);

      // create a renderer, set the background color and size
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      // renderer.setClearColor(0x000000, 1.0);
      renderer.setSize(window.innerWidth, window.innerHeight - 100);

      // create a field and add to scene
      const materials = [
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // red - right side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // green - left side
        new THREE.MeshBasicMaterial({ color: 0xb2c2d6 }), // blue - top side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // yellow - bottom side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // magenta - front side
        new THREE.MeshBasicMaterial({ color: 0xe89b4f }), // cyan - back side
      ];

      // Create the field geometry
      var fieldGeometry = new THREE.BoxGeometry(20, 1, 14);

      // Create the field mesh with the geometry and the materials array
      var field = new THREE.Mesh(fieldGeometry, materials);
      field.position.set(0, 0, 0); // Set the position
      scene.add(field);
      field.position.x = 0; // Position it at one edge of the field
      field.position.y = 0; // Adjust the height if necessary
      field.position.z = 0;
      scene.add(field);

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

      const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
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
        scene.add(mesh);
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
        scene.add(mesh);
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
        // for (let geo of Player_GeoList) {
        //   // geo.rotateOnAxis(new THREE.Vector3(0, 1, 0), player1_rotation);
        // }
        if (CLIKED_RIGHT == CLIKED_LEFT) {
          //
        } else if (CLIKED_RIGHT) {
          for (let geo of Player_GeoList) {
            player1_rotation = 0.015;
            geo.rotateOnAxis(new THREE.Vector3(0, -0.7, 1), player1_rotation);
            geo.position.z = geo.position.z + 0.2;
            // geo.position.y = geo.position.y + 0.2;
            // console.log(geo.position);
            geo.position.y = 2 + (3.5 - Math.abs(geo.position.z)) / 5;
            geo.position.x = 10.5 + (3.5 - Math.abs(geo.position.z)) / 10;
            console.log(geo.position.y);

            // console.log(Math.abs(geo.position.z));
          }
          // paddle1.position.z = paddle1.position.z + 0.2;
        } else if (CLIKED_LEFT) {
          for (let geo of Player_GeoList) {
            player1_rotation = -0.015;
            geo.rotateOnAxis(new THREE.Vector3(0, -0.7, 1), player1_rotation);
            geo.position.z = geo.position.z - 0.2;
            geo.position.y = 2 + (3.5 - Math.abs(geo.position.z)) / 5;
            geo.position.x = 10.5 + (3.5 - Math.abs(geo.position.z)) / 10;

            console.log(geo.position.y);
            // console.log(Math.abs(geo.position.z));
          }
          // paddle1.position.z = paddle1.position.z - 0.2;
        }
        ball.position.y =
          8 -
          ((Math.abs(ball.position.x) - 1) * (Math.abs(ball.position.x) - 1)) /
            20;
        // console.log(ball.position.y);
        console.log(ball.position.x, ball.position.y, ball.position.z);
        ball.position.x = ball.position.x + BALL_DX;
        if (ball.position.x > 10) {
          // ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
          BALL_DX = -BALL_DX;
        }
        if (ball.position.x < -10) {
          // ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
          BALL_DX = -BALL_DX;
        }

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
        animatescene();

        // Update game state
        // Here you would include logic for ball movement, collision detection, scoring etc.
        // if (ball.position.x > FIELD_LENGTH / 2 - BALL_RADIUS) {
        //   ball.position.x = FIELD_LENGTH / 2 - BALL_RADIUS;
        //   BALL_DX = -BALL_DX;
        // }
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
