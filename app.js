//require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
let ejs = require("ejs");
const bodyParser = require("body-parser");
const { request } = require("express");
// Mongoose Inititalization
const mongoose = require('mongoose');
const _ = require('lodash');


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/todoListDB');
  console.log("database connected");
}

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

const Item = mongoose.model("Item", itemSchema);

const item1 = Item({
    name: "Welcome to our todo List"
});

const item2 = Item({
    name: "Hit the  + button to add a new item "
});

const item3 = Item({
    name: "<- Hit the checkbox to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

app.get("/", function(req, res){

    Item.find({}, function(err, results){

        if(results.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                }else {
                    console.log("Default items added succesfullly!")
                }
            });
            res.redirect("/");
        } else{
            res.render("list", {listTitle: "Today", newListItems: results});
        }
    })
});

app.get("/:customListName",(req, res)=>{
    const customlist = _.capitalize(req.params.customListName);

    List.findOne({name: customlist}, function(err, result){
        if(!err){
            if(!result){
                // Create a new list
                const list = new List({
                    name: customlist,
                    items: defaultItems
                })
            
                list.save();
                res.redirect("/" + customlist)
            } else{
                // Show the existing list
                res.render("list", {listTitle: result.name, newListItems: result.items})
            }
        }
    })
    
});

app.post("/", function(req, res){
    let itemName = req.body.newItem;
    let listName = req.body.list;

    const new_item = Item({
        name: itemName
    });

    if(listName === "Today"){
        new_item.save();
        res.redirect("/");
    } else{
        List.findOne({name: listName}, (err, foundList)=>{
            foundList.items.push(new_item);
            console.log(foundList.items);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
})

app.post("/delete", function(req, res){
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItem, function(err){
            if(err){
                console.log(err);
            }else{
                console.log("removed succesfully");
                res.redirect("/")
            }
        })
    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            } 
        });
    }

    
})



app.get("/about", (req, res)=>{
    res.render("about");
})



app.listen(process.env.PORT || "3000", function(){
    console.log("Server has started sucessfully!");
})

