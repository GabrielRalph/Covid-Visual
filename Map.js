import {SvgPlus, SvgPath, Vector} from "https://www.svg.plus/3.5.js"
import {Vector3} from "./Vector3.js"

class Case{
  constructor(date, recv_low = 11, recv_high = 80){
    Object.defineProperty(this, 'start', {
      get: () => {return date.getTime();}
    });
    let recovery = recv_low + Math.random() * (recv_high - recv_low);
    Object.defineProperty(this, 'recovery', {
      value: recovery,
      writable: false
    });
  }



  risk(date){
    if (date instanceof Date){
      date = date.getTime();
    }

    if (date < this.start) return 0;
    // console.log(date);
    let dif = (date - this.start) / 24 / 60 / 60 / 1000;
    let r = dif / this.recovery;
    // console.log(r);
    return r > 1 ? 0 : 1 - r;
  }
}
class Boundry extends SvgPlus{
  constructor(id, map){
    super(id);
    this.cases = [];

    let datelast = map.current;
    let next = () => {
      if (map.current instanceof Date) {
        if (datelast != map.current) {
          this.updateCases(map.current)
        }
      }
      window.requestAnimationFrame(next)
    }
    next();
  }

  addCase(record){
    if (record.postcode == this.id) {
      let date = new Date(record.notification_date);
      this.cases.push(new Case(date));
    }
  }

  updateCases(date) {
    let trisk = 0;
    for (let rcase of this.cases) {
      trisk += rcase.risk(date);
    }
    // console.log(date);
    this.opacity = 0.4 + trisk/50;
  }

  set opacity(opacity){
    this.styles = {opacity: opacity}
  }
}

class TimeLine extends SvgPlus{
  constructor(map) {
    super("svg");
    this.class = "timeline"
    this.props = {
      viewBox: "-40 -30 1080 60"
    }

    this.map = map;
    this.history = this.createChild(SvgPath);
    this.history.class = "history";
    this.future = this.createChild(SvgPath).M(new Vector).L(new Vector(1000, 0));
    this.future.class = "future";
    this.dates = this.createChild("g", {class: "labels"});
    // this.makeDates();
    this.cursor = this.createChild("ellipse", {rx: 7, ry: 7, cy: 0});
    this.clickbox = this.createChild("ellipse", {rx: 40, ry: 40, cy: 0, opacity: 0});
  }

  mouseToX(e){
    let x = e.x;
    let bbox = this.getBoundingClientRect();
    x -= bbox.x;
    x /= bbox.width;
    bbox = this.dates.getBBox();
    x *= bbox.width;
    x += bbox.x;
    if (x < 0) x = 0;
    if (x > 1000) x = 1000;
    return x
  }

  ontouchstart(e){
    e.x = e.touches[0].clientX;
    this.onmousedown(e);
  }
  ontouchmove(e){
    e.x = e.touches[0].clientX;
    e.buttons = 1;
    // alert(e.x);
    this.onmousemove(e);
  }

  onmousedown(e){
    if (e.target instanceof SVGEllipseElement){
      this.move = true;
      // alert(e.target)

    }
    this.lastdatex = this.mouseToX(e);
  }
  // onmouseup(){
  //   console.log(this.xToDate(this.datex));
  //   this.map.current = this.xToDate(this.datex);
  // }
  onmousemove(e){
    if (e.buttons == 1 && this.move){
      // console.log(this.mouseToX(e));
      this.datex = this.mouseToX(e);

      if (Math.abs(this.datex - this.lastdatex) > 5) {
        this.map.paused = true;
        this.map.current = this.xToDate(this.datex);
        this.lastdatex = this.datex;
      }

      // console.log(e);
      // console.log();
    }else{
      this.move = false;
    }
  }

  update(){
    this.datex = this.dateToX(this.map.current);
  }

  dateToX(date){
    let start = this.map.start;
    let end = this.map.end;
    if (!start || !end || !(date instanceof Date)) return null;

    let total = end.getTime() - start.getTime();
    let elaps = date.getTime() - start.getTime();
    if (total == 0) return 0;
    return (elaps/total) * 1000;
  }
  xToDate(x){
    let start = this.map.start;
    let end = this.map.end;
    if (!start || !end) return null;

    let total = end.getTime() - start.getTime();
    if (total < 0) total = 0;
    return new Date(start.getTime() + (x/1000) * total);
  }

  set datex(x){
    this.history.d.clear();
    this.future.d.clear();
    this.cursor.props = {cx:x};
    this.clickbox.props = {cx:x};
    this.history.M(new Vector).L(new Vector(x, 0));
    this.future.M(new Vector(x, 0)).L(new Vector(1000, 0));
    this._datex = x;
  }
  get datex(){return this._datex;}

  drawDates(){
    this.dates.innerHTML = "";
    let start = new Date(this.map.start.getTime());
    let end = new Date(this.map.end.getTime());
    if (!start || !end) return;
    let b = false;
    while (start < end) {
      let txt = (`${start}`).split(" ");
      this.dates.createChild("text", {
        x: this.dateToX(start),
        y: b ? 20 : -10,

      }).innerHTML = txt[1] + " " + txt[3];
      b = !b;
      start.setMonth(start.getMonth() + 1);
    }
    let bbox = this.dates.getBBox()
    this.props = {
      viewBox: `${bbox.x} ${bbox.y} ${bbox.width + 10} ${bbox.height}`
    }
    // console.log(start);
  }
}

