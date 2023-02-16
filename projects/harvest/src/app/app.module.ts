import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { Jupyter } from './services/jupyter';
import { WorkflowComponent } from './workflow/workflow.component';

@NgModule({
  declarations: [
    AppComponent,
    WorkflowComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxGraphModule
  ],
  providers: [Jupyter],
  bootstrap: [AppComponent]
})
export class AppModule { }
