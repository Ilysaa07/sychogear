const fs = require('fs');
let s = fs.readFileSync('./components/store/LinktreeClient.tsx', 'utf8');
s = s.split('\\`').join('`');
s = s.split('\\$').join('$');
fs.writeFileSync('./components/store/LinktreeClient.tsx', s);
