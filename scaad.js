#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => rl.question(question, ans => {
        rl.close();
        resolve(ans.trim());
    }));
}

async function getAlbumArtURL(trackUrl) {
    const { data } = await axios.get('https://soundcloud.com/oembed', {
        params: {
            format: 'json',
            url: trackUrl,
        },
    });

    const baseThumb = data.thumbnail_url;
    if (!baseThumb) throw new Error('Thumbnail not found');

    return baseThumb.replace('-t500x500', '-t1080x1080').replace('.jpg', '.png');
}

async function downloadImage(imageUrl, filename = 'album.png') {
    const response = await axios.get(imageUrl, { responseType: 'stream' });
    const filepath = path.resolve(process.cwd(), filename);
    await new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
    console.log(`Album art saved as ${filename}`);
}

(async () => {
    try {
        const trackUrl = process.argv[2] || await prompt('Enter SoundCloud track URL: ');
        const artUrl = await getAlbumArtURL(trackUrl);

        console.log(`Album Art URL:\n${artUrl}\n`);

        const shouldDownload = (await prompt('Download image? (y/n): ')).toLowerCase();
        if (shouldDownload === 'y') {
            const filename = await prompt('Save as (e.g. album.png): ');
            await downloadImage(artUrl, filename || 'album.png');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
})();