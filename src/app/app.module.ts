import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgModule } from '@angular/core';

import { IMaskModule } from 'angular-imask';
import { PushNotificationsModule, PushNotificationsService } from 'ng-push';

import { AppComponent } from './app.component';


import { CalcComponent } from './calc/calc.component';

@NgModule({
  declarations: [
    AppComponent,
    CalcComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    IMaskModule,
    // PushNotificationsModule
  ],
  providers: [PushNotificationsService],
  bootstrap: [AppComponent]
})
export class AppModule { }
