import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';

import { DigitOnlyModule } from '@uiowa/digit-only';

import { AppComponent } from './app.component';
import { CalcComponent } from './calc/calc.component';

@NgModule({
  declarations: [AppComponent, CalcComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    DigitOnlyModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