class Map extends SvgPlus{
  constructor(id){
    if (id) super(id);
    else super("svg")
    this.boundries = this.createChild("g");
    this.keys = this.createChild("g", {class: "keys"});
    this.timeline = new TimeLine(this);
    this.parentNode.prepend(this.timeline);
    this.freq = 1;
    this.fps = 50;

    let paused = false;
    let date = this.start;
    let next = () => {
      if (!date) {
        date = this.start;
        if (!date) paused = true;
      }
      if (paused) return;
      this.timeline.update()
      // this.updateBoundries(date);
      date = new Date(date.getTime() + this.freq * 24 * 60 * 60 * 1000);
      if (date > this.end) {
        // date = this.start;
        paused = true;
      }else{
        setTimeout(next, this.fps);
      }
    }

    Object.defineProperty(this, 'paused', {
      get: () => {return paused},
      set: (value) => {
        if (value && !paused) paused = true;
        console.log(value);
        if (!value && paused) {
          if (date > this.end) {
            date = this.start;
          }
          paused = false;
          next();
        }
      }
    });
    Object.defineProperty(this, 'current', {
      set: (value) => {
        if (value instanceof Date) {
          // this.updateBoundries(date);
          date = value;
        }
      },
      get: () => {
        if (date instanceof Date) {

          return new Date(date.getTime())
        }
        return null;
      }
    });
    next();
  }

  colorIncome(income){

    let hues = {};
    let min = 60000;
    let max = 141262;
    for (let inc of income) {
      let postcode = inc.Postcode;
      let salary = parseFloat(inc["Average salary or wages"]);
      let hue = 360 - 140 * (salary - min)/(max - min);
      if (hue > 360) hue -= 360;
      hues[postcode] = `hsl(${Math.round(hue)}, 100%, 50%)`;
    }
    // console.log(hues);
    for (let child of this.boundries.children) {
      // console.log(child.class);
      if (child.getAttribute("class") != "void") {
        child.style.setProperty("fill", hues[child.id])
        child.style.setProperty("opacity",0.4)
      }
    }
    this.keys.innerHTML = "";
    let v = new Vector(41, 31);

    for (let inc = 140000; inc > 21000; inc -= 10000) {
      let hue = 360 - 140 * (inc - min)/(max - min);
      if (hue > 360) hue -= 360;
      hue = `hsl(${Math.round(hue)}, 100%, 50%)`;
      let text = `$${Math.round(inc/1000)}k`
      this.keys.createChild("text", {x: v.x, y: v.y, style: {
        "font-size": 2,
        // "opacity": 1,
        // "text-anchor": "end",
        fill: hue
      }}).innerHTML = text;
      v = v.add(new Vector(0, -2))
    }

    this.keys.createChild("text", {x: v.x, y: v.y, style: {
      "font-size": 1.5,
      // "opacity": 1,
      // "text-anchor": "end",
      fill: "black"
    }}).innerHTML = "mean salary";

  }

  drawFeatures(range) {
    let c_lon = (range.bounds.lon.max + range.bounds.lon.min) / 2;
    let c_lat = (range.bounds.lat.max + range.bounds.lat.min) / 2;
    let txt = "";
    let rad = new Vector3(0, 0, 6378.1);
    for (let feature of range.features) {
      let d = null
      for (let coord of feature.coordinates) {
        let lon = Math.PI * (coord[0] - c_lon) / 180;
        let lat = Math.PI * (coord[1] - c_lat) / 180;
        let v = rad.rotateX(lat).rotateY(lon);


        if (d == null) {
          d = `M${v.x},${v.y}`
        }else{
          d += `L${v.x},${v.y}`
        }
      }
      let postcode = this.pc[feature.props.nsw_loca_2];
      if (!postcode) {
        txt += `<path class = "void" name = '${feature.props.nsw_loca_2}' d = '${d}'></path>`
      }else{
        txt += `<path id = '${postcode.postcode}' name = '${postcode.locality}' d = '${d}'></path>`
      }
      // console.log(postcode);
    }
    this.boundries.innerHTML = txt;
    let bbox = this.boundries.getBBox()
    this.props = {
      viewBox: `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
    }
  }

  addCases(cases){
    for (let rcase of cases){
      this.addCase(rcase);
    }
    this.timeline.drawDates();

  }

  addCase(rcase){
    if (this.running) return;
    let date = new Date(rcase.notification_date);
    if (this.start instanceof Date) {
      if (date < this.start) this.start = date;
    }else {
      this.start = date;
    }
    if (this.end instanceof Date) {
      if (date > this.end) this.end = date;
    }else{
      this.end = date;
    }

    let boundry = this.getElementById(rcase.postcode);
    if (boundry) {
      if (!SvgPlus.is(boundry, Boundry)) {
        boundry = new Boundry(boundry, this);
      }
      boundry.addCase(rcase);
    }
  }

  updateBoundries(date){
    for (let boundry of this.boundries.children) {
      if (SvgPlus.is(boundry, Boundry)) {
        boundry.updateCases(date);
      }
    }
  }
}


export {Map}
