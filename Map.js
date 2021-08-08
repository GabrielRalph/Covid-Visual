import {SvgPlus, SvgPath, Vector} from "https://www.svg.plus/3.5.js"
import {Vector3} from "./Vector3.js"

async function getJSON(url){
  let res = await fetch(url);
  let data = await res.json();
  return data;
}
class CovidMap extends SvgPlus{
  constructor(bounds, id){
    if(id) super(id);
    else super("svg");
    this.cases_query = "https://data.nsw.gov.au/data/api/3/action/datastore_search?resource_id=21304414-1ff1-4243-a5d2-f52778048b29&limit=50000";
    this.min_recovery = 11;
    this.max_recovery = 80;

    this.map = {};
    this.bounds = bounds.bounds;
    this.boundries = bounds.boundries;

    let invpc = -1;
    for (let boundry of bounds.boundries) {
      let key = boundry.props.postcode;
      if (!key) {
        key = invpc;
        invpc--;
      }

      if (!(key in this.map)) {
        this.map[key] = [];
      }
      this.map[key].push(boundry);
    }
    this.map_group = this.createChild("g", {class: "map-group"});
    this.drawBoundries();
  }

  draw(time) {
    for (let boundry of this.boundry_paths) {
      boundry.opacity = 0.4 + boundry.risk(time)/50;
    }
  }

  drawBoundries(){
    let r_earth_km = 6378.1;
    let boundry_props = {
      c_lon: (this.bounds.lon.min + this.bounds.lon.max)/2,
      c_lat: (this.bounds.lat.min + this.bounds.lat.max)/2,
      rad: new Vector3(0, 0, r_earth_km),
    }
    this.boundry_paths = [];
    this.map_group.innerHTML = "";
    for (let boundry of this.boundries) {
      let boundry_path = new MapBoundry(boundry, boundry_props);

      let hue = 360 - 140 * (boundry.props.income - 60000)/(80000);
      if (hue > 360) hue -= 360;
      if (Number.isNaN(hue)){
        boundry_path.fill = "#0000"
      }else{
        boundry_path.fill = `hsl(${Math.round(hue)}, 100%, 50%)`
      }

      this.boundry_paths.push(boundry_path)
      this.map_group.appendChild(boundry_path);
    }

    let bbox = this.map_group.getBBox()
    this.props = {
      viewBox: `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`
    }
  }

  makeCasePeriod(date){
    let min = this.min_recovery;
    let max = this.max_recovery;
    let duration =  Math.round(Math.random() * (max - min) + min);
    duration *= 1000 * 60 * 60 * 24;
    return {
      start: date.getTime(),
      end: date.getTime() + duration
    }
  }

  async loadCases(){
    this.start = null;
    this.end = null;

    for (let boundry of this.boundries)
        boundry.cases = [];

    let cases = await getJSON(this.cases_query);
    let records = cases.result.records;
    for (let record of records) {

      let date = new Date(record.notification_date);
      if (this.start == null || date < this.start)
        this.start = date;
      if (this.end == null || date > this.end)
        this.end = date;

      let postcode = this.map[record.postcode];
      // console.log(postcode);
      if (Array.isArray(postcode)) {
        for (let boundry of postcode) {
          boundry.cases.push(this.makeCasePeriod(date));
        }
      }
    }
  }
}
class MapBoundry extends SvgPlus{
  constructor(boundry, props){
    super("path");
    this.boundry = boundry;
    this.class = "boundry"
    this.drawBoundry(boundry, props)
  }

  risk(t){
    let caseRiskAtTime = (period, time) => {
      if (time < period.start) return 0;
      if (time > period.end) return 0;

      let dif = period.end - period.start;
      let elp = time - period.start;
      let pcnt = elp/dif;

      return pcnt;
    }
    let total = 0;
    for (let period of this.boundry.cases)
      total += caseRiskAtTime(period, t);
    return total;
  }

  set fill(value){
    this.styles= {fill: value};
  }
  set opacity(value){
    this.styles= {opacity: value};
  }

  drawBoundry(boundry, props) {
    let d = null;
    for (let coord of boundry.coordinates) {
      let lon = Math.PI * (coord[0] - props.c_lon) / 180;
      let lat = Math.PI * (coord[1] - props.c_lat) / 180;
      let v = props.rad.rotateX(lat).rotateY(lon);
      if (d == null) {
        d = `M${v.x},${v.y}`
      }else{
        d += `L${v.x},${v.y}`
      }
    }
    this.props = {d: d};
  }
}


class TimeLine extends SvgPlus{
  constructor(start, end, id) {
    if (id) super(id);
    else super("svg");

    this.class = "timeline"
    this.props = {
      viewBox: "-40 -30 1080 60"
    }

    this.history = this.createChild(SvgPath);
    this.history.class = "history";
    this.future = this.createChild(SvgPath).M(new Vector).L(new Vector(1000, 0));
    this.future.class = "future";
    this.dates = this.createChild("g", {class: "labels"});

    this.cursor = this.createChild("ellipse", {rx: 7, ry: 7, cy: 0});
    this.clickbox = this.createChild("ellipse", {rx: 40, ry: 40, cy: 0, opacity: 0});

    this.drawDates(start, end)
  }



  // ontouchstart(e){
  //   e.x = e.touches[0].clientX;
  //   this.onmousedown(e);
  // }
  // ontouchmove(e){
  //   e.x = e.touches[0].clientX;
  //   e.buttons = 1;
  //   // alert(e.x);
  //   this.onmousemove(e);
  // }
  //
  // onmousedown(e){
  //   if (e.target instanceof SVGEllipseElement){
  //     this.move = true;
  //     // alert(e.target)
  //
  //   }
  //   this.lastdatex = this.mouseToX(e);
  // }
  //
  // onmousemove(e){
  //   if (e.buttons == 1 && this.move){
  //     this.datex = this.mouseToX(e);
  //     if (Math.abs(this.datex - this.lastdatex) > 5) {
  //       this.map.paused = true;
  //       this.map.current = this.xToDate(this.datex);
  //       this.lastdatex = this.datex;
  //     }
  //
  //     // console.log(e);
  //     // console.log();
  //   }else{
  //     this.move = false;
  //   }
  // }

  update(){
    this.datex = this.dateToX(this.map.current);
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
  dateToX(date){
    let start = this.start;
    let end = this.end;
    if (!start || !end || !(date instanceof Date)) return null;

    let total = end.getTime() - start.getTime();
    let elaps = date.getTime() - start.getTime();
    if (total == 0) return 0;
    return (elaps/total) * 1000;
  }
  xToDate(x){
    let start = this.start;
    let end = this.end;
    if (!start || !end) return null;

    let total = end.getTime() - start.getTime();
    if (total < 0) total = 0;
    return new Date(start.getTime() + (x/1000) * total);
  }

  set date(date) {
    this.datex = this.dateToX(date);
  }
  get date() {return this.xToDate(this.datex)}

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

  drawDates(start, end){
    this.dates.innerHTML = "";
    if (!start || !end) return;

    start = new Date(start.getTime());
    end = new Date(end.getTime());

    this.start = new Date(start.getTime());
    this.end = end;


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
  }
}
export {CovidMap, TimeLine, getJSON}
