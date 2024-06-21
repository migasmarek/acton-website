window.onload = function() {
const THICCNESS = 60;
const SVG_PATH_SELECTOR = "path";
// const SVG_WIDTH_IN_PX = 108;
let SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH = 0.0625;

const matterContainer = document.querySelector("#matter-container");
const canvasWidth = matterContainer.offsetWidth;
const canvasHeight = matterContainer.offsetHeight;

const COLS = 16;
const COL_WIDTH = matterContainer.clientWidth / COLS
const NUM_IMAGES = 30;

let xPosition = [];
let matterPairs = [];

for (let i = 0; i < COLS; i++) {
    if (i === 0) {
        xPosition.push(0 + COL_WIDTH / 2);
    } else {
        xPosition.push(xPosition[i-1] + COL_WIDTH);
    }  
};


  // This will be populated as we create our bodies and sprites from the images.
  const sceneObjects = [];


// module aliases
var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  World = Matter.World,
Mouse = Matter.Mouse,
MouseConstraint = Matter.MouseConstraint,
  Composite = Matter.Composite,
  Body = Matter.Body,
  Svg = Matter.Svg,
  Vector = Matter.Vector,
  Vertices = Matter.Vertices;

// create an engine
var engine = Engine.create();

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

createSvgBodies();

app.ticker.add(() => {
    sceneObjects.forEach(object => {
      // Make all pixi sprites follow the position and rotation of their body.
     object.sprite.position = object.body.position;
     object.sprite.rotation = object.body.angle;
   });
  });

/*--------------------------
Setup Walls
---
Walls will keep our bodies and sprites within a confined area.
--------------------------*/
var ground = Bodies.rectangle(
  matterContainer.clientWidth / 2,
  matterContainer.clientHeight + THICCNESS / 2,
  27184,
  THICCNESS,
  { isStatic: true }
);

let leftWall = Bodies.rectangle(
  0 - THICCNESS / 2,
  matterContainer.clientHeight / 2,
  THICCNESS,
  matterContainer.clientHeight * 5,
  {
    isStatic: true
  }
);

let rightWall = Bodies.rectangle(
  matterContainer.clientWidth + THICCNESS / 2,
  matterContainer.clientHeight / 2,
  THICCNESS,
  matterContainer.clientHeight * 5,
  { isStatic: true }
);

// add all of the bodies to the worldx§
World.add(engine.world, [ground, leftWall, rightWall]);

const mouse = Mouse.create(app.view);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: {
            visible: false
        }
    }
  });
  
  World.add(engine.world, mouseConstraint);

//   if ('ontouchstart' in window || navigator.maxTouchPoints) {
//     World.remove(engine.world, mouseConstraint);
//     console.log('Touchscreen detected: Mouse constraint removed');
// } else {
//     console.log('Touchscreen not detected: Mouse constraint remains');
// }


// allow scroll through the canvas
mouseConstraint.mouse.element.removeEventListener(
  "mousewheel",
  mouseConstraint.mouse.mousewheel
);
mouseConstraint.mouse.element.removeEventListener(
  "DOMMouseScroll",
  mouseConstraint.mouse.mousewheel
);

Engine.run(engine);

function createSvgBodies() {
    matterPairs = document.querySelectorAll(".matter-pair");
    let j = 0;
    let k = 0;
    let y = 0;
    matterPairs.forEach(pair => {
        if (j === matterPairs.length) {
            j = 0;
        }
        if (k === COLS) {
            k = 0;
            y = y + 200;
        }
        const imgElement = pair.querySelector("img");
        const pathElement = pair.querySelector("svg path");
        const svgElement = pair.querySelector("svg");

        const svgWidth = svgElement.width.baseVal.value;

        let vertices = Svg.pathToVertices(pathElement);
        let scaleFactor = (matterContainer.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH) / svgWidth;
        vertices = Vertices.scale(vertices, scaleFactor, scaleFactor);
        let svgBody = Bodies.fromVertices(
            xPosition[k],
            y,
            [vertices],
            {
                friction: 0.4,
                frictionAir: 0.01,
                restitution: 0.5,
                render: {
                    fillStyle: "#464655",
                    strokeStyle: "#464655",
                    lineWidth: 1
                }
            }
        );
        World.add(engine.world, svgBody);

        console.log(`${j} / ${matterPairs.length}`);
        console.log(svgBody);


        const imageSprite = new PIXI.Sprite.from(imgElement.src);
        imageSprite.width = svgBody.bounds.max.x - svgBody.bounds.min.x;
        imageSprite.height = svgBody.bounds.max.y - svgBody.bounds.min.y;
        imageSprite.position;
        imageSprite.anchor.set(0.5, 0.5);
        app.stage.addChild(imageSprite);

        sceneObjects.push({body: svgBody, sprite: imageSprite});
        j = j + 1;
        k++;
    })    
}

function scaleBodies() {
  sceneObjects.forEach((object) => {
    // console.log(object.body);
    const { min, max } = object.body.bounds;
    const bodyWidth = max.x - min.x;
    let scaleFactor = (matterContainer.clientWidth * SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH) / bodyWidth;
    console.log(scaleFactor);
    Body.scale(object.body, scaleFactor, scaleFactor);
    const aspectRatio = object.sprite.height / object.sprite.width;
    object.sprite.width = object.body.bounds.max.x - object.body.bounds.min.x;
    object.sprite.height = object.sprite.width * aspectRatio;
  });
}

function handleResize(matterContainer) {
// set canvas size to new values
app.renderer.resize(matterContainer.clientWidth, matterContainer.clientHeight);

if (matterContainer.clientWidth < 992) {
    SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH = 0.15;
} else if (matterContainer.clientWidth < 768) {
    SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH = 0.25;
} else {
    SVG_WIDTH_AS_PERCENT_OF_CONTAINER_WIDTH = 0.0625;
}

// reposition ground
  Body.setPosition(
    ground,
    Vector.create(
      matterContainer.clientWidth / 2,
      matterContainer.clientHeight + THICCNESS / 2
    )
  );

  // reposition right wall
  Body.setPosition(
    rightWall,
    Vector.create(
      matterContainer.clientWidth + THICCNESS / 2,
      matterContainer.clientHeight / 2
    )
  );

  scaleBodies();
}

window.addEventListener("resize", () => handleResize(matterContainer));
}