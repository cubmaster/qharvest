import {Component, ElementRef, Input, Renderer2, ViewChild} from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  @Input() title: string;
  @Input() icon: string;
  @ViewChild('thisModal') myModal: ElementRef;
  @ViewChild('myBackdrop') myBackdrop: ElementRef;

  constructor(private renderer: Renderer2) {
  }

  open() {
    this.renderer.addClass(this.myModal.nativeElement, 'show');
    this.renderer.setStyle(this.myModal.nativeElement, 'display', 'block');
    this.renderer.setStyle(this.myBackdrop.nativeElement, 'display', 'block');
  }

  close() {
    this.renderer.removeClass(this.myModal.nativeElement, 'show');
    this.renderer.setStyle(this.myModal.nativeElement, 'display', 'none');
    this.renderer.setStyle(this.myBackdrop.nativeElement, 'display', 'none');
  }

}
