/*--------------------------
Setup
--------------------------*/

// Matter Modules
const Engine = Matter.Engine;
const Render = Matter.Render;
const World = Matter.World;
const Body = Matter.Body;
const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Mouse = Matter.Mouse;
const MouseConstraint = Matter.MouseConstraint;


// Scene Container
const sceneContainer = document.querySelector("#matter-container");
const canvasWidth = sceneContainer.offsetWidth;
const canvasHeight = sceneContainer.offsetHeight + 100;


const THICCNESS = 60;
const COLS = 16;
const COL_WIDTH = sceneContainer.clientWidth / COLS
const NUM_IMAGES = 80;

let xPosition = [];

for (let i = 0; i < COLS; i++) {
    if (i === 0) {
        xPosition.push(0 + COL_WIDTH / 2);
    } else {
        xPosition.push(xPosition[i-1] + COL_WIDTH);
    }  
};

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let colIndex = 0;


/*--------------------------
Engine
---
Setup the Matter engine. This is what the Matter bodies will run in.
--------------------------*/

const engine = Engine.create();

/*--------------------------
Pixi Data
--------------------------*/

const matterImages = document.querySelectorAll(".matter-image");
const images = [];
let loadedImages = 0;
let drawImages = false;

console.log(matterImages.length);

// Loop through each image and extract the required information
matterImages.forEach((image) => {
    image.addEventListener("load", function() {
        const rect = image.getBoundingClientRect();
        images.push({
          src: image.src,
          initialPosition: {
            x: 500,
            y: -500,
          },
          width: image.width,
          height: image.height,
        });
        loadedImages++;
        if (loadedImages === matterImages.length) {
            // console.log(images);
            let colIndex = 0;
            images.forEach(image => {
                if (colIndex === COLS - 1) {
                //                  console.log("this is last iteration");
                                 colIndex = 0;
                           }
                // console.log(colIndex)
                image.initialPosition.x = xPosition[colIndex];
                // image.initialPosition.x = xPosition[getRandomInt(0, COLS - 1)];
                createSceneObject(image);
                colIndex++;
                // console.log('final');
                // console.log(image);
              });
        }
    });
});

  /*--------------------------
Setup Walls
---
Walls will keep our bodies and sprites within a confined area.
--------------------------*/

const wallTop = Bodies.rectangle(canvasWidth / 2, 0, canvasWidth, 10, {
    isStatic: true
  });
  const wallBottom = Bodies.rectangle(
    canvasWidth / 2,
    canvasHeight,
    27639,
    10,
    {
      isStatic: true,
      label: 'ground'
    }
  );
  const wallRight = Bodies.rectangle(
    canvasWidth,
    canvasHeight / 2,
    10,
    canvasHeight,
    {
      isStatic: true,
      label: 'wall'
    }
  );
  const wallLeft = Bodies.rectangle(0, canvasHeight / 2, 10, canvasHeight, {
    isStatic: true,
    label: 'wall'
  });
  
  // Add Matter walls to the world. This will keep the bodies within certain parameters.
  World.add(engine.world, [wallBottom, /*wallTop,*/ wallLeft, wallRight]);

  // This will be populated as we create our bodies and sprites from the images.
const sceneObjects = [];

/*--------------------------
Pixi
--------------------------*/

// Setup Pixi renderer to match the same size as the Matter world.
const app = new PIXI.Application({
    transparent: true,
    // resizeTo: sceneContainer,
    width: canvasWidth,
    height: canvasHeight,
    autoDensity: true,
    antialias: true,
    resolution: 2,
  });
  
  // Put the pixi apps canvas into the scene container.
  document.querySelector("#matter-container").appendChild(app.view);

/*--------------------------
Create Scene Object
--------------------------*/

