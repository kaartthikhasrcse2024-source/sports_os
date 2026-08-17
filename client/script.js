const {execSync}=require('child_process'); try {execSync('npx tsc -b', {encoding:'utf8'})} catch (e) {console.log(e.stdout)}
