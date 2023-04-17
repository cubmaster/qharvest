import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {cell, cellVariable, Jupyter, JupyterNotebook} from "../services/jupyter";
import {DomSanitizer} from "@angular/platform-browser";

@Component({
  selector: 'app-cell-properties',
  templateUrl: './cell-properties.component.html',
  styleUrls: ['./cell-properties.component.scss'],
})
export class CellPropertiesComponent implements OnInit, OnChanges {
  @Input() cell: cell;
  @Input() notebook: JupyterNotebook = new JupyterNotebook();
  @ViewChild('dataframeview') cellModal: any;

  priorDataFrames: string[] = []
  selectedResult: cellVariable;
  viewValue: any;
  tags: string[] = [];

  constructor(private jup: Jupyter, private sanitizer: DomSanitizer) {
  }

  ngOnInit() {


  }

  ngOnChanges(changes: SimpleChanges) {
    let nb: any = changes["notebook"].currentValue;
    nb.cells.forEach((cell: cell) => {
      if (cell.metadata.type == 'cell') {
        cell.metadata.results.forEach((result: cellVariable) => {
          if (result.type == 'dataframe') {
            this.priorDataFrames.push(cell.id + '_' + result.key)
          }

        })
      }

    })

  }


  execute() {
    this.jup.executeCell(this.cell);
  }


  view(output: cellVariable) {
    this.selectedResult = output;
    if (output.type == 'dataframe') {
      this.jup.runAdHocCode(this.cell.id + '_' + output.key + '.to_html()').subscribe((value) => {
        const val = value['text/plain'].replaceAll('\\n', '').replaceAll('\"', '"').replaceAll("'", "")
        console.log(val);
        this.viewValue = val;
      })
    } else {
      this.viewValue = output.value;
    }

    //this.cellModal.show()

  }

  setValue($event: object, input: cellVariable) {
    input.value = JSON.stringify($event)
  }
}
