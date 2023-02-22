import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgxGraphModule} from '@swimlane/ngx-graph';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {Jupyter} from './services/jupyter';
import {WorkflowComponent} from './workflow/workflow.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {CellPropertiesComponent} from './cell-properties/cell-properties.component';
import {ModalComponent} from './modal/modal.component';


@NgModule({
  declarations: [
    AppComponent,
    WorkflowComponent,
    CellPropertiesComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxGraphModule,
    BrowserAnimationsModule
  ],
  providers: [Jupyter],
  bootstrap: [AppComponent]
})
export class AppModule { }
