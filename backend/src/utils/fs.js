const fs = require('fs/promises');

async function safeUnlink(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore missing file
  }
}

module.exports = { safeUnlink };
