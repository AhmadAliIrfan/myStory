require("dotenv").config();
//const User = require("./models/user");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const Comment = require("./models/comment");
const { User, Post } = require("./models/post");
const sendEmail = require("./utils/sendEmail");

app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));

async function registerUser(req, res) {
  const { fName, lName, gender, age, email, username, password } = req.body;
 
  const date = new Date();

  console.log(req.body);

  let newPath;

  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  } else {
    newPath = "uploads\\basic.png";
  }

  const newUser = new User({
    fName: fName,
    lName: lName,
    gender: gender,
    age: age,
    email: email,
    username: username,
    password: password,
    pfp: newPath
  });

  if (password.length < 8) {
    return res
      .status(400)
      .json({ msg: "Password should be atleast 8 characters long" });
  }

  const myUser = await User.findOne({ username: username });
  const myEmail = await User.findOne({ email: email });

  if (myUser || myEmail) {
    return res.status(400).json({ msg: "Username or Email Already Exists" });
  }

  bcrypt.hash(password, 5, async (err, hash) => {
    if (err) {
      return res.status(400).json({ msg: "Error: Password was not saved" });
    }

    newUser.password = hash;
    const savedUser = await newUser.save();

    if (savedUser) {
      return res.status(200).json({ msg: "User Saved Successfully" });
    }
  });
}

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

async function authUser(req, res) {
  // Checking Login
  const data = req.body; // Getting Request Data
  var userFound;
  const email = await User.findOne({ email: data.email }); //Searching via Email
  const user = await User.findOne({ username: data.username }); //Searching via Username

  if (!user && !email) {
    // Checking if Email or Username was not found
    return res.status(400).json({ msg: "Username or Email not found" });
  }

  // If Found Sort into single user

  if (user) {
    userFound = user;
  } else {
    userFound = email;
  }

  // If Password Matches return true

  const matchPassword = await bcrypt.compare(data.password, userFound.password);

  if (matchPassword) {
    // if true logged in
    //logged In

    jwt.sign(
      // Sign Token Generation
      { username: userFound.username, id: userFound._id, pfp: userFound.pfp }, // Parameters Required
      process.env.SECRET_STRING, // Secret Key for encryption
      {}, // Options
      (err, token) => {
        // Call Back
        if (err) throw err;
        res.cookie("Login", token,{sameSite:'None', secure:true}).json({

          id: userFound._id,
          username: userFound.username,
          pfp: userFound.pfp
        });
      }
    );
  } else {
    res.status(400).json("Wrong Credentials");
  }
}

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

async function profile(req, res) {
  // body...

  const { Login } = req.cookies;

  if (Login) {
    jwt.verify(Login, process.env.SECRET_STRING, {}, async (err, info) => {
      if (err) throw err;

      //const user = await User.findOne({ _id: info.id }, { password: 0 });
      res.json(info);
    });
  } else {
    res.json(0);
  }
}

async function logout(req, res) {
  res.cookie("Login", null,{sameSite:'None', secure:true}).json("ok");

}

async function createPost(req, res) {
  const { Login } = req.cookies;
  const { originalname, path } = req.file;
  const parts = originalname.split(".");
  const ext = parts[parts.length - 1];
  const newPath = path + "." + ext;
  fs.renameSync(path, newPath);

  if (Login) {
    jwt.verify(Login, process.env.SECRET_STRING, {}, async (err, info) => {
      if (err) throw err;

      const { title, summary, content, category } = req.body;

      const myPost = await Post.create({
        title: title,
        summary: summary,
        content: content,
        cover: newPath,
        author: info.id,
        category: category
      });

      res.json(myPost);
    });
  }
}

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

async function getPosts(req, res) {
  const { categoryID, name } = req.body;

  if (categoryID === 0) {
    const posts = await Post.find()
      .populate("author", ["username"])
      .sort({ createdAt: -1 });

    res.json(posts);
  } else {
    const posts = await Post.find({ category: name })
      .populate("author", ["username"])
      .sort({ createdAt: -1 });

    res.json(posts);
  }
}

