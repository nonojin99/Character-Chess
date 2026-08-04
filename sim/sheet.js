const { createCanvas } = require('canvas');
const fs = require('fs');
global.window = global; global.devicePixelRatio = 1;
require('../logic/chess.js');
for (const f of ['shapes','themes','effects','board']) eval(fs.readFileSync(__dirname+'/../render/'+f+'.js','utf8'));
const C=110, cv=createCanvas(C*6, C*4+30), c=cv.getContext('2d');
c.fillStyle='#0E1219'; c.fillRect(0,0,cv.width,cv.height);
const order=['K','Q','R','B','N','P'];
let row=0;
for (const th of globalThis.Themes.list){
  for (const side of ['w','b']){
    order.forEach((code,i)=>{
      const x=i*C, y=row*C+30;
      c.fillStyle=(i+row)%2? th.board.light: th.board.dark;
      c.fillRect(x,y,C,C);
      c.save(); c.translate(x+C/2,y+C/2+4);
      globalThis.Shapes[th.shapes][th.pieces[code].shape](c, C*0.80, th.sides[side].pal, side==='w'?-1:1);
      c.restore();
    });
    c.fillStyle='#C9A227'; c.font='12px sans-serif';
    c.fillText(th.name+' / '+th.sides[side].name, 6, row*C+24);
    row++;
  }
}
fs.writeFileSync(__dirname+'/../sheet.png', cv.toBuffer());
console.log('ok');
