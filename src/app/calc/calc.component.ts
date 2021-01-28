import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';

import * as dayjs from 'dayjs'
import 'dayjs/locale/pt-br'
import toastr from 'toastr'

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

  unixMinutes;

  isInvalid = false;
  isSame = false;

  calculatedValues;

  form: FormGroup;

  result = false
  same = false

  mask = {
    mask: Number
  }

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.getLocals()
    this.buildForm()
    this.estimateResin()
  }

  checkValues() {
    const current = parseInt(this.form.value.currentResin)
    const expected = parseInt(this.form.value.expectedResin)

    if (current < 0 || expected < 0) {
      this.setInvalid()
    } else if (current > expected) {
      this.setInvalid()
    } else if (current == expected) {
      this.setSame()
    } else {
      this.calcResin()
    }

    this.currentLocalMinutes = localStorage.getItem('currentLocalMinutes')
    this.currentLocalHours = localStorage.getItem('currentLocalHours')
    this.currentLocalData = localStorage.getItem('currentLocalData')
    this.estimateResin()
  }

  calcResin() {
    const equivalentMinutes = ((parseInt(this.form.value.currentResin) - parseInt(this.form.value.expectedResin)) * 8) * -1
    const equivalentHours = (equivalentMinutes / 60).toFixed(2)
    const today = new Date();

    const estimatedCharge = dayjs(today).add(equivalentMinutes, 'm').toDate();
    const equivalentData = dayjs(estimatedCharge).locale('pt-br').format("dddd, HH:mm")

    const now = dayjs()
    const fromTime = now.format("HH:mm")
    localStorage.setItem('fromTime', fromTime)
    const currentResin = parseInt(this.form.value.currentResin)

    localStorage.setItem('currentResin', currentResin.toString())

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

  }

  setInvalid() {
    toastr.error('Valores incorretos!', 'Erro!')
    this.isInvalid = true
    setTimeout(() => {
      this.isInvalid = false
    }, 750);
  }

  setSame() {
    toastr.info('Resina carregada!', 'Atenção')
    this.isSame = true
    setTimeout(() => {
      this.isSame = false
    }, 750);
  }

  getLocals() {
    this.currentLocalMinutes = localStorage.getItem('currentLocalMinutes')
    this.currentLocalHours = localStorage.getItem('currentLocalHours')
    this.currentLocalData = localStorage.getItem('currentLocalData')
  }

  buildForm() {
    this.form = this.fb.group({
      currentResin: [null, [Validators.required]],
      expectedResin: [null, [Validators.required]]
    });
  }

  estimateResin() {
    const now = dayjs()
    const nowF = now.format("HH:mm")
    const fromTime = localStorage.getItem('fromTime')

    const currentResin = parseInt(localStorage.getItem('currentResin'))

    if (!isNaN(currentResin)) {
      const calculatedTime = this.getIntervalF(fromTime, nowF)

      const values = calculatedTime.split(':')

      const estimatedResin = Math.trunc((parseInt(values[0]) * 60 + parseInt(values[1])) / 8) + currentResin

      localStorage.setItem('estimatedResin', estimatedResin.toString())
      this.calculatedValues = parseInt(localStorage.getItem('estimatedResin')) >= 160 ? 160 : localStorage.getItem('estimatedResin')
    }

  }

  formatIntervalF(minutes) {
    let interval = [Math.floor(minutes / 60).toString(), (minutes % 60).toString()];
    return interval[0].padStart(2, '0') + ':' + interval[1].padStart(2, '0')
  }

  getIntervalF(from, to) {
    let [hoursA, minutesA] = from?.split(':');
    let [hoursB, minutesB] = to?.split(':');
    let timeA = dayjs().hour(hoursA).minute(minutesA);
    let timeB = dayjs().hour(hoursB).minute(minutesB);
    let interval = timeB.diff(timeA, 'minute');
    if (interval < 0) {
      return this.formatIntervalF(24 * 60 + timeB.diff(timeA, 'minute'));
    }
    return this.formatIntervalF(interval);
  }

}
