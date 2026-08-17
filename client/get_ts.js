const fs=require('fs'); console.log(fs.readFileSync('ts_out.txt', 'utf8').replace(/\x00/g, ''))
