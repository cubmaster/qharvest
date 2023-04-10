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
//used for both input and output variables for a cell metadata
export class cellVariable {
  constructor(
    public key: string = "",
    public value: string = "",
    public type: string = "",
    public resultId: string = uuidv4()
  ) {
  }
}

export class cellMetaData {

  //per notebook standard this can be whatever we want.  So we can change this per our ui needs
  constructor(public ui: string = "",
              public inputs: cellVariable[] = [],
              public results: cellVariable[] = [],
              public name: string = "",
              public icon: string = "",
              public type: string = "") {
  }

}

//jupyter notebook cell per spec
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

//All websocket messages are in this format
export class Message {
  channel: string = "";
  header: Header = new Header();
  parent_header: Header = new Header();
  metadata: object = {}
  content: any;
  buffers: object[] = []
  msg_type: string;
}

//specific content for the message for requesting code to be executed
export class execute_request {

'code' : string =''

'silent' : boolean = false;

'store_history' :  boolean = false;

'user_expressions' : any[]=[];

'allow_stdin' : boolean = false;


'stop_on_error' : boolean = true;
}


@Injectable()
export class Jupyter {

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
  $result = this.result.asObservable();
  $initalize = this.initalize.asObservable();

  $connectionstatus = this.connectionstatus.asObservable();
  session: string = uuidv4();
  kernel: any;
  ws: Websocket | undefined;
  private init: boolean = false;
  private currentCell!: cell

  constructor() {
    this.ws = undefined;
    //https://jupyter-client.readthedocs.io/en/latest/messaging.html
    //Stream socket hooks execute_reply messages
    this.$stream.subscribe((result: Message) => this.findResults(result))
    //result socket hooks
    this.$result.subscribe((result: Message) => this.findResults(result))
  }

  async deleteSession() {
    await this.delete<void>(environment.gatewayUrl + 'api/sessions/' + this.session)
  }

  async disconnect() {
   await this.delete<Kernel>(environment.gatewayUrl + 'api/kernels/' + this.kernel.id)
  }
  async connect() {
    let k = new Kernel();
    k.name = "python_kubernetes"     //controls the type of kernel. There is an api to get a list of what is available
    //starts a new kernel
    this.kernel = await this.post<Kernel>(k, environment.gatewayUrl + 'api/kernels')
    //connects to the kernel we just started
    this.ws = new WebsocketBuilder(environment.gatewayWsUrl + 'api/kernels/' + this.kernel.id + '/channels').build();
    this.ws.addEventListener(WebsocketEvents.open, (sub, event) => {
      this.connectionstatus.next("Open");
      let msg = new Message()
      //ask kernel for status of the kernel after its opened
      msg.channel = "iopub";
      msg.header.channel = "shell";
      msg.header.msg_type = "status";
      msg.header.msg_id = uuidv4()

      this.ws?.send(JSON.stringify(msg));
      if (!this.init){
        this.init=true;
        this.initalize.next(true)
      }
    })
    //handles all websocket messages from the kernel
    this.ws.addEventListener(WebsocketEvents.message, ( ws,msg:any)=> {

      this.session = msg.data.header?.session ?? "";
      const data: Message = JSON.parse(msg.data)
      console.debug(data.channel + '==>' + data.msg_type)
      console.debug(data)
      //hooks iopub and shell messages and by message typ send to the right observable
      switch (data.channel) {
        case "iopub": {
          //there are more events in iopub this doesn't handle
          //https://jupyter-client.readthedocs.io/en/latest/messaging.html#messages-on-the-iopub-pub-sub-channel
          switch (data.header.msg_type) {
            case "stream": {
              this.stream.next(data);
              break;
            }
            case "status": {
              this.status.next(data);
              break;
            }
            case "error": {
              this.error.next(data);
              break;
            }
            case "execute_reply": {
              this.result.next(data);
              break;
            }
            case "execute_result": {
              this.result.next(data);
              break;
            }
            case "execute_input": {
              this.input.next(data);
              break;
            }

          }
            break;
          }
          case "shell":{
            switch (data.header.msg_type) {
              case "execute_reply": {
                this.input.next(data);
                break;
              }
            }
            break;
          }


        default: {
          console.error("Unmapped channel");
          console.error(msg);
          break;
        }
      }
    });

  }

  //takes a cell with our metadata standard and creates code for

  makeCode(cell: cell): string[] {

    let code: string[] = []
    cell.source = [];


    const results = cell.metadata.results.map((cellVar: cellVariable) => cellVar.key);
    const params = cell.metadata.inputs.map((cellVar: cellVariable) => cellVar.key);

    results.forEach((result, ix) => {
      results[ix] = `${cell.id}_${result}`
    })
    cell.metadata.inputs.forEach((cellVar: cellVariable) => {
      code.push(`${cellVar.key}=${cellVar.value}`)
    })
    if (results.length > 0) {
      code.push(`${results}=${cell.metadata.name}(${params})`)
    } else {
      code.push(`${cell.metadata.name}(${params})`)
    }

    cell.source = [...code]

    return code;
  }

  //pass a cell in and execute it
  //this will automatically do a print on the result value of the cell.
  executeCell(cell: cell) {
    this.currentCell = cell;
    const code = this.makeCode(cell).join('\n');
    console.debug(code)
    this.run(code)
    //this secondary execute gets the results back and puts them in the metadata for the cell
    this.currentCell.metadata.results.forEach((result) => {
      const result_code = `print (${cell.id}_${result.key})`
      result.resultId = uuidv4();
      console.log(result_code);
      this.run(result_code, result.resultId);
    })
  }

  //lists all the outputs for a cell per metadata standard
  listOutPuts(notebook: JupyterNotebook): string[] {
    let outputs: string[] = [];
    notebook.cells.forEach((cell: cell) => {
      cell.metadata.results.forEach((result) => {
        if (cell.metadata.type == "cell") {
          outputs.push(`${cell.id}_${result.key}`);
        }
      })
    })

    return outputs;


  }

  //executes the whole notebook from top to bottom
  executeNotebook(notebook: JupyterNotebook, lastCell: cell = null) {
    //if lastCell is null then process whole notebook
    //otherwise calculate upto and including this cell
    notebook.cells.forEach((cell: cell) => {
      this.executeCell(cell);
      if (lastCell === cell) {
        return;
      }
    })

  }

  //run python code string against
  //its best to define the messageid as some guid on the calling function..its like a claim check to get the answer back
  run(code: string, msgid = uuidv4()): string {
    let msg: Message = new Message();
    let exec: execute_request = new execute_request();
    exec.code = code;

    msg.content = exec;
    msg.channel = "shell";
    msg.header.channel = "shell";
    msg.header.msg_type = "execute_request";
    msg.header.msg_id = msgid;
       msg.header.session = this.session ;

       this.ws?.send(JSON.stringify(msg));

      return msgid;

  }

  private findResults(msg: Message) {
    if (!this.currentCell) {
      throw Error("No Cell being processed")
    }
    this.currentCell.metadata.results.forEach((resultVar) => {
      if (msg.parent_header.msg_id === resultVar.resultId) {
        resultVar.value = msg.content.text;
      }
    })
  }

  //---------- API generics below
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

  //---------- API generics above
}
