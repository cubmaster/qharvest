import {environment} from '../../environments/environment';

import {BehaviorSubject, Subject} from "rxjs";

import {Injectable} from '@angular/core';
import {v4 as uuidv4} from 'uuid';
import {Websocket, WebsocketBuilder, WebsocketEvents} from 'websocket-ts';

export class Kernel{
  id:string=""
  name:string="python3"
}


export class Header {
  msg_id: string = ""
  msg_type: string = ""
  channel: string = ""
  session: string = ""

  constructor() {
  }

}

export class cellMetaData {
  inputMap: Map<string, any>
  resultMap: Map<string, any>

  constructor(public ui: string = "",
              public inputs: object = {},
              public results: object = {},
              public name: string = "",
              public icon: string = "",
              public type: string = "") {

  }

}

export class cell {
  source: string[] = [];
  outputs: any[] = [];
  metadata: cellMetaData = new cellMetaData()
  cell_type: string = "";
  execution_count: number = 0;
  id: string = "";

  constructor() {


  }
}

export class JupyterNotebook {
  cells: cell[] = [];
}

export class output{
  output_type:string=""
  data:object ={}
  metadata:object={}
}

export class kernel_status {
  text:string=""
  execution_state:string =""
  evalue:string = ""
}
 export    class Message{
       channel: string="";
       header: Header = new Header();
       parent_header: Header = new Header();
       metadata: object={}
       content: any;
       buffers: object[]=[]
     }

export class execute_request{

'code' : string =''

'silent' : boolean = false;

'store_history' :  boolean = false;

'user_expressions' : any[]=[];

'allow_stdin' : boolean = false;


'stop_on_error' : boolean = true;
}
export class outputData{
  name:string="";
  data:object={};
}

@Injectable()
export class Jupyter {
  panelData: Map<string, object> = new Map<string, object>()

  panelDataChange: Subject<string> = new Subject();//this should really be on another service
   status: Subject<Message> = new Subject();
   stream: Subject<Message> = new Subject();
   error: Subject<Message> = new Subject();
   input: Subject<Message> = new Subject();
   result: Subject <Message> = new Subject();

  private initalize: BehaviorSubject <boolean> = new BehaviorSubject(false);
  private connectionstatus: BehaviorSubject<string> = new BehaviorSubject<string>("");
  $status = this.status.asObservable();
  $stream= this.stream.asObservable();
  $error= this.error.asObservable();
  $input= this.input.asObservable();
  $result= this.result.asObservable();
  $initalize= this.initalize.asObservable();

  $connectionstatus = this.connectionstatus.asObservable();
  private init:boolean = false;
  session: string =  uuidv4();
  kernel:any;

  ws:Websocket|undefined;

  constructor() {
    this.ws = undefined;
  }
  async deleteSession(){
    await this.delete<void>(environment.gatewayUrl + 'api/sessions/' + this.session)
  }
  async disconnect(){
   await this.delete<Kernel>(environment.gatewayUrl + 'api/kernels/' + this.kernel.id)
  }
  async connect(){
    let k = new Kernel();
    k.name="python_kubernetes"

    this.kernel = await this.post<Kernel>(k,environment.gatewayUrl + 'api/kernels')

    this.ws = new WebsocketBuilder(environment.gatewayWsUrl +'api/kernels/' + this.kernel.id + '/channels').build();
    this.ws.addEventListener(WebsocketEvents.open, (sub,event )=>{
      this.connectionstatus.next("Open");
      let msg = new Message()

      msg.channel="iopub";
      msg.header.channel="shell";
      msg.header.msg_type= "status";
      msg.header.msg_id = uuidv4()
      console.log("Session init")
      this.ws?.send(JSON.stringify(msg));
      if (!this.init){
        this.init=true;
        this.initalize.next(true)
      }
    })
    this.ws.addEventListener(WebsocketEvents.message, ( ws,msg:any)=>{
       // console.log(msg);
        this.session = msg.data.header?.session ??  "";
        const data:Message = JSON.parse(msg.data)
        console.log(msg);
        switch (data.channel){
          case "iopub": {


            switch (data.header.msg_type) {
              case "stream": {
                this.stream.next(data);
                console.log('stream')
                console.log(data)
                break;
              }
              case "status": {
                this.status.next(data);
                console.log('status')
                console.log(data)
                break;
              }
              case "error": {
                this.error.next(data);
                console.log('error')
                console.error(data)
                break;
              }
              case "execute_reply": {
                this.result.next(data);
                console.log('execute_reply')
                console.log(data)
                break;
              }
              case "execute_result": {
                this.result.next(data);
                console.log('execute_result')
                console.log(data)
                break;
              }
              case "execute_input": {
                this.input.next(data);
                console.log('execute_input')
                console.log(data)

                break;
              }
              break;
            }
            break;
          }
          case "shell":{
            switch (data.header.msg_type) {
              case "execute_reply": {
                this.input.next(msg.content);
                console.log('execute_reply_shell')
                console.log(data)
                break;
              }
            }
            break;
          }


          default:{
            console.error("Unmapped channel");
            console.error(msg);
            break;
          }
        }
    });

  }



  run(code:string,msgid = uuidv4()):string{
        let msg:Message = new Message();
       let exec:execute_request = new execute_request();
       exec.code =code;

       msg.content = exec;
       msg.channel="shell";
       msg.header.channel="shell";
       msg.header.msg_type= "execute_request";
       msg.header.msg_id =msgid;
       msg.header.session = this.session ;

       this.ws?.send(JSON.stringify(msg));

      return msgid;

  }

  async post<T>(body:object,url:string){
//do this to create a kernel on each instance of ui
    let request:RequestInit = {
      body: JSON.stringify(body),
      credentials: 'omit', // include, *same-origin, omit
      method:"POST",
      headers:
        {
          'Accept':'*/*'
        },
    };

    let response =  await fetch(url, request);
    return await response.json();
  }

  async get<T>(url:string)
  {
      let request:RequestInit = {
      credentials: 'omit', // include, *same-origin, omit
      headers:
      {
        'Accept':'*/*'
      },

      };

      let response =  await fetch(url,request);
      return await response.json();
  }
  async delete<T>(url:string)
  {
    let request:RequestInit = {
      method:"DELETE",
      credentials: 'omit', // include, *same-origin, omit
      headers:
        {
          'Accept':'*/*'
        },

    };

    let response =  await fetch(url,request);
    return await response.json();
  }
}
