import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { isNil } from 'lodash';
import { isEmpty } from 'lodash-es';

import { DateTime } from 'luxon';
import toastr from 'toastr';

@Component({
  selector: 'genshin-calc',
  templateUrl: './calc.component.html',
  styleUrls: ['./calc.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate(500, style({ opacity: 1 }))
      ]),
      transition(':leave', [animate(500, style({ opacity: 0 }))])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CalcComponent implements OnInit {
  calculatedResinMinutes!: number;
  calculatedResinHours!: number;
  calculatedResinData!: number;

  currentLocalMinutes!: string;
  currentLocalHours!: string;
  currentLocalData!: string;
  calculatedValues!: number;

  isInvalid = false;
  isSame = false;
  result = false;

  form: FormGroup;

  maxResinValue: number = 160;

  constructor(private _formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this._getLocals();
    this._buildForm();
    this._estimateResin();
  }

  get hasValidCalculatedValues(): boolean {
    const hasData =
      !isNil(this.calculatedValues) && !isEmpty(this.calculatedValues);

    return !!hasData;
  }

  get hasInvalidForm(): boolean {
    return this.form.invalid || this.isInvalid || this.isSame;
  }

  handleCalculateValues() {
    const current = Number(this.form.value.currentResin);
    const expected = Number(this.form.value.expectedResin);

    const hasInvalidValues = current < 0 || current > expected || expected < 0;

    if (hasInvalidValues) {
      this._setInvalid();
    } else if (current === expected) {
      this._setSame();
    } else {
      this._setupCalculateResin();
    }

    this.currentLocalMinutes = localStorage.getItem('currentLocalMinutes');
    this.currentLocalHours = localStorage.getItem('currentLocalHours');
    this.currentLocalData = localStorage.getItem('currentLocalData');

    this._estimateResin();
  }

  private _buildForm() {
    this.form = this._formBuilder.group({
      currentResin: [null, [Validators.required]],
      expectedResin: [null, [Validators.required]]
    });
  }

  private _setupCalculateResin() {
    const resinTimeRecharge = 8;

    const currentResinForm = Number(this.form.value.currentResin);
    const expectedResinForm = Number(this.form.value.expectedResin);

    const equivalentMinutes =
      (currentResinForm - expectedResinForm) * resinTimeRecharge * -1;

    const equivalentHours = (equivalentMinutes / 60).toFixed(2);

    const estimatedResinLoad = DateTime.now().plus({
      minutes: equivalentMinutes
    });

    const [equivalentWeekday, equivalentHoursDay, equivalentMinutesDay] = [
      estimatedResinLoad.weekdayLong,
      estimatedResinLoad.hour,
      estimatedResinLoad.minute
    ];

    const fixedFormatedMinutes =
      equivalentMinutesDay < 10
        ? `0${equivalentMinutesDay}`
        : equivalentMinutesDay;

    const formatedResinLoadDate = `${equivalentWeekday}, ${equivalentHoursDay}:${fixedFormatedMinutes}`;

    const now = DateTime.now();
    const fromTime = now.toFormat('HH:mm');

    localStorage.setItem('fromTime', fromTime);

    const currentResin = Number(this.form.value.currentResin);

    localStorage.setItem('currentResin', currentResin.toString());

    this.calculatedResinMinutes = equivalentMinutes;
    this.calculatedResinHours = Number(equivalentHours);
    this.calculatedResinData = formatedResinLoadDate as any;

    if (this.calculatedResinMinutes > 0) {
      localStorage.setItem(
        'currentLocalMinutes',
        String(this.calculatedResinMinutes)
      );
    }

    if (this.calculatedResinHours > 0) {
      localStorage.setItem(
        'currentLocalHours',
        String(this.calculatedResinHours)
      );

      localStorage.setItem(
        'currentLocalData',
        String(this.calculatedResinData)
      );
    }

    this.result = true;
  }

  private _setInvalid() {
    toastr.error('Valores incorretos!', 'Erro');

    this.isInvalid = true;

    setTimeout(() => {
      this.isInvalid = false;
    }, 750);
  }

  private _setSame() {
    toastr.info('Resina carregada ou valores iguais', 'Atenção');

    this.isSame = true;

    setTimeout(() => {
      this.isSame = false;
    }, 750);
  }

  private _getLocals() {
    this.currentLocalMinutes = localStorage.getItem('currentLocalMinutes');
    this.currentLocalHours = localStorage.getItem('currentLocalHours');
    this.currentLocalData = localStorage.getItem('currentLocalData');
  }

  private _estimateResin() {
    const hours = 60;
    const resinTimeRecharge = 8;

    const currentTime = DateTime.now().toFormat('HH:mm');
    const fromTime = localStorage.getItem('fromTime');

    const currentResin = Number(localStorage.getItem('currentResin'));

    this._getIntervals(fromTime, currentTime);

    if (!isNaN(currentResin)) {
      const calculatedTime = this._getIntervals(fromTime, currentTime);

      const values = calculatedTime.split(':');

      const estimatedResin =
        Math.trunc(
          (Number(values[0]) * hours + Number(values[1])) / resinTimeRecharge
        ) + currentResin;

      localStorage.setItem('estimatedResin', estimatedResin.toString());

      this.calculatedValues =
        Number(localStorage.getItem('estimatedResin')) >= this.maxResinValue
          ? this.maxResinValue
          : Number(localStorage.getItem('estimatedResin'));
    }
  }

  private _setupFormatIntervals(minutes: number) {
    const interval = [
      Math.floor(minutes / 60).toFixed(),
      (minutes % 60).toFixed()
    ];

    const initialInterval = interval[0].padStart(2, '0');
    const endInterval = interval[1].padStart(2, '0');

    return `${initialInterval}:${endInterval}:`;
  }

  private _getIntervals(from: any, to: any) {
    const [hoursFirst, minutesFirst] = from?.split(':');
    const [hoursSecond, minutesSecond] = to?.split(':');

    const startTime = DateTime.fromObject({
      hour: hoursFirst,
      minute: minutesFirst
    });

    const endTime = DateTime.fromObject({
      hour: hoursSecond,
      minute: minutesSecond
    });

    const interval = endTime.diff(startTime, 'minutes').minutes;

    if (interval < 0) {
      return this._setupFormatIntervals(
        24 * 60 + endTime.diff(startTime, 'minute').minutes
      );
    }

    return this._setupFormatIntervals(interval);
  }
}