function createSceneObject(image) {
    // Matter Body
    const imageBody = Bodies.rectangle(
      image.initialPosition.x,
      image.initialPosition.y,
    //   image.width,
    window.innerWidth * 0.1,
      image.height,
      {
        friction: 0.001,
        frictionAir: 0.015,
        restitution: 0.05,
      }
    );
    World.addBody(engine.world, imageBody);

// Pixi Sprite
  // The sprite can be anything from the Pixi api. Video, image, make it into a circle, mask it, etc. You just need to make sure the proper anchor point is set, its added to the stage and that it follows the body in our pixi app ticker.
  const imageSprite = new PIXI.Sprite.from(image.src);
  imageSprite.width = image.width;
  imageSprite.height = image.height;
  imageSprite.position;
  imageSprite.anchor.set(0.5, 0.5);
  app.stage.addChild(imageSprite);

  // Add the complete scene object (body and sprite) to our array of objects. We'll track those objects in the pixi frame updates (see app.ticker below).
  sceneObjects.push({
    body: imageBody,
    sprite: imageSprite,
  });
}

/*--------------------------
Pixi Frame Updates
--------------------------*/

app.ticker.add(() => {
    sceneObjects.forEach(object => {
      // Make all pixi sprites follow the position and rotation of their body.
      object.sprite.position = object.body.position;
      object.sprite.rotation = object.body.angle;
    });
  });

/*--------------------------
Mouse Control
---
Add the mouse to the Pixi frame. This is how you enable interaction with the bodies. We aren't using the Matter renderer so need the mouse to be attached to our invisible Matter engine that runs on top of the Pixi world.
--------------------------*/

const mouseConstraint = MouseConstraint.create(engine, {
    mouse: Mouse.create(document.querySelector(".scene canvas")),
  });
  
  World.add(engine.world, mouseConstraint);


/*--------------------------
Run
--------------------------*/

// Create the bodies and sprites.
    images.forEach(image => {
        createSceneObject(image);
        console.log('final');
        console.log(image);
      });
  
  // Run the Matter engine. This continuously updates the Matter.Engine. It ensures we can listen for the updates on each tick and move the Pixi objects with Matter bodies (see app.ticker function).
  Engine.run(engine);


function handleResize() {
    const width = document.querySelector("#matter-container").offsetWidth;
    const height = document.querySelector("#matter-container").offsetHeight;

    const newRectWidth = window.innerWidth * 0.1;

    sceneObjects.forEach(sceneObject => {
        if (sceneObject.body.label !== 'ground' && sceneObject.body.label !== 'wall') {
            const currentWidth = sceneObject.body.bounds.max.x - sceneObject.body.bounds.min.x;
            const currentHeight = sceneObject.body.bounds.max.y - sceneObject.body.bounds.min.y;
            const scaleX = newRectWidth / currentWidth;
            const dimensionY = scaleX * currentHeight;

            // Scale the body
            Matter.Body.scale(sceneObject.body, scaleX, scaleX);

            // Update the sprite
            sceneObject.sprite.anchor.set(0.5);
            console.log(sceneObject.sprite.width);
            sceneObject.sprite.width = newRectWidth;
            sceneObject.sprite.height = dimensionY;
        }
      });

    app.renderer.resize(width, height);

        // reposition ground
    Matter.Body.setPosition(
        wallBottom,
        Matter.Vector.create(
            width / 2,
            height + THICCNESS / 2
        )
    );

    // reposition right wall
    Matter.Body.setPosition(
        wallRight,
        Matter.Vector.create(
            width + THICCNESS / 2,
            height / 2
        )
    );
}

// window.addEventListener("resize", () => handleResize());








// const matterContainer = document.querySelector("#matter-container");
// const THICCNESS = 60;
// const COLS = 13;
// const COL_WIDTH = matterContainer.clientWidth / COLS;
// const objects = [];
// let loadedImages = 0;
// const NUM_IMAGES = 80;


// const images = document.querySelectorAll(".matter-image");
// images.forEach((i) => {
//     i.addEventListener("load", function() {
//         objects.push(i);
//         loadedImages++;
//         if (loadedImages === images.length) {
//             addObjects();
//         }
//     });
// });

// let xPosition = [];