async function getPost(req, res) {
  const { id } = req.params;

  const post = await Post.findById(id).populate("author", ["username"]);

  res.json(post);
}

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

async function updatePost(req, res) {
  let newPath = null;

  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);
  }

  const { Login } = req.cookies;

  if (Login) {
    jwt.verify(Login, process.env.SECRET_STRING, {}, async (err, info) => {
      if (err) throw err;

      const { id, title, summary, content } = req.body;
      const post = await Post.findById(id).populate("author", ["username"]);
      const isAuthor =
        JSON.stringify(post.author._id) === JSON.stringify(info.id);

      if (!isAuthor) {
        return res.status(400).json("You are not the Author");
      }

      await post.updateOne({
        title: title,
        summary: summary,
        content: content,
        cover: newPath ? newPath : post.cover
      });

      res.json(post);
    });
  }
}

//---------------------------------------------------------------------------------
//---------------------------------------------------------------------------------

async function postComment(req, res) {
  const { name, pfp, comments, id } = req.body;

  try {
    const myComment = await Comment.create({
      name: name,
      comment: comments,
      pfp: pfp
    });

    const post = await Post.findById(id).populate("author", ["username"]);
    await post.updateOne({ $push: { comments: myComment } });
    res.status(200).json("ok");
  } catch (e) {
    // statements
    res.status(400).json({ msg: e.message });
  }
}

async function getComments(req, res) {
  const { name, pfp, comments, id } = req.body;

  const myComments = await Post.findById(id).populate("comments");

  res.json(myComments);
}

async function categoryPosts(req, res) {
  const { name } = req.params;

  if (name !== "All") {
    const myPost = await Post.find({ category: name }).populate("author", [
      "username"
    ]);
    res.status(200).json(myPost);
  } else {
    const myPost = await Post.find({}).populate("author", ["username"]);
    res.status(200).json(myPost);
  }
}

async function dashboardData(req, res) {
  const { id } = req.params;
  const { Login } = req.cookies;

  if (Login) {
    jwt.verify(Login, process.env.SECRET_STRING, {}, (err, info) => {
      if (err) {
        throw err;
      } else if (id !== info.id) {
        res.json({
          error: 0,
          msg: "The Dashboard accessed does not match Current User Login"
        });
      } else if (id === info.id) {
        res.json({ error: 1, data: info });
      }
    });
  } else {
    res.json({ error: 0, msg: "Please Login First to access the Dashboard" });
  }
}

async function getUser(req, res) {
  const { Login } = req.cookies;

  if (Login) {
    jwt.verify(Login, process.env.SECRET_STRING, {}, async (err, info) => {
      if (err) throw err;

      const user = await User.findOne({ _id: info.id }, { password: 0 });

      res.json(user);
    });
  }
}

//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------

async function savePost(req, res) {
  const { postID, saveState, username, userID } = req.body;

  const post = await Post.findOne({ _id: postID });

  const user = await User.findOne({
    $and: [{ _id: userID }, { saved: { _id: postID } }]
  }).populate("saved");

  if (user) {
    try {
      await user.updateOne({ $pull: { saved: postID } });
      res.json({ Status: "Post Deleted", State: false });
    } catch (e) {
      // statements
      console.log(e);
    }
  } else {
    const myUser = await User.findOne({ _id: userID }).populate("saved");

    await myUser.updateOne({ $push: { saved: post } });

    res.json({ Status: "Post Added", State: true });
  }
}

//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------

async function postStatus(req, res) {
  const { postID, username, userID } = req.body;

  const user = await User.findOne({
    $and: [{ _id: userID }, { saved: { _id: postID } }]
  }).populate("saved");

  if (user) {
    res.json(true);
  } else {
    res.json(false);
  }
}

//------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------

async function editUser(req, res) {
  const { fName, lName, age, email, id } = req.body;
  const user = await User.findOne({ _id: id }, { password: 0 });
  if (fName) {
    await user.updateOne({
      fName: fName,
      lName: lName
    });
    res.json("ok");
  } else if (age) {
    await user.updateOne({
      age: age
    });
    res.json("ok");
  } else if (email) {
    await user.updateOne({ email: email });
    res.json("ok");
  } else if (req.file) {
    let newPath;
    const { originalname, path } = req.file;
    const parts = originalname.split(".");
    const ext = parts[parts.length - 1];
    newPath = path + "." + ext;
    fs.renameSync(path, newPath);

    await user.updateOne({ pfp: newPath });
    res.json("ok");
  }
}

