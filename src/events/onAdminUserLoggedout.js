var broker = require('../rpcserver');
function onAdminUserLoggedout(){
    var _onOkCallBack
    function _onOk (result) {
        if (_onOkCallBack) {
        _onOkCallBack(result)
        }
    }
    
    function _call(user) {
        console.log('adminuserloggedout event triggered.')
        broker.publish("adminauth", "adminuserloggedout", user);
        _onOk(user);
    }
    return {
            call: _call,
            onOk: function (callback) {
                _onOkCallBack = callback
                return this
            }
    }
}

exports.onAdminUserLoggedout = onAdminUserLoggedout;

