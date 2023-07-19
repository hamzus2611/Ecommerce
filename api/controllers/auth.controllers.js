const User = require("../models/users");
const UserVerfication = require("../models/userVerification");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const config = require("config");
const path = require("path");
require("dotenv").config();
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const userVerification = require("../models/userVerification");
const { error } = require("console");
const passwordReset = require("../models/passwordReset");

const jwtPrivatekey = config.get("jwtPrivatekey");
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  auth: {
    user: config.get("AUTH_EMAIL"),
    pass: config.get("AUTH_PASS"),
  },
  tls: {
    rejectUnauthorized: false,
  },
});
transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("ready for messages...");
    console.log(success);
  }
});

const sendVerifiactionEmail = async ({ _id, Email }, res) => {
  const currentURL = "http://localhost:4000/";
  const uniqueString = uuidv4() + _id;
  const mailOptions = {
    from: config.get("AUTH_EMAIL"),
    to: Email,
    subject: "Verify Your Email",
    html: `<p>Verify your Email address to complete the signup and login into your account </p><p>This Link
        <b>expires in 6 hours</b>.</p><p>press <a href=${
          currentURL + "api/auth/verify/:" + _id + "/:" + uniqueString
        }>here</a> to proceed</p>`,
  };
  const saltRounds = 10;
  bcrypt
    .hash(uniqueString, saltRounds)
    .then((hashedUniqueString) => {
      const newVerifiaction = new UserVerfication({
        userId: _id,
        uniqueString: hashedUniqueString,
        CreatedAt: Date.now(),
        expiresAt: Date.now() + 21600000,
      });
      newVerifiaction
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              res.send("verifiaction email sent!");
            })
            .catch((error) => {
              res.status(400).json("Verification email failed !");
            });
        })
        .catch();
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json("An Error occurred while  hashing  email data !");
    });
};

exports.verfUser = async (req, res) => {
  let { userId, uniqueString } = await req.params;
  let resultver = await UserVerfication.find({
    userId: userId.substring(1, userId.length),
  });
  try {
    if (resultver.length > 0) {
      const { expiresAt } = resultver[0];
      if (expiresAt < Date.now()) {
        userVerification
          .deleteOne({ userId })
          .then(() => {
            let message = "Link has expired . please  sign up again.";
            res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
          })
          .catch((error) => {
            console.log(error);
            let message =
              "An error  occurred while clearing expired user verification record";
            res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
          });
      } else {
        console.log(uniqueString.substring(1, uniqueString.length));
        console.log(resultver[0].uniqueString);
        bcrypt
          .compare(
            uniqueString.substring(1, uniqueString.length),
            resultver[0].uniqueString
          )
          .then((result) => {
            if (result) {
              try {
                id_user = userId.substring(1, userId.length);
                let user = User.findOne({ id_user });
                console.log(user);
                User.findOneAndUpdate(
                  { _id: id_user },
                  { $inc: { verified: true } }
                );

                res.sendFile(path.join(__dirname, "./../views/verified.html"));
              } catch (error) {
                console.log(error);
                let message =
                  "An error occurred while updating user record to show verified.";
                res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
              }
            } else {
              let message =
                "Invalid verification details passed. check your inbox.";
              res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
            }
          })
          .catch((error) => {
            let message = "An error  occurred while comparing unique string";
            res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
          });
      }
    } else {
      let message =
        "Account record doesn't exist or has been verified already. Please Sign Up or log In";
      res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
    }
  } catch (error) {
    console.log(error);
    let message =
      "An error occurred while checking for existing user verification record";
    res.redirect(`/api/auth/Verif/?error=true&message=${message}`);
  }
};

exports.Verif = async (req, res) => {
  res.sendFile(path.join(__dirname, "./../views/verified.html"));
};

