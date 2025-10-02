require('dotenv').config();
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const categoryRouter = require('./routes/category')
const userRouter = require('./routes/auth')
const productRouter = require('./routes/product')
const sliderRouter = require('./routes/slider')
const categoriesBSCTRouter = require('./routes/bsct/categoriesBSCT')
const bsctRouter = require('./routes/bsct/bsct')
const favouriteRouter = require('./routes/favourite')
const categoriesThuVienRouter = require('./routes/thuvien/categoryThuVien')
const thuvienRouter = require('./routes/thuvien/thuvien')
const notificationRouter = require('./routes/notification')
const {startTokenCleanup} = require('./utils/tokenCleanup')
const categoryNNDTRouter = require('./routes/nndt/categorynndt')
const nndtRouter = require('./routes/nndt/nndt')
const categoryCTGDRouter = require('./routes/ctgd/categoryCTGD')
const ctgdRouter = require('./routes/ctgd/ctgd')
const categoryTinTucRouter = require('./routes/tintucs/categoryTinTuc')
const tintucRouter = require('./routes/tintucs/tintuc')
const reviewRouter = require('./routes/review')

const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

app.use('/api/categories', categoryRouter)
app.use('/api/auth', userRouter)
app.use('/api/product', productRouter)
app.use('/api/slider', sliderRouter)
app.use('/api/categoriesBSCT', categoriesBSCTRouter)
app.use('/api/bsct', bsctRouter)
app.use('/api/favourite', favouriteRouter)
app.use('/api/catthuvien', categoriesThuVienRouter)
app.use('/api/thuvien', thuvienRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/categoryNNDT', categoryNNDTRouter)
app.use('/api/nndt', nndtRouter)
app.use('/api/categoryCTGD', categoryCTGDRouter)
app.use('/api/ctgds', ctgdRouter)
app.use('/api/categoryTinTuc', categoryTinTucRouter)
app.use('/api/tintucs', tintucRouter)
app.use('/api/review', reviewRouter)

startTokenCleanup();


const DB_URI = process.env.MONGODB_URL || `mongodb+srv://${process.env.USERNAME}:${process.env.PASSWORD}@cluster0.pgf8qqw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`


mongoose.connect(DB_URI)
    .then(() => {
        console.log('connected to database')
        app.listen(4000, () => {
            console.log('CONNECTED && Listing on http://localhost:4000');
        })
    })
    .catch((err) => {
        console.log(err);
    })