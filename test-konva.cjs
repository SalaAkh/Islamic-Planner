const { JSDOM } = require('jsdom');
const { window } = new JSDOM('<!DOCTYPE html><html><body><div id="container"></div></body></html>');
global.window = window;
global.document = window.document;

const Konva = require('konva');

const stage = new Konva.Stage({
    container: 'container',
    width: 800,
    height: 600
});
const layer = new Konva.Layer();
stage.add(layer);

const rect1 = new Konva.Rect({ x: 10, y: 10, width: 50, height: 50, fill: 'red' });
layer.add(rect1);
layer.draw();

const json1 = layer.toJSON();

const rect2 = new Konva.Rect({ x: 100, y: 100, width: 50, height: 50, fill: 'blue' });
layer.add(rect2);
layer.draw();

const json2 = layer.toJSON();

console.log("JSON 1 has children:", JSON.parse(json1).children.length); // 1
console.log("JSON 2 has children:", JSON.parse(json2).children.length); // 2

// SIMULATE clearNoteLayer and restore
const children = layer.getChildren().slice();
children.forEach(c => c.destroy());

console.log("After clear, children:", layer.getChildren().length); // 0

const tempLayer = Konva.Node.create(json1);
console.log("TempLayer children:", tempLayer.getChildren().length); // 1

tempLayer.getChildren().forEach(blob => {
    const node = blob.clone();
    layer.add(node);
});

console.log("After restore, layer children:", layer.getChildren().length); // 1
