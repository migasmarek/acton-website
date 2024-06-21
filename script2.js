const matterContainer = document.querySelector("#matter-container");
const THICCNESS = 60;
const COLS = 13;
const COL_WIDTH = matterContainer.clientWidth / COLS;
const objects = [];
let loadedImages = 0;
const NUM_IMAGES = 61;


const images = document.querySelectorAll(".image-shape");
images.forEach((i) => {
    i.addEventListener("load", function() {
        objects.push(i);
        loadedImages++;
        console.log(`${loadedImages} / ${images.length}`);
        if (loadedImages === images.length) {
            addObjects();
        }
    });
});

let xPosition = [];

for (let i = 0; i < COLS; i++) {
    if (i === 0) {
        xPosition.push(0 + COL_WIDTH / 2);
    } else {
        xPosition.push(xPosition[i-1] + COL_WIDTH);
    }  
};

// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;

// create an engine
var engine = Engine.create();

engine.world.gravity.y = 0.6;

// create a renderer
var render = Render.create({
    element: matterContainer,
    engine: engine,
    options: {
        width: matterContainer.clientWidth,
        height: matterContainer.clientHeight,
        background: "transparent",
        wireframes: false,
        showAngleIndicator: false
    }
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

let colIndex = 0;

function addObjects() {
  console.log('add objects')
    for (let i = 0; i < NUM_IMAGES; i++) {
        if (colIndex === COLS - 1) {
            console.log("this is last iteration");
            colIndex = 0;
        }
        let randomNumber = getRandomInt(0, images.length - 1);
        console.log(objects[randomNumber].clientWidth);
        // console.log(randomNumber);
        console.log(colIndex);
        let rectangle = Bodies.rectangle(
            xPosition[colIndex],
            10,
            objects[randomNumber].clientWidth,
            objects[randomNumber].clientHeight,
            {
                friction: 0.3,
                frictionAir: 0.00001,
                restitution: 0.8,
                render: {
                    sprite: {
                        texture: objects[randomNumber].src,
                    }
                }
            }
        );
        colIndex++;
        Composite.add(engine.world, rectangle);
    }
}

var ground = Bodies.rectangle(matterContainer.clientWidth / 2, matterContainer.clientHeight + THICCNESS / 2, 27639, THICCNESS, { isStatic: true });

var leftWall = Bodies.rectangle(
   0 - THICCNESS / 2,
    matterContainer.clientHeight / 2,
    THICCNESS,
    matterContainer.clientHeight * 5,
    { isStatic: true}
);

var rightWall = Bodies.rectangle(
    matterContainer.clientWidth + THICCNESS / 2,
    matterContainer.clientHeight / 2,
    THICCNESS,
    matterContainer.clientHeight * 5,
    { isStatic: true}
);

// add all of the bodies to the world
Composite.add(engine.world, [ground, leftWall, rightWall]);

let mouse = Matter.Mouse.create(render.canvas);
let mouseConstraint = Matter.MouseConstraint.create(
    engine,
    {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    }
);

Composite.add(engine.world, mouseConstraint);

// allow scroll through the canvas
mouseConstraint.mouse.element.removeEventListener(
    "mousewheel",
    mouseConstraint.mouse.mousewheel
);

mouseConstraint.mouse.element.removeEventListener(
    "DOMMouseScroll",
    mouseConstraint.mouse.mousewheel
);

// run the renderer
Render.run(render);

// create runner
var runner = Runner.create();

// run the engine
Runner.run(runner, engine);

function handleResize(matterContainer) {
    // set canvas size to new values
    render.canvas.width = matterContainer.clientWidth;
    render.canvas.height = matterContainer.clientHeight;

    // reposition ground
    Matter.Body.setPosition(
        ground,
        Matter.Vector.create(
            matterContainer.clientWidth / 2,
            matterContainer.clientHeight + THICCNESS / 2
        )
    );

    // reposition right wall
    Matter.Body.setPosition(
        rightWall,
        Matter.Vector.create(
            matterContainer.clientWidth + THICCNESS / 2,
            matterContainer.clientHeight / 2
        )
    );
}

window.addEventListener("resize", () => handleResize(matterContainer));