async function getSavedPosts(req, res) {
  const { Login } = req.cookies;

  if (Login) {
    jwt.verify(Login, process.env.SECRET_STRING, {}, async (err, info) => {
      if (err) throw err;

      const user = await User.findOne({ _id: info.id }).populate("saved");

      res.json(user.saved);
    });
  } else {
    res.json(0);
  }
}

async function searchQ(req, res) {
  const { query } = req.body;

  const post = await Post.find({
    title: { $regex: `.*${query}.*`, $options: "i" }
  });

  if (post.length < 1) {
    res.json([]);
  } else {
    res.json(post);
  }
}

async function resetPassword(req, res) {
  const { email } = req.body;

  const newUser = await User.findOne({ email: email }).populate("saved");

  if (newUser) {
    jwt.sign(
      { username: newUser.username, id: newUser._id }, // Parameters Required
      process.env.SECRET_STRING, // Secret Key for encryption
      { expiresIn: "3h" }, // Options
      (err, token) => {
        // Call Back
        if (err) throw err;

        res.cookie("reset", token,{sameSite:'None', secure:true}).json({
          id: userFound._id,
          username: userFound.username
        });
      }
    );

    const link = `https://melodic-jalebi-c05672.netlify.app/password-reset/${newUser._id}`;
    const myHtml = `<h2>Hi ${newUser.username}</h2><p>Looks like you forgot your password. Follow this Link to change it. Thank you!</p><p>${link}</p>`;
    await sendEmail(email, "Password Reset", link, myHtml);

    res.json({ msg: "An Email Has been Sent", statusCode: 1 });
  } else {
    res.json({ msg: "User Email Not Found", statusCode: 15 });
  }
}

async function setPassword(req, res) {
  const { reset } = req.cookies;
  const { id, password } = req.body;

  jwt.verify(reset, process.env.SECRET_STRING, {}, async (err, token) => {
    if (err) throw err;

    const user = await User.findOne({ _id: id });

    bcrypt.hash(password, 5, async (err, hash) => {
      if (err) {
        return res.status(400).json({ msg: "Error: Password was not saved" });
      }

      await user.updateOne({ password: hash });


      res.cookie(reset, "",{sameSite:'None', secure:true});

      res.json({ msg: "Updated Successfully", statusCode: 1 });
    });
  });
}

async function checkLink(req, res) {
  const { reset } = req.cookies;

  if (reset) {
    jwt.verify(reset, process.env.SECRET_STRING, {}, async (err, info) => {
      if (err) throw err;

      res.json(true);
    });
  } else {
    res.json(false);
  }
}


async function newPassword(req, res){


const {Login} = req.cookies;

const {old, newPassword, id} = req.body;

console.log(old);
console.log(newPassword);

jwt.verify(Login, process.env.SECRET_STRING,{}, async (err, info) =>{

if (err) throw err;


const user = await User.findOne({_id:id});


const matchPassword = await bcrypt.compare(old , user.password);

if(matchPassword){

  bcrypt.hash(newPassword, 5, async (err, hash) => {
      if (err) {
        return res.status(400).json({ msg: "Error: Password was not saved" });
      }

      await user.updateOne({ password: hash });

      res.json({ msg: "Updated Successfully", statusCode: 1 });
    });


}else

res.json({msg:'The Old Password is not correct', statusCode:15});

});


}

module.exports = {
  registerUser,
  authUser,
  profile,
  logout,
  createPost,
  getPosts,
  getPost,
  updatePost,
  postComment,
  getComments,
  categoryPosts,
  dashboardData,
  getUser,
  savePost,
  editUser,
  postStatus,
  getSavedPosts,
  searchQ,
  resetPassword,
  setPassword,
  checkLink,
  newPassword
};
