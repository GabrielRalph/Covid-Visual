import {SvgPlus, Vector} from "../3.5.js"
class Map extends SvgPlus{
  constructor(id) {
    super(id);
    this.bgroup = new SvgPlus(this.children[0]);
    this.labels = new SvgPlus(this.children[1]);
  }

  get boundries(){
    return this.bgroup.children;
  }
  get postcodes(){
    let pcs = {};
    for (let boundry of this.boundries) {
      let pc = boundry.getAttribute("class");
      pc = pc.split(" ")[0];
      pcs[pc] = true;
    }
    return pcs;
  }
  get localities(){
    let locs = {};
    for (let boundry of this.boundries) {
      let loc = boundry.getAttribute("class");
      loc = loc.split(" ")[1].replace("-", " ")
      locs[loc] = true;
    }
    return locs;
  }

  set_boundry_props(bprops, def) {
    for (let boundry of this.boundries) {
      if (!SvgPlus.is(boundry, Boundry)) {
        boundry = new Boundry(boundry);
      }
      let pc = boundry.postcode;
      let loc = boundry.locality;

      if (pc in bprops) {
        boundry.props = bprops[pc];
      } else if (loc in bprops) {
        boundry.props = bprops[loc];
      } else {
        boundry.props = def;
      }
    }
  }
  set_props(els, props) {
    for (let el of els) {
      if (!SvgPlus.is(el, SvgPlus)) {
        el = new SvgPlus(el);
      }
      el.props = props;
    }
  }

  set_loc_props(locality, props) {
    let els = this.b_by_pc(locality);
    this.set_props(els, props);
  }
  set_pc_props(postcode, props) {
    let els = this.b_by_pc(postcode);
    this.set_props(els, props);
  }

  b_by_pc(postcode) {
    return this.bgroup.getElementsByClassName(postcode);
  }
  b_by_loc(locality) {
    locality = locality.replace(/\s+/g, "-");
    return this.bgroup.getElementsByClassName(locality);
  }

  label_by_pc(postcode) {
    return this.labels.getElementsByClassName(postcode);
  }
  label_by_loc(locality) {
    locality = locality.replace(/\s+/g, "-");
    return this.labels.getElementsByClassName(locality);
  }

  static getBoundryClassName(boundry) {
    let loc = boundry.props.nsw_loca_2.replace(/^\s*/, "");
    loc = loc.replace(/\s+/g, "-");
    return boundry.props.postcode + " " + loc;
  }
}

class Boundry extends SvgPlus{
  get postcode() {
    return this.getAttribute("postcode");
  }
  get locality() {
    return this.getAttribute("locality");
  }
}

// let Ladjust = {
//   "GUILDFORD": {
//     pos: new Vector(0, -0.6),
//   },
//   "MERRYLANDS": {
//     pos: new Vector(0.31, 0.31),
//     w: 0.9,
//   },
//   "GREYSTANES": {
//     pos: new Vector(0.8, 0),
//   },
//   "AUBURN": {
//     pos: new Vector(-0.2, -0.2)
//   },
//   "HAWKESBURY HEIGHTS": {
//     pos: new Vector(0, -0.5),
//     w: 1.4
//   },
//   "YARRAMUNDI": {
//     pos: new Vector(-1.2, -1),
//   },
//   "CASTLEREAGH": {
//     pos: new Vector(-0.4, 0),
//   },
//   "PENRITH": {
//     pos: new Vector(1.1, 0),
//   },
//   "EMU PLAINS": {
//     pos: new Vector(0.5, -0.3),
//   },
//   "EMU HEIGHTS": {
//     pos: new Vector(0.1, -0.7),
//     w: 1.2
//   },
//   "MOUNT RIVERVIEW": {
//     pos: new Vector(-0.3, 0.26)
//   },
//   "GLENBROOK": {
//     pos: new Vector(0, -0.5)
//   },
//   "LAPSTONE": {
//     pos: new Vector(0, -0.2)
//   },
//   "LEONAY": {
//     pos: new Vector(0, -0.6)
//   },
//   "REGENTVILLE": {
//     pos: new Vector(-0.15, 0)
//   },
//   "JAMISONTOWN": {
//     pos: new Vector(0, -0.5)
//   },
//   "GLENMORE PARK": {
//     pos: new Vector(0, -0.5)
//   },
//   "CRANEBROOK": {
//     pos: new Vector(0.3, -1)
//   },
//   "LONDONDERRY": {
//     pos: new Vector(-0.35, 0)
//   },
//   "LLANDILO": {
//     pos: new Vector(-.05, -1.2),
//     // w: 0.8
//   },
//   "JORDAN SPRINGS": {
//     pos: new Vector(-.6, 0.3),
//   },
//   "MASCOT": {
//     pos: new Vector(0, -1.7)
//   },
//   "BOTANY": {
//     pos: new Vector(0.2, -0.2)
//   },
//   "PAGEWOOD": {
//     pos: new Vector(1.2, -0.2),
//     w: 0.5
//   }
//
// }
// class MapLabel extends SvgPlus{
//   constructor(boundry){
//     super("g");
//     let locality = boundry.locality;
//     let bbox = boundry.getBBox();
//
//     let o = new Vector(bbox);
//     let size = new Vector(bbox.width, bbox.height);
//     let c = o.add(size.div(2));
//
//     let n = locality.length;
//     let w = size.x / n;
//     w = w / 1.5;
//
//     if (locality in Ladjust) {
//       let a = Ladjust[locality];
//
//       c = c.add(a.pos);
//       let aw = !a.w ? 1 : a.w;
//       w *= aw;
//     }
//
//
//     this.center = c;
//     this.scale = w;
//     this.class = boundry.class;
//     this.boundry = boundry;
//   }
// }
// class CovidMapLabel extends MapLabel{
//   constructor(boundry) {
//     super(boundry);
//
//     let c = this.center;
//     let s = this.scale;
//
//
//     this.createChild("text", {
//       x: c.x,
//       y: c.y + s * 0.3,
//       "text-anchor": "middle",
//       "font-size": s,
//       style: {
//         "--ls": 1/s,
//       }
//     }).innerHTML = boundry.locality;
//   }
// }
export {Map}
