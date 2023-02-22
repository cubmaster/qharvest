import {AfterViewInit, Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective implements AfterViewInit {
  private modalElement: HTMLElement;
  private topStart: number;
  private leftStart: number;
  private isDraggable: boolean;
  private handleElement: HTMLElement;

  constructor(public element: ElementRef) {
  }

  public ngAfterViewInit() {
    let element = this.element.nativeElement;

    //only make the modal header draggable
    this.handleElement = this.element.nativeElement;

    //change cursor on the header
    this.handleElement.style.cursor = 'move';

    //get the modal parent container element: that's the element we're going to move around
    for (let level = 3; level > 0; level--) {
      element = element.parentNode;
    }

    this.modalElement = element;
    this.modalElement.style.position = 'relative';
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(event: MouseEvent) {
    if (event.button === 2 || !this.handleElement) {
      return; // prevents right click drag or initialized handleElement
    }

    if (event.target !== this.handleElement && !this.searchParentNode(<any>event.target, this.handleElement)) {
      return; // prevents dragging of other elements than children of handleElement
    }

    //enable dragging
    this.isDraggable = true;

    //store original position
    this.topStart = event.clientY - Number(this.modalElement.style.top.replace('px', ''));
    this.leftStart = event.clientX - Number(this.modalElement.style.left.replace('px', ''));
    event.preventDefault();
  }

  @HostListener('document:mouseup', ['$event'])
  public onMouseUp(event: MouseEvent) {
    this.isDraggable = false;
  }

  @HostListener('document:mousemove', ['$event'])
  public onMouseMove(event: MouseEvent) {
    if (this.isDraggable) {
      //on moving the mouse, reposition the modal
      this.modalElement.style.top = (event.clientY - this.topStart) + 'px';
      this.modalElement.style.left = (event.clientX - this.leftStart) + 'px';
    }
  }

  @HostListener('document:mouseleave', ['$event'])
  public onMouseLeave(event: MouseEvent) {
    this.isDraggable = false;
  }

  private searchParentNode(element: Node, tag: Node): Node {
    while (element.parentNode) {
      element = element.parentNode;
      if (element === tag) {
        return element;
      }
    }

    return null;
  }

}