//SignUp User
exports.signup = async (req, res) => {
  const { FirstName, LastName, Email, ContactTelephone, DateOfBirth } =
    await req.body;

  try {
    if (!/^[a-zA-z]*$/.test(FirstName) || !/^[a-zA-z]*$/.test(LastName)) {
      return res.status(400).json("invalid name entered");
    }
    if (
      !/^\w+[\+\.\w-]*@([\w-]+\.)*\w+[\w-]*\.([a-z]{2,4}|\d+)$/i.test(Email)
    ) {
      return res.status(400).json("invalid Email entered ");
    }
    if (!new Date(DateOfBirth).getTime()) {
      return res.status(400).json("invalid Date of birth entered ");
    }
    if (req.body.password.length < 8) {
      return res.status(400).json("password is too short! ");
    }
    let user = await User.findOne({ Email });
    if (user) {
      return res.status(400).json("User is exists");
    }
    hash = await bcrypt.hash(req.body.password, saltRounds);
    let newUser = await new User({
      FirstName,
      LastName,
      password: hash,
      Email,
      ContactTelephone,
      DateOfBirth,
      verified: false,
      isAdmin: false,
    });

    newUser.password = hash;

    await newUser
      .save()
      .then((result) => {
        sendVerifiactionEmail(result, res);
      })
      .catch((error) => {
        console.log(error);
        return res
          .status(401)
          .json("An error occurred while saving user account");
      });

    {
      /*const accessToken = jwt.sign(
      {
        id: newUser._id,
        isAdmin: newUser.isAdmin,
      },
      jwtPrivatekey,
      { expiresIn: "7d" }
    );
    const { password, ...info } = await newUser._doc;
    return res.send({ ...info, accessToken });*/
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

// Login User
exports.login = async (req, res) => {
  let { Email } = req.body;
  try {
    let user = await User.findOne({ Email });
    if (!user) {
      return res.status(401).json("wrong password or email");
    }
    const validpassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validpassword) {
      return res.status(401).json("wrong password or email");
    }
    const accessToken = jwt.sign(
      {
        id: user._id,
        isAdmin: user.isAdmin,
      },
      jwtPrivatekey,
      { expiresIn: "7d" }
    );
    const { password, ...info } = await user._doc;
    return res.send({ ...info, accessToken });
  } catch (error) {
    return res.status(500).json(error);
  }
};

//reset password
exports.reset = async (req, res) => {
  const { Email, redirectURL } = req.body;
  try {
    let user = await User.findOne({ Email });
    if (!user) {
      return res.status(401).json("No account with the supplied email exists!");
    } else {
      if (!user[0].verified) {
        return res
          .status(401)
          .json("Email hasn't been verified yet.check your inbox!");
      } else {
        sendResetEmail(user[0], redirectURL, res);
      }
    }
  } catch (error) {
    return res
      .status(301)
      .json("An error occurred while checking for existing user");
  }
};

//send password reset email
const sendResetEmail = ({ _id, Email }, redirectURL, res) => {
  const resetString = uuidv4 + _id;
  try {
    PasswordReset.deleteOne({ userId: _id });
    const mailOptions = {
      from: config.get("AUTH_EMAIL"),
      to: Email,
      subject: "Password Reset",
      html: `<p>We heard the you lost the password . </p><p>don't worry, use the link below to reset it.</p>
      <p>This link <b>expires in 60 minutes </b></p> <p> Press <a href =${
        redirectURL + "/" + _id + "/" + resetString
      }>here</a> to proceed.</p>`,
    };
    const saltRounds = 10;
    try {
      let hashedResetString = bcrypt.hash(resetString, saltRounds);
      const newPasswordReset = new passwordReset({
        userId: _id,
        resetString: hashedResetString,
        CreatedAt: Date.now(),
        expiresAt: Date.now() + 3600000,
      });
      newPasswordReset.save().then(() => {
        res.send("Password reset email sent");
      });
    } catch (error) {
      res.status(300).json("Password rest email failed");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json("Clearing existing pasword reset records failed");
  }
};

//Actually  reset the password
exports.resetPasswor = async (req, res) => {
  let { userId, resetString, newPassword } = req.body;
  try {
    const passwordResult = passwordReset.find({ userId });
    if (passwordReset) {
      const { expiresAt } = passwordResult[0].expiresAt;
      const hashedResetString = passwordResult[0].resetString;

      if (expiresAt < Date.now()) {
        try {
          passwordReset.deleteOne({ userId });
          res.status(400).json("Password reset link has expires");
        } catch (error) {
          res.status(400).json("Clearing password reset record failed");
        }
      } else {
        bcrypt.compare(resetString, hashedResetString).then((result) => {
          if (result) {
            bcrypt
              .hash(newPassword, saltRounds)
              .then((hashedNewPassword) => {
                User.findOneAndUpdate(
                  { _id: userId },
                  { password: hashedNewPassword }
                )
                  .then(() => {
                    PasswordReset.deleteOne({ userId }).then(()=>{
                      res.send("Password has been reset successfuly")
                    }).catch((error)=>{
                      res.status(400).json("An error occurred while finalizing password reset.");
                    });
                  })
                  .catch((error) => {
                    console.log(error);
                    res.status(400).json("Updating new password failed.");
                  });
              })
              .catch((error) => {
                console.log(error);
                res
                  .status(400)
                  .json("An Error occurred while hashing new password");
              });
          }
        });
      }
    } else {
      res.status(400).json("Password reset request not found");
    }
  } catch (error) {
    console.log(error);
    res.status(400).json("Cheking for existing password reset record failed");
  }
};
