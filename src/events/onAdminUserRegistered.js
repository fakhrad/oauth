var broker = require('../rpcserver');
function onAdminUserRegistered(){
    var _onOkCallBack
    function _onOk (result) {
        if (_onOkCallBack) {
        _onOkCallBack(result)
        }
    }
    
    function _call(user) {
        console.log('event triggered.')
        broker.publish("adminauth", "adminuserregistered", user);
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

exports.onAdminUserRegistered = onAdminUserRegistered;

