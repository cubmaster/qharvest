import { Component, HostListener, OnInit } from '@angular/core';
import { Jupyter, JupyterNotebook,cell } from '../services/jupyter';
import * as notebook from "../../assets/notebook.json";
import { Edge, Node, Layout } from '@swimlane/ngx-graph';
import { DagreLayout } from '@swimlane/ngx-graph';



class port {
  id: string =""
  label: string =""
  type: string =""
  options!: options
  position:position
}


class options {
  constructor(public color:string="red"){
  
  }

}



class superNode implements Node {

  ports:port[]=[]
  id:string=""
  label:string=""
  type:string=""
  options!:options
  dimension!:size
  position!:position
}
class size{
  constructor(public width:number=50,public height:number=50){}
}
class position{
  constructor(public x:number=0,public y:number=0){}
}
@Component({
  selector: 'app-workflow',
  templateUrl: './workflow.component.html',
  styleUrls: ['./workflow.component.scss']
})
export class WorkflowComponent implements OnInit {

  public connection_status: string = 'Closed'
  public session_status: string = 'Please Wait...'
  private init: boolean = true;
  public jupFile: JupyterNotebook = new JupyterNotebook();

  nodes: superNode[] = 
  [
    {
      id: 'source',
      label: 'Source Node',
      type: 'source',
      options: new options(),
      dimension: new size(),
      position: new position(),
      ports: [
        {
          id: 'port1',
          label: 'Output Port 1',
          type: 'output',
          options:new options(),
          position: new position()
        },
        {
          id: 'port2',
          label: 'Output Port 2',
          type: 'output',
          options: new options(),
          position: new position()
        }
      ]
    },
    {
      id: 'target',
      label: 'Target Node',
      type: 'target',
      options: new options("blue"),
      dimension: new size(),
      position: new position(),
      ports: [
        {
          id: 'port1',
          label: 'Input Port 1',
          type: 'input',
          options:new options(),
          position: new position()
        },
        {
          id: 'port2',
          label: 'Input Port 2',
          type: 'input',
          options:new options(),
          position: new position()
        }
      ]
    }
  ];

  public edges: Edge[] = [];

  public layout: Layout = new DagreLayout();

  constructor(public jup: Jupyter) {

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

    //workflow
  }

  Init() {
    if (this.init) {
      this.init = false;

      this.jupFile.cells.forEach((cell: cell) => {
        if (!!cell.metadata.ui && cell.metadata.ui == "functions") {
          this.jup.run(cell.source.join("\n"))

        }
      })
    }
  }

  onEdgeStart(event:any) {
    console.log('Edge start:', event);
  }

  onEdgeEnd(event:any) {
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
}


