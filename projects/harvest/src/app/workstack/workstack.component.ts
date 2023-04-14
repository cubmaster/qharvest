import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {cell, Jupyter, JupyterNotebook} from "../services/jupyter";
import {DomSanitizer} from "@angular/platform-browser";
import * as notebook from "../../assets/notebook.json";

@Component({
  selector: 'app-workstack',
  templateUrl: './workstack.component.html',
  styleUrls: ['./workstack.component.scss']
})
export class WorkstackComponent implements OnInit, OnDestroy {
  public connection_status: string = 'Closed'
  public session_status: string = 'Please Wait...'
  jupFileText: string = "";
  showFile: string = ""
  functions: cell[] = []
  public jupFile: JupyterNotebook = new JupyterNotebook();
  private init: boolean = true;

  constructor(public jup: Jupyter, private sanitizer: DomSanitizer) {

    jup.$error.subscribe(Message => {
      console.error(Message);
      alert(Message.content.evalue)
    })

  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler() {
    this.killConnection();
  }


  async ngOnDestroy() {
    this.killConnection()
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

  }

  prepFunctions() {
    this.jupFile.cells.forEach((cell) => {
      if (cell.metadata.type == "function") {
        this.functions.push(cell);
      }
    })
  }

  Init() {
    if (this.init) {
      this.init = false;

      this.jupFile.cells.forEach((cell: cell) => {
        if (cell.metadata.type == "initialize" || cell.metadata.type == "function") {
          this.jup.run(cell.source.join("\n"))

        }
      })

    }
  }

  showNotebook() {

    this.jupFileText = JSON.stringify(this.jupFile, null, 4);
    if (this.showFile == "")
      this.showFile = "show"
    else
      this.showFile = ""
  }

  addCell(cell: cell) {
    //create a copy of the cell template

    let target: cell = JSON.parse(JSON.stringify(cell));
    target.cell_type = "code";
    target.id = cell.metadata.ui + (this.jupFile.cells.length + 1);
    target.metadata.type = "cell";
    //add it to the jupyter file cells
    this.jupFile.cells.push(target);

  }

  private killConnection() {
    this.jup.deleteSession().then(() => {
      console.log('delete')
    });
    this.jup.disconnect().then(() => {
      console.log('disconnect')
    });

  }


}
