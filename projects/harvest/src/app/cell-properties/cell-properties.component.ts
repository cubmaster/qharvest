import {Component, Input, OnInit} from '@angular/core';
import {cell, Jupyter} from "../services/jupyter";

@Component({
  selector: 'app-cell-properties',
  templateUrl: './cell-properties.component.html',
  styleUrls: ['./cell-properties.component.scss'],
})
export class CellPropertiesComponent implements OnInit {
  @Input() cell: cell;
  // @Input() notebook: JupyterNotebook=new JupyterNotebook();
  inputKeys: string[] = []
  resultKeys: string[] = []
  outputs: string[] = [];
  last_msg: string = ""

  constructor(private jup: Jupyter) {


  }

  ngOnInit() {

  }

//  ngOnChanges(changes: SimpleChanges) {
//     // if (changes["notebook"]){
//     //   this.notebook = Object.assign(changes["notebook"].currentValue)
//     // }
//     // this.outputs= this.jup.listOutPuts(this.notebook);
//  }

  execute() {
    this.jup.executeCell(this.cell);
  }

}
