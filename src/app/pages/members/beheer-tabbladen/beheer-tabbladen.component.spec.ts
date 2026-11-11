import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import {
  BeheerTabbladenComponent,
  BeheerTabbladenData,
} from './beheer-tabbladen.component';

@Component({ selector: 'app-test-leden', template: '<p class="display-1">Leden</p><p>leden-inhoud</p>' })
class TestLedenComponent {}

@Component({ selector: 'app-test-aanmeldingen', template: '<p>aanmeldingen-inhoud</p>' })
class TestAanmeldingenComponent {}

describe('BeheerTabbladenComponent', () => {
  let fixture: ComponentFixture<BeheerTabbladenComponent>;
  let component: BeheerTabbladenComponent;
  let navigateSpy: jasmine.Spy;
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const data: BeheerTabbladenData = {
    titel: 'Leden',
    tabbladen: [
      { id: 'leden', label: 'Leden', icon: 'groups', laad: () => Promise.resolve(TestLedenComponent) },
      {
        id: 'aanmeldingen',
        label: 'Aanmeldingen',
        icon: 'person_add',
        laad: () => Promise.resolve(TestAanmeldingenComponent),
      },
    ],
  };

  const maak = async (tab: string | null): Promise<void> => {
    queryParams = new BehaviorSubject(convertToParamMap(tab ? { tab } : {}));
    navigateSpy = jasmine.createSpy('navigate');

    await TestBed.configureTestingModule({
      imports: [BeheerTabbladenComponent],
      providers: [
        provideNoopAnimations(),
        { provide: Router, useValue: { navigate: navigateSpy } },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of(data),
            queryParamMap: queryParams.asObservable(),
            snapshot: { data, queryParamMap: queryParams.value },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeheerTabbladenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  it('opent zonder tab-parameter het eerste tabblad en toont de titel één keer', async () => {
    await maak(null);
    const element: HTMLElement = fixture.nativeElement;

    expect(component.geselecteerdeIndex()).toBe(0);
    expect(element.textContent).toContain('leden-inhoud');
    expect(element.querySelector('.beheer-tabblad-inhoud .display-1')).not.toBeNull();
    expect(getComputedStyle(element.querySelector('.beheer-tabblad-inhoud .display-1')!).display).toBe('none');
  });

  it('opent het tabblad uit de URL', async () => {
    await maak('aanmeldingen');

    expect(component.geselecteerdeIndex()).toBe(1);
    expect(component.componenten()['aanmeldingen']).toBe(TestAanmeldingenComponent);
    expect(component.componenten()['leden']).toBeUndefined();
  });

  it('valt terug op het eerste tabblad bij een onbekende tab-parameter', async () => {
    await maak('bestaat-niet');

    expect(component.geselecteerdeIndex()).toBe(0);
  });

  it('zet het gekozen tabblad in de URL (zonder parameter voor het eerste)', async () => {
    await maak(null);

    component.kiesTabblad(1);
    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { tab: 'aanmeldingen' },
      replaceUrl: true,
    }));

    queryParams.next(convertToParamMap({ tab: 'aanmeldingen' }));
    component.kiesTabblad(0);
    expect(navigateSpy).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { tab: null },
    }));
  });
});
