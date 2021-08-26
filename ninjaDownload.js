const open = require("open");
// Move the mouse across the screen as a sine wave.
var robot = require("robotjs");
const { x, y } = { x: 983, y: 556 };
const hex = "fd1b23";
const waitTime = async (timeout) => {
  return new Promise((respond, reject) => {
    setTimeout(() => {
      respond();
    }, timeout);
  });
};

const waitForColor = async (hex, { x, y }) => {
  console.log(robot.getPixelColor(x, y));
  if (robot.getPixelColor(x, y) === hex) return true;
  else await waitTime(1000);
  await waitForColor(hex, { x, y });
};

const ninjaDownload = async (fileLink) => {
  open(fileLink);
  await waitTime(5000);
  robot.moveMouse(x, y);
  await waitForColor(hex, { x, y });
  robot.mouseClick();
  return true;
};

module.exports = ninjaDownload;
