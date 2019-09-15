const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
// const { spawnSync } = require('child_process');



const extractTimestamps = ({
  filename,
  treshold = 0.1
}) => new Promise((resolve) => {
  ffmpeg(filename)
    .audioFilter(`silencedetect=noise=${treshold}`)
    .format('null')
    .on('end', function (stdout, stderr) {
      const log = stderr.toString();
      // needs node 12 for matchAll
      const timestamps = [...log.matchAll(/silence_(start|end): (\-?\d+(\.\d+)?)/gm)].map(i => i[2]).slice(1);
      const groupedTimestamps = [];
      for (let index = 0; index < timestamps.length - 1; index += 2) {
        groupedTimestamps.push([timestamps[index], timestamps[index + 1]]);
      }
      resolve(groupedTimestamps);
      // }).on('error', function (err, stdout, stderr) {
      //   console.log('Cannot process video: ' + err.message);
      // }).on('stderr', function (stderrLine) {
      //   console.log('Stderr output: ' + stderrLine);
    })
    .output('/dev/null')
    .run();
});

const cut = ({ filename, timestamps }) => new Promise((resolve) => {
  const { dir, name, ext } = path.parse(filename);
  timestamps.forEach(([start, end], index) => {
    ffmpeg(filename)
      .seekInput(start)
      .inputOptions([`-to ${end}`])
      .audioCodec('copy')
      .videoCodec('copy')
      .save(path.join(dir, `${name}_${index}${ext}`));
  });
  resolve();
});

const merge = ({ filename, timestamps }) => new Promise((resolve) => {
  const { dir, name, ext } = path.parse(filename);
  let command = ffmpeg();
  timestamps.forEach((_, index) => {
    command = command.mergeAdd(path.join(dir, `${name}_${index}${ext}`));
  });
  command
    .on('end', resolve)
    .mergeToFile(path.join(dir, `${name}_super-cut${ext}`));
});

const clean = ({ filename, timestamps }) => new Promise((resolve) => {
  const { dir, name, ext } = path.parse(filename);
  timestamps.forEach((_, index) => {
    fs.unlinkSync(path.join(dir, `${name}_${index}${ext}`));
  });
  resolve();
});

const process = async () => {
  const filename = './big.mkv';
  const timestamps = await extractTimestamps({ filename });
  await cut({ filename, timestamps });
  await merge({ filename, timestamps });
  await clean({ filename, timestamps });
};

process();

// const log = fs.readFileSync('log.txt').toString();

// console.log(log.split('\n'));

// const timestamps = log.split('\n').filter(x => x).map(timestamp => +timestamp.split(' ')[1]);

// console.log(timestamps);

// const stream = fs.createWriteStream('big-cut.mkv');

// ffmpeg('big.mkv').inputOptions([
//   //'-filter_complex ""',
//   //'-map [outv]',
//   //'-map [outa]'
// ]).output(stream);

// ffmpeg('big.mkv').output(stream);
