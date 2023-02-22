import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CellPropertiesComponent} from './cell-properties.component';

describe('CellPropertiesComponent', () => {
  let component: CellPropertiesComponent;
  let fixture: ComponentFixture<CellPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CellPropertiesComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CellPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
