const express = require('express')
const router = express()
const Users = require('../models/users')
const multer = require('multer')
const fs = require('fs')

//image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
    }
})

const upload = multer({
    storage: storage,
}).single('image')


router.post("/add", upload, async (req, res) => {
    try {
        const user = new Users({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename
        });

        await user.save();
        req.session.message = {
            type: 'success',
            message: "User added successfully"
        };
        res.redirect('/');
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});


router.get('/', async (req, res) => {
    try {
        const users = await Users.find()
        res.render('index', {
            title: 'HomePage',
            users: users
        });
    } catch (err) {
        res.json({ message: err.message });
    }
});

// edit an user eoute
router.get('/edit/:id', (req, res) => {
    let id = req.params.id;
    Users.findById(id)
        .then(user => {
            if (!user) {
                res.redirect('/');
            } else {
                res.render('edit-users', {
                    title: "Edit Users",
                    user: user
                });
            }
        })
        .catch(err => {
            res.redirect('/');
        });
});

//update user route
router.post('/update/:id', upload, (req, res) => {
    const id = req.params.id
    let new_image = ""

    if (req.file) {
        new_image = req.file.filename
        try {
            fs.unlinkSync("./uploads/" + req.body.old_image)
        } catch (err) {
            console.log(err);
        }
    } else {
        new_image = req.body.old_image
    }
    Users.findByIdAndUpdate(id, {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: new_image
    }).exec()
        .then(result => {
            req.session.message = {
                type: "success",
                message: "User Updated Successfully"
            };
            res.redirect('/');
        })
        .catch(err => {
            res.json({ message: err.message, type: "danger" });
        });
})

//delete user route

router.get("/delete/:id", (req, res) => {
    let id = req.params.id
    Users.findByIdAndRemove(id)
        .then(result => {
            if (result && result.image !== '') {
                try {
                    fs.unlinkSync("./uploads/" + result.image);
                } catch (err) {
                    console.log(err);
                }
            }
            req.session.message = {
                type: "info",
                message: "User deleted successfully",
            };
            res.redirect('/');
        })
        .catch(err => {
            res.json({ message: err.message });
        });


})


router.get('/add', (req, res) => {
    res.render('add-users', { title: "Add User" })
})



module.exports = router