// for (let i = 0; i < COLS; i++) {
//     if (i === 0) {
//         xPosition.push(0 + COL_WIDTH / 2);
//     } else {
//         xPosition.push(xPosition[i-1] + COL_WIDTH);
//     }  
// };

// // module aliases
// var Engine = Matter.Engine,
//     Render = Matter.Render,
//     Runner = Matter.Runner,
//     Bodies = Matter.Bodies,
//     Composite = Matter.Composite;

// // create an engine
// var engine = Engine.create();

// engine.world.gravity.y = 0.6;

// // create a renderer
// var render = Render.create({
//     element: matterContainer,
//     engine: engine,
//     options: {
//         width: matterContainer.clientWidth,
//         height: matterContainer.clientHeight,
//         background: "transparent",
//         wireframes: false,
//         showAngleIndicator: false
//     }
// });

// function getRandomInt(min, max) {
//     min = Math.ceil(min);
//     max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

// let colIndex = 0;

// function addObjects() {
//     for (let i = 0; i < NUM_IMAGES; i++) {
//         if (colIndex === COLS - 1) {
//             console.log("this is last iteration");
//             colIndex = 0;
//         }
//         let randomNumber = getRandomInt(0, images.length - 1);
//         // console.log(randomNumber);
//         console.log(colIndex);
//         let rectangle = Bodies.rectangle(
//             xPosition[colIndex],
//             10,
//             objects[randomNumber].clientWidth,
//             objects[randomNumber].clientHeight,
//             {
//                 friction: 0.3,
//                 frictionAir: 0.00001,
//                 restitution: 0.8,
//                 render: {
//                     sprite: {
//                         texture: objects[randomNumber].src,
//                     }
//                 }
//             }
//         );
//         colIndex++;
//         Composite.add(engine.world, rectangle);
//     }
// }

// var ground = Bodies.rectangle(matterContainer.clientWidth / 2, matterContainer.clientHeight + THICCNESS / 2, 27639, THICCNESS, { isStatic: true });

// var leftWall = Bodies.rectangle(
//    0 - THICCNESS / 2,
//     matterContainer.clientHeight / 2,
//     THICCNESS,
//     matterContainer.clientHeight * 5,
//     { isStatic: true}
// );

// var rightWall = Bodies.rectangle(
//     matterContainer.clientWidth + THICCNESS / 2,
//     matterContainer.clientHeight / 2,
//     THICCNESS,
//     matterContainer.clientHeight * 5,
//     { isStatic: true}
// );

// // add all of the bodies to the world
// Composite.add(engine.world, [ground, leftWall, rightWall]);

// let mouse = Matter.Mouse.create(render.canvas);
// let mouseConstraint = Matter.MouseConstraint.create(
//     engine,
//     {
//         mouse: mouse,
//         constraint: {
//             stiffness: 0.2,
//             render: {
//                 visible: false
//             }
//         }
//     }
// );

// Composite.add(engine.world, mouseConstraint);

// // allow scroll through the canvas
// mouseConstraint.mouse.element.removeEventListener(
//     "mousewheel",
//     mouseConstraint.mouse.mousewheel
// );

// mouseConstraint.mouse.element.removeEventListener(
//     "DOMMouseScroll",
//     mouseConstraint.mouse.mousewheel
// );

// // run the renderer
// Render.run(render);

// // create runner
// var runner = Runner.create();

// // run the engine
// Runner.run(runner, engine);

// function handleResize(matterContainer) {
//     // set canvas size to new values
//     render.canvas.width = matterContainer.clientWidth;
//     render.canvas.height = matterContainer.clientHeight;

//     // reposition ground
//     Matter.Body.setPosition(
//         ground,
//         Matter.Vector.create(
//             matterContainer.clientWidth / 2,
//             matterContainer.clientHeight + THICCNESS / 2
//         )
//     );

//     // reposition right wall
//     Matter.Body.setPosition(
//         rightWall,
//         Matter.Vector.create(
//             matterContainer.clientWidth + THICCNESS / 2,
//             matterContainer.clientHeight / 2
//         )
//     );
// }

// window.addEventListener("resize", () => handleResize(matterContainer));