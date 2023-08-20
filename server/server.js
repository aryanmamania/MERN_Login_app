import express from 'express'
// const express = require('require')
import cors from 'cors';
import morgan from 'morgan';
import connect from './database/Connection.js';
import router from './router/routes.js'

const app = express();


/**middleware */
app.use(express.json());
app.use(cors());
app.use(morgan('tiny'));
app.disable('x-powered-by');

const port = 5000;


/**http get request */
app.get('/', (req,res)=>{
    res.status(201).json("Home GET request")
})


/**api route */
app.use('/api', router)


/**server only starts when there is a valid connection */
connect().then(()=>{
    try{
        app.listen(port, ()=>{
            console.log(`Server Connected to http://localhost:${port}`)
        })
    }catch (error){
console.log('Cannot connect to server')
    }
}).catch(error =>{
    console.log("Invalid databse connection....!");
})

