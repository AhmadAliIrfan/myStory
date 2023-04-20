const {
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
} = require("./userFunctions");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const Post = require("./models/post");

router.post("/register", upload.single("pfp"), registerUser);
router.post("/login", authUser);
router.get("/profile", profile);
router.post("/logout", logout);
router.post("/post", upload.single("file"), createPost);
router.post("/myposts", getPosts);
router.get("/post/:id", getPost);
router.put("/post/", upload.single("file"), updatePost);
router.post("/postComment", postComment);
router.post("/getComments", getComments);
router.get("/categories/:name", categoryPosts);
router.get('/dashboard/:id', dashboardData);
router.get('/getUser', getUser);
router.post('/savePost', savePost);
router.post("/editUser", upload.single("pfp"), editUser);
router.post('/savePostStatus', postStatus);
router.get('/getUserPosts',getSavedPosts);
router.post('/search',searchQ);
router.post('/resetPassword', resetPassword);
router.post('/reset-password/:id', setPassword);
router.post('/reset-password', newPassword)
router.get('/link', checkLink);

module.exports = router;
