import sql from"mysql2/promise"
import env from "dotenv"
import { connect } from "http2";
 env.config();//required to get them loaded 
 const connect_to_db=async()=>{
try{
const database=await sql.createConnection({
     host: process.env.host, // Your MySQL host
  user: process.env.user, // Your MySQL username
  password: process.env.password, // Your MySQL password
  database : process.env.database // The name of your database
})
console.log("✅CONNECTION ESTABLISHED WITH DATABASE SUCCESSFULLY -- named database for further query");
return database;
}

catch(err){
  console.error("❌SOMETHING WENT WRONG ",err);
}}
connect_to_db();
//using mysql2 promis .connect and create connection are same though
export default connect_to_db;


