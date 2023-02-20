import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {cell, cellMetaData, Jupyter, JupyterNotebook} from '../services/jupyter';
import * as notebook from "../../assets/notebook.json";
import {DagreLayout, Edge, GraphComponent, Layout} from '@swimlane/ngx-graph';
import {port, portType, superNode} from "../services/graph.service";
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {v4 as uuidv4} from 'uuid';


@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {
  @ViewChild(GraphComponent) graph: GraphComponent;

  showFile: string = ""
  public connection_status: string = 'Closed'
  public session_status: string = 'Please Wait...'
  private init: boolean = true;
  public jupFile: JupyterNotebook = new JupyterNotebook();
  nodes: superNode[] = []
  functions: cell[] = []


  public edges: Edge[] = [];
  jupFileText: string = "";
  public layout: Layout = new DagreLayout();

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
    this.jupFile = notebook;

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
        n.id = cell.id;
        n.icon = cell.metadata.icon;
        cell.metadata.resultMap.forEach((value, key) => {
          let p: port = new port(portType.output, n);
          p.label = key;
          p.value = value;
          n.ports = [...n.ports, p]

        })
        cell.metadata.inputMap.forEach((value, key) => {
          let p: port = new port(portType.input, n);
          p.label = key;
          p.value = value;
          n.ports = [...n.ports, p]

        })
        this.nodes = [...this.nodes, n]
      }

    })

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

    const Meta: cellMetaData = new cellMetaData(cell.metadata.ui,
      cell.metadata.inputs,
      cell.metadata.results,
      cell.metadata.name,
      cell.metadata.icon);
    let target: cell = {
      cell_type: "code",
      execution_count: 0,
      id: uuidv4(),
      source: cell.source,
      metadata: Meta,
      outputs: [],

    }

    this.jupFile.cells.push(target);
    //refresh the map
    this.refreshNodes()

  }


  onEdgeStart(event: any) {
    console.log('Edge start:', event);
  }


  onEdgeEnd(event: any) {
    console.log('Edge end:', event);
    const sourceNode = this.nodes.find(n => n.id === event.source);
    const targetNode = this.nodes.find(n => n.id === event.target);
    const sourcePort = sourceNode.ports.find(p => p.id === event.sourcePort);
    const targetPort = targetNode.ports.find(p => p.id === event.targetPort);
    this.edges.push({
      id: `${event.source}-${event.target}`,
      source: event.source,
      target: event.target,
      label: `${sourcePort.label} -> ${targetPort.label}`
    });
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
}


