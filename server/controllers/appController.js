import UserModal from "../model/User.modal.js";
import bcrypt from 'bcrypt'
import  jwt from "jsonwebtoken";
import ENV from '../config.js'
import otpGenerator from 'otp-generator';


/**middleware to verify user */
export async function verifyUser(req,res, next){
    try{
      const { username } = req.method ==  "GET" ? req.query : req.body;

      // check user existance
      let exist = await UserModal.findOne({ username});
      if(!exist) return res.status(404).send({error : "cannot find user"});
      next();

    }catch(error){
        return res.status(404).send({ error: "authentication Error"})
    }
}


/**register function */
export async function register(req,res){
   
    try{ 

         
        const { username, password , profile , email}= req.body;
         /**check existing user */

    {/*      const existUsername = new Promise((resolve, reject) => {
            UserModal.findOne({ username }).then((err,user) => {
                if(err) reject(new Error(err))
                if(user) reject({ error: "Please use unique username"});

                resolve();
            }).catch(err => reject({error: "exist username findone error"}));
        }); */}


        const existUsername = new Promise((resolve, reject)=>{
            UserModal.findOne({ username }, function(err,user){
                if(err) reject(new Error(err))
                if(user) reject({error: "please use unique username"});

                resolve();
            })
         });  

         /**check for existing email */
         const existEmail = new Promise((resolve, reject)=>{
            UserModal.findOne({ email }, function(err,email){
                if(err) reject(new Error(err))
                if(email) reject({error: "please use unique Email"});

                resolve();
            })
         });

       Promise.all([existUsername, existEmail])
       .then(()=>{
        if(password){
         bcrypt.hash(password, 10)
         .then(hashedpassword =>{
          const user = new UserModal({
            username,
            password: hashedpassword,
            profile: profile || '',
            email 
          })

          /**return saved results as response */
          user.save()
          .then(result => res.status(201).send({msg: "User Registered Successfully"}))
          .catch(error => res.status(500).send({error}))
         }).catch(error =>{
            return res.status(500).send({
                error: "Enable to hashed password"
            })
           })
        }
       }).catch(error =>{
        return res.status(500).send({
            error
        })
       })
    }catch(error){
        return res.status(500).send(error);
    }
}



/**login function */
/**POST: http://localhost:5000/api/login 
 @param: {
    "username": "example123",
    "password": "admin123"
 }



        .catch(error =>{
            res.status(400).send({error: "Passwords does not Match"})
        })
     })
     .catch( error =>{
        return res.status(404).send( { error: "username not found"})
     })
    }catch(error){
        return res.status(500).send({error})
    }
}

*/
export async function login(req,res){
   
    const { username, password } = req.body;


    try {
        
        UserModal.findOne({ username })
            .then(user => {
                bcrypt.compare(password, user.password)


                    .then(passwordCheck => {

                        if(!passwordCheck) return res.status(400).send({ error: "Don't have Password"});

                        // create jwt token
                        const token = jwt.sign({
                                        userId: user._id,
                                        username : user.username
                                    }, ENV.JWT_SECRET , { expiresIn : "24h"});

                        return res.status(200).send({
                            msg: "Login Successful...!",
                            username: user.username,
                            token
                        });                                    

                    })


                    .catch(error =>{
                        return res.status(400).send({ error: "Password does not Match"})
                    })
            })
            .catch( error => {
                return res.status(404).send({ error : "Username not Found"});
            })

    } catch (error) {
        return res.status(500).send({ error});
    }
}


 /**(GET)get user  function */

 export async function getUser(req,res){
    
    const { username } = req.params;

    try {
        
        if(!username) return res.status(501).send({ error: "Invalid Username"});

        UserModal.findOne({ username }, function(err, user){
            if(err) return res.status(500).send({ err });
            if(!user) return res.status(501).send({ error : "Couldn't Find the User"});

            /** remove password from user */
            // mongoose return unnecessary data with object so convert it into json
            const { password, ...rest } = Object.assign({}, user.toJSON());

            return res.status(201).send(rest);
        })

    } catch (error) {
        return res.status(404).send({ error : "Cannot Find User Data"});
    }

}

/**(PUT) update the user */

export async function updateUser(req,res){
    try {
        
        // const id = req.query.id;
        const { userId } = req.user;

        if(userId){
            const body = req.body;

            // update the data
            UserModal.updateOne({ _id : userId }, body, function(err, data){
                if(err) throw err;

                return res.status(201).send({ msg : "Record Updated...!"});
            })

        }else{
            return res.status(401).send({ error : "User Not Found...!"});
        }

    } catch (error) {
        return res.status(401).send({ error });
    }
}


/**geneate otp */

export async function generateOTP(req,res){
    req.app.locals.OTP = await otpGenerator.generate(4, { lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false})
    res.status(201).send({ code: req.app.locals.OTP })
}

export async function verifyOTP(req,res){
    const { code } = req.query;
    if(parseInt(req.app.locals.OTP) === parseInt(code)){
        req.app.locals.OTP = null; // reset the OTP value
        req.app.locals.resetSession = true; // start session for reset password
        return res.status(201).send({ msg: 'Verify Successsfully!'})
    }
    return res.status(400).send({ error: "Invalid OTP"});
}


/**reset session */
export async function createResetSession(req,res){
    if(req.app.locals.resetSession){
         
        return res.status(201).send({ flag : req.app.locals.resetSession})
    }
    return res.status(440).send({error: "session expired!"})
}

/**update the password when we have valid session*/
export async function resetPassword(req,res){
    try {
        
        if(!req.app.locals.resetSession) 
        return res.status(440).send({error : "Session expired!"});

        const { username, password } = req.body;

        try {
            
            UserModal.findOne({ username})
                .then(user => {
                    bcrypt.hash(password, 10)
                        .then(hashedPassword => {
                            UserModal.updateOne({ username : user.username },
                            { password: hashedPassword}, function(err, data){
                                if(err) throw err;
                                req.app.locals.resetSession = false; // reset session
                                return res.status(201).send({ msg : "Record Updated...!"})
                            });
                        })
                        .catch( e => {
                            return res.status(500).send({
                                error : "Enable to hashed password"
                            })
                        })
                })
                .catch(error => {
                    return res.status(404).send({ error : "Username not Found"});
                })

        } catch (error) {
            return res.status(500).send({ error })
        }

    } catch (error) {
        return res.status(401).send({ error })
    }
}