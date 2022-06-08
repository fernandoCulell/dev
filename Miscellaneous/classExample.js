/* 
function Rectangle(height, width) {
    this.height = height;
    this.width = width;
    this.calculateArea = function () {
        return this.height * this.width;
    };
}
 */

class Rectangle {
    constructor(height, width) {
        this.height = height;
        this.width = width;
    }
    // Method
    calculateArea() {
        return this.height * this.width;
    }
}

const square = new Rectangle(10, 10);

console.log(square.calculateArea()); // 100
