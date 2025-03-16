class AppContainer extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
      <style>
        .toolbar {
          background-color: #333;
          color: white;
          padding: 10px;
          display: flex;
          justify-content: space-between;
        }
        button {
          margin: 5px;
          padding: 10px;
          background-color: #4b4e4b;
          color: white;
          border: 1px;
          border-radius: 5px;
          cursor: pointer;
        }
        button:hover {
          background-color: #a1a5a1;
        }
      </style>
      <div class="toolbar">
        <button id="createButton">Создать</button>
        <div>
          <button id="saveButton">Сохранить</button>
          <button id="resetButton">Сбросить</button>
        </div>
      </div>
      <buffer-zone></buffer-zone>
      <working-area></working-area>
    `;

    this.createButton = document.getElementById('createButton');
    this.saveButton = document.getElementById('saveButton');
    this.resetButton = document.getElementById('resetButton');
    this.bufferZone = document.querySelector('buffer-zone');
    this.workingArea = document.querySelector('working-area');

    this.createButton.addEventListener('click', () => this.createPolygons());
    this.saveButton.addEventListener('click', () => this.savePolygons());
    this.resetButton.addEventListener('click', () => this.resetPolygons());



  }

  createPolygons() {
    const count = Math.floor(Math.random() * 16) + 5;
    let offsetX = 0;

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    g.setAttribute('width', '100px');
    g.setAttribute('height', '100px');

    for (let i = 0; i < count; i++) {
      const points = [];
      const vertexCount = Math.floor(Math.random() * 5) + 3;
      for (let j = 0; j < vertexCount; j++) {
        const x = Math.random() * 100 + offsetX;
        const y = Math.random() * 100;
        points.push(`${x},${y}`);
      }

      const polygon = document.createElementNS(g.namespaceURI, 'polygon');
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('fill', 'red');
      g.appendChild(polygon);
    }

    g.addEventListener('mousedown', (e) => {
      let shiftX = e.clientX - g.getBoundingClientRect().left;
      let shiftY = e.clientY - g.getBoundingClientRect().top;

      g.style.position = 'absolute';
      g.style.zIndex = 1000;
      document.body.append(g)

      moveAt(e.pageX, e.pageY)

      function moveAt(pageX, pageY) {
        g.style.left = pageX - shiftX + 'px';
        g.style.top = pageY - shiftY + 'px';
      }

      function onMouseMove(event) {
        moveAt(event.pageX, event.pageY);
      }

      document.addEventListener('mousemove', onMouseMove);

      g.onmouseup = (e) => {
        document.removeEventListener('mousemove', onMouseMove);
        g.style.display = 'none';
        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
        g.style.display = 'block';
        if (elemBelow.tagName === 'WORKING-AREA') {
          elemBelow.shadowRoot.appendChild(g);
          console.log(g.style.top)
          g.style.top = g.style.top.split('px')[0] * (elemBelow.clientHeight / window.innerHeight) + 'px'
          console.log(g.style.top)
        }
        g.onmouseup = null;
      };
    });
    this.bufferZone.addPolygon(g);
  }

  savePolygons() {
    console.log("Save polygons");
  }

  resetPolygons() {
    this.bufferZone.clearPolygons();
    this.workingArea.clearPolygons();
  }
}

customElements.define('app-container', AppContainer);

class BufferZone extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 10px;
          background-color: #444;
          height: 50%;
          position: relative;
          z-index: 1;
          border: 1px solid #ccc;
        }
        .container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      </style>
      <div class="container"></div>
    `;
    this.container = this.shadowRoot.querySelector('.container');
  }

  addPolygon(polygon) {
    this.container.appendChild(polygon);
  }

  clearPolygons() {
    this.container.innerHTML = '';
  }
}

customElements.define('buffer-zone', BufferZone);

class WorkingArea extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          display: block;
          overflow: hidden;
          height: 50%;
          position: relative;
          z-index: -1;
          background-color: #444;
        }
        .working-area {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
        }
      </style>
      <svg xmlns="http://www.w3.org/2000/svg" class="working-area">
        <defs>
          <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#6a6969" stroke-width="0.5"/>
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#6a6969" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    `;
    this.scale = 4;
    this.style.transform = `scale(${this.scale})`;
    let workingArea = this.shadowRoot.querySelector('svg');
    console.log(
      window.getComputedStyle(workingArea).left, window.getComputedStyle(workingArea).top,
      workingArea.clientWidth, workingArea.clientHeight,
      window.innerWidth, window.innerHeight
      );

    let prevX = 0
    let prevY = 0

    this.initZoom();

    this.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'svg') return
      prevX = e.target.offsetX;
      prevY = e.target.offsetY;

      function onMouseMove(event) {
        const style = window.getComputedStyle(workingArea).transform.split(',')
        const [x, y] = [parseInt(style[4]), parseInt(style[5].split(')')[0])]

        workingArea.style.transform = `translate(
          ${x + event.pageX - prevX + 'px'},
          ${y + event.pageY - prevY + 'px'})
        `;

        prevX = event.pageX;
        prevY = event.pageY;
      }
      document.addEventListener('mousemove', onMouseMove);

      workingArea.onmouseup = () => {
        document.removeEventListener('mousemove', onMouseMove);
        workingArea.onmouseup = null;
      };
    });
  }

  initZoom() {
    this.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale *= zoomFactor;
      if(this.scale <= 1) this.scale = 1;
      if(this.scale >= 10) this.scale = 10;
      this.style.transform = `scale(${this.scale})`;
    });
  }

  clearPolygons() {
    this.content.innerHTML = '';
  }
}

customElements.define('working-area', WorkingArea);
