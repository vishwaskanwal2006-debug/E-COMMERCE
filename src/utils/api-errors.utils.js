class api_error extends Error{
    constructor(status_code,message="something went wrong ",data,errors=[],stack='') {
        super(message);
        this.status_code=status_code;
        this.errors=errors;
        this.data=data;
        this.message=message;
        this.success=false;
        if (stack){
            this.stack=stack
        }  else{
            Error.captureStackTrace(this,this.constructor)
        }    }
}
export  {api_error}