import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WorkflowComponent} from './workflow/workflow.component';
import {WorkstackComponent} from "./workstack/workstack.component";

const routes: Routes = [
  {path: 'workflow', component: WorkflowComponent},
  {path: '', component: WorkstackComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
