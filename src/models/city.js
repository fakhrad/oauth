var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var city = new Schema({
    cityCode : {type:Number, required :true, unique:true},
    name : {type : Object, max:100, required:true}
});

module.exports = mongoose.model("City", city);