/**
 * @fileoverview JavaScript for the Brick Breaker game.
 * @author Jesse L. Palmer
 */

/**
 * The code for the application.
 *
 */
function canvasApp() {
  'use strict';

  const DELAY_TIME = 1;
  const SCREEN_WIDTH = 633;
  const SCREEN_HEIGHT = 500;
  const SCREEN_X1 = 0;
  const SCREEN_Y1 = 0;
  const SCREEN_X2 = SCREEN_WIDTH;
  const SCREEN_Y2 = SCREEN_HEIGHT;
  const SCREEN_COLOR = '#fff';
  const TEXT_COLOR = '#000';
  const STATUS_BAR_Y_OFFSET = 40;
  const BRICK_ROWS = 10;
  const BRICKS_PER_ROW = 10;
  const BRICK_WIDTH = 60;
  const BRICK_HEIGHT = 13;
  const BRICK_OFFSET = 3;
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const context = canvas.getContext('2d');
  let windowWidth = document.body.offsetWidth;
  let windowHeight = document.body.offsetHeight;
  let paddle = null;
  let ball = null;
  const bricks = [];
  let score = 0;
  let highScores = [];
  let bricksRemaining = BRICK_ROWS * BRICKS_PER_ROW;
  let turns = 3;
  let level = 1;
  let gameStatus = 'start';
  let continueGame = null;

  /**
   * A Paddle.
   * @constructor
   */
  function Paddle() {
      this.width = 100;
      this.height = 15;
      this.offset = this.height;
      this.color = '#000';
      this.x1 = (SCREEN_WIDTH - this.width) / 2;
      this.y1 = SCREEN_HEIGHT - this.offset;
      this.x2 = this.x1 + this.width;
      this.y2 = this.y1 + this.height;
  }

  /**
   * A Ball.
   * @constructor
   */
  function Ball() {
      this.color = '#000';
      this.radius = 16;
      this.cx = SCREEN_WIDTH / 2;
      this.cy = SCREEN_HEIGHT / 2;
      this.x1 = this.cx - this.radius;
      this.y1 = this.cy - this.radius;
      this.x2 = this.x1 + this.radius;
      this.y2 = this.y1 + this.radius;
      const ballVelocity = 3;
      const getRandomXVelocity = () => {
              const randomNumber = Math.random();
              if (randomNumber > 0.5) {
                  return ballVelocity;
              }
              return ballVelocity * -1;
          };
      this.velocityx = getRandomXVelocity();
      this.velocityy = ballVelocity;
  }

  /**
   * Builds a rectangle of bricks.
   * @param {string[]} colors is an array of colors.
   */
  function drawRectangle(colors: string[]) {
      let i;
      let j;
      let brickNum = 0;
      let brickY = BRICK_OFFSET;
      let brickX = 0;
      let brick = null;
      for (i = 0; i < BRICK_ROWS; i += 1) {
          brickX = BRICK_OFFSET;
          for (j = 0; j < BRICKS_PER_ROW; j += 1) {
              brick = {
                color: colors[i],
                visible: true,
                x1: brickX,
                x2: brickX + BRICK_WIDTH,
                y1: brickY,
                y2: brickY + BRICK_HEIGHT,
              };
              bricks[brickNum] = brick;
              brickX += BRICK_WIDTH + BRICK_OFFSET;
              brickNum += 1;
          }
          brickY += BRICK_HEIGHT + BRICK_OFFSET;
      }
  }

  /**
   * Builds a triangle of bricks.
   * @param {string[]} colors is an array of colors.
   */
  function drawTriangle(colors: string[]) {
      let i = 0;
      let j = 0;
      let brickNum = 0;
      let brickY = BRICK_OFFSET;
      const bricksPerRow = 3;
      let brickX;
      let brick = null;
      for (i = 0; i < BRICK_ROWS; i += 1) {
          brickX = BRICK_OFFSET;
          for (j = 0; j < bricksPerRow; j += 1) {
              brick = {
                color: colors[i],
                visible: true,
                x1: brickX,
                x2: brick.x1 + BRICK_WIDTH,
                y1: brickY,
                y2: brick.x1 + BRICK_HEIGHT,
              };
              bricks[brickNum] = brick;
              brickX += BRICK_WIDTH + BRICK_OFFSET;
              brickNum += 1;
          }
          brickY += BRICK_HEIGHT + BRICK_OFFSET;
      }
  }

  /**
   * Updates the window parameters in case users resize the screen.
   */
  function updateWindowParameters() {
      windowWidth = document.body.offsetWidth;
      windowHeight = document.body.offsetHeight;
  }

  /**
   * Updates the window parameters in case users resize the screen.
   * @return {boolean} Returns true if the window width is greater than the
   * screen width.
   */
  function isWindowIsLargerThanScreen(): boolean {
      return (windowWidth > SCREEN_WIDTH);
  }

  /**
   * Moves the paddle depending on the position of the cursor.
   * @param {Object} e contains the location of the cursor.
   */
  function movePaddle(e) {
    const wallOffset = 1;
    let xOffset = 0;

    updateWindowParameters();

    if (isWindowIsLargerThanScreen()) {
      xOffset = (windowWidth - SCREEN_WIDTH) / 2;
    }

    paddle.x2 = paddle.x1 + paddle.width;
    if ((paddle.x1 >= SCREEN_X1) && (paddle.x2 <= SCREEN_X2)) {
          paddle.x1 = e.pageX - (paddle.width / 2) - xOffset;
          if (paddle.x1 <= 0) {
              paddle.x1 = 1;
          } else if (paddle.x1 >= SCREEN_X2 - paddle.width) {
              paddle.x1 = SCREEN_X2 - paddle.width - wallOffset;
          }
      }
  }

  /**
   * This function is run when a player loses a turn.
   */
  function loseTurn() {
      turns -= 1;
      ball = new Ball();
  }

  /**
   * Checks to see if the ball has collided with the wall.
   */
  function wallCollisionCheck() {
      if ((ball.x1 <= SCREEN_X1) || (ball.x2 >= SCREEN_X2)) {
          ball.velocityx = -ball.velocityx;
      } else if ((ball.y1 <= SCREEN_Y1)) {
          ball.velocityy = -ball.velocityy;
          ball.cy += 2;
      } else if (ball.y2 >= SCREEN_Y2) {
          ball.velocityy = -ball.velocityy;
          loseTurn();
      }
  }

  /**
   * Checks to see if the ball has collided with the ball.
   */
  function paddleCollisionCheck() {
      if (isCollidingRightLeft(ball, paddle)) {
          ball.velocityx = -ball.velocityx;
      } else if (isCollidingTopBottom(ball, paddle)) {
          ball.velocityy = -ball.velocityy;
          ball.cy -= 2;
      }
  }

  /**
   * Checks to see if the ball has collided with the wall.
   */
  function brickCollisionCheck() {
      let i;
      const length = bricks.length;

      for (i = 0; i < length; i += 1) {
          if (bricks[i].visible === true) {
              if (isColliding(ball, bricks[i])) {
                  bricks[i].visible = false;
                  score += 100;
                  bricksRemaining -= 1;
                  ball.velocityy = -ball.velocityy;
                  ball.cy -= 2;
              }
          }
      }
  }

  /**
   * Function moves the ball.
   */
  function moveBall() {
      ball.cx += ball.velocityx;
      ball.cy += ball.velocityy;
      ball.x1 = ball.cx - ball.radius;
      ball.y1 = ball.cy - ball.radius;
      ball.x2 = ball.cx + ball.radius;
      ball.y2 = ball.cy + ball.radius;
      wallCollisionCheck();
      paddleCollisionCheck();
      brickCollisionCheck();
  }

  /**
   * Inserts the final score into web storage.
   */
  function setScore() {
      localStorage.setItem(localStorage.length.toString(), score.toString());
  }

  /**
   * Sets the high scores.
   */
  function setHighScores() {
    const length = localStorage.length;
    const scores = [];
    let i;

    scores[0] = 0;
    scores[1] = 0;
    scores[2] = 0;
    scores[3] = 0;

    for (i = 0; i < length; i += 1) {
          scores[i] = parseInt(localStorage.getItem(i.toString()), 10);
      }
    highScores = scores.sort((a, b) => {
          return b - a;
      });
  }

  /**
   * Function that needs to be run to end the game.
   */
  function endGame() {
      gameStatus = 'gameover';
      setScore();
      setHighScores();
  }

  /**
   * Displays the winning screen.
   */
  function winningScreen() {
      endGame();
  }

  /**
   * Displays the losing screen.
   */
  function losingScreen() {
      endGame();
  }

  /**
   * Loads the colors of the bricks into an array and then returns the
   * array.
   * @return {string[]>} color an array of colors.
   */
  function loadBrickColors(): string[] {
      const colors = ['red', 'red', 'orange', 'orange', 'yellow', 'yellow', 'green',
              'green', 'blue', 'blue'];
      return colors;
  }

  /**
   * Loads the colors of the bricks into the colors array.
   */
  function createBricks() {
      let colors = [];
      colors = loadBrickColors();
      switch (level) {
      case 1:
          drawRectangle(colors);
          break;
      case 2:
          drawTriangle(colors);
          break;
      default:
          break;
      }
  }

  /**
   * Gets the variables ready for the game.
   */
  function initGameVariables() {
      paddle = new Paddle();
      ball = new Ball();
      turns = 3;
      level = 1;
      score = 0;
      gameStatus = 'start';
      bricksRemaining = BRICK_ROWS * BRICKS_PER_ROW;
  }

  /**
   * Initalizes the event listeners.
   */
  function initListeners() {
      canvas.addEventListener('mousemove', movePaddle);
  }

  /**
   * Sets the canvas width and height.
   */
  function resizeCanvas() {
      context.canvas.width = SCREEN_WIDTH;
      context.canvas.height = SCREEN_HEIGHT;
  }

  /**
   * Initalizes the game.
   */
  function initGame() {
      createBricks();
      initGameVariables();
      initListeners();
      resizeCanvas();
  }

  /**
   * Draws the background.
   */
  function drawBackground() {
      context.fillStyle = SCREEN_COLOR;
      context.fillRect(SCREEN_X1, SCREEN_Y1, SCREEN_WIDTH, SCREEN_HEIGHT);
  }

  /**
   * Draws the bricks.
   */
  function drawBricks() {
      let i = 0;
      const length = bricks.length;
      let x1 = 0;
      let y1 = 0;
      let x2 = 0;
      let y2 = 0;
      let color = '';

      for (i = 0; i < length; i += 1) {
          if (bricks[i].visible === true) {
              x1 = bricks[i].x1;
              y1 = bricks[i].y1;
              x2 = BRICK_WIDTH;
              y2 = BRICK_HEIGHT;
              color = bricks[i].color;
              context.fillStyle = color;
              context.fillRect(x1, y1, x2, y2);
          }
      }
  }

  /**
   * Draws the ball.
   */
  function drawBall() {
      context.fillStyle = ball.color;
      context.beginPath();
      context.arc(ball.cx, ball.cy, ball.radius, 0, Math.PI * 2, true);
      context.closePath();
      context.stroke();
      context.fill();
  }

  /**
   * Draws the paddle.
   */
  function drawPaddle() {
      context.fillStyle = paddle.color;
      context.fillRect(paddle.x1, paddle.y1, paddle.width, paddle.height);
  }

  /**
   * Starts the game.
   */
  function startGame() {
      gameStatus = 'playing';
      canvas.removeEventListener('click', startGame);
  }

  /**
   * Draws the start screen.
   */
  function drawStartScreen() {
      canvas.addEventListener('click', startGame);
      const x = SCREEN_WIDTH / 2;
      const y = 175;
      context.textAlign = 'center';
      context.fillStyle = TEXT_COLOR;
      context.font = '30px Verdana bold';
      context.textBaseline = 'top';
      context.fillText('Brick Breaker', x, y);
      context.font = '15px Arial';
      context.fillStyle = TEXT_COLOR;
      context.fillText('Click on screen to start', x, y + 125);
  }

  /**
   * Draws the score.
   */
  function drawScore() {
      context.textAlign = 'left';
      context.fillStyle = TEXT_COLOR;
      context.font = '15px arial';
      context.textBaseline = 'top';
      context.fillText('Score: ' + score, 30,
          SCREEN_HEIGHT - STATUS_BAR_Y_OFFSET);
  }

  /**
   * Draws the turns on the screen.
   */
  function drawTurns() {
      context.textAlign = 'left';
      context.fillStyle = TEXT_COLOR;
      context.font = '15px arial';
      context.textBaseline = 'top';
      context.fillText('Turns: ' + turns, SCREEN_WIDTH - 100,
          SCREEN_HEIGHT - STATUS_BAR_Y_OFFSET);
  }

  /**
   * Draws the score.
   */
  function exitGameCheck() {
      if (bricksRemaining === 0) {
          winningScreen();
      } else if (turns === 0) {
          losingScreen();
      }
  }

  /**
   * Plays the game.
   */
  function playGame() {
      moveBall();
  }

  /**
   * Draws the game over screen.
   */
  function gameOverScreen() {
      canvas.addEventListener('click', () => {
        initGame();
        startGame();
      });
      const x = SCREEN_WIDTH / 2;
      let y = 175;
      context.textAlign = 'center';
      context.fillStyle = TEXT_COLOR;
      context.font = 'bold 30px Verdana';
      context.textBaseline = 'top';
      context.fillText('Game Over', x, y);
      context.font = 'bold 15px Arial';
      context.fillStyle = TEXT_COLOR;
      context.fillText('High Scores', x, y += 50);
      context.font = '15px Arial';
      context.fillText('1.  ' + highScores[0], x, y += 25);
      context.fillText('2.  ' + highScores[1], x, y += 25);
      context.fillText('3.  ' + highScores[2], x, y += 25);
      context.fillText('Click on screen to play again', x, y += 25);
  }

  /**
   * Draws the screen.
   */
  function drawScreen() {
      drawBackground();
      drawBricks();
      drawPaddle();
      if (gameStatus === 'start') {
          drawStartScreen();
          drawBall();
      } else if (gameStatus === 'playing') {
          drawScore();
          drawTurns();
          drawBall();
          playGame();
          exitGameCheck();
      } else if (gameStatus === 'gameover') {
          drawScore();
          drawTurns();
          gameOverScreen();
      }
  }

  /**
   * Runs the game.
   */
  function runGame() {
      continueGame = setInterval(drawScreen, DELAY_TIME);
  }

  initGame();
  runGame();
}

window.onload = canvasApp;
