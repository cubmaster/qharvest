import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {cell, cellMetaData, cellVariable, Jupyter, JupyterNotebook} from '../services/jupyter';
import * as notebook from "../../assets/notebook.json";
import {DagreLayout, Edge, GraphComponent, Layout} from '@swimlane/ngx-graph';

import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {v4 as uuidv4} from 'uuid';
import {port, portType, superNode} from "../services/graph.service";
import {ModalComponent} from "../modal/modal.component";


@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {
  @ViewChild('cellModal') cellModal: ModalComponent;
  @ViewChild(GraphComponent) graphComponent: GraphComponent;

  selectedCell: cell = new cell();
  showFile: string = ""
  public connection_status: string = 'Closed'
  public session_status: string = 'Please Wait...'
  private init: boolean = true;
  public jupFile: JupyterNotebook = new JupyterNotebook();
  nodes: superNode[] = []
  links: Edge[] = [];
  functions: cell[] = []

  jupFileText: string = "";
  public layout: Layout = new DagreLayout();
  private sourcePort: port;
  private isDragging: boolean = false;

  private sourceEdge: Edge;

  constructor(public jup: Jupyter, private sanitizer: DomSanitizer) {


  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler() {
    this.killConnection();
  }


  async ngOnDestroy() {
    this.killConnection()
  }

  private killConnection() {
    this.jup.deleteSession().then(() => {

    });
    this.jup.disconnect().then(() => {
    });

  }

  async ngOnInit() {

    // @ts-ignore
    this.jupFile = notebook.default;

    await this.jup.connect();
    this.jup.$connectionstatus.subscribe((val) => {
      this.connection_status = val;
    })
    this.jup.$status.subscribe((val) => {
      this.session_status = val.content.execution_state;
    })

    this.jup.$initalize.subscribe((value: boolean) => {
      if (value) {
        this.Init()
      }
    })
    this.prepFunctions();
    this.refreshNodes();


    //workflow
  }

  nodeClick(node: superNode) {
    this.selectedCell = this.jupFile.cells.find(cell => cell.id == node.id)

    this.cellModal.open();

  }

  prepFunctions() {
    this.jupFile.cells.forEach((cell) => {
      if (cell.metadata.type == "function") {
        this.functions.push(cell);
      }
    })
  }

  refreshNodes() {

    this.nodes = [];

    this.jupFile.cells.forEach((cell) => {

      if (cell.metadata.type !== 'Initialize' && cell.metadata.type !== 'function') {
        let n = new superNode();
        // @ts-ignore
        n.id = cell.id;
        n.dimension = {width: 50, height: 50}
        n.label = cell.id
        // @ts-ignore
        n.icon = cell.metadata.icon;

        cell.metadata.results?.forEach((value, key) => {
          // @ts-ignore
          let p: port = new port(portType.output, n);
          p.label = value.key;
          p.value = value.value;
          p.type = portType.output;
          // @ts-ignore
          n.ports = [...n.ports, p]

        })
        cell.metadata.inputs?.forEach((value, ix) => {
          // @ts-ignore
          let p: port = new port(portType.input, n);
          p.label = value.key;
          p.value = value.value;
          p.type = portType.input;
          // @ts-ignore
          n.ports = [...n.ports, p]

        })
        // @ts-ignore
        this.nodes = [...this.nodes ?? [], n]
      }

    })
    this.graphComponent.createGraph();
  }
  Init() {
    if (this.init) {
      this.init = false;

      this.jupFile.cells.forEach((cell: cell) => {
        if (!!cell.metadata.ui && (cell.metadata.type == "initialize" || cell.metadata.type == "function")) {
          this.jup.run(cell.source.join("\n"))

        }
      })

    }
  }

  addCell(cell: cell) {

    // @ts-ignore

    const resultCopy: cellVariable[] = cell.metadata.results.map<cellVariable[]>((result) => {
      result.resultId = uuidv4();
      return result;
    })


    const Meta: cellMetaData = new cellMetaData(cell.metadata.ui,
      cell.metadata.inputs,
      resultCopy,
      cell.metadata.name,
      cell.metadata.icon,
      "cell");
    let target: cell = {
      cell_type: "code",
      execution_count: 0,
      id: cell.metadata.ui + (this.jupFile.cells.length + 1),
      source: [],
      metadata: Meta,
      outputs: [],


    }
    /// target.source = this.jup.makeCode(target)
    this.jupFile.cells.push(target);
    //refresh the map
    this.refreshNodes()

  }


  showNotebook() {

    this.jupFileText = JSON.stringify(this.jupFile, null, 4);
    if (this.showFile == "")
      this.showFile = "show"
    else
      this.showFile = ""
  }

  bootstrapIcon(name: string): SafeHtml {
    const svg = `<svg viewBox="0 0 16 16" class="bi bi-${name}" fill="currentColor">
      <use xlink:href="assets/bootstrap-icons.svg#${name}"/>
    </svg>`;

    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }


  portDrag($event: any) {
    this.isDragging = true;
    $event.preventDefault();
    $event.stopPropagation();


  }

  portDragStart($event: any, port: port) {

  }

  portDragEnd($event: any, target: port) {
    this.isDragging = false;
  }

  portDragOver($event: any, port: port) {
    $event.preventDefault();
  }

  portMouseDown($event: any, port: port) {
    this.sourcePort = port;
    this.isDragging = true;
    $event.preventDefault();
    $event.stopPropagation();
    //$event.dataTransfer.setData('sourceNodeId', port.id);


  }

  portDrop($event: any, target: port) {
    if (this.sourcePort && target && this.isDragging) {
      this.links.push({
        id: `link_${this.sourcePort.id}_${target.id}`,
        source: this.sourcePort.id,
        target: target.id,

      });
      this.isDragging = false;
    }
  }

  portMouseMove($event: any) {
    if (this.isDragging) {
      let position = {x: $event.clientX, y: $event.clientY}
      console.log(position)
    }
  }

  portMouseUp($event: any, target: port) {
    if (this.sourcePort && target && this.isDragging) {
      this.links.push({
        id: `link_${this.sourcePort.id}_${target.id}`,
        source: this.sourcePort.id,
        target: target.id,

      });
      this.isDragging = false;
    }
  }
}


