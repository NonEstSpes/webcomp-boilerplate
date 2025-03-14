class AppContainer extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
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

    this.createButton = this.shadowRoot.getElementById('createButton');
    this.saveButton = this.shadowRoot.getElementById('saveButton');
    this.resetButton = this.shadowRoot.getElementById('resetButton');
    this.bufferZone = this.shadowRoot.querySelector('buffer-zone');
    this.workingArea = this.shadowRoot.querySelector('working-area');

    this.createButton.addEventListener('click', () => this.createPolygons());
    this.saveButton.addEventListener('click', () => this.savePolygons());
    this.resetButton.addEventListener('click', () => this.resetPolygons());
  }

  createPolygons() {
    const count = Math.floor(Math.random() * 16) + 5;
    let offsetX = 0;// от 5 до 20 полигонов
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('draggable', 'true');
    svg.setAttribute('width', '200px');
    svg.setAttribute('height', '200px');

    for (let i = 0; i < count; i++) {
      const points = [];
      const vertexCount = Math.floor(Math.random() * 5) + 3; // от 3 до 7 вершин
      for (let j = 0; j < vertexCount; j++) {
        const x = Math.random() * 100 + offsetX; // Смещаем полигон по X
        const y = Math.random() * 100;
        points.push(`${x},${y}`);
      }

      const polygon = document.createElementNS(svg.namespaceURI, 'polygon');
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('fill', 'red');

      // Добавляем обработчики Drag & Drop
      polygon.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', e.target.outerHTML);
        setTimeout(() => e.target.remove(), 0);
      });
      svg.appendChild(polygon);
    }
    this.bufferZone.addPolygon(svg);
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
    this.attachShadow({ mode: 'open' });

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 10px;
          background-color: #444;
          height: 50%;
        }
        .container {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
      </style>
      <div class="container"></div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
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
    this.attachShadow({ mode: 'open' });

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          overflow: auto;
          height: 50%;
        }
        svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        #content {
          position: relative;
        }
      </style>
      <svg xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#666" stroke-width="0.5"/>
          </pattern>
          <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#smallGrid)"/>
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#666" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div id="content"></div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.content = this.shadowRoot.querySelector('#content');
    this.scale = 1;

    this.initZoom();
    this.initDrag();
  }

  initZoom() {
    this.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.scale *= zoomFactor;
      this.style.transform = `scale(${this.scale})`;
    });
  }

  initDrag() {
    let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;

    this.addEventListener('mousedown', (e) => {
      if (e.target.tagName !== 'svg') return;
      startX = e.pageX;
      startY = e.pageY;
      scrollLeft = this.scrollLeft;
      scrollTop = this.scrollTop;
    });

    this.addEventListener('mousemove', (e) => {
      if (!startX && !startY) return;
      const dx = e.pageX - startX;
      const dy = e.pageY - startY;
      this.scrollLeft = scrollLeft - dx;
      this.scrollTop = scrollTop - dy;
    });

    this.addEventListener('mouseup', () => {
      startX = startY = 0;
    });

    this.addEventListener('mouseleave', () => {
      startX = startY = 0;
    });
  }

  addPolygon(polygon) {
    this.content.appendChild(polygon);
  }

  clearPolygons() {
    this.content.innerHTML = '';
  }
}

customElements.define('working-area', WorkingArea);

// Обработка Drop событий
document.querySelectorAll('buffer-zone, working-area').forEach((zone) => {
  zone.addEventListener('dragover', (e) => e.preventDefault());
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = data;
    const polygon = tempDiv.querySelector('svg');
    zone.addPolygon(polygon);
  });
});
