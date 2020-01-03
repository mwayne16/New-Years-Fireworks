var canvas = document.querySelector("canvas");
var ctx = canvas.getContext("2d");
canvas.width = innerWidth;
canvas.height = innerHeight;
// Load in all images
var duckImg = new Image();
var Cannonimg = new Image();
var imgBase = new Image();
var smokeImg = new Image();
var overlayBGimage = new Image();
var planeImg = new Image();
overlayBGimage.src = "assets/Night-PierBGr.png";
duckImg.src = "assets/duck.png";
Cannonimg.src = "assets/cannonskin4.png";
imgBase.src = "assets/cannonBase.png";
smokeImg.src = "assets/smokeV2.png";
planeImg.src = "assets/planecp.png";
innerHeight = 845;
var floorLevel = innerHeight - 155;
var isFiring = false;
var colors = [
  "#F2CA50",
  "#A60303",
  "#F2AF5C",
  "#0000FF",
  "#4F4EDC",
  "#FEFBFF",
  "#CA3C4A",
  "#CA3C4A",
  "#CC0518"
];
// Mouse object
var mouse = {
  x: undefined,
  y: undefined
};

// Resize canvas to screen
// Add Listeners
window.addEventListener("resize", () => {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
});

window.addEventListener("mousemove", event => {
  mouse.x = event.x;
  mouse.y = event.y;
});

window.addEventListener("mousedown", () => {
  isFiring = true;
});

window.addEventListener("mouseup", () => {
  isFiring = false;
});
// General Purpose functions

// Generates a random number between the min value and max value
function generateValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
//creates and populates array with sequential values and index
function range(start, end, step = 1) {
  const allNumbers = [start, end, step].every(Number.isFinite);
  if (!allNumbers) {
    throw new TypeError("range() expects only finite numbers as arguments.");
  }
  if (step <= 0) {
    throw new Error("step must be a number greater than 0.");
  }
  if (start > end) {
    step = -step;
  }
  const length = Math.floor(Math.abs((end - start) / step)) + 1;
  return Array.from(Array(length), (x, index) => start + index * step);
}
// Plots distance between two objects
function getDistance(x1, y1, x2, y2) {
  let xDistance = x2 - x1;
  let yDistance = y2 - y1;

  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

function cannonBase() {
  ctx.beginPath();
  ctx.save();
  ctx.drawImage(imgBase, innerWidth / 2 - 45, floorLevel - 35);
  ctx.fill();
}

function Cannon(x, y, width, height) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.angle = 0;
  this.update = () => {
    desiredAngle = Math.atan2(
      mouse.y - this.y - floorLevel / 2,
      mouse.x - this.x
    );
    this.angle = desiredAngle;
    this.draw();
  };

  this.draw = () => {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = "none";
    ctx.rect(0, 0, this.width, this.height);
    ctx.drawImage(Cannonimg, 0, -50);
    ctx.restore();
    ctx.restore();
  };
}

function CannonBall(x, y, dx, dy, color, cannon) {
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = -dy;
  this.color = color;
  this.source = cannon;
  this.radius = generateValue(7, 10);
  this.timeToLive = generateValue(1, 1.2);
  this.gravity = 0.06;

  this.init = () => {
    this.x = Math.cos(this.source.angle) * this.source.width;
    this.y = Math.sin(this.source.angle) * this.source.width - 155;

    this.x = this.x + innerWidth / 2;
    this.y = this.y + innerHeight;
    mouse.x - innerWidth / 2 < 0 ? (this.dx = -this.dx) : null;
    this.dx = Math.cos(this.source.angle) * generateValue(4, 6);
    this.dy = Math.sin(this.source.angle) * generateValue(2, 6);
  };

  this.update = () => {
    if (this.y + this.radius + this.dy > innerHeight) {
      this.dy = -this.dy;
    } else {
      this.dy += this.gravity;
    }
    if (
      this.x + this.radius + this.dx > innerWidth ||
      this.x + this.radius + this.dx < 0
    ) {
      this.dx = -this.dx;
    }

    this.y - this.radius * this.radius < innerHeight / 4
      ? (this.timeToLive = 0)
      : (this.timeToLive -= 0.01);

    this.x += this.dx - generateValue(0, 5);
    this.x += this.dx + generateValue(0, 5);
    this.y += this.dy - generateValue(0, 5);
    this.timeToLive -= 0.01;
    this.draw();
  };

  this.draw = () => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  // Shoutout Tyrianad (HTCW Discord) Explaining what this does to a dum dum
  this.isAlive = () => {
    return 0 <= this.timeToLive;
  };
  this.init();
}

