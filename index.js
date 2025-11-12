const express = require("express");
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const Chat = require("./models/chat.js");
const methodOverride = require('method-override');


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
app.get("/chats", async (req, res)=>{
    let chats = await Chat.find(); //Chat.find() is asynchronous function which is bringing data from database to here. since Chat.find() is asyncronous function which returns promise so we need to await. 
    
    res.render("index.ejs", { chats });
});

//New Route
app.get("/chats/new", (req, res)=>{
    res.render("new.ejs");
})

//create route: insert data into database after submition of new chat 
app.post("/chats", (req, res)=>{
    let { from, to, msg } = req.body;
    let newChat = new Chat({
        from: from,
        to: to,
        msg: msg,
        created_at: new Date()
    });
    newChat.save()
        .then((res)=>{
            console.log("chat was saved");
        })
        .catch((err)=>{
            console.log(err);
        })
    res.redirect("/chats");
});

// edit route: give form as a response to the browser
app.get("/chats/:id/edit", async (req, res)=>{
    let {id} = req.params;
    let chat = await Chat.findById(id);
    res.render("edit.ejs", {chat});
});

//update Route: this update the edited message in the database
app.put("/chats/:id/", async (req, res) => {
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
});

//Destroy route
app.delete("/chats/:id", async (req, res)=>{
    let {id} = req.params;
    console.log(id);
    let deletedChat =  await Chat.findByIdAndDelete(id); //server search data using id in database and database reply query object in response
    console.log(deletedChat);
    res.redirect("/chats");
})

app.get("/", (req, res)=>{
    res.send("root is working"); 
})

app.listen(8080, ()=>{
    console.log("app is listening");
})
