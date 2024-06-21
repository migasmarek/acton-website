window.onload = function() {

    /*--------------------------
Setup
--------------------------*/

    // Matter Modules
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Body = Matter.Body;
    const Bodies = Matter.Bodies;
    const Mouse = Matter.Mouse;
    const MouseConstraint = Matter.MouseConstraint;
    const Vector = Matter.Vector;

    // Scene Container
    const sceneContainer = document.querySelector("#matter-container");
    const canvasWidth = sceneContainer.offsetWidth;
    const canvasHeight = sceneContainer.offsetHeight;

    // let PERCENTAGE = 0.08;
    let PERCENTAGE = 0.165;
    let COLS = 5;

    if (sceneContainer.clientWidth >= 768 && sceneContainer.clientWidth < 992) {
        PERCENTAGE = 0.135
        COLS = 6
    } else if (sceneContainer.clientWidth >= 992 && sceneContainer.clientWidth < 1200) {
        PERCENTAGE = 0.125;
        COLS = 8
    } else {
        PERCENTAGE = 0.08;
        COLS = 8
    }
    const COL_WIDTH = sceneContainer.clientWidth / COLS
    const increments = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];

    const THICCNESS = 60;


    let xPosition = [];

    for (let i = 0; i < COLS; i++) {
      if (i === 0) {
        xPosition.push(0 + COL_WIDTH / 2);
      } else {
        xPosition.push(xPosition[i-1] + COL_WIDTH);
      }  
    };

    function getRandomValue(increments) {
      const randomIndex = Math.floor(Math.random() * increments.length);
      return increments[randomIndex];
    }

    /*--------------------------
Engine
---
Setup the Matter engine. This is what the Matter bodies will run in.
--------------------------*/

    const engine = Engine.create();

    /*--------------------------
Pixi Data
--------------------------*/

    const matterImages = document.querySelectorAll(".image-shape");

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    const imageUrls = Array.from(matterImages).map(img => img.src);

    const images = [];

    function loadImage(url) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({
          url: url,
          width: img.width,
          height: img.height
        });
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
      });
    }

    function loadAllImages(urls) {
      return Promise.all(urls.map(loadImage));
    }

    loadAllImages(imageUrls)
      .then(images => {
      console.log('all images loaded');
      const shuffledImages = shuffle(images);
      let j = 0;
      let y = -100;
      for (let i = 0; i < shuffledImages.length; i++) {
        if (j-1 === COLS) {
          j = 0;
          y = y - 100;
        }
        createSceneObject(shuffledImages[i], xPosition[j], y);
        j++;
      }
    })
      .catch(error => {
      console.log(error.message);
    });


    // This will be populated as we create our bodies and sprites from the images.
    const sceneObjects = [];

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
        isStatic: true
      }
    );
    const wallRight = Bodies.rectangle(
      canvasWidth,
      canvasHeight / 2,
      10,
      canvasHeight,
      {
        isStatic: true
      }
    );
    const wallLeft = Bodies.rectangle(0, canvasHeight / 2, 10, canvasHeight, {
      isStatic: true
    });

    // Add Matter walls to the world. This will keep the bodies within certain parameters.
    World.add(engine.world, [wallBottom, wallLeft, wallRight]);

    /*--------------------------
Pixi
--------------------------*/

    // Setup Pixi renderer to match the same size as the Matter world.
    const app = new PIXI.Application({
      transparent: true,
      resizeTo: sceneContainer,
      autoDensity: true,
      antialias: true,
      resolution: 2,
    });

    // Put the pixi apps canvas into the scene container.
    document.querySelector("#matter-container").appendChild(app.view);

    /*--------------------------
Create Scene Object
--------------------------*/

    function createSceneObject(image, x, y) {
      // Matter Body
      const scaleFactor = (sceneContainer.clientWidth * PERCENTAGE) / image.width;
      const imageBody = Bodies.rectangle(
        x, // x pos
        y, // y pos
        image.width * scaleFactor, // width
        image.height * scaleFactor, // height
        {
          friction: 0.01,
          slop: 0,
          frictionAir: 0.04,
          restitution: 0.9,
          angle: -Math.PI * getRandomValue(increments)
        }
      );
      World.addBody(engine.world, imageBody);

      // Pixi Sprite
      // The sprite can be anything from the Pixi api. Video, image, make it into a circle, mask it, etc. You just need to make sure the proper anchor point is set, its added to the stage and that it follows the body in our pixi app ticker.
      const imageSprite = new PIXI.Sprite.from(image.url);
      imageSprite.width = image.width * scaleFactor;
      imageSprite.height = image.height * scaleFactor;
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
      mouse: Mouse.create(document.querySelector("#matter-container canvas")),
    });

    mouseConstraint.mouse.pixelRatio = 2;

    // allow scroll through the canvas
    mouseConstraint.mouse.element.removeEventListener(
      "mousewheel",
      mouseConstraint.mouse.mousewheel
    );
    mouseConstraint.mouse.element.removeEventListener(
      "DOMMouseScroll",
      mouseConstraint.mouse.mousewheel
    );

    World.add(engine.world, mouseConstraint);

    const blocker = document.querySelector(".matter-blocker");
    if ('ontouchstart' in window || navigator.maxTouchPoints) {
      World.remove(engine.world, mouseConstraint);
      blocker.style.display = "block";
      console.log('Touchscreen detected: Mouse constraint removed');
    } else {
        blocker.style.display = "none";
      console.log('Touchscreen not detected: Mouse constraint remains');
    }

    /*--------------------------
Run
--------------------------*/

    // Create the bodies and sprites.
    images.forEach(image => {
      createSceneObject(image);
      console.log(image);
    });

    // Run the Matter engine. This continuously updates the Matter.Engine. It ensures we can listen for the updates on each tick and move the Pixi objects with Matter bodies (see app.ticker function).
    Engine.run(engine);

    function scaleBodies() {
      sceneObjects.forEach((object) => {
        const { min, max } = object.body.bounds;
        const bodyWidth = max.x - min.x;
        let scaleFactor = (sceneContainer.clientWidth * PERCENTAGE) / bodyWidth;
        // console.log(`${scaleFactor}, ${object.width}`);
        Body.scale(object.body, scaleFactor, scaleFactor);
        const aspectRatio = object.sprite.height / object.sprite.width;
        object.sprite.width = object.body.bounds.max.x - object.body.bounds.min.x;
        object.sprite.height = object.sprite.width * aspectRatio;
      })
    }

    function handleResize(sceneContainer) {
      app.renderer.resize(sceneContainer.clientWidth, sceneContainer.clientHeight);

      if (sceneContainer.clientWidth < 992) {
        PERCENTAGE = 0.15;
    } else if (sceneContainer.clientWidth < 768) {
        PERCENTAGE = 0.4;
    } else {
        PERCENTAGE = 0.08;
    }

      // reposition ground
         Body.setPosition(
            wallBottom,
            Vector.create(
                0,
                sceneContainer.clientHeight
            )
         )

      // reposition right wall
      Body.setPosition(
        wallRight,
        Vector.create(
          sceneContainer.clientWidth + THICCNESS / 2,
          sceneContainer.clientHeight / 2
        )
      );


      scaleBodies();
    }

    window.addEventListener("resize", () => handleResize(sceneContainer))
  }