function CannonSmoke(cannon) {
  this.dx = 0;
  this.dy = 5;
  this.source = cannon;
  this.width = 72;
  this.height = 72;
  this.frameCount = 6;
  this.index = 0;
  this.scale = 1;
  this.scaledW = this.scale * this.width;
  this.scaledH = this.scale * this.height;
  this.gravity = 0.15;
  this.friction = 0.44;
  this.init = function() {
    this.x = Math.cos(this.source.angle) * this.source.width;
    this.y = Math.sin(this.source.angle) * this.source.width - 155;
    this.x = this.x + innerWidth / 2;
    this.y = this.y + innerHeight;
    this.dx = Math.cos(this.source.angle) * generateValue(4, 10);
    this.dy = Math.sin(this.source.angle) * generateValue(5, 8);
  };

  this.update = () => {
    this.x += this.dx;
    this.y += this.dy;
    this.drawFrame();
  };
  // Creating a function which stores variables for each frame playback
  this.drawFrame = (frameX, frameY) => {
    ctx.drawImage(
      smokeImg,
      frameX * this.width,
      frameY * this.height,
      this.width,
      this.height,
      this.x - this.width / 2,
      this.y - this.width,
      this.scaledW,
      this.scaledH
    );
  };

  this.init();
}

function Explosion(cannonballs) {
  this.source = cannonballs;
  this.init = () => {
    // Generating a random amount of particles per cannonball
    cannonballs.forEach(ball => {
      for (var i = 0; i < generateValue(25, 50); i++) {
        var velocity = {
          x:
            generateValue(-2, 2) *
            Math.floor(Math.random() * generateValue(2, 10)),
          y: generateValue(-2, 2) * -1 || 2
        };

        particles.push(
          new Particles(
            ball.x,
            ball.y,
            velocity.x,
            velocity.y,
            colors[Math.floor(Math.random() * colors.length)],
            cannonballs
          )
        );
      }
    });
  };
  this.init(cannonballs);
  cannonballs.splice(ball, 1);
}

function Particles(x, y, dx, dy, color, cannonballs) {
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = -dy;
  this.color = color;
  this.source = cannonballs;
  this.radius = generateValue(1, 2);
  this.timeToLive = generateValue(2, 3);
  this.opacity = 1;
  this.gravity = 20;
  this.friction = 2;

  this.update = function() {
    if (this.y + this.radius + this.dy > floorLevel) {
      this.dy = -this.dy;
    }

    if (
      this.x + this.radius + this.dx > canvas.width ||
      this.x - this.radius + this.dx < 0
    ) {
      this.dx = -this.dx;
    }
    this.x += this.dx;
    this.y += this.dy;
    this.timeToLive -= 0.01;
    this.opacity = this.timeToLive -= 0.01;

    this.draw();
  };
  this.draw = () => {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  };
  this.isAlive = () => {
    return 0 <= this.timeToLive;
  };
}

/* ------------------------------------------Scenery ----------------------------------------*/

