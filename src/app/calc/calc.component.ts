import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import * as dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import { PushNotificationsService } from 'ng-push';

@Component({
  selector: 'genshin-calc',
  templateUrl: './calc.component.html',
  styleUrls: ['./calc.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [style({ opacity: 0 }), animate(500, style({ opacity: 1 }))]),
      transition(':leave', [animate(500, style({ opacity: 0 }))])
    ])
  ]
})
export class CalcComponent implements OnInit {

  static isGreater(group: AbstractControl): { [key: string]: boolean } {

    const current = group.get('currentResin');
    const expected = group.get('expectedResin');

    if (!current || !expected) {
      return undefined;
    }

    if (expected.value > 0) {
      if (current.value == expected.value) {
        return { isSame: true };
      }
      if (current.value > expected.value) {
        return { isGreater: true };
      }
    }

    return undefined;

  }

  currentResinText = 'Resina atual'
  expectedResinText = 'Resina esperada'
  btnText = 'Calcular'

  calculatedResinMinutes;
  calculatedResinHours;
  calculatedResinData;

  currentLocalMinutes;
  currentLocalHours;
  currentLocalData;

  form: FormGroup;

  result = false
  same = false

  mask = {
    mask: Number
  }


  constructor(
    private fb: FormBuilder,
    private pushNotify: PushNotificationsService
  ) {
    this.pushNotify.requestPermission();
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      currentResin: [null, [Validators.required]],
      expectedResin: [null, [Validators.required]]
    },
      { validator: CalcComponent.isGreater }
    );

    this.currentLocalMinutes = localStorage.getItem('currentLocalMinutes')
    this.currentLocalHours = localStorage.getItem('currentLocalHours')
    this.currentLocalData = localStorage.getItem('currentLocalData')

  }

  calcResin() {
    const equivalentMinutes = ((parseInt(this.form.value.currentResin) - parseInt(this.form.value.expectedResin)) * 1) * -1
    const equivalentHours = (equivalentMinutes / 60).toFixed(2)
    const today = new Date();

    const estimatedCharge = dayjs(today).add(equivalentMinutes, 'm').toDate();
    const equivalentData = dayjs(estimatedCharge).locale('pt-br').format("dddd, HH:mm")

    this.calculatedResinMinutes = equivalentMinutes
    this.calculatedResinHours = equivalentHours
    this.calculatedResinData = equivalentData

    if (this.calculatedResinMinutes > 0) {
      localStorage.setItem('currentLocalMinutes', this.calculatedResinMinutes)
    }
    if (this.calculatedResinHours > 0) {
      localStorage.setItem('currentLocalHours', this.calculatedResinHours)
      localStorage.setItem('currentLocalData', this.calculatedResinData)
    }


    this.result = true

    if (dayjs().locale('pt-br').format("dddd, HH:mm") >= this.currentLocalData) {
      this.notify()
    }

  }

  notify() {
    const options = {
      body: "Sua resina está totalmente carregada!",
      icon: "assets/icons/paimon-2.png"
    }
    this.pushNotify.create('Genshin Impact', options).subscribe(
      res => console.log(res),
      err => console.log(err)
    );
  }
}
