import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Reservering } from '../../../../models/domain/reservering.model';
import { PocketbaseService } from '../../../../shared/services/pocketbase.service';
import { ErrorService } from '../../../../shared/services/error.service';
import { DateTimeService } from '../../../../shared/services/datetime.service';
import { SeoService } from '../../../../shared/services/seo.service';
import { ReserverenComponent } from './reserveren.component';

describe('ReserverenComponent', () => {
  let component: ReserverenComponent;
  let fixture: ComponentFixture<ReserverenComponent>;
  let clientCreateSpy: jasmine.Spy;
  let routerNavigateSpy: jasmine.Spy;
  let originalFetch: typeof fetch;

  beforeEach(async () => {
    clientCreateSpy = jasmine
      .createSpy('create')
      .and.returnValue(Promise.resolve({ id: 'fake-reservering-id' } as Reservering));
    const clientMock = {
      create: clientCreateSpy,
      getOne: jasmine.createSpy('getOne').and.returnValue(
        Promise.resolve({
          id: 'v1',
          titel: 'Test',
          datum_tijd_1: '2026-12-01T19:00:00.000Z',
          datum_tijd_2: null,
          groep: 'g1',
        })
      ),
      environment: { pocketbase: { baseUrl: 'https://test.example.com' } },
    };

    routerNavigateSpy = jasmine.createSpy('navigate');

    const dateTimeServiceMock = jasmine.createSpyObj<DateTimeService>('DateTimeService', ['isPastHoursBefore', 'toAmsterdamTime']);
    dateTimeServiceMock.isPastHoursBefore.and.returnValue(false);
    dateTimeServiceMock.toAmsterdamTime.and.returnValue({ toJSDate: () => new Date('2026-12-01T20:00:00') } as any);

    originalFetch = globalThis.fetch;
    globalThis.fetch = jasmine.createSpy('fetch').and.returnValue(
      Promise.resolve({ ok: true, json: () => Promise.resolve({ datum_tijd_1_total: 0, datum_tijd_2_total: 0 }) } as Response)
    );

    await TestBed.configureTestingModule({
      imports: [ReserverenComponent],
      providers: [
        { provide: PocketbaseService, useValue: clientMock },
        { provide: Router, useValue: { navigate: routerNavigateSpy } },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
        { provide: SeoService, useValue: jasmine.createSpyObj('SeoService', ['update', 'updateOpenGraphTags', 'updateStructuredDataForEvent']) },
        { provide: ErrorService, useValue: jasmine.createSpyObj('ErrorService', ['getErrorMessage']) },
        { provide: DateTimeService, useValue: dateTimeServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReserverenComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call create when form is invalid (no voorstellingId)', async () => {
    component.reserveringModel.set({
      name: 'Jan',
      surname: 'Jansen',
      email: 'jan@example.com',
      email2: 'jan@example.com',
      vriendVanTovedem: false,
      lidVanTovedemMejotos: false,
      opmerking: '',
      amountOfPeopleDate1: 1,
      amountOfPeopleDate2: 0,
    });
    (component as any).voorstellingId = null;
    await component.saveReservering();
    expect(clientCreateSpy).not.toHaveBeenCalled();
  });

  it('should call create with reserveringen and payload on valid submit (no real reservation)', async () => {
    (component as any).voorstellingId = 'voorstelling-123';
    component.datum1Str = '2026-12-01T19:00:00.000Z';
    component.datum2Str = null;
    component.totalPeopleDate1.set(0);
    component.totalPeopleDate2.set(0);
    component.reserveringModel.set({
      name: 'Jan',
      surname: 'Jansen',
      email: 'jan@example.com',
      email2: 'jan@example.com',
      vriendVanTovedem: false,
      lidVanTovedemMejotos: false,
      opmerking: 'Test opmerking',
      amountOfPeopleDate1: 1,
      amountOfPeopleDate2: 0,
    });

    await component.saveReservering();

    expect(clientCreateSpy).toHaveBeenCalledWith('reserveringen', jasmine.objectContaining({
      voornaam: 'Jan',
      achternaam: 'Jansen',
      email: 'jan@example.com',
      voorstelling: 'voorstelling-123',
      datum_tijd_1_aantal: 1,
      datum_tijd_2_aantal: 0,
    }));
    expect(clientCreateSpy).toHaveBeenCalledTimes(1);
  });

  it('should navigate to reservering-geslaagd after successful create', async () => {
    (component as any).voorstellingId = 'voorstelling-123';
    component.datum1Str = '2026-12-01T19:00:00.000Z';
    component.datum2Str = null;
    component.totalPeopleDate1.set(0);
    component.totalPeopleDate2.set(0);
    component.reserveringModel.set({
      name: 'Jan',
      surname: 'Jansen',
      email: 'jan@example.com',
      email2: 'jan@example.com',
      vriendVanTovedem: false,
      lidVanTovedemMejotos: false,
      opmerking: '',
      amountOfPeopleDate1: 1,
      amountOfPeopleDate2: 0,
    });
    clientCreateSpy.and.returnValue(
      Promise.resolve({ id: 'new-res-id' } as Reservering)
    );

    await component.saveReservering();

    expect(routerNavigateSpy).toHaveBeenCalledWith(
      ['/reservering-geslaagd'],
      jasmine.objectContaining({
        queryParams: { voorstellingId: 'voorstelling-123', reserveringId: 'new-res-id' },
      })
    );
  });
});
