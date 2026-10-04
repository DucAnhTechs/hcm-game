import {DatabaseSync, type SQLInputValue} from 'node:sqlite';
import {mkdirSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';

function openDatabase() {
 const filename=resolve(process.env.DATABASE_PATH||'data/pho-viet.sqlite');
 mkdirSync(dirname(filename),{recursive:true});
 const sql=new DatabaseSync(filename);
 sql.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
 const version=Number(sql.prepare('PRAGMA user_version').get()?.user_version);
 if(version===0){
  sql.exec('BEGIN IMMEDIATE');
  try{
   if(Number(sql.prepare('PRAGMA user_version').get()?.user_version)===0){
    sql.exec(readFileSync(resolve('drizzle/0000_abnormal_ink.sql'),'utf8'));
    sql.exec('PRAGMA user_version=1');
   }
   sql.exec('COMMIT');
  }catch(error){sql.exec('ROLLBACK');sql.close();throw error;}
 }
 function prepare(query:string){
  let values:SQLInputValue[]=[];
  return {
   bind(...args:SQLInputValue[]){values=args;return this;},
   async first(){return sql.prepare(query).get(...values)||null;},
   async all(){return {results:sql.prepare(query).all(...values)};},
   async run(){return {meta:{changes:Number(sql.prepare(query).run(...values).changes)}};}
  };
 }
 return {prepare,async batch(statements:ReturnType<typeof prepare>[]){
  sql.exec('BEGIN IMMEDIATE');
  try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}
  catch(error){sql.exec('ROLLBACK');throw error;}
 }};
}
const shared=globalThis as typeof globalThis & {phoVietDb?:ReturnType<typeof openDatabase>};
export function getDatabase(){return shared.phoVietDb??=openDatabase();}
