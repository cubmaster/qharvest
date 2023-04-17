import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {cell, cellVariable, Jupyter, JupyterNotebook} from "../services/jupyter";
import {DomSanitizer} from "@angular/platform-browser";
import {ModalComponent} from "../modal/modal.component";

@Component({
  selector: 'app-cell-properties',
  templateUrl: './cell-properties.component.html',
  styleUrls: ['./cell-properties.component.scss'],
})
export class CellPropertiesComponent implements OnInit, OnChanges {
  @Input() cell: cell;
  @Input() notebook: JupyterNotebook = new JupyterNotebook();
  @Input() index: Number;

  @ViewChild('cellModal') cellModal: ModalComponent;
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
    this.cellModal.open()
    this.viewValue = ""
    this.selectedResult = output;
    if (output.type == 'dataframe') {
      this.jup.run(this.cell.id + '_' + output.key + '.to_html()').subscribe((msg) => {

        const result = msg.content.data["text/plain"]
        this.viewValue = result.replaceAll('\\n', '').replaceAll('\"', '"').replaceAll("'", "");
      })
    } else {
      this.jup.run('print(' + this.cell.id + '_' + output.key + ')').subscribe((msg) => {
        this.viewValue = msg.content.text
      })
    }

    //this.cellModal.show()

  }

  setValue($event: object, input: cellVariable) {
    input.value = JSON.stringify($event)
  }
}
