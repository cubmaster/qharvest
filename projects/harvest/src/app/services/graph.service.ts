import {Injectable} from '@angular/core';
import {Node} from "@swimlane/ngx-graph";

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  constructor() {
  }
}

export enum portType {
  input = 0,
  output = 1
}

export class port {
  id: string = ""
  label: string = ""
  value: any;
  options!: options
  position: position = new position(0, 0);

  constructor(public type: portType, node: superNode) {
    if (type == portType.input) {
      this.position.x = 0
    } else {
      this.position.x = node.dimension.width;
    }
    0
    this.position.y = node.ports.length * 20 ?? 0;
  }
}


export class options {
  constructor(public color: string = "red") {

  }

}


export class superNode implements Node {

  ports: port[] = []
  id: string = ""
  label: string = ""
  icon: string = "bi bi-heart"
  type: string = ""
  options: options = new options()
  dimension: size = new size()
  position: position = new position()
}

export class size {
  constructor(public width: number = 50, public height: number = 50) {
  }
}

export class position {
  constructor(public x: number = 0, public y: number = 0) {
  }
}
