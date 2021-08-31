import {Vector} from "./3.5.js"
async function getJSON(url){
  let res = await fetch(url);
  let data = await res.json();
  return data;
}

function riskByPostcode(cbyp, time, recovery = 70){
  let rct = recovery * 1000 * 60 * 60 * 24;
  let rbyp = {};
  for (let pc in cbyp) {
    let cases = cbyp[pc];
    let risk = 0;
    for (let c of cases) {
      // console.log(c);
      if (c < time) {
        // console.log(c - time);
        let r = 1 - (time - c)/(rct);
        r = r < 0 ? 0 : r;
        risk += r;
      }
    }
    rbyp[pc] = risk;
  }

  return rbyp;
}
function numCasesTo(cases, to) {
  let nct = {};
  for (let pc in cases) {
    let n = 0;
    for (let time of cases[pc]) {
      if (time <= to) {
        n++;
      }
    }
    nct[pc] = n;
  }
  return nct;
}
function caseByPostcode(cases, from = 0) {
  let cbyp = {};
  for (let c of cases) {
    let date = new Date(c.notification_date);
    if (date > from && c.postcode != null) {
      if (!(c.postcode in cbyp)) cbyp[c.postcode] = [];
      cbyp[c.postcode].push(date.getTime());
    }
  }
  return cbyp;
}


let adjust = {
  "GUILDFORD": {
    pos: new Vector(0, -0.6),
  },
  "MERRYLANDS": {
    pos: new Vector(0.31, 0.31),
    w: 0.9,
  },
  "GREYSTANES": {
    pos: new Vector(0.8, 0),
  },
  "AUBURN": {
    pos: new Vector(-0.2, -0.2)
  },
  "HAWKESBURY HEIGHTS": {
    pos: new Vector(0, -0.5),
    w: 1.4
  },
  "YARRAMUNDI": {
    pos: new Vector(-1.2, -1),
  },
  "CASTLEREAGH": {
    pos: new Vector(-0.4, 0),
  },
  "PENRITH": {
    pos: new Vector(1.1, 0),
  },
  "EMU PLAINS": {
    pos: new Vector(0.5, -0.3),
  },
  "EMU HEIGHTS": {
    pos: new Vector(0.1, -0.7),
    w: 1.2
  },
  "MOUNT RIVERVIEW": {
    pos: new Vector(-0.3, 0.26)
  },
  "GLENBROOK": {
    pos: new Vector(0, -0.5)
  },
  "LAPSTONE": {
    pos: new Vector(0, -0.2)
  },
  "LEONAY": {
    pos: new Vector(0, -0.6)
  },
  "REGENTVILLE": {
    pos: new Vector(-0.15, 0)
  },
  "JAMISONTOWN": {
    pos: new Vector(0, -0.5)
  },
  "GLENMORE PARK": {
    pos: new Vector(0, -0.5)
  },
  "CRANEBROOK": {
    pos: new Vector(0.3, -1)
  },
  "LONDONDERRY": {
    pos: new Vector(-0.35, 0)
  },
  "LLANDILO": {
    pos: new Vector(-.05, -1.2),
    // w: 0.8
  },
  "JORDAN SPRINGS": {
    pos: new Vector(-.6, 0.3),
  },
  "MASCOT": {
    pos: new Vector(0, -1.7)
  },
  "BOTANY": {
    pos: new Vector(0.2, -0.2)
  },
  "PAGEWOOD": {
    pos: new Vector(1.2, -0.2),
    w: 0.5
  }

}
function addNames() {
  let map = document.getElementById("map");
  let boundries = document.getElementsByClassName("boundries")[0];
  let labels = "";
  for (let boundry of boundries.children) {
    let bbox = boundry.getBBox();

    let o = new Vector(bbox);
    let size = new Vector(bbox.width, bbox.height);
    let c = o.add(size.div(2));


    let cname = boundry.getAttribute("class").split(" ");
    let pc = cname[0];
    let name = cname[1].replace("-", " ");


    let n = name.length;
    let w = size.x / n;
    w = w / 1.5;

    if (name in adjust) {
      let a = adjust[name];
      c = c.add(a.pos);
      let aw = !a.w ? 1 : a.w;
      w *= aw;
    }

    labels += `<text font-size = ${w} text-anchor = "middle" x = ${c.x} y = ${c.y + w*0.3}>
                <tspan>${name}</tspan>
                <tspan class = "${pc}-L1" font-size = "0.8em" x = ${c.x} y = "${c.y + w*1.3}">cases</tspan>
                <tspan style = "--ls${1/w}" class = "${pc}-L2" font-size = "0.8em" x = ${c.x} y = "${c.y + w*2.3}"></tspan>
              </text>`
  }
  map.innerHTML += `<g class = "labels">${labels}</g>`;
}

function setStyle(el, style){
  for (let key in style) {
    el.style.setProperty(key, style[key]);
  }
}
function setProps(el, props) {
  for (let key in props) {
    if (key == "style") {
      setStyle(el, props.style);
    } else if (key == "html") {
      el.innerHTML = props[key];
    }else {
      el.setAttribute(key, props[key]);
    }
  }
}

function setBoundryByPostcode(pc, props) {
  let els = document.getElementsByClassName(pc);
  for (let el of els) {
    setProps(el, props);
  }
}
function setL2ByPostcode(pc, props) {
  let els = document.getElementsByClassName(pc + "-L2");
  for (let el of els) {
    setProps(el, props);
  }
}

let init = true;
function setRisk(cases, now) {
  if (init) {
    let boundries = document.getElementsByClassName("boundries")[0];
    for (let child of boundries.children) {
      child.style.setProperty("--risk", 0);
    }
  }

  let risk = riskByPostcode(cases, now);
  let numc = numCasesTo(cases, now);
  for (let pc in risk) {
    let els = document.getElementsByClassName(pc);
    for (let el of els) {
      el.style.setProperty("--risk", risk[pc])
    }
    els = document.getElementsByClassName(pc+"-L2");
    // console.log(els);
    for (let el of els) {
      // console.log(numc[pc]);

      el.innerHTML = numc[pc]
    }
  }
}


let caseurl = "https://data.nsw.gov.au/data/api/3/action/datastore_search?resource_id=21304414-1ff1-4243-a5d2-f52778048b29&limit=50000";
let load = async () => {
  addNames();
  let cases = await getJSON(caseurl);
  cases = caseByPostcode(cases.result.records, new Date("1 Jun 2021").getTime());

  let today = new Date().getTime();
  let now = new Date("1 Jun 2021").getTime();
  let next = () => {
    setRisk(cases, now);
    now += 1000*60*60*24;
    if (now <= today) {
      console.log(now);
      window.requestAnimationFrame(next);
    }
  }
  window.requestAnimationFrame(next);
}


export {load}