function Stars() {
  this.radius = generateValue(2, 4);
  this.x = Math.random() * innerWidth;
  this.y = generateValue(0, innerHeight / 6);
  this.glow = 15;

  this.update = () => {
    this.y + this.glow + this.radius > innerHeight / 4
      ? (this.y = 0 - this.radius)
      : (this.y += 0.01);

    this.x + this.radius < 0
      ? (this.x = innerWidth)
      : (this.x += generateValue(-0.05, 0.02));
    this.draw();
  };

  this.draw = () => {
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "rgba(5, 10, 28, 1)";
    ctx.fillRect(0, 0, innerWidth, innerHeight / 4);
    ctx.beginPath();
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowColor = "#fff";
    ctx.shadowBlur = this.glow;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = "#fff";
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.restore();
  };
}
function duckSprite() {
  this.width = 101;
  this.height = 78;
  this.x = 300;
  this.y = floorLevel - 10;
  this.frameCount = 13;
  this.index = 0;
  this.drawFrame = function(frameX, frameY) {
    ctx.drawImage(
      duckImg,
      frameX * this.width,
      frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  };
}

function planeSprite() {
  this.x = innerWidth;
  this.y = innerHeight / 6;
  this.dx = -5;
  this.dy = 0;
  this.width = 128;
  this.height = 128;
  this.frameCount = 6;
  this.index = 0;
  this.scale = 2.5;
  this.scaledW = this.width * this.scale;
  this.scaledH = this.height * this.scale;
  this.update = function() {
    if (this.x + this.scaledW <= 0) {
      this.x = generateValue(innerWidth * 2, innerWidth * 4);
    }

    if (isColliding == true) {
      this.dy = 10;
      this.dx = -10;
      if (this.y + this.scaledH - 180 >= floorLevel) {
        this.dy = 0;
        this.dx = 0;
      }
    }

    this.x += this.dx;
    this.y += this.dy;
  };
  this.drawFrame = (frameX, frameY) => {
    ctx.save();
    ctx.restore();
    ctx.drawImage(
      planeImg,
      frameX * this.width,
      frameY * this.height,
      this.width,
      this.height,
      this.x,
      this.y,
      this.scaledW,
      this.scaledH
    );
  };
}

stars = [];

for (var i = 0; i < 100; i++) {
  stars.push(new Stars());
}

var duck, plane, cannon, cannonsmoke, cannonballs, explosions, particles;

var storeVariables = () => {
  duck = new duckSprite();
  plane = new planeSprite();
  cannon = new Cannon(innerWidth / 2, floorLevel, 100, 100);
  cannonsmoke = [];
  cannonballs = [];
  explosions = [];
  particles = [];
};

storeVariables();

var timer = 0;
let fps = 30;
var start = null;
var now;
var then = Date.now();
let interval = 1000 / fps;
var delta;
var isColliding = false;
let spriteY = 0;
function animate() {
  window.requestAnimationFrame(animate);
  now = Date.now();
  delta = now - then;
  if (delta > interval) {
    then = now - (delta % interval);
    cannonBase();
    plane.update();
    ctx.beginPath();
    ctx.globalAlpha = 0.2;
    ctx.drawImage(overlayBGimage, 0, 0, innerWidth, innerHeight + 200);
    ctx.restore();
    if (isFiring === true && timer % 3 == 0) {
      cannonballs.push(
        new CannonBall(
          innerWidth / 2,
          innerHeight,
          2,
          2,
          colors[Math.floor(Math.random() * colors.length)],
          cannon
        )
      );
      cannon.y > floorLevel + 20 ? (cannon.y -= 30) : (cannon.y += 10);
      cannonsmoke.push(new CannonSmoke(cannon));
    }
    for (ball of cannonballs) {
      ball.update();

      if (
        getDistance(plane.x, plane.y, ball.x, ball.y) <
        ball.radius + plane.width
      ) {
        explosions.push(new Explosion(cannonballs));
        isColliding = true;
      }
      ball.isAlive() === false
        ? explosions.push(new Explosion(cannonballs))
        : null;
    }
    isFiring != true && cannon.y > floorLevel ? (cannon.y -= 1) : null;
    for (particle of particles) {
      particle.update();
      particle.isAlive() === false ? particles.splice(particle, 1) : null;
    }
    isFiring === true ? (timer += 1) : (timer = 0);

    for (star of stars) {
      star.update();
    }

    plane.drawFrame(range(0, plane.frameCount - 1)[plane.index], spriteY);
    duck.drawFrame(range(0, duck.frameCount - 1)[duck.index], 0);
    cannon.update();
  }
}

animate();

var pixelFps = 7;
let pixelTimer = 0;
function draw() {
  setTimeout(function() {
    requestAnimationFrame(draw);
    cannonsmoke.forEach(smoke => {
      smoke.update();
      smoke.drawFrame(range(0, smoke.frameCount - 1)[smoke.index], 0);
      smoke.index++;
      if (smoke.index >= smoke.frameCount) {
        smoke.index = 0;
        cannonsmoke.splice(smoke, 1);
      }
    });
    // Creates sprite loop play state every 60 seconds
    if (pixelTimer >= 60) {
      duck.index++;
    }
    // Spaghetti Code Incoming
    // Testing Cannonball collision and running sprites accordingly
    if (duck.index >= duck.frameCount - 1) {
      pixelTimer = 0;
      duck.index = 0;
    }

    plane.index++;
    if (isColliding == true && spriteY == 0) {
      plane.index = 0;
      spriteY = 1;
    }
    if (spriteY == 1 && plane.index >= plane.frameCount - 1) {
      spriteY = 2;
      plane.index = 0;
    }

    if (spriteY == 2 && plane.index >= plane.frameCount - 1) {
      spriteY = 3;
      plane.index = 0;
    }

    if (spriteY == 3 && plane.index >= plane.frameCount - 1) {
      spriteY = 4;
      plane.index = 0;
    }

    if (plane.index >= plane.frameCount - 1) {
      plane.index = 0;
    }

    pixelTimer++;
  }, 1000 / pixelFps);
}

draw();
