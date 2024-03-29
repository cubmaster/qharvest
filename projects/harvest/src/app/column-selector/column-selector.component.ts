import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Jupyter, Message} from "../services/jupyter";

@Component({
  selector: 'app-column-selector',
  templateUrl: './column-selector.component.html',
  styleUrls: ['./column-selector.component.scss']
})
export class ColumnSelectorComponent {
  @Input() dataFrameOnly: boolean = false;
  @Input() dataFrames: string[] = [];
  @Output() onSelection: EventEmitter<object> = new EventEmitter<object>();
  result = {
    dataFrame: "",
    column: ""
  }
  columns: string[] = [];

  constructor(private jup: Jupyter) {
  }

  getColumns(event: Event) {

    if (!this.dataFrameOnly) {
      this.jup.run('list(' + event.target["value"] + '.columns)').subscribe((msg: Message) => {
        this.columns = msg.content.data["text/plain"].replaceAll('[', '')
          .replaceAll(']', '')
          .replaceAll("'", '').split(',\n')
      })
    }
    this.result.dataFrame = event.target["value"];
    this.onSelection.emit(this.result);

  }

  setColumn(event: Event) {
    this.result.column = event.target["value"];
    this.onSelection.emit(this.result);
  }
}
