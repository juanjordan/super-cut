const ffmpeg = require('fluent-ffmpeg');
const command = ffmpeg();
const fs = require('fs');

const log = fs.readFileSync('log.txt').toString();

// console.log(log.split('\n'));

const timestamps = log.split('\n').filter(x => x).map(timestamp => +timestamp.split(' ')[1]);

console.log(timestamps);

const stream = fs.createWriteStream('big-cut.mkv');

// ffmpeg('big.mkv').inputOptions([
//   //'-filter_complex ""',
//   //'-map [outv]',
//   //'-map [outa]'
// ]).output(stream);

ffmpeg('big.mkv').output(stream);
