import {Component, Input} from '@angular/core';
import {cell} from "../services/jupyter";


@Component({
  selector: 'app-cell-properties',
  templateUrl: './cell-properties.component.html',
  styleUrls: ['./cell-properties.component.scss']
})
export class CellPropertiesComponent {
  @Input() cell: cell;


}
