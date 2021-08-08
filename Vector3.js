class Vector3{
  constructor(x = 0, y = x, z = 0) {
    Object.defineProperty(this, 'x', {
      value: x,
      writable: false
    });
    Object.defineProperty(this, 'y', {
      value: y,
      writable: false
    });
    Object.defineProperty(this, 'z', {
      value: z,
      writable: false
    });
  }

  rotateZ(theta) {
    let x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
    let y = this.x * Math.sin(theta) + this.y * Math.cos(theta);
    return new Vector3(x, y, this.z);
  }

  rotateY(theta) {
    let x = this.x * Math.cos(theta) + this.z * Math.sin(theta);
    let z = -this.x * Math.sin(theta) + this.z * Math.cos(theta);
    return new Vector3(x, this.y, z);
  }

  rotateX(theta) {
    let y = this.y * Math.cos(theta) - this.z * Math.sin(theta);
    let z = -this.y * Math.sin(theta) + this.z * Math.cos(theta);
    return new Vector3(this.x, y, z);
  }

  sub(that){
    return new Vector3(this.x - that.x, this.y - that.y, this.z - that.z)
  }

  add(that){
    return new Vector3(this.x + that.x, this.y + that.y, this.z + that.z)
  }

  dot(that){
    return this.x * that.x + this.y * that.y + this.z * that.z
  }

  norm() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z);
  }

  dist(that) {
    return this.sub(that).norm();
  }

  angleBetween(that){
    return (this.dot(that)) / (this.norm() * that.norm());
  }
}

export {Vector3}
