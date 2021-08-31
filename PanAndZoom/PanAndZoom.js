import {SvgPlus, Vector} from "../3.5.js";


class Transform extends SvgPlus{
  constructor(id){
    super(id);
    this.scale = 1;
    this.position = new Vector;
    this.update();
  }
  update(){
    this.styles = {
      "transform-origin": "0 0",
      transform: `translate(${this.position.x}px, ${this.position.y}px) scale(${this.scale})`,
      "--zoom": this.scale,
    }
  }

  set scale(value) {
    if (typeof value === "string") {
      value = parseFloat(value);
    }
    if (typeof value === "number") {
      if (Number.isNaN(value)) {
        value = 1;
      }

      if (value == 0) {
        value = 1;
      }
    }else {
      value = 1;
    }

    this._scale = value;
  }
  get scale(){
    return this._scale;
  }

  set position(value){
    if (value instanceof Vector) {
      this._position = value;
    }
  }
  get position(){
    return this._position.clone();
  }
}

class PanAndZoom extends SvgPlus{
  constructor(id){
    super(id);
    let html = this.innerHTML;
    this.innerHTML = "";
    this.trans = new Transform("div");
    this.appendChild(this.trans);
    this.trans.innerHTML = html;
    this.lastDist = null;
    this.lastp1 = null;
    this.mode = 0;
    this.onwheel = (e) => {
      e.preventDefault();
      this.zoomWheel(e);
    };
  }

  zoomWheel(e) {
    let change = e.deltaY / screen.width;
    let point = new Vector(e);
    this.zoom(change, point);
  }

  zoom(zoomChange, zoomPoint) {
    let old_scale = this.trans.scale;
    let o = this.trans.position;
    let new_scale = old_scale * (1 + zoomChange);

    let o_to_p = zoomPoint.sub(o);
    let new_o_to_p = o_to_p.mul(1 + zoomChange);
    let delta = new_o_to_p.sub(o_to_p);
    let new_o = o.sub(delta);

    this.trans.position = new_o;
    this.trans.scale = new_scale;
    this.trans.update();
  }

  resetZoomDrag(){
    this.lastp1 = null;
    this.lastDist = null;
  }
  zoomDrag(e) {
    let p1 = e.touches[0];
    let p2 = e.touches[1];

    p1 = new Vector(p1.clientX, p1.clientY);
    p2 = new Vector(p2.clientX, p2.clientY);

    let center = p1.add(p2).div(2);
    let dist = p1.dist(p2);
    if (this.lastDist == null) {
      this.lastDist = dist;
    }
    let change = (dist - this.lastDist) / this.lastDist;
    this.drag(center);
    this.zoom(change, center);
    this.lastDist = dist;
  }

  ontouchmove(e) {
    e.preventDefault();
    if (this.mode == 0) {
      this.resetZoomDrag();
    }

    if (e.touches.length == 1) {
      if (this.mode == 2) {
        this.resetZoomDrag();
      }

      let t = e.touches[0];
      let point = new Vector(t.clientX, t.clientY);
      this.drag(point);
      this.mode = 1;
    } else if (e.touches.length > 1) {
      if (this.mode == 1) {
        this.resetZoomDrag();
      }

      this.zoomDrag(e);
      this.mode = 2;
    }
  };

  ontouchend(e){
    this.mode = 0;
  }

  resetDrag(point = null){
    this.lastp1 = point;
  }
  drag(p){
    if (this.lastp1 == null) {
      this.lastp1 = p;
    }

    let delta = p.sub(this.lastp1);
    this.trans.position = this.trans.position.add(delta);
    this.trans.update();

    this.lastp1 = p;
  }

  onmousemove(e){
    // console.log(e);
    if (e.buttons == 1) {
      this.drag(new Vector(e));
    } else {
      this.lastp1 = null;
    }
  }




}

export {PanAndZoom}
