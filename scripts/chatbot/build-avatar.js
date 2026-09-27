const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcPath = path.resolve(__dirname, '../../docs/chatbot/source/cuu-hula-avatar.png');
const outDirs = [
  path.resolve(__dirname, '../../hula-web/website/public/images/chatbot'),
  path.resolve(__dirname, '../../frontend/public/images/chatbot'),
];

async function build() {
  if (!fs.existsSync(srcPath)) {
    console.error('Source avatar not found at:', srcPath);
    process.exit(1);
  }

  for (const dir of outDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await sharp(srcPath)
      .resize(96, 96)
      .webp({ quality: 90 })
      .toFile(path.join(dir, 'cuu-hula-96.webp'));

    await sharp(srcPath)
      .resize(192, 192)
      .webp({ quality: 90 })
      .toFile(path.join(dir, 'cuu-hula-192.webp'));

    console.log(`Generated avatars in: ${dir}`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
