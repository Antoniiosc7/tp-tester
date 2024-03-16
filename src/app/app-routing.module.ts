import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { MetricsTesterComponent } from "./pages/metrics-tester/metrics-tester.component";
import { MetricsLoaderComponent } from "./pages/metrics-loader/metrics-loader.component";
import { ExecutorComponent } from "./pages/metrics-loader/executor/executor.component";
import { ViewerComponent } from "./pages/metrics-loader/viewer/viewer.component";
import { TpaManagementComponent } from "./pages/tpa-management/tpa-management.component";
import{ TpaDeleteComponent } from "./pages/tpa-management/tpa-delete/tpa-delete.component";
import { TpaViewComponent } from "./pages/tpa-management/tpa-view/tpa-view.component";
import { TpaEditComponent } from "./pages/tpa-management/tpa-edit/tpa-edit.component";
const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'tpa-management',
    component: TpaManagementComponent
  },
  {
    path: 'tpa-management/delete/:id',
    component: TpaDeleteComponent
  },
  {
    path: 'tpa-management/view/:id',
    component: TpaViewComponent
  },
  {
    path: 'tpa-management/edit/:id',
    component: TpaEditComponent
  },
  {
    path: 'metrics-tester',
    component: MetricsTesterComponent
  },
  {
    path: 'metrics-loader',
    component: MetricsLoaderComponent
  },
  {
    path: 'metrics-loader/executor/:fileName',
    component: ExecutorComponent
  },
  {
    path: 'metrics-loader/viewer/:fileName',
    component: ViewerComponent
  }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
