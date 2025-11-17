const express = require("express");
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const Chat = require("./models/chat.js");
const methodOverride = require('method-override');
const ExpressError = require("./ExpressError.js");

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "/public")));

app.use(express.urlencoded({extended:true}));//to parse the data send through form submition

// override with POST having ?_method=PUT
app.use(methodOverride('_method'))


main()
    .then(()=>{
        console.log("connection successful");
    })
    .catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/whatsapp');
}

//index Route
app.get("/chats", asyncWrap(async (req, res)=>{
    let chats = await Chat.find(); //Chat.find() is asynchronous function which is bringing data from database to here. since Chat.find() is asyncronous function whichreturns promise so we need to await. 
    res.render("index.ejs", { chats });
}));

//New Route
app.get("/chats/new", (req, res)=>{
    // throw new ExpressError(404, "Page not found");
    res.render("new.ejs");
})

//create route: insert data into database after submition of new chat 
app.post("/chats", asyncWrap(async (req, res, next)=>{
    let { from, to, msg } = req.body;
    let newChat = new Chat({ //new Chat creates the document
        from: from,
        to: to,
        msg: msg,
        created_at: new Date()
    });
    await newChat.save()
    res.redirect("/chats");
}));

//new - show route (for error handling class)
app.get("/chats/:id", asyncWrap(async (req, res, next)=>{
    let { id } = req.params;
    let chat = await Chat.findById(id);
    if(!chat) {
        next(new ExpressError(404, "Chat not found"));
    }
    res.render("edit.ejs", { chat });
}));



// edit route: give form as a response to the browser
app.get("/chats/:id/edit", asyncWrap(async (req, res)=>{
    let {id} = req.params;
    let chat = await Chat.findById(id);
    res.render("edit.ejs", {chat});
}));

//update Route: this update the edited message in the database
app.put("/chats/:id/", asyncWrap(async (req, res) => {
    let {id} = req.params;
    let {msg: newMsg} = req.body; //destructuring assingment with renaming
    console.log(newMsg);
    let updatedChat = await Chat.findByIdAndUpdate( 
        id,
        { 
            msg: newMsg, //message updated
            updated_at: new Date() //date updated
        }, 
        { runValidators: true, new: true} //optionals object ( new: true )
    );
    console.log(updatedChat);
    res.redirect("/chats");
}));

//Destroy route
app.delete("/chats/:id", asyncWrap(async (req, res)=>{
    let {id} = req.params;
    console.log(id);
    let deletedChat =  await Chat.findByIdAndDelete(id); //server search data using id in database and database reply query object in response
    console.log(deletedChat);
    res.redirect("/chats");
}));

app.get("/", (req, res)=>{
    res.send("root is working"); 
})

//async wrap funciton 
function asyncWrap(fn) {
    return function(req, res, next) {
        fn(req, res, next).catch((err)=> {next(err)});
    }
}

//validation error function
const handleValidationErr = (err) => {
    console.log("This was a validation error. Please follow the rules");
    console.dir(err.message);
    return err;
}

//error handling middleware to print error name
app.use((err,req, res, next)=>{
    console.log(err.name);
    if(err.name === "ValidationError") {
      err = handleValidationErr(err);
    }
    next(err);
});

//Error Handling Middleware: global handler
app.use((err, req, res, next)=>{
    let {status = 500, message = "Some Error OCcured" } = err;
    res.status(status).send(message);
});

app.listen(8080, ()=>{
    console.log("app is listening");
})
