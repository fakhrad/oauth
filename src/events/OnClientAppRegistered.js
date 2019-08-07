
var broker = require('../rpcserver');
function OnClientAppRegistered(){
    var _onOkCallBack
    function _onOk (result) {
        if (_onOkCallBack) {
        _onOkCallBack(result)
        }
    }
    
    function _call(user) {
        console.log('OnClientAppRegistered event triggered.')
        broker.publish("adminauth", "OnClientAppRegistered", user);
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

exports.OnClientAppRegistered = OnClientAppRegistered;

