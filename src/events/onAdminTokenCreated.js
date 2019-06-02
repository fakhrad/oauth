var broker = require('../rpcserver');
function onAdminTokenCreated(){
    var _onOkCallBack
    function _onOk (result) {
        if (_onOkCallBack) {
        _onOkCallBack(result)
        }
    }
    
    function _call(user) {
        console.log('admintokencreated event triggered.')
        broker.publish("adminauth", "admintokencreated", user);
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

exports.onAdminTokenCreated = onAdminTokenCreated;

