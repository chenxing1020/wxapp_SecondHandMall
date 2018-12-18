var express = require('express'),
    mongoose = require('mongoose'),
    getDateDiff = require('../utils/utils'),
    Model = require('../models/model');//调用自定义的Mongoose Model

var router = express.Router();
var goodModel = Model.goodModel,
    commentModel = Model.commentModel;

var pageNum = 20;

//首页商品列表
router.get('/goods', function (req, res) {
    var scrollPage = req.query.page;
    goodModel.find({}, function (err, docs) {
        for (var item in docs) {
            let time = getDateDiff(docs[item]["createAt"]);
            docs[item]["createAt"] = time;
        }
        res.json(docs);
    }).limit(pageNum).skip(scrollPage * pageNum).sort({ '_id': -1 }).lean();
});

//分类商品列表
router.get('/sections', function (req, res) {
    var sId = req.query.id;
    var scrollPage = req.query.page;
    goodModel.find({ 'sId': sId }, function (err, docs) {
        for (var item in docs) {
            let time = getDateDiff(docs[item]["createAt"]);
            docs[item]["createAt"] = time;
        }
        res.json(docs);
    }).limit(pageNum).skip(scrollPage * pageNum).sort({ '_id': -1 }).lean();
});

//商品信息和评论单页
router.get('/good', function (req, res) {
    var _id = mongoose.Types.ObjectId(req.query._id);

    goodModel.aggregate([
        { $lookup: { from: "commentmodels", localField: "_id", foreignField: "gId", as: "cmt" } },
        { $match: { "_id": _id } }
    ], function (err, docs) {
        let gData = docs[0];
        let cmtData = [];
        if ("cmt" in gData) {
            cmtData = gData["cmt"];
            delete gData["cmt"];
            for (var item in cmtData) {
                let time = getDateDiff(cmtData[item]["createAt"]);
                cmtData[item]["createAt"] = time;
            }
        }
        res.json({ gData: gData, cmtData: cmtData });
    });
});

//刷新评论
router.get('/comment', function (req, res) {
    let gId = req.query.gId;
    commentModel.find({ 'gId': gId }, function (err, docs) {
        for (var item in docs) {
            let time = getDateDiff(docs[item]["createAt"]);
            docs[item]["createAt"] = time;
        }
        res.json(docs);
    }).sort({ 'createAt': 1 }).lean();
})

module.exports = router;