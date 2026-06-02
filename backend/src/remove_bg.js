const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;

// Always use the pristine, untouched original image as input
const inputPath = "C:\\Users\\Ayush.Rai\\.gemini\\antigravity-ide\\brain\\056e65cb-5bb9-4e0c-acfa-1351fe48a328\\media__1779981204669.png";
const outputPath = path.join(__dirname, 'assets/logo_transparent.png');

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function () {
    const width = this.width;
    const height = this.height;
    const data = this.data; // RGBA array

    // Helper to get pixel index
    function getIdx(x, y) {
      return (y * width + x) * 4;
    }

    // Helper to check if pixel is part of the background checkerboard
    function isBackground(x, y) {
      const idx = getIdx(x, y);
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // If already transparent, it's background
      if (a === 0) return true;

      // Background checkerboard is neutral (R, G, B are very close) and bright
      const isNeutral = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
      const isBright = r > 180 && g > 180 && b > 180;

      return isNeutral && isBright;
    }

    // Flood fill queue
    const queue = [];
    const visited = new Uint8Array(width * height);

    // Helper to add pixel to queue
    function addToQueue(x, y) {
      const idx = y * width + x;
      if (!visited[idx]) {
        visited[idx] = 1;
        queue.push({ x, y });
      }
    }

    // Initialize queue with all border pixels
    for (let x = 0; x < width; x++) {
      if (isBackground(x, 0)) addToQueue(x, 0);
      if (isBackground(x, height - 1)) addToQueue(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      if (isBackground(0, y)) addToQueue(0, y);
      if (isBackground(width - 1, y)) addToQueue(width - 1, y);
    }

    // Add the counter hole inside the letter "A" (in "Am")
    addToQueue(82, 51);

    // Perform 8-way BFS flood fill to squeeze through narrow outline gaps
    let head = 0;
    const dx = [0, 0, 1, -1, 1, 1, -1, -1];
    const dy = [1, -1, 0, 0, 1, -1, 1, -1];

    while (head < queue.length) {
      const curr = queue[head++];
      
      // Set this background pixel to fully transparent
      const idx = getIdx(curr.x, curr.y);
      data[idx + 3] = 0; // Alpha = 0

      // Check 8-way neighbors
      for (let i = 0; i < 8; i++) {
        const nx = curr.x + dx[i];
        const ny = curr.y + dy[i];

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nVisIdx = ny * width + nx;
          if (!visited[nVisIdx] && isBackground(nx, ny)) {
            visited[nVisIdx] = 1;
            queue.push({ x: nx, y: ny });
          }
        }
      }
    }

    // Save the processed image
    this.pack()
      .pipe(fs.createWriteStream(outputPath))
      .on('finish', () => {
        console.log('🎉 Background removed successfully! Saved to logo_transparent.png');
      });
  });
