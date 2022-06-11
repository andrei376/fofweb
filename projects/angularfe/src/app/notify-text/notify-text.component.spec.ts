import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotifyTextComponent } from './notify-text.component';

describe('NotifyTextComponent', () => {
  let component: NotifyTextComponent;
  let fixture: ComponentFixture<NotifyTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NotifyTextComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotifyTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
