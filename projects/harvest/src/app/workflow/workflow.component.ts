import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {cell, cellMetaData, Jupyter, JupyterNotebook} from '../services/jupyter';
import * as notebook from "../../assets/notebook.json";
import {DagreLayout, Edge, GraphComponent, Layout, Node} from '@swimlane/ngx-graph';

import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {v4 as uuidv4} from 'uuid';
import {fromEvent, map, takeUntil} from "rxjs";
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
      cell.metadata.inputMap = new Map(Object.entries(cell.metadata.inputs ?? []));
      cell.metadata.resultMap = new Map(Object.entries(cell.metadata.results ?? []));
      if (cell.metadata.type !== 'Initialize' && cell.metadata.type !== 'function') {
        let n = new superNode();
        // @ts-ignore
        n.id = cell.id;
        n.dimension = {width: 50, height: 50}
        n.label = cell.id
        // @ts-ignore
        n.icon = cell.metadata.icon;

        cell.metadata.resultMap.forEach((value, key) => {
          // @ts-ignore
          let p: port = new port(portType.output, n);
          p.label = key;
          p.value = value;
          // @ts-ignore
          n.ports = [...n.ports, p]

        })
        cell.metadata.inputMap.forEach((value, key) => {
          // @ts-ignore
          let p: port = new port(portType.input, n);
          p.label = key;
          p.value = value;
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

    const Meta: cellMetaData = new cellMetaData(cell.metadata.ui,
      cell.metadata.inputs,
      cell.metadata.results,
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
    target.source = this.makeCode(target)
    this.jupFile.cells.push(target);
    //refresh the map
    this.refreshNodes()

  }

  onEdgeEnd(event: any) {
    console.log('Edge end:', event);
    const sourceNode = this.nodes.find(n => n.id === event.source);
    const targetNode = this.nodes.find(n => n.id === event.target);
    // @ts-ignore
    const sourcePort = sourceNode.ports.find(p => p.id === event.sourcePort);
    // @ts-ignore
    const targetPort = targetNode.ports.find(p => p.id === event.targetPort);
    const newEdge: Edge = <Edge>{
      id: uuidv4(),
      source: event.source,
      target: event.target,
      label: `${sourcePort.label} -> ${targetPort.label}`
    };
    this.edges = [...this.edges, newEdge];
  }


  onEdgeStart(event: any) {
    console.log('Edge start:', event);
  }

  onPortMouseDown(event: MouseEvent, node: Node, port: port) {

    // Prevent the default mouse event behavior
    event.preventDefault();

    // Get the coordinates of the mouse click
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    console.log({mouseX, mouseY})
    // Create a new edge from the clicked port
    const newEdge = {
      id: uuidv4(),
      source: {
        id: node.id,
        port: port.id
      },
      target: {
        x: mouseX,
        y: mouseY
      }
    };


    // Update the edges array to include the new edge
    // @ts-ignore
    //this.edges = [...this.edges??[], newEdge];
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

  onPortMouseDown_x(event: MouseEvent, node: Node, port: port) {

    // Prevent the default mouse event behavior
    event.preventDefault();

    // Get the coordinates of the mouse click
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Create a new edge from the clicked port
    const newEdge = {
      id: uuidv4(),
      source: {
        id: node.id,
        port: port.id
      },
      target: {
        x: mouseX,
        y: mouseY
      }
    };


    // Update the edges array to include the new edge
    // @ts-ignore
    this.edges = [...this.edges ?? [], newEdge];


    // Subscribe to mousemove events until the user releases the mouse button
    const mouseMove$ = fromEvent(document, 'mousemove').pipe(
      map((moveEvent: MouseEvent) => {
        return {
          x: moveEvent.clientX,
          y: moveEvent.clientY
        };
      }),
      takeUntil(fromEvent(document, 'mouseup'))
    );

    // Subscribe to the mousemove stream and update the target coordinates of the new edge
    mouseMove$.subscribe(({x, y}) => {
      // @ts-ignore
      this.edges = this.edges.map<superEdge>((edge) => {
        if (edge.id === newEdge.id) {
          return {
            ...edge,
            target: {x, y}
          };
        }
        return edge;
      });
    });
  }

  private makeCode(cell: cell): string[] {

    let code: string[] = []
    cell.source = [];


    const results = Object.getOwnPropertyNames(cell.metadata.results);
    const params = Object.getOwnPropertyNames(cell.metadata.inputs);

    results.forEach((result, ix) => {
      results[ix] = `${cell.id}_${result}`
    })

    code.push(`${results}=${cell.metadata.name}(${params})`)


    return code;
  }

}


